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
    operation: path.startsWith('/doc') ? 'doc' : 'search',
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

// Kanoon wraps matched terms in its own markup; strip it for display.
const clean = (s) =>
  String(s || '').replace(/<\/?[^>]+>/g, '').replace(/\s+/g, ' ').trim()

/**
 * Search judgments. `court` narrows by doctype; `fromYear`/`toYear`
 * narrow by decision date. Returns a light result list — no full text,
 * because that is the part that costs.
 */
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
