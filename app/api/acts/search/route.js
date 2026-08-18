// GET /api/acts/search?q=... — find the Acts that bear on a problem.
//
// The query may be a plain description ("my tenant will not leave") or an
// Act name ("Negotiable Instruments"). Curated Acts rank first because
// they carry hand-written section notes; Acts the daily India Code sync
// has recorded follow, with official metadata and a link to the text.
//
// Free for every signed-in user: it reads a local corpus and our own
// table, so nothing here is billed.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchActs } from '@/lib/legal-data/act-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = new URL(req.url).searchParams.get('q')

    let prisma = null
    try { ({ prisma } = await import('@/lib/prisma')) } catch (_) {}

    // Only used when the direct match finds nothing: restate a vague
    // problem in the words statutes are actually written in.
    const expand = async (text) => {
      const { buildCaseSearchQuery } = await import('@/lib/groq')
      return buildCaseSearchQuery({ facts: text })
    }

    const result = await searchActs(q, { expand, prisma })
    return NextResponse.json(result)
  } catch (err) {
    if (err?.code === 'BAD_QUERY') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[acts/search]', err)
    return NextResponse.json({ error: 'Could not search the Acts right now.' }, { status: 500 })
  }
}
