// ─────────────────────────────────────────────────────────────────
//  Act search — describe the problem, or name the Act.
//
//  Two sources, ranked deliberately:
//
//   1. The curated corpus (lib/indian-laws.js) — 214 Acts with 378
//      hand-written key sections. These rank first because they carry
//      the explanation a reader actually needs, not just a title.
//   2. ActRecord — Acts the daily India Code sync has recorded. These
//      have official metadata and a link to the full text, but no
//      hand-written notes.
//
//  Honest limit, stated here because it shapes what this can promise:
//  India Code publishes ~900 Central Acts and thousands of State Acts,
//  but its item listings come only from /discover, which robots.txt
//  disallows. There is no API. So the searchable set is the curated
//  corpus plus whatever the daily feed has collected — not everything
//  on India Code. Widening it means adding to the curated corpus.
// ─────────────────────────────────────────────────────────────────
import { findApplicableLaws } from '../indian-laws.js'

/** Which of our features actually helps someone in this situation. */
function suggestServices({ law, query }) {
  const q = `${query} ${law?.category || ''} ${(law?.tags || []).join(' ')}`.toLowerCase()
  const out = []

  const has = (...words) => words.some(w => q.includes(w))

  if (has('cheque', 'bounce', 'dishonour', 'recovery', 'unpaid', 'dues', 'money'))
    out.push({ id: 'CHEQUE_BOUNCE', label: 'Cheque Bounce Notice', why: 'Sent before a criminal complaint, and there is a 30-day deadline.' })
  if (has('arrest', 'bail', 'custody', 'police', 'fir', 'accused'))
    out.push({ id: 'BAIL_APPLICATION', label: 'Bail Application', why: 'The application asking a court to release an arrested person.' })
  if (has('tenant', 'landlord', 'rent', 'lease', 'eviction', 'vacate'))
    out.push({ id: 'LEGAL_NOTICE', label: 'Legal Notice', why: 'The formal demand that usually has to come before a suit.' })
  if (has('consumer', 'defect', 'service', 'refund', 'warranty'))
    out.push({ id: 'CONSUMER_COMPLAINT', label: 'Consumer Complaint', why: 'Filed with a consumer commission rather than a civil court.' })
  if (has('government', 'authority', 'licence', 'pension', 'transfer', 'article 226', 'writ', 'fundamental'))
    out.push({ id: 'WRIT_PETITION', label: 'Writ Petition', why: 'The remedy when a public authority has acted unlawfully.' })
  if (has('information', 'rti', 'disclosure', 'public authority'))
    out.push({ id: 'RTI_APPLICATION', label: 'RTI Application', why: 'Forces a government body to disclose records.' })
  if (has('marriage', 'divorce', 'maintenance', 'custody', 'matrimonial'))
    out.push({ id: 'DIVORCE_PETITION', label: 'Divorce Petition', why: 'The ground must match the personal law that applies.' })
  if (has('contract', 'agreement', 'breach', 'partnership', 'company'))
    out.push({ id: 'CONTRACT', label: 'Contract', why: 'Set the obligations down before the relationship starts.' })
  if (has('property', 'sale', 'land', 'possession', 'title'))
    out.push({ id: 'SALE_DEED', label: 'Sale Deed', why: 'Transfers ownership. Needs title checks a lawyer must do.' })

  // Always worth offering, whatever the subject.
  out.push({ id: 'LEGAL_NOTICE', label: 'Legal Notice', why: 'The general-purpose formal demand before litigation.' })

  // De-duplicate, keep the most specific suggestions first.
  const seen = new Set()
  return out.filter(s => !seen.has(s.id) && seen.add(s.id)).slice(0, 3)
}

function shapeCurated(law, query) {
  return {
    source: 'curated',
    id: law.id,
    shortName: law.shortName,
    fullName: law.fullName,
    year: law.year,
    category: law.category,
    tags: law.tags || [],
    sections: (law.keySections || []).map(s => ({ n: s.n, desc: s.desc })),
    sectionCount: (law.keySections || []).length,
    services: suggestServices({ law, query }),
    // Filled in only if the daily sync happens to know this Act's handle.
    handle: null,
  }
}

/**
 * @param query   a problem description, or an Act name
 * @param opts    { expand } an optional async fn turning a vague problem
 *                into legal keywords; only called if the direct match is thin
 */
export async function searchActs(query, { expand = null, prisma = null, deep = false, userId = null } = {}) {
  const q = String(query || '').trim()
  if (q.length < 3) {
    throw Object.assign(new Error('Type at least a few words — a problem, or the name of an Act.'), { code: 'BAD_QUERY' })
  }

  // 1. Curated corpus on the raw words first. Its tag matching already
  //    handles plain descriptions well ("cheque bounced" finds the NI Act).
  let laws = findApplicableLaws(q, 8)
  let expandedWith = null

  // 2. A vague description can miss entirely — findApplicableLaws requires
  //    a real match and correctly returns nothing rather than guessing. In
  //    that case, restate the problem in legal terms and try once more.
  if (laws.length === 0 && expand) {
    try {
      const legalised = await expand(q)
      if (legalised && legalised.toLowerCase() !== q.toLowerCase()) {
        laws = findApplicableLaws(legalised, 8)
        expandedWith = legalised
      }
    } catch (_) { /* the direct result stands */ }
  }

  const results = laws.map(l => shapeCurated(l, q))

  // 3. Anything the daily India Code sync has recorded. Title match only —
  //    these have no tags — so they are a supplement, never the main event.
  let official = []
  if (prisma) {
    try {
      const words = q.split(/\s+/).filter(w => w.length > 3).slice(0, 4)
      if (words.length) {
        const rows = await prisma.actRecord.findMany({
          where: { OR: words.map(w => ({ shortTitle: { contains: w, mode: 'insensitive' } })) },
          orderBy: { enactmentDate: 'desc' },
          take: 8,
        })
        const known = new Set(results.map(r => r.fullName.toLowerCase()))
        official = rows
          .filter(r => !known.has(String(r.shortTitle).toLowerCase()))
          .map(r => ({
            source: 'indiacode',
            id: r.handle,
            handle: r.handle,
            shortName: r.shortTitle,
            fullName: r.shortTitle,
            year: r.actYear,
            category: r.jurisdiction === 'central' ? 'Central Act' : r.jurisdiction,
            tags: [],
            sections: [],
            sectionCount: 0,
            url: r.url,
            services: suggestServices({ law: null, query: q }),
          }))
      }
    } catch (_) { /* the curated results still stand */ }
  }

  // 4. The long tail, from Indian Kanoon's `laws` doctype — every
  //    Central Act and Rule, not just the 269 carried locally.
  //
  //    Deliberately LAST and deliberately conditional. Steps 1 to 3 read
  //    a local corpus and our own table and cost nothing; this one is
  //    billed at ₹0.50 a search. So it runs only when the free sources
  //    found nothing worth showing, which keeps Act search free for the
  //    queries people actually make while still being able to find an
  //    Act nobody thought to curate.
  let external = []
  let externalError = null
  if (deep && results.length + official.length < 3) {
    try {
      const { searchActsOnKanoon } = await import('./indiankanoon.js')
      const out = await searchActsOnKanoon({ query: expandedWith || q, userId })
      const known = new Set([...results, ...official].map(r => r.fullName.toLowerCase()))
      external = out.results
        .filter(r => !known.has(String(r.title).toLowerCase()))
        .slice(0, 8)
        .map(r => ({
          source: 'indiankanoon',
          id: r.docId,
          shortName: r.title,
          fullName: r.title,
          year: r.actYear,
          category: 'Central Act or Rule',
          tags: [],
          // No hand-written section notes for these — the whole point of
          // the curated corpus is that it has them and this does not.
          sections: [],
          sectionCount: 0,
          snippet: r.snippet,
          url: r.sourceUrl,
          services: suggestServices({ law: null, query: q }),
        }))
    } catch (e) {
      // A billed source being unavailable must not fail a search the
      // free sources already answered.
      externalError = e?.message || 'Indian Kanoon could not be reached.'
    }
  }

  return {
    query: q,
    expandedWith,
    curated: results,
    official,
    external,
    externalError,
    searchedEverything: deep,
    total: results.length + official.length + external.length,
  }
}
