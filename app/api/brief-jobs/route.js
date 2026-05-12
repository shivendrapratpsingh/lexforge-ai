// ─────────────────────────────────────────────────────────────────
//  POST /api/brief-jobs
//  Enqueue a long-document brief job and fire-and-forget a self-trigger
//  on /api/brief-jobs/worker so processing starts immediately (no
//  one-minute wait for cron).  Returns { jobId } for the client to poll.
//
//  This route is dormant unless ENABLE_BRIEF_JOBS=1 is set in the env.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const maxDuration = 30
export const runtime    = 'nodejs'
export const dynamic    = 'force-dynamic'

function selfTrigger(req) {
  // Fire-and-forget: triggers the worker route once, without waiting.
  // If it fails, the next cron tick picks the job up — so this is just
  // an optimisation, never a correctness requirement.
  try {
    const host = req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    const base  = host ? `${proto}://${host}` : ''
    if (!base) return
    fetch(`${base}/api/brief-jobs/worker`, {
      method: 'POST',
      headers: { 'x-cron-secret': process.env.CRON_SECRET || 'dev' },
    }).catch(() => {})
  } catch (_) { /* swallow */ }
}

export async function POST(req) {
  if (process.env.ENABLE_BRIEF_JOBS !== '1') {
    return NextResponse.json({ error: 'Brief-job mode is disabled on this deployment.' }, { status: 503 })
  }

  const session = await auth().catch(() => null)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const sourceText = (body?.sourceText || '').toString()
  if (!sourceText || sourceText.trim().length < 60) {
    return NextResponse.json({ error: 'sourceText is required (minimum 60 characters).' }, { status: 400 })
  }

  const { prisma } = await import('@/lib/prisma')
  const job = await prisma.briefJob.create({
    data: {
      userId:     session.user.id,
      sourceText: sourceText.slice(0, 2_000_000),  // hard cap 2 MB of text
      court:      body?.court || null,
      language:   body?.language || 'english',
      state:      'queued',
    },
    select: { id: true, state: true, createdAt: true },
  })

  selfTrigger(req)
  return NextResponse.json({ jobId: job.id, state: job.state }, { status: 201 })
}
