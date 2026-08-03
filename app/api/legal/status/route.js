// GET /api/legal/status — which live legal sources are switched on,
// and when the daily job last ran.
//
// Exists so nobody has to guess. An empty judgment search because no
// API key is set looks identical to an empty search because there are
// genuinely no results, and those need very different responses from
// whoever is looking at the screen.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { providerStatus } from '@/lib/legal-data/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const providers = providerStatus()
    let lastRun = null
    let counts = null

    // The tables only exist once the migration has been applied, so a
    // missing-table error here is reported rather than thrown — the
    // provider status is still useful without it.
    try {
      const { prisma } = await import('@/lib/prisma')
      const [run, acts, judgments, cases] = await Promise.all([
        prisma.legalSyncRun.findFirst({ orderBy: { startedAt: 'desc' } }),
        prisma.actRecord.count(),
        prisma.cachedJudgment.count(),
        prisma.trackedCase.count({ where: { userId: session.user.id } }),
      ])
      lastRun = run
      counts = { acts, judgments, myTrackedCases: cases }
    } catch (e) {
      counts = { error: 'Legal-data tables are not migrated on this database yet.' }
    }

    return NextResponse.json({ providers, lastRun, counts })
  } catch (err) {
    console.error('[GET /api/legal/status]', err)
    return NextResponse.json({ error: 'Could not read legal-data status.' }, { status: 500 })
  }
}
