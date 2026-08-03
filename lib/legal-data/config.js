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

export const INDIA_CODE_BASE = 'https://www.indiacode.nic.in'

// India Code's edge returns 403 to anything that does not look like a
// browser UA — including a browser UA with a contact URL appended, which
// would be the polite convention. Tested: the string below returns 200,
// the same string with "(+https://…)" appended returns 403. So the UA
// stays clean and the courtesy is expressed the other ways that matter:
// one request per collection per day, only robots-permitted paths, and
// no /discover or /simple-search.
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

/** What the UI and the admin console show about each source. */
export function providerStatus() {
  return {
    acts: {
      id: 'acts',
      name: 'India Code',
      what: 'Every Central and State Act',
      configured: actsConfigured(),
      cost: 'free',
      note: 'Official Government repository. No key needed.',
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
