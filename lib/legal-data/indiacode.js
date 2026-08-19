// ─────────────────────────────────────────────────────────────────
//  India Code — the official Government repository of every Central
//  and State enactment. Free, no key.
//
//  This was rewritten after the site moved. What changed and why it
//  matters, because none of it is obvious from the outside:
//
//    * The old host, indiacode.nic.in, now serves nothing but a
//      migration notice. Every call the app made had been failing —
//      silently, because a harvest that finds no Acts looks exactly
//      like a day on which Parliament passed none.
//    * The old approach was RSS. DSpace's per-collection feeds were the
//      only machine-readable surface the old site had, since its /rest/
//      and /oai/ endpoints were switched off. On the new site the feeds
//      404 and the REST API is switched on, so this reads JSON now.
//    * /handle/ pages used to carry a link to the Act's PDF and could be
//      read directly. The new site is an Angular app: /handle/ returns
//      an empty shell, and the PDF has to come through the API's
//      bundle → bitstream chain instead.
//
//  The migration is still in flight upstream: the site root and
//  robots.txt return 502, some API endpoints return 401, and items come
//  back with no bundles. So every function here reports what actually
//  happened rather than returning an empty list, and the caller is
//  expected to surface that. The 269-Act corpus in lib/indian-laws.js is
//  local and unaffected by any of this.
//
//  Every request is checked against India Code's robots.txt first, by
//  lib/legal-data/robots.js. That matters here because the policy
//  disallows /discover — the old interface's search page — while the
//  REST API has an unrelated /server/api/discover namespace holding the
//  browse indexes. A Disallow matches from the start of the path, so the
//  browse index is permitted and the search page is not.
// ─────────────────────────────────────────────────────────────────
import { INDIA_CODE_BASE, INDIA_CODE_API, HARVEST_UA, fetchWithTimeout } from './config.js'
import { robotsAllows } from './robots.js'

// Central → Acts, on the new site. The uuid is what the REST API takes;
// the handle is kept because it is what the old data and every existing
// link in the app are keyed on.
export const COLLECTIONS = [
  {
    uuid: '69a0c1fb-7b22-4481-b16a-1dc59b5d02e6',
    handle: '123456789/2',
    jurisdiction: 'central',
    label: 'Central Acts',
  },
]

class IndiaCodeError extends Error {
  constructor(message, { status = null, migrating = false } = {}) {
    super(message)
    this.name = 'IndiaCodeError'
    this.code = 'PROVIDER_ERROR'
    this.status = status
    // A 502 from the new host during its migration is a different thing
    // from a bug here, and the difference belongs in the status panel.
    this.migrating = migrating
  }
}

async function api(path, { timeoutMs = 25000 } = {}) {
  const url = path.startsWith('http') ? path : `${INDIA_CODE_API}${path}`

  // Checked against India Code's own robots.txt every time, cached for
  // six hours. When the file cannot be read — as during this migration
  // — it falls back to what the last published policy refused.
  const permitted = await robotsAllows(url)
  if (!permitted.allowed) {
    throw new IndiaCodeError(
      `Not fetching ${path} — India Code's robots.txt says ${permitted.rule}.`,
      { status: null }
    )
  }

  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': HARVEST_UA, Accept: 'application/json' },
    timeoutMs,
  })

  if (!res.ok) {
    const migrating = res.status === 502 || res.status === 503 || res.status === 401
    throw new IndiaCodeError(
      migrating
        ? `India Code responded ${res.status} — the site migration to indiacode.gov.in is still in progress upstream.`
        : `India Code responded ${res.status} for ${path}`,
      { status: res.status, migrating }
    )
  }

  return res.json()
}

// "Repealing and Amending Act, 2025" → 2025. Falls back to the metadata
// date when the title carries no year.
function yearFromTitle(title) {
  const m = String(title || '').match(/\b(1[89]\d{2}|20\d{2})\b(?!.*\b(1[89]\d{2}|20\d{2})\b)/)
  return m ? Number(m[1]) : null
}

const meta = (item, key) => item?.metadata?.[key]?.[0]?.value || null

function shapeItem(item, collection) {
  const title = item.name || meta(item, 'dc.title')
  const handle = item.handle || null

  // The API carries the year and the enactment date as their own
  // fields. The old RSS did not, which is why the year used to be read
  // out of the title — a guess that failed on every Act whose short
  // title mentions another year. Prefer the field, keep the guess as a
  // fallback for records that predate it.
  const issued = meta(item, 'dc.date.enact_date') || meta(item, 'dc.date.issued') || meta(item, 'dc.date.accessioned')
  const date = issued ? new Date(issued) : null
  const statedYear = Number(meta(item, 'dc.date.act_year')) || null

  return {
    uuid: item.uuid,
    handle,
    shortTitle: title,
    description: meta(item, 'dc.description.abstract'),
    actNumber: meta(item, 'dc.identifier.act_number'),
    actYear: statedYear || yearFromTitle(title) || (date && !isNaN(date) ? date.getUTCFullYear() : null),
    enactmentDate: date && !isNaN(date) ? date : null,
    ministry: meta(item, 'dc.contributor.author') || meta(item, 'dc.publisher'),
    jurisdiction: collection?.jurisdiction || 'central',
    url: handle ? `${INDIA_CODE_BASE}/handle/${handle}` : `${INDIA_CODE_BASE}/items/${item.uuid}`,
  }
}

/**
 * Confirm the collection is reachable and report what the API says about
 * it. Cheap, and it is the check worth running before concluding that
 * nothing new was enacted.
 */
export async function fetchCollection(collection) {
  const data = await api(`/core/collections/${collection.uuid}`)
  return {
    uuid: data.uuid,
    handle: data.handle,
    name: data.name,
    label: collection.label,
  }
}

/**
 * The most recently added Acts in one collection.
 *
 * Reads the collection first, so that an empty result can be told apart
 * from an unreachable one — an empty list looks exactly like a week in
 * which Parliament passed nothing, which is how the last breakage went
 * unnoticed for months.
 */
export async function fetchCollectionFeed(collection) {
  // Proves the host and the collection are real before anything else is
  // concluded from an empty result.
  await fetchCollection(collection)

  // DSpace 7 dropped /core/collections/{uuid}/items. Its replacement is
  // the browse index, which is the API behind the site's own "browse by
  // title" — not its search, and not disallowed by robots.txt. Sorted
  // newest first, because this is a "what was enacted since yesterday"
  // job, not a bulk export.
  const data = await api(
    `/discover/browses/dateissued/items?scope=${collection.uuid}&sort=default,desc&size=50`
  )

  const items = data?._embedded?.items || []
  return items.map(i => shapeItem(i, collection)).filter(a => a.shortTitle)
}

/**
 * Every configured collection, flattened. Errors are returned rather
 * than thrown: one collection failing must not lose the others, and the
 * sync record needs to show what went wrong.
 */
export async function fetchLatestActs() {
  const out = []
  const errors = []
  let migrating = false

  for (const c of COLLECTIONS) {
    try {
      out.push(...await fetchCollectionFeed(c))
    } catch (e) {
      if (e.migrating) migrating = true
      errors.push(`${c.label}: ${e.message}`)
    }
  }

  return { acts: out, errors, migrating }
}

/**
 * The official PDF of an Act, through the API's bundle → bitstream
 * chain. The old route — read the /handle/ page and pull the PDF link
 * out of the HTML — does not work on the new site, whose /handle/ pages
 * are an empty shell filled in by JavaScript.
 */
export async function findActPdfUrlByUuid(uuid) {
  const bundles = await api(`/core/items/${uuid}/bundles`)
  const list = bundles?._embedded?.bundles || []
  // ORIGINAL is DSpace's bundle for the deposited file itself, as
  // opposed to thumbnails, licences and extracted text.
  const original = list.find(b => b.name === 'ORIGINAL') || list[0]
  if (!original) {
    throw new IndiaCodeError('That Act has no attached file in India Code yet.')
  }

  const bitstreams = await api(`/core/bundles/${original.uuid}/bitstreams`)
  const files = bitstreams?._embedded?.bitstreams || []
  const pdf = files.find(f => /\.pdf$/i.test(f.name || '')) || files[0]
  if (!pdf) throw new IndiaCodeError('That Act has no PDF in India Code yet.')

  return {
    pdfUrl: `${INDIA_CODE_API}/core/bitstreams/${pdf.uuid}/content`,
    name: pdf.name,
  }
}
