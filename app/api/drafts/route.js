import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES, getRelevantCaseLaws } from '@/lib/utils'
import { isAdmin, hasProAccess, requiresProDocumentDynamic, getFreeDocsLimit } from '@/lib/admin'
import { isJunkValue } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

// AI generation can take 20–40s with 70B models. Vercel's Hobby plan caps
// serverless functions at 10s by default, which silently kills the request
// and the user sees no output. Raise to 60s (Hobby max). Pro plans allow up
// to 300s — bump this if you ever need it.
export const maxDuration = 60
export const runtime = 'nodejs'

// Strip junk placeholders ("NA", "no", "don't know", "-", etc.) from templateData
// so the AI never sees them. The client-side guard normally blocks these,
// but this is defense-in-depth — empty values trigger placeholders downstream
// thanks to the FIDELITY_MANDATE in lib/groq.js.
function sanitizeTemplateData(templateData) {
  if (!templateData || typeof templateData !== 'object') return {}
  const out = {}
  for (const [k, v] of Object.entries(templateData)) {
    if (v === null || v === undefined) continue
    if (isJunkValue(v)) continue
    out[k] = v
  }
  return out
}

// ─── Extract client info from templateData by document type ───────
function extractClientFromTemplate(documentType, templateData) {
  if (!templateData) return null
  const t = templateData

  // Map of document types to their "client name" field and supporting fields
  const maps = {
    LEGAL_NOTICE:     { raw: t.senderName,      addr: t.senderAddress },
    PETITION:         { raw: t.petitionerName },
    WRIT_PETITION:    { raw: t.petitionerName },
    PIL:              { raw: t.petitionerName },
    BAIL_APPLICATION: { raw: t.applicantName,   father: t.fatherName, age: t.applicantAge, addr: t.address },
    STAY_APPLICATION: { raw: t.applicantName },
    AFFIDAVIT:        { raw: t.deponentName,    father: t.deponentFather, age: t.deponentAge, addr: t.deponentAddress },
    VAKALATNAMA:      { raw: t.clientName,      father: t.clientFather,   age: t.clientAge,  addr: t.clientAddress },
    CONTRACT:         { raw: t.partyA },
    CASE_BRIEF:       { raw: t.caseName },
    MEMORANDUM:       { raw: t.from },
  }

  const map = maps[documentType]
  if (!map?.raw) return null

  // Parse "Name s/o Father, Age X, r/o Address" format
  const raw    = String(map.raw).trim()
  const nameMatch = raw.match(/^([^,s/]+?)(?:\s+s\/o\s+|\s+d\/o\s+|\s+w\/o\s+|,|$)/i)
  const name   = nameMatch ? nameMatch[1].trim() : raw.split(',')[0].trim()
  if (!name || name.length < 2) return null

  // Try to parse father from raw string if not separately provided
  const fatherMatch = raw.match(/(?:s\/o|d\/o|w\/o)\s+([^,]+?)(?:,|$)/i)
  const ageMatch    = raw.match(/Age[:\s]+(\d+)/i)
  const addrMatch   = raw.match(/r\/o\s+(.+?)(?:,\s*$|$)/i)

  return {
    name,
    fatherName: map.father || (fatherMatch ? fatherMatch[1].trim() : null),
    age:        map.age    || (ageMatch    ? ageMatch[1]           : null),
    address:    map.addr   || (addrMatch   ? addrMatch[1].trim()   : null),
  }
}

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()

    const { prisma } = await import('@/lib/prisma')
    const where = { userId: session.user.id }
    if (q) {
      where.OR = [
        { title:       { contains: q, mode: 'insensitive' } },
        { documentType:{ contains: q, mode: 'insensitive' } },
        { content:     { contains: q, mode: 'insensitive' } },
      ]
    }
    const drafts = await prisma.draft.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ drafts })
  } catch (err) {
    console.error('[GET /api/drafts]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Failed to fetch: ${err?.message}` : 'Failed to fetch documents.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(session.user.id, 'drafts')
    if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const {
      documentType,
      templateData,
      court        = null,
      language     = 'english',
      intakeMethod = 'form',
      sourceText   = null,
      targetWords  = null,        // user-requested length, rounded to nearest 10
    } = body

    // Sanitise targetWords. The client already rounds to the nearest 10,
    // but we re-round here so a hand-crafted POST can't bypass it.
    // Caps:  free  = 1,200 words   |   pro = 5,000 words.
    function clampTargetWords(raw, isPro) {
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) return null
      const cap = isPro ? 5000 : 1200
      const min = 100
      const rounded = Math.round(n / 10) * 10
      return Math.max(min, Math.min(cap, rounded))
    }

    if (!documentType || !DOCUMENT_TYPES.find(t => t.value === documentType))
      return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })

    // ── Strip junk placeholders ("NA", "no", "don't know", etc.) ──
    const cleanTemplateData = sanitizeTemplateData(templateData)
    const incomingFieldCount = templateData && typeof templateData === 'object'
      ? Object.values(templateData).filter(v => v !== null && v !== undefined && String(v).trim().length > 0).length
      : 0
    const cleanFieldCount = Object.keys(cleanTemplateData).length
    if (incomingFieldCount > 0 && cleanFieldCount === 0) {
      return NextResponse.json({
        error: 'All fields contained placeholders like "NA", "no", or "don\'t know". Please fill in real details and try again.',
        hint: 'The document cannot be drafted accurately without the actual particulars.',
      }, { status: 422 })
    }

    const { generateLegalDocument, generateMeritsDemerits } = await import('@/lib/groq')
    const { prisma }                                        = await import('@/lib/prisma')

    // ── Pro gating: fetch user's current tier (always check DB, not cached session) ──
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, tier: true, suspended: true },
    })
    if (!dbUser)
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (dbUser.suspended)
      return NextResponse.json({ error: 'Your account is suspended. Contact the administrator.' }, { status: 403 })

    const userIsPro = await hasProAccess(dbUser.email, dbUser.tier)

    // Block premium document types for free users (only when Pro enforcement is on)
    if (!userIsPro && (await requiresProDocumentDynamic(documentType))) {
      return NextResponse.json({
        error: 'This document type requires Pro. Please contact the administrator to upgrade.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    // Enforce monthly quota for free users (limit is admin-controlled)
    const FREE_DOCS_PER_MONTH = await getFreeDocsLimit()
    if (!userIsPro) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
      const thisMonthCount = await prisma.draft.count({
        where: { userId: session.user.id, createdAt: { gte: startOfMonth } },
      })
      if (thisMonthCount >= FREE_DOCS_PER_MONTH) {
        return NextResponse.json({
          error: `Free plan is limited to ${FREE_DOCS_PER_MONTH} documents per month. Contact the administrator to upgrade to Pro.`,
          code: 'QUOTA_EXCEEDED',
        }, { status: 403 })
      }
    }

    // Build detail string from template fields (junk values already stripped)
    const details = Object.entries(cleanTemplateData)
      .filter(([, v]) => v?.toString().trim())
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
      .join('\n')

    const contextPrefix = [
      court    ? `Court: ${court}`       : null,
      language ? `Language: ${language}` : null,
    ].filter(Boolean).join('\n')
    const fullDetails = contextPrefix ? `${contextPrefix}\n\n${details}` : details

    const searchTerms = Object.values(cleanTemplateData).join(' ')
    const caseLaws    = getRelevantCaseLaws(documentType, court, searchTerms)

    const targetWordsClamped = clampTargetWords(targetWords, userIsPro)

    let content
    try {
      content = await generateLegalDocument(documentType, fullDetails, court, language, {
        isPro: userIsPro,
        targetWords: targetWordsClamped,
      })
    } catch (genErr) {
      if (genErr?.code === 'AI_REFUSAL') {
        return NextResponse.json({
          error: genErr.message,
          hint: 'Please use professional, respectful language in all case details fields and try again.',
        }, { status: 422 })
      }
      throw genErr  // re-throw other errors to outer catch
    }

    // ── Generate merits/demerits conclusion in parallel with client lookup ──
    const meritsPromise = generateMeritsDemerits(documentType, content, cleanTemplateData, court, { isPro: userIsPro })

    const dtLabel  = DOCUMENT_TYPES.find(t => t.value === documentType)?.label
    const titleKey =
      cleanTemplateData.subject        ||
      cleanTemplateData.caseName       ||
      cleanTemplateData.purpose        ||
      cleanTemplateData.to             ||
      cleanTemplateData.petitionerName ||
      cleanTemplateData.applicantName  ||
      cleanTemplateData.deponentName   ||
      cleanTemplateData.publicIssue    ||
      'Document'
    const title = `${dtLabel}: ${String(titleKey).substring(0, 55)}`

    // ── Auto-create / link client ──────────────────────────────
    let autoClientId     = null
    let autoClientAction = null   // 'created' | 'linked' | null

    try {
      const extracted = extractClientFromTemplate(documentType, cleanTemplateData)
      if (extracted?.name) {
        // Try to find existing client (same user, same name)
        const existing = await prisma.client.findFirst({
          where: { userId: session.user.id, name: { equals: extracted.name, mode: 'insensitive' } },
        })
        if (existing) {
          autoClientId     = existing.id
          autoClientAction = 'linked'
        } else {
          const newClient = await prisma.client.create({
            data: {
              userId:     session.user.id,
              name:       extracted.name,
              fatherName: extracted.fatherName || null,
              age:        extracted.age        || null,
              address:    extracted.address    || null,
              state:      'Uttar Pradesh',
            },
          })
          autoClientId     = newClient.id
          autoClientAction = 'created'
        }
      }
    } catch (clientErr) {
      console.error('[AutoClient]', clientErr)
      // Non-fatal — continue with draft creation
    }

    // ── Await merits/demerits (started in parallel above) ────────
    const meritsDemerits = await meritsPromise.catch(e => {
      console.error('[MeritsDemerits]', e)
      return null
    })

    // ── Build legalReasoning: merits/demerits + case law precedents ──
    let legalReasoning = null
    if (meritsDemerits) {
      legalReasoning = meritsDemerits
      if (caseLaws.length > 0) {
        legalReasoning += `\n\n---\n**Relevant Precedents:** ${caseLaws.map(c => `${c.name} (${c.citation})`).join(', ')}`
      }
    } else if (caseLaws.length > 0) {
      legalReasoning = `Relevant precedents: ${caseLaws.map(c => `${c.name} (${c.citation})`).join(', ')}`
    }

    // ── Create draft ───────────────────────────────────────────
    const draft = await prisma.draft.create({
      data: {
        userId:    session.user.id,
        clientId:  autoClientId,
        title,
        content,
        documentType,
        templateData: cleanTemplateData,
        caseLaws,
        status:    'draft',
        caseStatus: 'active',
        court,
        language,
        intakeMethod,
        sourceText,
        legalReasoning,
      },
      include: {
        client: { select: { id: true, name: true, fatherName: true, phone: true } },
      },
    })

    return NextResponse.json({ ...draft, autoClientAction }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drafts]', err)
    // Always return a descriptive error so the user knows what failed
    let msg = 'Failed to generate document. Please try again.'
    let status = 500
    const errMsg = err?.message || ''
    if (errMsg.includes('.prisma/client') || errMsg.includes('PrismaClient')) {
      msg = 'Database not initialized. Please ensure DATABASE_URL is set and `prisma db push` has been run against it.'
      status = 503
    } else if (err?.status === 401 || err?.status === 403 || errMsg.includes('API key') || errMsg.includes('GROQ_API_KEY')) {
      msg = 'Invalid or missing GROQ_API_KEY. Set it in your environment variables and redeploy.'
      status = 503
    } else if (err?.status === 429 || /rate[\s_-]?limit/i.test(errMsg)) {
      msg = 'Groq rate limit hit. Wait a minute and try again.'
      status = 429
    } else if (process.env.NODE_ENV === 'development') {
      msg = `Generation failed: ${errMsg}`
    }
    return NextResponse.json({ error: msg }, { status })
  }
}
