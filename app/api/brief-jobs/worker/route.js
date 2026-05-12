// ─────────────────────────────────────────────────────────────────
//  POST /api/brief-jobs/worker
//  GET  /api/brief-jobs/worker
//  Advances queued BriefJobs by one or more ticks.  Invoked by:
//    • Vercel Cron (once per minute — picks up the oldest queued job)
//    • Fire-and-forget self-trigger from POST /api/brief-jobs
//
//  Authentication:
//    • Vercel Cron passes header `Authorization: Bearer <CRON_SECRET>`
//    • Self-trigger passes header `x-cron-secret: <CRON_SECRET>`
//  Either of those must match `process.env.CRON_SECRET` (or be the
//  literal 'dev' when running locally without the env var).
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

export const maxDuration = 60
export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'

function isAuthorised(req) {
  if (process.env.ENABLE_BRIEF_JOBS !== '1') return false
  const expected = process.env.CRON_SECRET || 'dev'
  const fromHeader = req.headers.get('x-cron-secret')
                  || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return fromHeader === expected
}

async function runTicks(req) {
  const tStart = Date.now()
  const { advanceOne } = await import('@/lib/brief-pipeline')
  let advanced = 0
  let lastState = null
  // Spend up to ~50s advancing as many jobs / job-steps as we can.
  while (Date.now() - tStart < 50_000) {
    const res = await advanceOne(req.method)
    if (!res.advanced) break
    advanced += 1
    lastState = res.state
    if (res.state === 'done' || res.state === 'failed') {
      // Keep going — another tick may pick up the next queued job.
    }
  }
  return { advanced, lastState, ms: Date.now() - tStart }
}

export async function POST(req) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  try {
    const result = await runTicks(req)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[brief-jobs/worker] POST failed', err?.message)
    return NextResponse.json({ ok: false, error: err?.message || 'worker failed' }, { status: 500 })
  }
}

export async function GET(req) {
  // Vercel Cron uses GET by default.
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  try {
    const result = await runTicks(req)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[brief-jobs/worker] GET failed', err?.message)
    return NextResponse.json({ ok: false, error: err?.message || 'worker failed' }, { status: 500 })
  }
}
