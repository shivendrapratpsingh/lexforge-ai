import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
