// GET/POST /api/legal/sync — the 8 AM daily legal-data job.
//
// Two things every morning:
//   1. New Acts. Polls the India Code collection feeds and records
//      anything not already known. Free, no key.
//   2. Tracked cases. Refreshes each case a user is following so the
//      next hearing date on their dashboard is current. Only runs when
//      an eCourts provider is configured, and is budgeted — see below.
//
// Bounded by wall clock, not by item count. A serverless invocation is
// capped (60s on Hobby), and a job that runs past the cap is killed
// mid-write with no record of where it got to. So it works to a budget
// and records a cursor, and the next morning resumes from there.
//
// Auth: the same CRON_SECRET the other scheduled jobs use.

import { NextResponse } from 'next/server'
import { fetchLatestActs } from '@/lib/legal-data/indiacode'
import { ecourtsConfigured } from '@/lib/legal-data/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Leave headroom under the platform cap so the final writes and the run
// record always land.
const BUDGET_MS = 45_000

function authorised(req) {
  const expected = process.env.CRON_SECRET
  if (!expected) return process.env.NODE_ENV !== 'production'
  const got = req.headers.get('x-cron-secret')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return got === expected
}

async function syncActs(prisma) {
  const { acts, errors } = await fetchLatestActs()
  let added = 0, updated = 0

  for (const act of acts) {
    const existing = await prisma.actRecord.findUnique({ where: { handle: act.handle } })
    if (!existing) {
      await prisma.actRecord.create({
        data: {
          handle: act.handle,
          shortTitle: act.shortTitle,
          actYear: act.actYear ?? null,
          enactmentDate: act.enactmentDate ?? null,
          jurisdiction: act.jurisdiction,
          url: act.url,
        },
      })
      added++
    } else if (existing.shortTitle !== act.shortTitle) {
      // The repository edits titles in place when an Act is amended or
      // renamed, so a changed title is a real signal, not noise.
      await prisma.actRecord.update({
        where: { handle: act.handle },
        data: { shortTitle: act.shortTitle, actYear: act.actYear ?? existing.actYear },
      })
      updated++
    }
  }

  return { scanned: acts.length, added, updated, errors }
}

async function refreshTrackedCases(prisma, deadline) {
  if (!ecourtsConfigured()) return { scanned: 0, updated: 0, skipped: 'ecourts not configured' }

  const { caseByCnr } = await import('@/lib/legal-data/ecourts')

  // Oldest-refreshed first, so every case comes round eventually even
  // when a single run cannot get through all of them.
  const cases = await prisma.trackedCase.findMany({
    orderBy: { refreshedAt: 'asc' },
    take: 40,
  })

  let scanned = 0, updated = 0
  for (const c of cases) {
    if (Date.now() > deadline) break
    scanned++
    try {
      const fresh = await caseByCnr(c.cnr)
      await prisma.trackedCase.update({
        where: { id: c.id },
        data: {
          caseNumber: fresh.caseNumber ?? c.caseNumber,
          title: fresh.title ?? c.title,
          court: fresh.court ?? c.court,
          stage: fresh.stage ?? c.stage,
          nextHearing: fresh.nextHearing ? new Date(fresh.nextHearing) : c.nextHearing,
          parties: fresh.parties ?? c.parties,
          raw: JSON.stringify(fresh.raw).slice(0, 60000),
          refreshedAt: new Date(),
          refreshError: null,
        },
      })
      updated++
    } catch (e) {
      // One dead case must not stop the run; record why and move on.
      await prisma.trackedCase.update({
        where: { id: c.id },
        data: { refreshedAt: new Date(), refreshError: String(e?.message || e).slice(0, 300) },
      }).catch(() => {})
    }
  }

  return { scanned, updated }
}

async function run() {
  const deadline = Date.now() + BUDGET_MS
  const { prisma } = await import('@/lib/prisma')

  const started = await prisma.legalSyncRun.create({ data: { job: 'daily' } })
  const result = { acts: null, cases: null }
  let error = null

  try {
    result.acts = await syncActs(prisma)
    result.cases = await refreshTrackedCases(prisma, deadline)
  } catch (e) {
    error = String(e?.message || e).slice(0, 500)
    console.error('[legal/sync]', e)
  }

  const added = result.acts?.added ?? 0
  const updated = (result.acts?.updated ?? 0) + (result.cases?.updated ?? 0)

  await prisma.legalSyncRun.update({
    where: { id: started.id },
    data: {
      finishedAt: new Date(),
      ok: !error,
      scanned: (result.acts?.scanned ?? 0) + (result.cases?.scanned ?? 0),
      added,
      updated,
      error,
    },
  }).catch(() => {})

  return { ok: !error, error, ...result, tookMs: BUDGET_MS - (deadline - Date.now()) }
}

export async function GET(req) {
  if (!authorised(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try { return NextResponse.json(await run()) }
  catch (e) {
    console.error('[legal/sync]', e?.message)
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 })
  }
}

export const POST = GET
