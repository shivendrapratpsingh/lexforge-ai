import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

// AI route — needs > 10s on Vercel Hobby plan.
// AI_TIMEOUT_ROUTE - one of nine routes whose ceiling has to move
// together. Change them with `npm run timeouts:pro` / `:hobby`, not by
// hand, so none is left behind.
//
// Measured, not guessed: a full filing takes 98-232 seconds. At 60 the
// function is killed mid-generation and the user gets a timeout rather
// than a document - every time, for the longest and most valuable
// filings. 300 is the Vercel Pro maximum and the actual fix.
//
// Held at 60 because this project is on Hobby, where 60 IS the platform
// ceiling. A higher number here buys nothing on Hobby and risks the
// deployment being rejected outright for exceeding the plan limit - so
// it stays at the plan limit until the plan changes.
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(session.user.id, 'analyze')
    if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 })

    // Pro-gate: this is a Pro tier tool. hasProAccess respects the global
    // proEnforcementEnabled toggle and any active promos, so when
    // enforcement is off everyone passes through.
    const userIsPro = await hasProAccess(session.user.email, session.user.tier)
    if (!userIsPro) {
      return NextResponse.json({
        error: 'The Fresh Application tool is a Pro feature. Upgrade to Pro to continue.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.rejectionOrderText?.trim())
      return NextResponse.json({ error: 'Rejection order text is required.' }, { status: 400 })

    const {
      rejectionOrderText,
      documentType = 'BAIL_APPLICATION',
      court,
      language = 'english',
      additionalGrounds,
      clientId,
    } = body

    const { generateFreshApplication } = await import('@/lib/groq')
    const content = await generateFreshApplication(rejectionOrderText, documentType, court || null, language, additionalGrounds || '')

    const { prisma } = await import('@/lib/prisma')
    const dtLabel = documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Fresh ${dtLabel} - ${new Date().toLocaleDateString('en-IN')}`,
        content,
        documentType,
        status:       'draft',
        caseStatus:   'active',
        court:        court || null,
        language,
        intakeMethod: 'tool',
      },
    })

    return NextResponse.json({ content, draft }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/analyze/fresh]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Fresh application failed: ${err?.message}` : 'Failed to generate fresh application.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
