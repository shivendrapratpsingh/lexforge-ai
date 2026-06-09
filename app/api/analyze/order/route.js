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

    // Pro-gate: legal tools are a Pro tier feature. hasProAccess respects
    // the global proEnforcementEnabled toggle and any active promos, so
    // when enforcement is off everyone passes through.
    const userIsPro = await hasProAccess(session.user.email, session.user.tier)
    if (!userIsPro) {
      return NextResponse.json({
        error: 'The Order Analyzer is a Pro feature. Upgrade to Pro to continue.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.orderText?.trim())
      return NextResponse.json({ error: 'Order text is required.' }, { status: 400 })

    const { orderText, court } = body

    const { analyzeCourtOrder } = await import('@/lib/groq')
    const analysis = await analyzeCourtOrder(orderText, court || null)

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[POST /api/analyze/order]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Analysis failed: ${err?.message}` : 'Failed to analyze order.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
