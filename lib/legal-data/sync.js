// ─────────────────────────────────────────────────────────────────
//  The daily legal-data sync, as a function rather than a route.
//
//  It lives here because it runs from two places: its own endpoint, so
//  it can be triggered by hand, and the existing 8 AM push job, which
//  is what actually schedules it. Vercel's Hobby plan allows two cron
//  jobs and this project already has two, so rather than spend the
//  deploy on a third — or fail the deploy finding out — the sync rides
//  along with the notification job that already fires at 8 AM IST.
//
//  Bounded by wall clock, not item count. An invocation killed at the
//  platform cap leaves no record of where it reached, so the job works
//  to a budget, writes a run row, and resumes next morning.
// ─────────────────────────────────────────────────────────────────
import { fetchLatestActs } from './indiacode.js'
import { ecourtsConfigured } from './config.js'

async function syncActs(prisma) {
  const { acts, errors, migrating } = await fetchLatestActs()
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
      // renamed, so a changed title is real signal, not noise.
      await prisma.actRecord.update({
        where: { handle: act.handle },
        data: { shortTitle: act.shortTitle, actYear: act.actYear ?? existing.actYear },
      })
      updated++
    }
  }

  // `migrating` travels with the result so the status panel can say
  // "India Code is moving house" rather than showing a run that scanned
  // nothing. A silent zero is indistinguishable from a quiet week in
  // Parliament, which is how this went unnoticed in the first place.
  return { scanned: acts.length, added, updated, errors, migrating }
}

async function refreshTrackedCases(prisma, deadline) {
  if (!ecourtsConfigured()) return { scanned: 0, updated: 0, skipped: 'ecourts not configured' }

  const { caseByCnr } = await import('./ecourts.js')

  // Oldest-refreshed first, so every case comes round eventually even
  // when one run cannot get through all of them.
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

/**
 * @param budgetMs how long the job may spend before it stops and leaves
 *        the rest for tomorrow. Callers sharing an invocation with other
 *        work should pass what they can actually spare.
 */
export async function runDailySync({ budgetMs = 45_000 } = {}) {
  const deadline = Date.now() + budgetMs
  const startedMs = Date.now()
  const { prisma } = await import('../prisma.js')

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

  await prisma.legalSyncRun.update({
    where: { id: started.id },
    data: {
      finishedAt: new Date(),
      ok: !error,
      scanned: (result.acts?.scanned ?? 0) + (result.cases?.scanned ?? 0),
      added: result.acts?.added ?? 0,
      updated: (result.acts?.updated ?? 0) + (result.cases?.updated ?? 0),
      error,
    },
  }).catch(() => {})

  return { ok: !error, error, ...result, tookMs: Date.now() - startedMs }
}
