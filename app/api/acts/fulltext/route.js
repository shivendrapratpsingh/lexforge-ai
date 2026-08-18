// GET /api/acts/fulltext?handle=123456789/22148
//
// Downloads and reads the official PDF of an Act from India Code and
// returns it split into sections. Takes several seconds, which is why
// it is a separate call the reader triggers rather than part of search.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { fetchActFullText } from '@/lib/legal-data/act-fulltext'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const handle = new URL(req.url).searchParams.get('handle')
    if (!/^\d+\/\d+$/.test(String(handle || ''))) {
      return NextResponse.json({ error: 'A valid India Code handle is required.' }, { status: 400 })
    }

    const act = await fetchActFullText(handle)
    // The whole text is not sent to the browser — the sections carry it,
    // and shipping 400KB of statute to a phone helps nobody.
    const { text, ...payload } = act
    return NextResponse.json(payload)
  } catch (err) {
    const map = {
      NO_PDF: [404, 'No official PDF is published for this Act on India Code.'],
      NOT_TEXT: [422, err.message],
      PROVIDER_ERROR: [502, 'India Code could not be reached just now.'],
    }
    const [status, message] = map[err?.code] || [500, 'Could not read the full Act.']
    if (!map[err?.code]) console.error('[acts/fulltext]', err)
    return NextResponse.json({ error: message, code: err?.code }, { status })
  }
}
