// ─────────────────────────────────────────────────────────────────
//  eCourts — live case status by CNR.
//
//  Deliberately written against a licensed reseller of the Government
//  eCourts feed rather than services.ecourts.gov.in itself. That portal
//  is CAPTCHA-protected precisely to prevent automated access, and
//  working around it would breach its terms — so there is no code path
//  here that touches it.
//
//  Resellers differ in their response shape, so ECOURTS_API_BASE points
//  at whichever one is licensed and `normalise` below absorbs the
//  differences. Switching provider should mean changing two env vars
//  and, at most, the field list in normalise().
//
//  A CNR (Case Number Record) is the 16-character national identifier
//  every case in the eCourts system carries, e.g. DLHC010012342024.
// ─────────────────────────────────────────────────────────────────
import { fetchWithTimeout, ecourtsConfigured, ProviderUnavailable } from './config.js'

const CNR_RE = /^[A-Z]{4}[A-Z0-9]{2}\d{6}\d{4}$/i

export function looksLikeCnr(value) {
  return CNR_RE.test(String(value || '').replace(/[\s-]/g, ''))
}

export function normaliseCnr(value) {
  return String(value || '').replace(/[\s-]/g, '').toUpperCase()
}

async function call(path, body) {
  if (!ecourtsConfigured()) {
    throw new ProviderUnavailable('ecourts', 'Case lookup is not switched on for this deployment.')
  }

  const base = process.env.ECOURTS_API_BASE.replace(/\/+$/, '')
  const res = await fetchWithTimeout(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.ECOURTS_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    // Court backends are slow; this is the upstream's own latency, not ours.
    timeoutMs: 25000,
  })

  const text = await res.text()
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw Object.assign(new Error('The eCourts provider rejected the API key.'), { code: 'PROVIDER_AUTH' })
    }
    if (res.status === 404) {
      throw Object.assign(new Error('No case found with that number.'), { code: 'NOT_FOUND' })
    }
    if (res.status === 429) {
      throw Object.assign(new Error('The eCourts provider is rate-limiting us. Try again shortly.'), { code: 'PROVIDER_QUOTA' })
    }
    throw Object.assign(new Error(`The eCourts provider responded ${res.status}.`), { code: 'PROVIDER_ERROR' })
  }

  try { return JSON.parse(text) }
  catch { throw Object.assign(new Error('The eCourts provider returned a malformed response.'), { code: 'PROVIDER_ERROR' }) }
}

// Pull the fields we need out of whatever shape the reseller uses.
// Every key is tried in order, so a provider swap usually means adding
// one alias rather than rewriting the caller.
const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, part) => (o == null ? o : o[part]), obj)
    if (v !== undefined && v !== null && v !== '') return v
  }
  return null
}

function normalise(raw) {
  const d = raw?.data ?? raw?.result ?? raw ?? {}
  const parties = pick(d, 'parties', 'partyDetails', 'petitioners')
  return {
    cnr:           pick(d, 'cnr', 'cnrNumber', 'cnr_number'),
    caseNumber:    pick(d, 'caseNumber', 'case_number', 'filingNumber', 'registrationNumber'),
    title:         pick(d, 'caseTitle', 'title', 'case_title'),
    court:         pick(d, 'courtName', 'court', 'court_name', 'establishmentName'),
    caseType:      pick(d, 'caseType', 'case_type'),
    stage:         pick(d, 'caseStage', 'stage', 'case_status.stage'),
    status:        pick(d, 'caseStatus', 'status', 'case_status.status'),
    filingDate:    pick(d, 'filingDate', 'filing_date', 'dateOfFiling'),
    nextHearing:   pick(d, 'nextHearingDate', 'next_hearing_date', 'nextDate', 'case_status.nextHearingDate'),
    lastHearing:   pick(d, 'lastHearingDate', 'last_hearing_date', 'case_status.lastHearingDate'),
    judge:         pick(d, 'judge', 'coramName', 'presidingOfficer'),
    petitioners:   pick(d, 'petitioners', 'petitionerAndAdvocate') || null,
    respondents:   pick(d, 'respondents', 'respondentAndAdvocate') || null,
    parties: typeof parties === 'string' ? parties : null,
    hearings: Array.isArray(pick(d, 'history', 'caseHistory', 'hearings'))
      ? pick(d, 'history', 'caseHistory', 'hearings') : [],
    orders: Array.isArray(pick(d, 'orders', 'orderList', 'judgments'))
      ? pick(d, 'orders', 'orderList', 'judgments') : [],
    acts: Array.isArray(pick(d, 'acts', 'actsAndSections')) ? pick(d, 'acts', 'actsAndSections') : [],
    raw: d,
  }
}

/** Look up one case by its CNR. */
export async function caseByCnr(cnr) {
  const clean = normaliseCnr(cnr)
  if (!looksLikeCnr(clean)) {
    throw Object.assign(
      new Error('That does not look like a CNR number. A CNR is 16 characters, e.g. DLHC010012342024.'),
      { code: 'BAD_CNR' }
    )
  }
  return normalise(await call('/case/cnr', { cnr: clean }))
}

/** Search by party name where the CNR is not known. */
export async function casesByParty({ name, stateCode, districtCode, year }) {
  if (!name || String(name).trim().length < 3) {
    throw Object.assign(new Error('Enter at least three characters of the party name.'), { code: 'BAD_QUERY' })
  }
  const data = await call('/case/party', {
    name: String(name).trim(), stateCode, districtCode, year,
  })
  const list = data?.data ?? data?.results ?? data ?? []
  return (Array.isArray(list) ? list : []).map(normalise)
}
