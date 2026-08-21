// GET /api/health — is the thing up, and is the database awake?
//
// Two jobs, and the second is the reason it exists.
//
// 1. Something to point a monitor at, so a failure is found by a check
//    rather than by a user.
//
// 2. Keeping Neon awake. The free tier suspends compute after about five
//    minutes idle, and the next request pays a cold start — measured at
//    4.4 seconds. At launch, when traffic is sporadic rather than
//    steady, that cost lands on almost every early visitor. A cron
//    hitting this every few minutes keeps the database warm.
//
//    Vercel's Hobby plan allows two cron jobs and this project already
//    has two, so the schedule is NOT in vercel.json — adding a third
//    would fail the deploy. On Vercel Pro, add:
//
//      { "path": "/api/health", "schedule": "*/5 * * * *" }
//
// Deliberately says nothing about versions, environment variables or
// stack traces. A health endpoint is public by nature and should not be
// a reconnaissance tool.

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  const checks = {}
  let healthy = true

  try {
    const { prisma } = await import('@/lib/prisma')
    const t = Date.now()
    await prisma.$queryRawUnsafe('SELECT 1')
    checks.database = { ok: true, ms: Date.now() - t }
    // A slow answer here means the database had suspended and this
    // request woke it — worth seeing in the log, since it says the
    // warming cron is not running or not often enough.
    if (checks.database.ms > 1000) checks.database.note = 'cold start — compute had suspended'
  } catch (err) {
    healthy = false
    checks.database = { ok: false, error: 'unreachable' }
    console.error('[health] database unreachable:', err?.message)
  }

  // Configuration, as booleans only. Whether a key is present is useful
  // to know; the key itself is nobody's business.
  checks.config = {
    ai: Boolean(process.env.GROQ_API_KEY),
    payments: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    mail: Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY),
    judgments: Boolean(process.env.INDIANKANOON_TOKEN),
  }

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', ms: Date.now() - started, checks },
    {
      status: healthy ? 200 : 503,
      // Never cached — a cached health check reports the past.
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    }
  )
}
