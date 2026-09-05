// GET /api/legal/treatment?docId=… — how later courts have discussed
// this judgment, in their own words.
//
// THIS IS NOT A CITATOR AND MUST NEVER BE PRESENTED AS ONE. SCC Online
// and Manupatra employ editors who read each later judgment and
// classify how it treated an earlier one. That is human judgment and
// this does not reproduce it.
//
// What this returns is EVIDENCE, not a verdict: the actual passage in
// which a later court discussed this case, with a link so the reader
// can open the judgment and see it in context. Where that passage
// contains language of doubt or of reliance, it is flagged so the
// reader looks there first — but the flag describes the WORDS FOUND,
// never the standing of the case.
//
// The reason for that design is not modesty. A wrong "overruled" makes
// a student discard good authority; a wrong "still good" is worse. By
// quoting rather than concluding, we cannot be wrong about the one
// thing we are not in a position to know.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchTreatment } from '@/lib/legal-data/indiankanoon'
import { kanoonConfigured } from '@/lib/legal-data/config'

// Fans out one fragment call per citing judgment, so it needs longer
// than a single lookup.
export const maxDuration = 60
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
        error: 'Checking how later courts treated a judgment is a Pro feature.',
        upgrade: '/upgrade',
      }, { status: 402 })
    }

    if (!kanoonConfigured()) {
      return NextResponse.json({
        error: 'Judgment lookup is not switched on for this deployment yet.',
        code: 'PROVIDER_UNAVAILABLE',
      }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const docId = searchParams.get('docId')
    // Numeric, and checked rather than trusted: this value goes into an
    // upstream path and every call downstream of it costs money.
    if (!docId || !/^\d{1,12}$/.test(docId)) {
      return NextResponse.json({ error: 'A valid judgment id is required.' }, { status: 400 })
    }

    const result = await fetchTreatment(docId, { userId: session.user.id, examine: 8 })

    return NextResponse.json({
      ...result,
      // Travels with the data so no client can render the numbers
      // without it.
      caveat: 'These are passages from later judgments that mention this case, quoted as written. ' +
              'They are not an editorial classification, and this is not a good-law check — read the ' +
              'judgment itself before relying on it.',
    })
  } catch (err) {
    const map = {
      PROVIDER_AUTH: [502, 'The judgment provider rejected our credentials. The administrator has been notified.'],
      PROVIDER_QUOTA: [502, 'The judgment service has run out of credit. Please try again later.'],
      PROVIDER_UNAVAILABLE: [503, 'Judgment lookup is not switched on for this deployment.'],
    }
    const [status, message] = map[err?.code] || [500, 'Could not check how this judgment has been treated.']
    if (!map[err?.code]) console.error('[GET /api/legal/treatment]', err)
    return NextResponse.json({ error: message, code: err?.code || 'ERROR' }, { status })
  }
}
