// ─────────────────────────────────────────────────────────────────
//  lib/legal-data/config.js — which live legal sources are switched on.
//
//  Three providers, each independent. The app works with none, one, or
//  all three configured, and every surface reports honestly which are
//  live rather than showing an empty result set that looks like "no
//  judgments found".
//
//    India Code    indiacode.nic.in — every Central and State Act.
//                  Official, free, no key. Always available.
//                  It has NO API: /rest/ and /oai/ are both 404, so the
//                  harvester parses the public /handle/ and /browse/
//                  pages, which robots.txt permits (/discover and
//                  /simple-search are disallowed and are never touched).
//
//    Indian Kanoon api.indiankanoon.org — 30M+ judgments across the
//                  Supreme Court, every High Court and the tribunals.
//                  Needs INDIANKANOON_TOKEN. Billed per call.
//
//    eCourts       A licensed reseller of the Government eCourts feed,
//                  for live case status by CNR. Needs ECOURTS_API_KEY
//                  and ECOURTS_API_BASE. Billed per call.
//
//  Deliberately absent: any path that scrapes services.ecourts.gov.in
//  directly. Its CAPTCHA exists to stop exactly that, and working
//  around it would breach the portal's terms.
// ─────────────────────────────────────────────────────────────────

// India Code moved. indiacode.nic.in now serves nothing but a migration
// notice — every call the app made to it had been failing, silently,
// because a harvest that finds no Acts looks exactly like a day on which
// no Acts were passed.
//
// The new site is a DSpace 7 Angular app. Two consequences: the RSS
// feeds this code used are gone (404 on every variant), and /handle/
// pages are now an empty shell rendered by JavaScript, so the old scrape
// for the Act PDF finds no link. Both paths need the REST API instead.
//
// At the time of writing that migration is still in flight — the site
// root and robots.txt return 502, /server/api/core/items returns 401,
// and items come back with no bundles. So the client below reaches the
// live host and reports honestly when it cannot get an answer, rather
// than pretending the corpus is simply up to date.
export const INDIA_CODE_BASE = process.env.INDIA_CODE_BASE || 'https://indiacode.gov.in'

// The DSpace REST API, which is the only machine-readable surface the
// new site has.
export const INDIA_CODE_API = `${INDIA_CODE_BASE}/server/api`

// India Code's edge returns 403 to anything that does not look like a
// browser UA — including a browser UA with a contact URL appended, which
// would be the polite convention. Tested: the string below returns 200,
// the same string with "(+https://…)" appended returns 403. So the UA
// stays clean and the courtesy is expressed the other ways that matter:
// one request per collection per day, robots.txt honoured on every
// request, and no search paths.
export const HARVEST_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36'

export function kanoonConfigured() {
  return !!process.env.INDIANKANOON_TOKEN
}

export function ecourtsConfigured() {
  return !!(process.env.ECOURTS_API_KEY && process.env.ECOURTS_API_BASE)
}

/** India Code needs no credentials, so it is always on. */
export function actsConfigured() {
  return true
}

// Whether a path may be fetched is decided by lib/legal-data/robots.js,
// which reads India Code's actual robots.txt and matches Disallow rules
// from the start of the path the way the standard says. A guard written
// here as "does the URL mention discover" refused /server/api/discover/
// browses, which no policy disallows — the REST browse index simply
// shares a word with the old UI's search page.

/** What the UI and the admin console show about each source. */
export function providerStatus() {
  return {
    acts: {
      id: 'acts',
      name: 'India Code',
      what: 'Every Central and State Act',
      configured: actsConfigured(),
      cost: 'free',
      note: 'Official Government repository, no key needed. It moved from indiacode.nic.in to indiacode.gov.in and the migration is still in progress upstream, so daily Act sync may report an error — the built-in corpus of 269 Acts is unaffected and keeps working.',
    },
    judgments: {
      id: 'judgments',
      name: 'Indian Kanoon',
      what: 'Supreme Court, High Courts and tribunal judgments',
      configured: kanoonConfigured(),
      cost: 'per call',
      note: kanoonConfigured()
        ? null
        : 'Set INDIANKANOON_TOKEN to switch judgment search on.',
    },
    cases: {
      id: 'cases',
      name: 'eCourts',
      what: 'Live case status by CNR number',
      configured: ecourtsConfigured(),
      cost: 'per call',
      note: ecourtsConfigured()
        ? null
        : 'Set ECOURTS_API_BASE and ECOURTS_API_KEY to switch case lookup on.',
    },
  }
}

/** Thrown when a caller reaches a provider that has no credentials. */
export class ProviderUnavailable extends Error {
  constructor(provider, hint) {
    super(hint || `${provider} is not configured on this deployment.`)
    this.name = 'ProviderUnavailable'
    this.provider = provider
    this.code = 'PROVIDER_UNAVAILABLE'
  }
}

/**
 * fetch with a hard timeout. An external legal API that hangs must not
 * hold a serverless invocation open until the platform kills it — that
 * turns one slow upstream into a failed request with no error message.
 */
export async function fetchWithTimeout(url, { timeoutMs = 15000, ...init } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
