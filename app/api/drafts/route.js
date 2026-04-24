import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES, getRelevantCaseLaws } from '@/lib/utils'
import { isAdmin, hasProAccess, requiresProDocument, FREE_DOCS_PER_MONTH } from '@/lib/admin'

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

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const drafts = await prisma.draft.findMany({
      where: { userId: session.user.id },
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

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const {
      documentType,
      templateData,
      court        = null,
      language     = 'english',
      intakeMethod = 'form',
      sourceText   = null,
    } = body

    if (!documentType || !DOCUMENT_TYPES.find(t => t.value === documentType))
      return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })

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

    // Block premium document types for free users
    if (!userIsPro && requiresProDocument(documentType)) {
      return NextResponse.json({
        error: 'This document type requires Pro. Please contact the administrator to upgrade.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    // Enforce monthly quota for free users
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

    // Build detail string from template fields
    const details = Object.entries(templateData || {})
      .filter(([, v]) => v?.toString().trim())
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
      .join('\n')

    const contextPrefix = [
      court    ? `Court: ${court}`       : null,
      language ? `Language: ${language}` : null,
    ].filter(Boolean).join('\n')
    const fullDetails = contextPrefix ? `${contextPrefix}\n\n${details}` : details

    const searchTerms = Object.values(templateData || {}).join(' ')
    const caseLaws    = getRelevantCaseLaws(documentType, court, searchTerms)

    let content
    try {
      content = await generateLegalDocument(documentType, fullDetails, court, language, { isPro: userIsPro })
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
    const meritsPromise = generateMeritsDemerits(documentType, content, templateData, court)

    const dtLabel  = DOCUMENT_TYPES.find(t => t.value === documentType)?.label
    const titleKey =
      templateData?.subject        ||
      templateData?.caseName       ||
      templateData?.purpose        ||
      templateData?.to             ||
      templateData?.petitionerName ||
      templateData?.applicantName  ||
      templateData?.deponentName   ||
      templateData?.publicIssue    ||
      'Document'
    const title = `${dtLabel}: ${String(titleKey).substring(0, 55)}`

    // ── Auto-create / link client ──────────────────────────────
    let autoClientId     = null
    let autoClientAction = null   // 'created' | 'linked' | null

    try {
      const extracted = extractClientFromTemplate(documentType, templateData)
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
        templateData: templateData || {},
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
    if (err?.message?.includes('.prisma/client') || err?.message?.includes('PrismaClient')) {
      msg = 'Database not initialized. Please run SETUP.bat or FIX.bat to set up the database, then restart the app.'
    } else if (err?.message?.includes('API key') || err?.message?.includes('GROQ')) {
      msg = 'Invalid GROQ_API_KEY. Please check your .env.local file.'
    } else if (process.env.NODE_ENV === 'development') {
      msg = `Generation failed: ${err?.message}`
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
