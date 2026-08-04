// GET /api/legal/search — judgment search across the Supreme Court,
// the High Courts and the tribunals.
//
// Pro-only, because every call is billed by the provider. A free-tier
// user gets a clear 402 pointing at /upgrade rather than an empty list,
// so nobody is left wondering whether the search simply found nothing.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchJudgments, COURTS } from '@/lib/legal-data/indiankanoon'
import { kanoonConfigured } from '@/lib/legal-data/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hasProAccess } = await import('@/lib/admin')
    const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)
    if (!isPro) {
      return NextResponse.json({
        error: 'Case law search is a Pro feature.',
        upgrade: '/upgrade',
      }, { status: 402 })
    }

    if (!kanoonConfigured()) {
      return NextResponse.json({
        error: 'Case law search is not switched on for this deployment yet.',
        code: 'PROVIDER_UNAVAILABLE',
      }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Enter something to search for.' }, { status: 400 })
    }

    const result = await searchJudgments({
      query,
      court: searchParams.get('court') || undefined,
      fromYear: searchParams.get('from') || undefined,
      toYear: searchParams.get('to') || undefined,
      page: Number(searchParams.get('page') || 0),
    })

    return NextResponse.json({ ...result, courts: COURTS })
  } catch (err) {
    // The provider's own failures need distinguishing: a dead key and a
    // spent balance are both "no results" to a user, but only one of
    // them is something they can do anything about.
    const map = {
      PROVIDER_AUTH: [502, 'The case law provider rejected our credentials. The administrator has been notified.'],
      PROVIDER_QUOTA: [502, 'The case law service has run out of credit. Please try again later.'],
      PROVIDER_UNAVAILABLE: [503, 'Case law search is not switched on for this deployment.'],
      BAD_QUERY: [400, err.message],
    }
    const [status, message] = map[err?.code] || [502, 'Case law search is unavailable right now.']
    if (!map[err?.code]) console.error('[legal/search]', err)
    else if (err.code === 'PROVIDER_AUTH' || err.code === 'PROVIDER_QUOTA') console.error('[legal/search]', err.code, err.message)
    return NextResponse.json({ error: message, code: err?.code }, { status })
  }
}
