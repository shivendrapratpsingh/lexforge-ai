// ─────────────────────────────────────────────────────────────────
//  POST /api/future-lawyer/moot
//  Body: { problem: string, side: 'petitioner'|'respondent'|'prosecution', moot?: string }
//  Returns: { memorial: string }
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

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
