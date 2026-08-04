// GET/POST /api/legal/sync — run the legal-data sync on demand.
//
// The schedule itself lives in /api/push/daily, which already fires at
// 8 AM IST: Vercel's Hobby plan allows two cron jobs and this project
// already has two, so the sync rides along with the notification job
// rather than spending a third. This endpoint exists so it can also be
// triggered by hand — after adding an API key, or to check a change
// without waiting until morning.
//
// Auth: the same CRON_SECRET the other scheduled jobs use.

import { NextResponse } from 'next/server'
import { runDailySync } from '@/lib/legal-data/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorised(req) {
  const expected = process.env.CRON_SECRET
  if (!expected) return process.env.NODE_ENV !== 'production'
  const got = req.headers.get('x-cron-secret')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return got === expected
}

export async function GET(req) {
  if (!authorised(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    return NextResponse.json(await runDailySync({ budgetMs: 45_000 }))
  } catch (e) {
    console.error('[legal/sync]', e?.message)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export const POST = GET
