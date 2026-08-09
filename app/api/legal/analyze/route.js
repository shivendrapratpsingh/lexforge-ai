// GET /api/legal/analyze?issue=... — the Legal Research page.
//
// This route used to hand the question straight to the model and print
// whatever came back, including any case names and citations it produced.
// A language model has no case database: asked to recall citations it
// invents plausible ones. Users reported exactly that — real-sounding
// case names with wrong citations. A fabricated citation carried into a
// filing is a professional disaster, so the model is no longer the source
// of case law here.
//
// Now: retrieve real judgments first, then let the model reason over
// only what was retrieved. The verified list is returned alongside the
// analysis so the lawyer can click through and check every authority
// against its original text.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { kanoonConfigured } from '@/lib/legal-data/config'

export const maxDuration = 60
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const issue = new URL(req.url).searchParams.get('issue')
    if (!issue?.trim()) return NextResponse.json({ error: 'Issue text is required.' }, { status: 400 })

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('REPLACE'))
      return NextResponse.json({ error: 'GROQ_API_KEY not configured.' }, { status: 503 })

    // ── 1. Statutes: local corpus, no model, no billed call.
    const { findApplicableLaws } = await import('@/lib/indian-laws')
    const acts = findApplicableLaws(issue, 6).map(l => ({
      shortName: l.shortName,
      fullName: l.fullName,
      year: l.year,
      sections: (l.keySections || []).slice(0, 4).map(s => ({ n: s.n, desc: s.desc })),
    }))

    // ── 2. Judgments: retrieved from the real index, never recalled.
    let cases = []
    let caseLawStatus = 'ok'

    if (!kanoonConfigured()) {
      caseLawStatus = 'unavailable'
    } else {
      try {
        const { buildCaseSearchQuery } = await import('@/lib/groq')
        const { searchJudgments } = await import('@/lib/legal-data/indiankanoon')

        const query = await buildCaseSearchQuery({ facts: issue })
        const [apex, general] = await Promise.allSettled([
          searchJudgments({ query, court: 'supremecourt' }),
          searchJudgments({ query }),
        ])

        const seen = new Set()
        for (const s of [apex, general]) {
          if (s.status !== 'fulfilled') continue
          for (const c of s.value.results) {
            if (seen.has(c.docId)) continue
            seen.add(c.docId)
            cases.push(c)
          }
        }
        // Enough to reason over, few enough to stay inside the token budget.
        cases = cases.slice(0, 10)
        if (!cases.length) caseLawStatus = 'none-found'
      } catch (e) {
        console.error('[legal/analyze] retrieval failed:', e?.code, e?.message)
        caseLawStatus = 'retrieval-failed'
      }
    }

    // ── 3. Reason over what was actually retrieved. With an empty list the
    //      model is instructed to cite nothing at all rather than recall.
    const { analyzeLegalIssue } = await import('@/lib/groq')
    const analysis = await analyzeLegalIssue(issue, { cases, acts })

    return NextResponse.json({
      analysis,
      acts,
      // Returned so the page can show every authority with a link to its
      // original text. Nothing cited should be unverifiable by the reader.
      cases: cases.map(c => ({
        title: c.title, court: c.court, date: c.date,
        citation: c.citation, sourceUrl: c.sourceUrl,
      })),
      caseLawStatus,
    })
  } catch (err) {
    console.error('[GET /api/legal/analyze]', err)
    return NextResponse.json({ error: err?.message || 'Analysis failed.' }, { status: 500 })
  }
}
