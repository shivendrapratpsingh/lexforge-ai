// ─────────────────────────────────────────────────────────────────
//  POST /api/future-lawyer/moot
//  Body: { problem: string, side: 'petitioner'|'respondent'|'prosecution', moot?: string }
//  Returns: { memorial: string }
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const maxDuration = 60
export const runtime    = 'nodejs'
export const dynamic    = 'force-dynamic'

export async function POST(req) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body    = await req.json().catch(() => null)
  const problem = (body?.problem || '').toString()
  const side    = ['petitioner', 'respondent', 'prosecution'].includes(body?.side) ? body.side : 'petitioner'
  const moot    = (body?.moot || '').toString().slice(0, 120)
  if (!problem || problem.trim().length < 60) {
    return NextResponse.json({ error: 'Please paste the full moot problem (at least 60 characters).' }, { status: 400 })
  }
  try {
    const { buildMootMemorial } = await import('@/lib/groq')
    const { hasProAccess }      = await import('@/lib/admin')
    const isPro    = await hasProAccess(session.user.email, session.user.tier)
    const memorial = await buildMootMemorial({ problem, side, moot, isPro })
    return NextResponse.json({ memorial })
  } catch (err) {
    console.error('[future-lawyer/moot]', err)
    return NextResponse.json({ error: 'Failed to build the memorial. Please try again.' }, { status: 500 })
  }
}
