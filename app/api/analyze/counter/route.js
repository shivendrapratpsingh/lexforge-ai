import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

// AI route — needs > 10s on Vercel Hobby plan.
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
        error: 'The Counter / Reply tool is a Pro feature. Upgrade to Pro to continue.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.oppositePartyDoc?.trim())
      return NextResponse.json({ error: 'Opposite party document is required.' }, { status: 400 })

    const { oppositePartyDoc, documentType = 'AFFIDAVIT', court, language = 'english', clientPosition, clientId } = body

    const { generateCounter } = await import('@/lib/groq')
    const content = await generateCounter(oppositePartyDoc, documentType, court || null, language, clientPosition || '')

    const { prisma } = await import('@/lib/prisma')
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Counter Affidavit - ${new Date().toLocaleDateString('en-IN')}`,
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
    console.error('[POST /api/analyze/counter]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Counter generation failed: ${err?.message}` : 'Failed to generate counter.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
