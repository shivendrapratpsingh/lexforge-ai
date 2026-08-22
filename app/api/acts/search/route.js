// GET /api/acts/search?q=... — find the Acts that bear on a problem.
//
// The query may be a plain description ("my tenant will not leave") or an
// Act name ("Negotiable Instruments"). Curated Acts rank first because
// they carry hand-written section notes; Acts the daily India Code sync
// has recorded follow, with official metadata and a link to the text.
//
// The local corpus and our own India Code table are free for every
// signed-in user. When they come back with almost nothing, a Pro user's
// search also reaches Indian Kanoon's `laws` doctype — every Central Act
// and Rule rather than the 269 carried locally. That call is billed, so
// it is Pro-only and runs only as a fallback.

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

    // Reaching past the free sources costs money, so it follows the same
    // rule as every other live legal lookup in the app.
    const { hasProAccess } = await import('@/lib/admin')
    const deep = await hasProAccess(session.user.email, session.user.tier).catch(() => false)

    let prisma = null
    try { ({ prisma } = await import('@/lib/prisma')) } catch (_) {}

    // Only used when the direct match finds nothing: restate a vague
    // problem in the words statutes are actually written in.
    const expand = async (text) => {
      const { buildCaseSearchQuery } = await import('@/lib/groq')
      return buildCaseSearchQuery({ facts: text })
    }

    const result = await searchActs(q, { expand, prisma, deep, userId: session.user.id })
    return NextResponse.json(result)
  } catch (err) {
    if (err?.code === 'BAD_QUERY') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[acts/search]', err)
    return NextResponse.json({ error: 'Could not search the Acts right now.' }, { status: 500 })
  }
}
