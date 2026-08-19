// ─────────────────────────────────────────────────────────────────
//  robots.txt, honoured properly.
//
//  This exists because of a mistake that is easy to make and hard to
//  notice. India Code's published policy disallows /discover — the
//  search page on its old interface. Its REST API has a namespace
//  called /server/api/discover, which contains the browse indexes. A
//  guard written as "does the URL contain the word discover" refuses
//  both, and so refuses a path nobody disallowed.
//
//  A Disallow rule matches from the start of the path. /discover
//  matches /discover and /discover/foo. It does not match
//  /server/api/discover/browses, which begins with /server. Reading the
//  rule correctly is the difference between honouring a policy and
//  guessing at one.
//
//  When robots.txt cannot be read — India Code's returns 502 throughout
//  its current migration — this refuses the paths the last published
//  policy refused. An unreadable policy is a reason to be more careful,
//  not an excuse to assume permission.
// ─────────────────────────────────────────────────────────────────
import { HARVEST_UA, fetchWithTimeout } from './config.js'

// What the last readable policy on India Code disallowed. Used only
// when the live file cannot be fetched.
const FALLBACK_DISALLOW = ['/discover', '/simple-search']

const cache = new Map()
const TTL_MS = 6 * 60 * 60 * 1000

function parse(text) {
  const rules = []
  let applies = false

  for (const raw of String(text).split('\n')) {
    const line = raw.split('#')[0].trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue

    const field = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()

    if (field === 'user-agent') {
      // Only the catch-all group. This crawler has no registered name,
      // so a group naming some other bot does not apply to it.
      applies = value === '*'
    } else if (applies && field === 'disallow' && value) {
      rules.push(value)
    } else if (applies && field === 'allow' && value) {
      rules.push({ allow: value })
    }
  }
  return rules
}

async function rulesFor(origin) {
  const hit = cache.get(origin)
  if (hit && Date.now() - hit.at < TTL_MS) return hit

  let rules = null
  let readable = false
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, {
      headers: { 'User-Agent': HARVEST_UA, Accept: 'text/plain' },
      timeoutMs: 10000,
    })
    if (res.ok) {
      const text = await res.text()
      // A 502 page served with a 200 is not a policy. Anything that
      // opens with markup is an error page, not robots.txt.
      if (!text.trimStart().startsWith('<')) {
        rules = parse(text)
        readable = true
      }
    }
  } catch { /* falls through to the conservative default */ }

  const entry = { at: Date.now(), rules: rules ?? FALLBACK_DISALLOW, readable }
  cache.set(origin, entry)
  return entry
}

/**
 * May this URL be fetched? Answers `{ allowed, readable, rule }` so a
 * caller can log why, and so "refused by policy" is distinguishable
 * from "refused because the policy could not be read".
 */
export async function robotsAllows(url) {
  let parsed
  try { parsed = new URL(url) } catch { return { allowed: false, readable: false, rule: 'unparseable URL' } }

  const path = parsed.pathname + parsed.search
  const { rules, readable } = await rulesFor(parsed.origin)

  // A longer Allow beats a shorter Disallow, which is how a site carves
  // one path out of a blocked directory.
  let disallowed = null
  let allowedBy = null
  for (const r of rules) {
    if (typeof r === 'object') {
      if (path.startsWith(r.allow) && (!allowedBy || r.allow.length > allowedBy.length)) allowedBy = r.allow
    } else if (path.startsWith(r) && (!disallowed || r.length > disallowed.length)) {
      disallowed = r
    }
  }

  if (disallowed && (!allowedBy || allowedBy.length <= disallowed.length)) {
    return { allowed: false, readable, rule: `Disallow: ${disallowed}` }
  }
  return { allowed: true, readable, rule: allowedBy ? `Allow: ${allowedBy}` : null }
}

export function _resetRobotsCache() {
  cache.clear()
}
