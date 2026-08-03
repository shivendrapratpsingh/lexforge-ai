// ─────────────────────────────────────────────────────────────────
//  India Code — the official Government repository of every Central
//  and State enactment (indiacode.nic.in). Free, no key.
//
//  How this ended up using RSS, because it is not obvious:
//
//    * It runs DSpace, but /rest/ and /oai/ are both 404 — the APIs are
//      not enabled, so there is no JSON to ask for.
//    * The browse pages (/handle/.../browse?type=actyear) render only
//      the facet UI; the actual item rows come from /discover, and
//      robots.txt disallows /discover and /simple-search. So the
//      obvious scrape is also the disallowed one, and is not done here.
//    * DSpace's per-collection RSS feed IS served, IS well-formed, and
//      is not disallowed. It returns the most recently added items with
//      title, handle and date.
//
//  That makes this a *new arrivals* feed rather than a bulk export,
//  which suits the actual requirement: check every morning for Acts
//  that have come into force and add them. The historical corpus is
//  already carried in lib/indian-laws.js; this keeps it current.
// ─────────────────────────────────────────────────────────────────
import { INDIA_CODE_BASE, HARVEST_UA, fetchWithTimeout } from './config.js'

// DSpace collection handles. 1362 is Central Acts; the state collections
// can be added here as they are confirmed, and each is polled the same way.
export const COLLECTIONS = [
  { handle: '123456789/1362', jurisdiction: 'central', label: 'Central Acts' },
]

const strip = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? strip(m[1]) : null
}

// "Repealing and Amending Act, 2025" → 2025. Falls back to the feed date.
function yearFromTitle(title) {
  const m = String(title || '').match(/\b(1[89]\d{2}|20\d{2})\b(?!.*\b(1[89]\d{2}|20\d{2})\b)/)
  return m ? Number(m[1]) : null
}

/**
 * Read one collection's feed. Returns the most recent items, newest
 * first — typically ten, which is what DSpace serves by default.
 */
export async function fetchCollectionFeed(collection) {
  const url = `${INDIA_CODE_BASE}/feed/rss_2.0/${collection.handle}`
  const res = await fetchWithTimeout(url, {
    headers: { 'User-Agent': HARVEST_UA, Accept: 'application/rss+xml, text/xml' },
    timeoutMs: 25000,
  })
  if (!res.ok) {
    throw Object.assign(
      new Error(`India Code responded ${res.status} for ${collection.label}`),
      { code: 'PROVIDER_ERROR' }
    )
  }

  const xml = await res.text()
  const items = xml.split(/<item>/i).slice(1)

  return items.map(chunk => {
    const block = chunk.split(/<\/item>/i)[0]
    const title = tag(block, 'title')
    const link  = tag(block, 'link') || ''
    const iso   = tag(block, 'dc:date') || tag(block, 'pubDate')
    // http://hdl.handle.net/123456789/22046 → 123456789/22046
    const handle = (link.match(/(\d+\/\d+)\s*$/) || [])[1] || null
    const date = iso ? new Date(iso) : null

    return {
      handle,
      shortTitle: title,
      // The description repeats the short title in this feed, so it is
      // only worth keeping when it actually says something else.
      description: (() => {
        const d = tag(block, 'description')
        return d && d.replace(/^Short Title:\s*/i, '') !== title ? d : null
      })(),
      actYear: yearFromTitle(title) || (date && !isNaN(date) ? date.getUTCFullYear() : null),
      enactmentDate: date && !isNaN(date) ? date : null,
      jurisdiction: collection.jurisdiction,
      url: handle ? `${INDIA_CODE_BASE}/handle/${handle}` : link,
    }
  }).filter(a => a.handle && a.shortTitle)
}

/** Every configured collection, flattened. */
export async function fetchLatestActs() {
  const out = []
  const errors = []
  for (const c of COLLECTIONS) {
    try { out.push(...await fetchCollectionFeed(c)) }
    catch (e) { errors.push(`${c.label}: ${e.message}`) }
  }
  return { acts: out, errors }
}
