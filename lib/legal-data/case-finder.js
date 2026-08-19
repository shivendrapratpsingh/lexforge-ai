// ─────────────────────────────────────────────────────────────────
//  Relevant case finder — describe your matter, get the authorities.
//
//  Three steps, in this order for a reason:
//
//    1. The description is rewritten as a legal query (lib/groq.js).
//       A lawyer describes what happened; judgments are written in
//       doctrine and section numbers. Searching the raw narrative
//       returns noise.
//    2. Two searches are run, not one. The apex court is asked for
//       explicitly, because a general relevance search often surfaces
//       a well-argued High Court judgment above the Supreme Court
//       decision that binds it — and for a lawyer, "what binds me"
//       comes before "what reads well".
//    3. Results are bucketed by court hierarchy and returned in that
//       order: Supreme Court, then High Courts, then tribunals, then
//       everything else.
//
//  Nothing here invents a case. Every judgment shown came back from
//  the index with its own citation and link; the model only ever
//  writes the query.
// ─────────────────────────────────────────────────────────────────
import { searchJudgments } from './indiankanoon.js'
import { buildCaseSearchQuery } from '../groq.js'
import { findApplicableLaws } from '../indian-laws.js'

// Court hierarchy. Order matters — it is the display order, and the
// tests below run in sequence, so "high court" must be checked before
// the looser tribunal pattern that would otherwise catch appellate benches.
export const TIERS = [
  {
    id: 'supreme',
    label: 'Supreme Court of India',
    note: 'Binding on every court in India',
    test: /supreme court/i,
  },
  {
    id: 'high',
    label: 'High Courts',
    note: 'Binding in their own State; persuasive elsewhere',
    test: /high court/i,
  },
  {
    id: 'tribunal',
    label: 'Tribunals & Appellate Authorities',
    note: 'NCLT, NCLAT, ITAT, CAT, CESTAT, consumer and other fora',
    test: /tribunal|appellate|commission|NCLA?T|ITAT|CESTAT|\bCAT\b|consumer|forum/i,
  },
  {
    id: 'other',
    label: 'District & Other Courts',
    note: 'Persuasive only',
    test: /.*/,
  },
]

export function tierFor(courtName) {
  const name = String(courtName || '')
  return TIERS.find(t => t.test.test(name)) || TIERS[TIERS.length - 1]
}

/**
 * @param details  { facts, reliefSought, documentType, court, actsInvolved }
 * @returns { query, acts, tiers: [{ id, label, note, cases: [...] }], total }
 */
export async function findRelevantCases(details, { perSearch = 0, userId = null } = {}) {
  const facts = String(details?.facts || '').trim()
  if (facts.length < 20) {
    throw Object.assign(
      new Error('Describe the matter in a little more detail — at least a sentence or two — so the search has something to work with.'),
      { code: 'BAD_QUERY' }
    )
  }

  // 1. Narrative → legal query.
  const query = await buildCaseSearchQuery({ ...details, facts }, { userId })

  // 2. Two searches: the apex court explicitly, and everything else by
  //    relevance. Run together — the second must not wait on the first.
  const [apex, general] = await Promise.allSettled([
    searchJudgments({ query, court: 'supremecourt', page: perSearch, userId }),
    searchJudgments({ query, page: perSearch, userId }),
  ])

  // If BOTH failed the provider is down or the credentials are wrong,
  // and that needs surfacing rather than showing an empty result.
  if (apex.status === 'rejected' && general.status === 'rejected') {
    throw apex.reason
  }

  const seen = new Set()
  const all = []
  for (const settled of [apex, general]) {
    if (settled.status !== 'fulfilled') continue
    for (const c of settled.value.results) {
      if (seen.has(c.docId)) continue      // the same judgment in both searches
      seen.add(c.docId)
      all.push(c)
    }
  }

  // 3. Bucket by hierarchy, preserving the index's relevance order
  //    inside each tier.
  const tiers = TIERS.map(t => ({
    id: t.id,
    label: t.label,
    note: t.note,
    cases: all.filter(c => tierFor(c.court).id === t.id),
  })).filter(t => t.cases.length > 0)

  // Statutes come from the local corpus, not the model and not a billed
  // call — findApplicableLaws already scores the Acts in lib/indian-laws
  // and drops weak matches, so an irrelevant statute is not shown.
  const acts = findApplicableLaws(`${facts} ${details?.actsInvolved || ''}`, 6)
    .map(l => ({
      shortName: l.shortName,
      fullName: l.fullName,
      year: l.year,
      // Only the sections a lawyer would actually reach for first.
      sections: (l.keySections || []).slice(0, 4).map(s => ({ n: s.n, desc: s.desc })),
    }))

  return { query, acts, tiers, total: all.length }
}
