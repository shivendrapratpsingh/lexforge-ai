import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES, getRelevantCaseLaws } from '@/lib/utils'
import { isAdmin, hasProAccess, requiresProDocumentDynamic, getFreeDocsLimit } from '@/lib/admin'
import { isJunkValue } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getFollowUp, buildFollowUpCourtDate } from '@/lib/followup'
import { kanoonConfigured } from '@/lib/legal-data/config'

// Measured, not guessed: a full filing takes 98-232 seconds. At the old
// ceiling of 60 the function was killed mid-generation and the user got
// a timeout rather than a document - every time, for the longest and
// most valuable filings. 300 is the Vercel Pro maximum.
//
// THIS REQUIRES THE VERCEL PRO PLAN. On Hobby the platform caps the
// function at 60s regardless of what is written here, so on Hobby this
// line is inert and long drafts will still fail.
export const maxDuration = 300
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

// Which documents actually argue a point of law. A rent agreement, a
// vakalatnama or an RTI application cites no judgment, so searching for
// one would be two billed searches spent on nothing.
const AUTHORITY_TYPES = new Set([
  'BAIL_APPLICATION', 'WRIT_PETITION', 'PIL', 'PETITION', 'STAY_APPLICATION',
  'CASE_BRIEF', 'MEMORANDUM', 'LEGAL_OPINION', 'CONSUMER_COMPLAINT',
  'DIVORCE_PETITION',
])
const wantsAuthority = (t) => AUTHORITY_TYPES.has(t)

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

    // ── The court code must be one we actually know ───────────────
    //
    // courtAddendum() returns '' for anything unrecognised, so an
    // unknown code did not fail — it silently produced a filing with NO
    // court-specific formatting at all: no cause-title rule, no case
    // number block, no jurisdictional statute set. The draft still came
    // back looking plausible because the model inferred a court from the
    // facts, which is the worst outcome of the three: wrong, confident,
    // and unannounced. getCourtLabel() compounds it by echoing the raw
    // code back into the UI as though it were a court's name.
    //
    // 1,134 courts are listed. Anything outside that list is a caller
    // error and is now told so.
    if (court) {
      const { ALL_COURTS } = await import('@/lib/utils')
      if (!ALL_COURTS.some(c => c.value === court)) {
        return NextResponse.json({
          error: `Unknown court "${court}".`,
          hint: 'Pick a court from the list — the draft would otherwise be formatted for no court in particular.',
        }, { status: 400 })
      }
    }

    // ── Strip junk placeholders ("NA", "no", "don't know", etc.) ──
    const cleanTemplateData = sanitizeTemplateData(templateData)

    // ── Route an obviously-mislabelled deed to its real type ──────
    //
    // A user picked CONTRACT and typed "Rental agreement" as the
    // purpose. CONTRACT gets the generic contract prompt; RENT_AGREEMENT
    // carries the Transfer of Property Act, the Model Tenancy Act 2021,
    // the s.17(1)(d) Registration Act rule behind the 11-month
    // convention, deposit caps, stamp duty and a 20-clause structure.
    // Choosing the wrong tile silently forfeited all of it, and nothing
    // in the product ever said so.
    //
    // Only fires when the signal is unambiguous — the chosen type is the
    // generic one AND the user's own words name the specific deed. It is
    // reported back in the response so the switch is visible, never
    // silent.
    let effectiveType = documentType
    let retypedFrom = null
    {
      const said = Object.values(cleanTemplateData || {}).join(' ').toLowerCase()
      const RETYPE = [
        { from: 'CONTRACT', to: 'RENT_AGREEMENT', re: /\b(rent|rental|tenanc|lease|leave and licen[cs]e|landlord|tenant)\b/ },
        { from: 'CONTRACT', to: 'SALE_DEED',      re: /\b(sale deed|conveyance|sale of (?:the )?(?:property|land|flat|plot))\b/ },
      ]
      const hit = RETYPE.find(r => r.from === documentType && r.re.test(said))
      if (hit && DOCUMENT_TYPES.find(t => t.value === hit.to)) {
        effectiveType = hit.to
        retypedFrom = documentType
        console.log(`[draft] retyped ${documentType} -> ${hit.to} from the user's own wording`)
      }
    }
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
    if (!userIsPro && (await requiresProDocumentDynamic(effectiveType))) {
      return NextResponse.json({
        error: 'This document type is part of Pro. See the plans to unlock it.',
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
          error: `The free plan covers ${FREE_DOCS_PER_MONTH} document${FREE_DOCS_PER_MONTH === 1 ? '' : 's'} a month, and you have used ${thisMonthCount}. Pro removes the limit — your allowance resets on the 1st either way.`,
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
    const caseLaws    = getRelevantCaseLaws(effectiveType, court, searchTerms)

    const targetWordsClamped = clampTargetWords(targetWords, userIsPro)

    // ── Retrieve the authority BEFORE drafting ──────────────────
    //
    // The draft used to be written from the model's own recollection of
    // case law, under a rule that said "name a judgment only if you are
    // certain". The model is certain and wrong at the same time — that
    // is what a fabricated citation is — so judgments are now retrieved
    // from the real index first and the model may name nothing else.
    //
    // Deliberately narrow, because each run costs two billed searches:
    //   - filings only. A rent agreement or a legal notice argues no
    //     point of law, and paying to search judgments for one is waste.
    //   - Pro only, for the same reason.
    //   - fails CLOSED. If retrieval breaks, the draft is written with
    //     no case law at all rather than falling back on memory, which
    //     is the failure this exists to prevent.
    let authority = { cases: [], acts: [], retrieved: false }
    if (userIsPro && wantsAuthority(effectiveType) && kanoonConfigured()) {
      try {
        const { findRelevantCases } = await import('@/lib/legal-data/case-finder')
        const found = await findRelevantCases({
          facts: details,
          effectiveType,
          court,
          reliefSought: cleanTemplateData.relief || cleanTemplateData.reliefSought || '',
          actsInvolved: cleanTemplateData.offence || cleanTemplateData.applicableLaws || '',
        }, { userId: session.user.id })

        // Flatten the hierarchy tiers, apex court first, and cap it.
        // Only titles and citations go into the prompt — never judgment
        // bodies, which would blow the token budget for the draft itself.
        authority = {
          cases: (found.tiers || []).flatMap(t => t.cases).slice(0, 6).map(c => ({
            title: c.title, court: c.court, date: c.date, citation: c.citation,
            docId: c.docId, url: c.url,
          })),
          acts: found.acts || [],
          retrieved: true,
        }
      } catch (e) {
        // Not fatal: no authority simply means the absolute no-citation
        // rule applies, which is the safe side of this trade.
        console.error('[draft/authority]', e?.code || e?.message || e)
      }
    }

    let content
    try {
      content = await generateLegalDocument(effectiveType, fullDetails, court, language, {
        isPro: userIsPro,
        targetWords: targetWordsClamped,
        userId: session.user.id,
        operation: 'draft',
        cases: authority.cases,
        acts: authority.acts,
      })
    } catch (genErr) {
      if (genErr?.code === 'AI_REFUSAL') {
        return NextResponse.json({
          error: genErr.message,
          hint: 'Please use professional, respectful language in all case details fields and try again.',
        }, { status: 422 })
      }
      // Rate-limited (free Groq quota exhausted for the minute) — tell the
      // user to wait and retry rather than saving a raw, undrafted template.
      if (genErr?.code === 'GROQ_RATE_LIMIT') {
        return NextResponse.json({
          error: genErr.message,
          hint: 'Your inputs are saved — just click Generate again in a minute. Upgrading the Groq key to the free Dev tier removes this limit.',
        }, { status: 429 })
      }
      if (genErr?.code === 'GROQ_AUTH') {
        return NextResponse.json({ error: genErr.message }, { status: 503 })
      }
      // The model answered with nothing. This used to be swallowed: the
      // user silently received a formatted copy of their own form
      // fields, signed "Generated by LexForge AI", and had no way to
      // tell it was a failure. Nothing is saved now, and they are told.
      if (genErr?.code === 'AI_EMPTY') {
        return NextResponse.json({
          error: genErr.message,
          hint: 'Nothing was saved and your inputs are still on the form — press Generate again.',
        }, { status: 503 })
      }
      if (genErr?.code === 'NO_AI_PROVIDER') {
        return NextResponse.json({
          error: 'Document generation is not configured on this deployment.',
          hint: 'An administrator needs to set GEMINI_API_KEY (or GROQ_API_KEY).',
        }, { status: 503 })
      }
      throw genErr  // re-throw other errors to outer catch
    }

    // ── Generate merits/demerits conclusion in parallel with client lookup ──
    const meritsPromise = generateMeritsDemerits(effectiveType, content, cleanTemplateData, court, { isPro: userIsPro })

    const dtLabel  = DOCUMENT_TYPES.find(t => t.value === effectiveType)?.label
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
      const extracted = extractClientFromTemplate(effectiveType, cleanTemplateData)
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
              state:      '',
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

    // The authority the draft was actually written against, listed so it
    // can be checked. A retrieved judgment with a link is the difference
    // between a citation a reader can verify and one they must trust.
    if (authority.retrieved && authority.cases.length) {
      const lines = authority.cases.map(c => {
        const head = `- ${c.title}${c.court ? ` — ${c.court}` : ''}${c.citation ? ` (${c.citation})` : ''}`
        return c.url ? [head, `  ${c.url}`].join('\n') : head
      }).join('\n')
      legalReasoning = [
        legalReasoning || null,
        '**Judgments retrieved for this draft** — the document was written ' +
        'against these, and the AI was not permitted to name any other:',
        lines,
      ].filter(Boolean).join('\n\n')
    }

    // ── Create draft ───────────────────────────────────────────
    const draft = await prisma.draft.create({
      data: {
        userId:    session.user.id,
        clientId:  autoClientId,
        title,
        content,
        effectiveType,
        templateData: cleanTemplateData,
        // What this draft was actually built from. When judgments were
        // retrieved they are stored instead of the curated shelf, so the
        // record shows the authority the document was written against.
        caseLaws: authority.retrieved && authority.cases.length
          ? { retrieved: true, cases: authority.cases, acts: authority.acts }
          : caseLaws,
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

    // ── Auto-save follow-up deadline to CourtDate ──────────────────
    let followUpSaved = false
    try {
      const followUp   = getFollowUp(effectiveType, cleanTemplateData, draft.createdAt)
      const courtDateData = buildFollowUpCourtDate(followUp, draft.id, session.user.id, effectiveType)
      if (courtDateData) {
        await prisma.courtDate.create({ data: courtDateData })
        followUpSaved = true
      }
    } catch (fuErr) {
      console.error('[FollowUp auto-save]', fuErr)
      // Non-fatal — draft is already saved
    }

    // `retypedFrom` is non-null when the chosen document type was
    // overridden from the user's own wording. Surfaced so the UI can say
    // "drafted as a Rent Agreement" — a silent switch would be worse
    // than the wrong type, because the user could not tell either had
    // happened.
    return NextResponse.json(
      { ...draft, autoClientAction, followUpSaved, retypedFrom, retypedTo: retypedFrom ? effectiveType : null },
      { status: 201 },
    )
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
