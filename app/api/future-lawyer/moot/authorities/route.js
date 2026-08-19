// POST /api/future-lawyer/moot/authorities
// Body: { propositions: string[], court?: string }
//
// The memorial builder deliberately writes [FIND AUTHORITY — …] instead
// of inventing a case, because a fabricated citation in a moot memorial
// is the one mistake a bench will always catch. That honesty left the
// student with a list of holes and no help filling them.
//
// This route fills them with real judgments: each proposition is turned
// into a search and run against Indian Kanoon, and what comes back is
// what was actually reported. Nothing is generated here — if a search
// finds nothing, the answer is that nothing was found, which is a true
// answer and tells the student to narrow the proposition.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Each search is a billed upstream call, so the number of them a single
// request can trigger is capped rather than taken from the body.
const MAX_PROPOSITIONS = 8
const PER_PROPOSITION = 3

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Live legal data is Pro. A free account still gets the memorial and
    // the placeholders — it just does the searching itself.
    if (!(await hasProAccess(session.user.email, session.user.tier))) {
      return NextResponse.json({
        error: 'Finding authorities searches live judgment databases, which is a Pro feature. Your memorial and its placeholders are unaffected.',
        needsPro: true,
      }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const propositions = (Array.isArray(body.propositions) ? body.propositions : [])
      .map(p => String(p || '').trim())
      .filter(p => p.length >= 8)
      .slice(0, MAX_PROPOSITIONS)

    if (!propositions.length) {
      return NextResponse.json({ error: 'No propositions to look up.' }, { status: 400 })
    }

    const { searchJudgments } = await import('@/lib/legal-data/indiankanoon')
    const court = typeof body.court === 'string' && body.court ? body.court : undefined

    // Sequential, not parallel: eight simultaneous searches is how a
    // rate limit gets hit, and the whole batch would fail together.
    const found = []
    for (const proposition of propositions) {
      try {
        const out = await searchJudgments({
          query: proposition, court, userId: session.user.id,
        })
        found.push({
          proposition,
          searchedFor: out.searchedFor,
          relaxed: out.relaxed,
          results: out.results.slice(0, PER_PROPOSITION).map(r => ({
            title: r.title,
            court: r.court,
            date: r.date,
            citation: r.citation,
            snippet: r.snippet,
            sourceUrl: r.sourceUrl,
          })),
        })
      } catch (e) {
        // One failed search must not lose the other seven.
        console.error('[moot/authorities]', proposition.slice(0, 60), e?.message)
        found.push({ proposition, results: [], error: 'That search could not be run.' })
      }
    }

    return NextResponse.json({
      authorities: found,
      // Said plainly, because a student is about to put these in front of
      // a bench: these are search results, not a holding.
      note: 'These are real reported judgments matched to your proposition. Read each one before citing it — a search match is not a holding, and a bench will ask what the case actually decided.',
    })
  } catch (err) {
    console.error('[moot/authorities]', err)
    return NextResponse.json({ error: 'Could not look up authorities.' }, { status: 500 })
  }
}
