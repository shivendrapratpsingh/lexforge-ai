// ─────────────────────────────────────────────────────────────────
//  POST /api/future-lawyer/moot
//  Body: { problem: string, side: 'petitioner'|'respondent'|'prosecution', moot?: string }
//  Returns: { memorial: string }
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Measured, not guessed: a full filing takes 98-232 seconds. At the old
// ceiling of 60 the function was killed mid-generation and the user got
// a timeout rather than a document - every time, for the longest and
// most valuable filings. 300 is the Vercel Pro maximum.
//
// THIS REQUIRES THE VERCEL PRO PLAN. On Hobby the platform caps the
// function at 60s regardless of what is written here, so on Hobby this
// line is inert and long drafts will still fail.
export const maxDuration = 300
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
