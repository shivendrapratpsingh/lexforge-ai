// POST /api/legal/relevant-cases
//
// Describe a matter in plain language; get back the authorities that
// bear on it, ordered Supreme Court → High Courts → tribunals → rest,
// plus the statutes the local corpus matches.
//
// Pro-only, and it costs two billed searches per run, so it is a POST
// with an explicit body: nothing here fires on page load or as the
// user types.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findRelevantCases } from '@/lib/legal-data/case-finder'
import { kanoonConfigured } from '@/lib/legal-data/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hasProAccess } = await import('@/lib/admin')
    const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)
    if (!isPro) {
      return NextResponse.json({
        error: 'Finding relevant cases is a Pro feature.',
        upgrade: '/upgrade',
      }, { status: 402 })
    }

    if (!kanoonConfigured()) {
      return NextResponse.json({
        error: 'Case law search is not switched on for this deployment yet.',
        code: 'PROVIDER_UNAVAILABLE',
      }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const result = await findRelevantCases({
      facts: body.facts,
      reliefSought: body.reliefSought,
      documentType: body.documentType,
      court: body.court,
      actsInvolved: body.actsInvolved,
    })

    return NextResponse.json(result)
  } catch (err) {
    const map = {
      BAD_QUERY: [400, err.message],
      PROVIDER_AUTH: [502, 'The case law provider rejected our credentials. The administrator has been notified.'],
      PROVIDER_QUOTA: [502, 'The case law service has run out of credit. Please try again later.'],
      PROVIDER_UNAVAILABLE: [503, 'Case law search is not switched on for this deployment.'],
      GROQ_RATE_LIMIT: [429, 'The AI is rate-limited right now. Try again in a minute.'],
    }
    const [status, message] = map[err?.code] || [502, 'Could not search for related cases right now.']
    if (!map[err?.code]) console.error('[legal/relevant-cases]', err)
    return NextResponse.json({ error: message, code: err?.code }, { status })
  }
}
