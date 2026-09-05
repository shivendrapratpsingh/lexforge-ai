// GET /api/legal/citedby?docId=… — which LATER judgments cite this one.
//
// THIS IS NOT A CITATOR, and the wording throughout deliberately avoids
// implying it is. SCC Online and Manupatra employ editors who read a
// judgment and classify every later treatment of it as followed,
// distinguished or overruled. This does none of that.
//
// It answers a narrower question honestly: has anything cited this
// since, and did any of it come from the Supreme Court. A 1998
// authority nothing has touched in thirty years and one the Supreme
// Court cited last year are very different things to put in a moot
// memorial, and a student currently has no way to tell them apart.
//
// A case is cited BY THE JUDGMENT THAT OVERRULES IT, so a high count is
// not evidence of good law. The response carries that caveat and the UI
// prints it, because the inference is the obvious one to draw and it is
// wrong.
//
// Pro-only and billed per call, like every other Kanoon route.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchLaterCitations } from '@/lib/legal-data/indiankanoon'
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
        error: 'Later citations are a Pro feature.',
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

    // Kanoon document ids are numeric. Checked rather than trusted: this
    // value goes into the upstream path, and a call that costs money
    // should not be made on a malformed id.
    if (!docId || !/^\d{1,12}$/.test(docId)) {
      return NextResponse.json({ error: 'A valid judgment id is required.' }, { status: 400 })
    }

    const result = await fetchLaterCitations(docId, { userId: session.user.id, max: 25 })

    return NextResponse.json({
      ...result,
      // Sent with the data, not left to the client to remember.
      caveat: 'These are later judgments that cite this one. A citation is not an endorsement — a case is also cited by the judgment overruling it. This is not a good-law check.',
    })
  } catch (err) {
    const map = {
      PROVIDER_AUTH: [502, 'The judgment provider rejected our credentials. The administrator has been notified.'],
      PROVIDER_QUOTA: [502, 'The judgment service has run out of credit. Please try again later.'],
      PROVIDER_UNAVAILABLE: [503, 'Judgment lookup is not switched on for this deployment.'],
    }
    const [status, message] = map[err?.code] || [500, 'Could not load later citations.']
    if (!map[err?.code]) console.error('[GET /api/legal/citedby]', err)
    return NextResponse.json({ error: message, code: err?.code || 'ERROR' }, { status })
  }
}
