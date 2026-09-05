// ─────────────────────────────────────────────────────────────────
//  Indian Kanoon — judgment search and retrieval.
//
//  api.indiankanoon.org. Every call is billed, which shapes the design:
//  search results are cheap-ish and transient, full documents are the
//  expensive part and are cached in CachedJudgment so the same judgment
//  is never paid for twice.
//
//  The API is POST-only with a token in the Authorization header, which
//  is unusual enough to be worth stating: GET returns 405.
// ─────────────────────────────────────────────────────────────────
import { fetchWithTimeout, kanoonConfigured, ProviderUnavailable } from './config.js'
import { trackUsage } from '../usage.js'

const BASE = 'https://api.indiankanoon.org'

// doctypes the API understands, mapped to what a user would pick.
export const COURTS = [
  { id: 'supremecourt', label: 'Supreme Court' },
  { id: 'delhi',        label: 'Delhi High Court' },
  { id: 'bombay',       label: 'Bombay High Court' },
  { id: 'kolkata',      label: 'Calcutta High Court' },
  { id: 'chennai',      label: 'Madras High Court' },
  { id: 'allahabad',    label: 'Allahabad High Court' },
  { id: 'karnataka',    label: 'Karnataka High Court' },
  { id: 'kerala',       label: 'Kerala High Court' },
  { id: 'gujarat',      label: 'Gujarat High Court' },
  { id: 'punjab',       label: 'Punjab & Haryana High Court' },
  { id: 'rajasthan',    label: 'Rajasthan High Court' },
  { id: 'patna',        label: 'Patna High Court' },
  { id: 'lucknow',      label: 'Allahabad HC (Lucknow Bench)' },
  { id: 'tribunals',    label: 'Tribunals' },
  // Not a court. Indian Kanoon files Central Acts and Rules under this
  // doctype, which is what makes every enactment searchable rather than
  // only the 269 in the curated corpus.
  { id: 'laws',         label: 'Central Acts & Rules' },
]

async function call(path, params = {}, opts = {}) {
  if (!kanoonConfigured()) {
    throw new ProviderUnavailable('indiankanoon', 'Judgment search is not switched on for this deployment.')
  }

  const qs = new URLSearchParams(params).toString()
  const res = await fetchWithTimeout(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
    method: 'POST',                              // the API rejects GET
    headers: {
      Authorization: `Token ${process.env.INDIANKANOON_TOKEN}`,
      Accept: 'application/json',
    },
    timeoutMs: 20000,
  })

  const text = await res.text()

  // Billed per call by the provider, so recorded whatever the outcome —
  // a failed call still costs, and a cost model that only counts
  // successes understates the bill.
  trackUsage({
    userId: opts.userId ?? null,
    provider: 'indiankanoon',
    operation: kanoonOperation(path),
    ok: res.ok,
  })

  if (!res.ok) {
    // Surface the two failures that need different handling by the
    // caller: a dead token, and a spent balance.
    if (res.status === 401 || res.status === 403) {
      const e = new Error('Indian Kanoon rejected the token.')
      e.code = 'PROVIDER_AUTH'
      throw e
    }
    if (res.status === 429 || /balance|credit/i.test(text)) {
      const e = new Error('Indian Kanoon credit is exhausted or rate-limited.')
      e.code = 'PROVIDER_QUOTA'
      throw e
    }
    const e = new Error(`Indian Kanoon responded ${res.status}`)
    e.code = 'PROVIDER_ERROR'
    throw e
  }

  try { return JSON.parse(text) }
  catch { throw Object.assign(new Error('Indian Kanoon returned a malformed response.'), { code: 'PROVIDER_ERROR' }) }
}

// Which billed endpoint this path is, and they are NOT the same price:
// search and origdoc cost ₹0.50, doc ₹0.20, a fragment ₹0.05, metainfo
// ₹0.02. This used to be `startsWith('/doc') ? 'doc' : 'search'`, which
// swept /docfragment and /docmeta in with /doc and costed both at four
// and ten times what they actually are. Longest prefix first.
function kanoonOperation(path) {
  if (path.startsWith('/docfragment')) return 'fragment'
  if (path.startsWith('/docmeta')) return 'meta'
  if (path.startsWith('/origdoc')) return 'origdoc'
  if (path.startsWith('/doc')) return 'doc'
  return 'search'
}

// Kanoon wraps matched terms in its own markup; strip it for display.
const clean = (s) =>
  String(s || '').replace(/<\/?[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/**
 * Search judgments. `court` narrows by doctype; `fromYear`/`toYear`
 * narrow by decision date. Returns a light result list — no full text,
 * because that is the part that costs.
 */
/**
 * Central Acts and Rules, from the same index.
 *
 * The curated corpus carries 269 Acts with hand-written section notes,
 * which is what makes it good — but it is 269 out of many thousands, so
 * anything outside it simply could not be found. This covers the rest.
 *
 * Billed per search like any other, so callers use it as a fallback
 * after the free local corpus, never as the first move.
 */
export async function searchActsOnKanoon({ query, page = 0, userId = null }) {
  const out = await searchJudgments({ query, court: 'laws', page, userId })
  return {
    ...out,
    results: out.results.map(r => ({
      ...r,
      // "The Companies Act, 2013" → 2013. The index has no year field
      // for laws, so it comes from the title or not at all.
      actYear: Number((r.title.match(/\b(1[89]\d{2}|20\d{2})\b/) || [])[1]) || null,
    })),
  }
}

export async function searchJudgments({ query, court, fromYear, toYear, page = 0, userId = null }) {
  if (!query || !String(query).trim()) {
    throw Object.assign(new Error('A search term is required.'), { code: 'BAD_QUERY' })
  }

  const filters =
    (court ? ` doctypes:${court}` : '') +
    (fromYear ? ` fromdate:1-1-${fromYear}` : '') +
    (toYear ? ` todate:31-12-${toYear}` : '')

  const shape = (data) => {
    const docs = Array.isArray(data?.docs) ? data.docs : []
    return {
      total: Number(data?.found ?? docs.length) || docs.length,
      page,
      results: docs.map(d => ({
        docId: String(d.tid),
        title: clean(d.title),
        court: clean(d.docsource),
        snippet: clean(d.headline),
        date: d.publishdate || null,
        citation: clean(d.citation) || null,
        sourceUrl: `https://indiankanoon.org/doc/${d.tid}/`,
      })),
    }
  }

  const original = String(query).trim()
  let out = shape(await call('/search/', { formInput: original + filters, pagenum: page }, { userId }))
  if (out.results.length > 0) return { ...out, searchedFor: original, relaxed: false }

  // Indian Kanoon requires EVERY word to appear, so a long query finds
  // nothing while a shorter one finds plenty: "section 138 negotiable
  // instruments act rebuttal of presumption" returned zero, while
  // "dishonour of cheque forged signature defence" returned ten. Asking a
  // user to guess how many words is too many is not a real answer.
  //
  // So on an empty result — and only then, since each attempt is billed —
  // drop the words carrying least meaning and try once more.
  const relaxed = relaxQuery(original)
  if (relaxed && relaxed !== original) {
    out = shape(await call('/search/', { formInput: relaxed + filters, pagenum: page }, { userId }))
    if (out.results.length > 0) return { ...out, searchedFor: relaxed, relaxed: true }
  }

  return { ...out, searchedFor: original, relaxed: false }
}

// Words that add no discriminating power in a corpus of Indian judgments —
// every one of them appears in almost every judgment, so requiring them
// only shrinks the result set.
const FILLER = new Set([
  'the', 'of', 'a', 'an', 'and', 'or', 'in', 'on', 'for', 'to', 'by', 'with',
  'under', 'act', 'section', 'sections', 'law', 'case', 'court', 'judgment',
  'india', 'indian', 'my', 'client', 'is', 'was', 'has', 'have',
])

/**
 * Shorten an over-specified query: drop filler, keep section numbers and
 * the most distinctive terms. Returns '' when there is nothing to relax.
 */
export function relaxQuery(query) {
  const words = String(query || '').trim().split(/\s+/)
  if (words.length <= 4) return ''

  const numbers = words.filter(w => /^\d+[A-Za-z]?$/.test(w))
  const kept = words.filter(w => !FILLER.has(w.toLowerCase().replace(/[^a-z0-9]/gi, '')))

  // Longest words first: in legal text length correlates well with how
  // specific a term is ("presumption" discriminates, "made" does not".)
  const ranked = kept
    .filter(w => !numbers.includes(w))
    .sort((a, b) => b.length - a.length)
    .slice(0, 4)

  // Section numbers are the most discriminating token there is, so they
  // survive the trim regardless of length.
  const out = [...numbers, ...ranked]
  return out.length >= 2 ? out.join(' ') : ''
}

/** Fetch one judgment in full. This is the billed call worth caching. */
export async function fetchJudgment(docId, { userId = null } = {}) {
  const data = await call(`/doc/${encodeURIComponent(docId)}/`, {}, { userId })
  return {
    docId: String(docId),
    title: clean(data?.title),
    court: clean(data?.docsource),
    bench: clean(data?.bench) || null,
    date: data?.publishdate || null,
    citation: clean(data?.citation) || null,
    // Kanoon returns HTML. Kept as-is so the reader can render structure
    // (paragraph numbers, headings) that plain text would destroy.
    html: data?.doc || '',
    text: clean(data?.doc).slice(0, 200000),
    sourceUrl: `https://indiankanoon.org/doc/${docId}/`,
  }
}

/**
 * Which LATER judgments have cited this one.
 *
 * WHAT THIS IS, AND WHAT IT IS NOT
 *
 * It is NOT a citator. SCC Online and Manupatra employ editors who read
 * a judgment and classify every later treatment of it — followed,
 * distinguished, overruled. That is human work and this is not a
 * substitute for it.
 *
 * This answers a narrower question honestly: has anybody cited this
 * since, and who. A 1998 authority nothing has touched in thirty years
 * and one the Supreme Court cited last year are very different things
 * to put in a memorial, and a student currently cannot tell them apart.
 *
 * Callers must label it as later citations, never as good law. Saying
 * a case is still good because it was cited is exactly the inference
 * this cannot support: a judgment gets cited by the decision overruling
 * it.
 *
 * Billed as one /doc/ call (₹0.20), so it is fetched on demand for one
 * judgment — never eagerly for a page of search results, which would
 * cost ₹2 per search for something most users never open.
 */
export async function fetchLaterCitations(docId, { userId = null, max = 25 } = {}) {
  // maxcites=0: we are asking what cites THIS, not what this cites, and
  // the other half of the payload is billed weight we would discard.
  const data = await call(
    `/doc/${encodeURIComponent(docId)}/`,
    { maxcitedby: String(Math.min(Math.max(Number(max) || 25, 1), 50)), maxcites: '0' },
    { userId },
  )

  const list = Array.isArray(data?.citedbyList) ? data.citedbyList : []

  // Field names are read defensively. The documented shape carries tid
  // and title; docsource is present on search results and may or may
  // not be here, so the court falls back to reading the title, which
  // Kanoon writes as "X vs Y on 3 March 2019" prefixed by the bench.
  const cites = list.map((c) => {
    const title  = clean(c?.title)
    const source = clean(c?.docsource) || courtFromTitle(title)
    return {
      docId: String(c?.tid ?? ''),
      title,
      court: source || null,
      date: c?.publishdate || null,
      apex: /supreme\s+court/i.test(source || title),
      sourceUrl: c?.tid ? `https://indiankanoon.org/doc/${c.tid}/` : null,
    }
  }).filter(c => c.docId && c.title)

  return {
    docId: String(docId),
    title: clean(data?.title),
    // What came back, which is capped by `max` — not a count of every
    // citation in existence. Named for what it is so no caller reports
    // "cited 25 times" when the real number may be far larger.
    returned: cites.length,
    capped: cites.length >= Math.min(Number(max) || 25, 50),
    apex: cites.filter(c => c.apex),
    others: cites.filter(c => !c.apex),
  }
}

/** Last resort when the payload carries no docsource of its own. */
function courtFromTitle(title) {
  const t = String(title || '')
  if (/supreme\s+court/i.test(t)) return 'Supreme Court of India'

  // Walk BACKWARDS from "High Court" collecting the capitalised words
  // in front of it, rather than matching forwards. A forward regex with
  // spaces in its character class runs from the first capital in the
  // string, so "M/S Gupta Traders vs Bank Of India Madras High Court"
  // came back as the whole title instead of "Madras High Court".
  //
  // Stops at the first word that is not part of a court's name, which
  // keeps "Punjab And Haryana High Court" whole while cutting the
  // parties off "... vs Bank Of India Madras High Court".
  const i = t.search(/\bHigh\s+Court\b/i)
  if (i === -1) return ''

  const before = t.slice(0, i).trim().split(/\s+/)
  const STOP = new Set(['vs', 'v', 'v.', 'vs.', 'versus', 'of', 'the', 'in', 'on', 'at', 'and'])
  const parts = []
  for (let k = before.length - 1; k >= 0 && parts.length < 4; k--) {
    const w = before[k]
    // "And"/"&" joins two state names, so it is kept only when another
    // capitalised word follows it.
    if (/^(&|and)$/i.test(w)) {
      if (!parts.length) break
      parts.unshift('and')
      continue
    }
    if (!/^[A-Z][A-Za-z.]*$/.test(w)) break
    if (STOP.has(w.toLowerCase())) break
    parts.unshift(w)
  }
  if (parts.length && /^(&|and)$/i.test(parts[0])) parts.shift()
  return parts.length ? parts.join(' ') + ' High Court' : ''
}

// ─── How later courts have TREATED a judgment ──────────────────────
//
//  WHAT THIS IS, AND WHY IT IS NOT A CITATOR
//
//  SCC Online and Manupatra employ editors who read every later
//  judgment and classify how it treated an earlier one: followed,
//  distinguished, overruled. That classification is a considered human
//  judgment and it is the single thing this product cannot reproduce.
//
//  So this does not classify. It SURFACES EVIDENCE.
//
//  Indian Kanoon's /docfragment/ endpoint returns the passage of a
//  judgment that matches a query. Ask a later judgment for the passage
//  where it names this case, and you get back the actual sentences in
//  which that court discussed it. If a bench wrote "the decision in X
//  is no longer good law", those words are in the passage.
//
//  What comes back is therefore a QUOTE and a LINK, never a verdict.
//  The student reads the sentence and decides. That is honest about
//  what we know, and it is also more useful to somebody learning than
//  a one-word label they cannot check.
//
//  Getting this wrong in either direction is expensive: a false
//  "overruled" makes a student throw away good authority, and a false
//  "still good" is worse. Surfacing the passage avoids being wrong at
//  all, because we assert nothing.
//
//  COST. One /doc/ call for the citing list (₹0.20) plus one fragment
//  per judgment examined (₹0.05 each). Eight judgments is ₹0.60. Run
//  only on request.

// Words a court uses when it is unpicking an earlier decision, and
// words it uses when it is relying on one. Matched case-insensitively
// against the returned passage.
//
// These decide only how a quote is LABELLED for the reader's attention,
// never whether the quote is shown. A passage that matches nothing is
// still displayed, because the sentence is the point.
// Both tenses of each verb. Judgments are written both ways - "we
// follow the principle" and "the principle was followed" - and a list
// carrying only the past tense misses half of them.
const TREATMENT_NEGATIVE = [
  'overrule', 'overrules', 'overruled', 'overruling', 'over-ruled',
  'no longer good law', 'not good law', 'cannot be considered good law',
  'per incuriam', 'disapprove', 'disapproves', 'disapproved',
  'doubt', 'doubts', 'doubted', 'wrongly decided',
]
const TREATMENT_NARROWING = [
  'distinguish', 'distinguishes', 'distinguished',
  'confined to its own facts', 'has no application', 'is not applicable',
]
const TREATMENT_POSITIVE = [
  'follow', 'follows', 'followed', 'approve', 'approves', 'approved',
  'affirm', 'affirms', 'affirmed', 'reiterate', 'reiterates', 'reiterated',
  'reaffirm', 'reaffirms', 'reaffirmed', 'uphold', 'upholds', 'upheld',
  'relied upon', 'relied on',
]

// Matched on WORD BOUNDARIES, not as substrings. "the following
// submissions" is not a court following anything, and plain substring
// matching read it as approval. Phrases work the same way.
const wordRe = (phrase) =>
  new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '\\b', 'i')

const RE_NEGATIVE  = TREATMENT_NEGATIVE.map(wordRe)
const RE_NARROWING = TREATMENT_NARROWING.map(wordRe)
const RE_POSITIVE  = TREATMENT_POSITIVE.map(wordRe)

function classifyPassage(passage) {
  const t = String(passage || '')
  const hits = (res, words) => words.filter((_, i) => res[i].test(t))
  // Worst news first, and deliberately: a bench that follows one part of
  // a judgment and overrules another must not be reported as merely
  // having followed it.
  const neg = hits(RE_NEGATIVE, TREATMENT_NEGATIVE)
  if (neg.length) return { signal: 'negative', matched: neg }
  const nar = hits(RE_NARROWING, TREATMENT_NARROWING)
  if (nar.length) return { signal: 'narrowing', matched: nar }
  const pos = hits(RE_POSITIVE, TREATMENT_POSITIVE)
  if (pos.length) return { signal: 'positive', matched: pos }
  return { signal: 'neutral', matched: [] }
}

/**
 * The most distinctive words of a case name, for querying a later
 * judgment. Kanoon requires EVERY word of a query to appear, so the
 * full case name finds nothing — "Kesavananda Bharati v. State of
 * Kerala" fails against a judgment that writes "Kesavananda Bharati
 * case". Party surnames are what actually recur.
 */
function caseNameQuery(title) {
  const t = String(title || '')
    // Everything after "vs" is usually "State of X" or "Union of India",
    // which appears in half the reports and discriminates nothing.
    .split(/\bv[s]?\.?\b/i)[0]
    .replace(/[^A-Za-z\s]/g, ' ')
  const STOP = new Set(['the', 'of', 'and', 'in', 'on', 'ltd', 'co', 'm', 's', 'shri', 'smt', 'state', 'union'])
  const words = t.split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))
    .sort((a, b) => b.length - a.length)
    .slice(0, 2)
  return words.join(' ')
}

/** Pull the passage of one judgment that mentions a given case. */
async function fragmentMentioning(docId, query, { userId = null } = {}) {
  const data = await call(
    `/docfragment/${encodeURIComponent(docId)}/`,
    { formInput: query },
    { userId },
  )
  // Shape is read defensively: the documented field is `headline`, the
  // same field a search result carries, and the endpoint has not been
  // exercised against the live API from this codebase before.
  const raw = data?.headline ?? data?.fragment ?? data?.doc ?? ''
  const list = Array.isArray(raw) ? raw : [raw]
  return clean(list.join(' … ')).slice(0, 900)
}

/**
 * How later judgments have discussed this one.
 *
 * Returns quotes with links, grouped by the language they use. Asserts
 * nothing about whether the case is still good law.
 */
export async function fetchTreatment(docId, { userId = null, examine = 8 } = {}) {
  const later = await fetchLaterCitations(docId, { userId, max: 40 })
  const query = caseNameQuery(later.title)

  // Apex court first, then the rest. A Supreme Court judgment saying
  // something about this case matters more than a tribunal doing so,
  // and the budget is spent in that order.
  const candidates = [...later.apex, ...later.others]
    .filter(c => c.docId)
    .slice(0, Math.max(1, Math.min(Number(examine) || 8, 15)))

  const passages = []
  if (query) {
    const settled = await Promise.allSettled(
      candidates.map(c => fragmentMentioning(c.docId, query, { userId })),
    )
    settled.forEach((s, i) => {
      if (s.status !== 'fulfilled' || !s.value) return
      const c = candidates[i]
      passages.push({
        docId: c.docId,
        title: c.title,
        court: c.court,
        apex: c.apex,
        sourceUrl: c.sourceUrl,
        passage: s.value,
        ...classifyPassage(s.value),
      })
    })
  }

  // Anything with treatment language first, negatives before the rest,
  // so the thing a student most needs to see is not below the fold.
  const order = { negative: 0, narrowing: 1, positive: 2, neutral: 3 }
  passages.sort((a, b) => (order[a.signal] - order[b.signal]) || (b.apex - a.apex))

  return {
    docId: String(docId),
    title: later.title,
    query,
    citedBy: later.apex.length + later.others.length,
    citedByCapped: later.capped,
    examined: candidates.length,
    passages,
    counts: {
      negative: passages.filter(p => p.signal === 'negative').length,
      narrowing: passages.filter(p => p.signal === 'narrowing').length,
      positive: passages.filter(p => p.signal === 'positive').length,
    },
  }
}

export { classifyPassage, caseNameQuery }
