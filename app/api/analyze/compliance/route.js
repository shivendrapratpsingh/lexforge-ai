import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

// AI route — needs > 10s on Vercel Hobby plan.
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
        error: 'The Compliance Report tool is a Pro feature. Upgrade to Pro to continue.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.orderText?.trim())
      return NextResponse.json({ error: 'Order text is required.' }, { status: 400 })

    const { orderText, complianceDetails, court, language = 'english', clientId } = body

    const { generateComplianceReport } = await import('@/lib/groq')
    const content = await generateComplianceReport(orderText, complianceDetails || '', court || null, language)

    const { prisma } = await import('@/lib/prisma')
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Compliance Report - ${new Date().toLocaleDateString('en-IN')}`,
        content,
        documentType: 'AFFIDAVIT',
        status:       'draft',
        caseStatus:   'active',
        court:        court || null,
        language,
        intakeMethod: 'tool',
      },
    })

    return NextResponse.json({ content, draft }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/analyze/compliance]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Compliance report failed: ${err?.message}` : 'Failed to generate compliance report.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
