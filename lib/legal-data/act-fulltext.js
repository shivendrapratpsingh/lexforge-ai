// ─────────────────────────────────────────────────────────────────
//  Full text of an Act, from India Code's own PDF.
//
//  India Code has no API, and its item listings come from /discover,
//  which robots.txt disallows. But an individual Act's page under
//  /handle/ IS permitted, and that page links the official PDF of the
//  whole Act under /bitstream/. So: given a handle, we can legitimately
//  fetch and read the real statute.
//
//  This is deliberately on-demand. A 300KB PDF takes a few seconds to
//  download and parse, which is far too slow to do on every search —
//  so the search shows the summary instantly and this runs only when
//  the reader asks to see the full Act.
// ─────────────────────────────────────────────────────────────────
import { INDIA_CODE_BASE, HARVEST_UA, fetchWithTimeout } from './config.js'

/**
 * Find the official PDF for an Act.
 *
 * This used to read the /handle/ page and pull the /bitstream/ link out
 * of its HTML. That worked until India Code moved to indiacode.gov.in,
 * where /handle/ returns an empty Angular shell — the link is not in the
 * markup at all, so the scrape found nothing and every Act full-text
 * lookup started failing.
 *
 * The old path is still tried first, because it keeps working for any
 * deployment still pointed at an older mirror and costs one request. The
 * REST API's bundle → bitstream chain is the real route on the new site.
 */
export async function findActPdfUrl(handle, { uuid = null } = {}) {
  const page = `${INDIA_CODE_BASE}/handle/${handle}`

  try {
    const res = await fetchWithTimeout(page, {
      headers: { 'User-Agent': HARVEST_UA },
      timeoutMs: 25000,
    })
    if (res.ok) {
      const html = await res.text()
      // The Act itself is the /bitstream/ PDF. Other links on the page
      // point at rules and notifications, which are separate documents.
      const m = html.match(/href="(\/bitstream\/[^"]+\.pdf)"/i)
      if (m) {
        return { pdfUrl: INDIA_CODE_BASE + m[1].replace(/&amp;/g, '&'), pageUrl: page }
      }
    }
  } catch {
    // Fall through to the API. A dead or slow HTML page is exactly the
    // case the API route exists for.
  }

  if (uuid) {
    const { findActPdfUrlByUuid } = await import('./indiacode.js')
    const { pdfUrl } = await findActPdfUrlByUuid(uuid)
    return { pdfUrl, pageUrl: page }
  }

  throw Object.assign(
    new Error(
      'No official PDF could be reached for this Act. India Code is migrating to indiacode.gov.in and its Act pages are not currently machine-readable without the item id.'
    ),
    { code: 'NO_PDF' }
  )
}

// India Code PDFs open with an ARRANGEMENT OF SECTIONS table — every
// section number and title, with no text under them — and only then the
// Act itself. Parsing from the top therefore produced 51 correctly-named
// sections with empty bodies. The enacting formula ("BE it enacted…
// as follows:—") separates the two, so the body is everything after it.
function findBodyStart(text) {
  const markers = [
    /BE it enacted[\s\S]{0,400}?as follows\s*:?\s*[—-]/i,
    /BE it enacted/i,
    /as follows\s*:\s*[—-]/i,
    /ARRANGEMENT OF SECTIONS/i,          // last resort: at least skip the TOC head
  ]
  for (const re of markers) {
    const m = text.match(re)
    if (m) return m.index + m[0].length
  }
  return 0
}

// A body heading looks like "12A. Power to make rules.—(1) The Central…".
// Anchored to a line start, so a cross-reference mid-sentence cannot be
// mistaken for a heading.
const SECTION_RE = /(?:^|\n)[ \t]*(\d+[A-Z]{0,2})\.[ \t]*([^\n]{3,120}?)\s*[.．]\s*[—–-]/g
// Some older Acts omit the em-dash after the title; this is the fallback.
const SECTION_RE_LOOSE = /(?:^|\n)[ \t]*(\d+[A-Z]{0,2})\.[ \t]+([A-Z][^\n]{4,100})/g

function collect(text, re) {
  re.lastIndex = 0
  const marks = [...text.matchAll(re)]
  const out = []
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i]
    const start = m.index + m[0].length
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length
    const clean = text.slice(start, end)
      .replace(/--\s*\d+\s+of\s+\d+\s*--/g, ' ')   // "-- 4 of 13 --" page furniture
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    out.push({
      number: m[1],
      title: m[2].replace(/[.\s]+$/, '').trim(),
      text: clean.slice(0, 6000),
    })
  }
  return out
}

function splitIntoSections(fullText) {
  const body = fullText.slice(findBodyStart(fullText))

  let out = collect(body, SECTION_RE)
  // If the strict pattern found little, the Act probably predates the
  // em-dash convention — fall back to the looser heading shape.
  if (out.length < 3) out = collect(body, SECTION_RE_LOOSE)

  // Drop anything before section 1: a stray numbered line in the preamble
  // is not a section.
  const first = out.findIndex(s => s.number === '1')
  if (first > 0) out = out.slice(first)

  // A section with no text at all means the split missed; keeping it would
  // show the reader an empty accordion.
  return out.filter(s => s.text.length > 0)
}

/**
 * Download and read the Act. Returns the section list and the raw text.
 * The caller decides how much to show.
 */
export async function fetchActFullText(handle) {
  const { pdfUrl, pageUrl } = await findActPdfUrl(handle)

  const res = await fetchWithTimeout(pdfUrl, {
    headers: { 'User-Agent': HARVEST_UA },
    timeoutMs: 45000,
  })
  if (!res.ok) {
    throw Object.assign(new Error(`Could not download the Act (${res.status}).`), { code: 'PROVIDER_ERROR' })
  }

  const bytes = new Uint8Array(await res.arrayBuffer())

  // pdf-parse v2 exposes a class, not the v1 callable default.
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: bytes })
  let parsed
  try {
    parsed = await parser.getText()
  } finally {
    await parser.destroy?.().catch(() => {})
  }

  const text = parsed?.text || ''
  if (text.trim().length < 200) {
    throw Object.assign(
      new Error('This Act is published as a scanned image rather than text, so it cannot be read automatically.'),
      { code: 'NOT_TEXT' }
    )
  }

  const sections = splitIntoSections(text)
  return {
    handle,
    pageUrl,
    pdfUrl,
    pages: parsed?.pages?.length ?? null,
    characters: text.length,
    sections,
    // Kept for search-within-the-Act; the UI never renders it whole.
    text: text.slice(0, 400000),
  }
}
