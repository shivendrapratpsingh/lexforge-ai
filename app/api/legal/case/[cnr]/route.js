// GET /api/legal/case/[cnr] — live case status by CNR number.
//
// Pro-only for the same reason as search: the provider bills per call.
// A successful lookup is recorded in TrackedCase so the daily job keeps
// it fresh afterwards, which is what turns a one-off lookup into
// "your next hearing" on the dashboard.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { caseByCnr, normaliseCnr } from '@/lib/legal-data/ecourts'
import { ecourtsConfigured } from '@/lib/legal-data/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hasProAccess } = await import('@/lib/admin')
    const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)
    if (!isPro) {
      return NextResponse.json({ error: 'Case lookup is a Pro feature.', upgrade: '/upgrade' }, { status: 402 })
    }

    if (!ecourtsConfigured()) {
      return NextResponse.json({
        error: 'Case lookup is not switched on for this deployment yet.',
        code: 'PROVIDER_UNAVAILABLE',
      }, { status: 503 })
    }

    const { cnr } = await params
    const found = await caseByCnr(cnr)

    // Remember it, so tomorrow's 8 AM run keeps the hearing date current.
    // A failure here must not lose the user their result.
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.trackedCase.upsert({
        where: { userId_cnr: { userId: session.user.id, cnr: normaliseCnr(cnr) } },
        create: {
          userId: session.user.id,
          cnr: normaliseCnr(cnr),
          caseNumber: found.caseNumber ?? null,
          title: found.title ?? null,
          court: found.court ?? null,
          stage: found.stage ?? null,
          nextHearing: found.nextHearing ? new Date(found.nextHearing) : null,
          parties: found.parties ?? null,
          raw: JSON.stringify(found.raw).slice(0, 60000),
        },
        update: {
          caseNumber: found.caseNumber ?? null,
          title: found.title ?? null,
          court: found.court ?? null,
          stage: found.stage ?? null,
          nextHearing: found.nextHearing ? new Date(found.nextHearing) : null,
          parties: found.parties ?? null,
          raw: JSON.stringify(found.raw).slice(0, 60000),
          refreshedAt: new Date(),
          refreshError: null,
        },
      })
    } catch (e) {
      console.error('[legal/case] could not track:', e?.message)
    }

    return NextResponse.json({ case: found, tracked: true })
  } catch (err) {
    const map = {
      BAD_CNR: [400, err.message],
      NOT_FOUND: [404, 'No case found with that CNR number.'],
      PROVIDER_AUTH: [502, 'The case provider rejected our credentials. The administrator has been notified.'],
      PROVIDER_QUOTA: [502, 'The case service is rate-limited or out of credit. Please try again shortly.'],
      PROVIDER_UNAVAILABLE: [503, 'Case lookup is not switched on for this deployment.'],
    }
    const [status, message] = map[err?.code] || [502, 'Case lookup is unavailable right now.']
    if (!map[err?.code]) console.error('[legal/case]', err)
    return NextResponse.json({ error: message, code: err?.code }, { status })
  }
}
