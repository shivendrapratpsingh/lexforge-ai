// ─────────────────────────────────────────────────────────────────
//  Dates, in the timezone the reader actually lives in.
//
//  Vercel's servers run in UTC. `toLocaleString('en-IN', …)` sets the
//  FORMAT to Indian conventions but takes the timezone from the machine,
//  so a receipt sent at 5:14 PM in Bengaluru printed "11:44 am" — the
//  right format, the wrong moment, with nothing to suggest anything was
//  amiss.
//
//  Harmless in a test email. Not harmless on an invoice, where the date
//  is a tax record, or on a legal document, where it is the date of
//  execution. Between 00:00 and 05:30 IST the UTC rendering is not even
//  the right DAY — an invoice raised at 1 AM on the 1st would be dated
//  the 31st of the previous month, in the previous quarter, and possibly
//  the previous financial year.
//
//  So every date a user or a court will read goes through here. Browser
//  code does not need it — the browser already knows where it is.
// ─────────────────────────────────────────────────────────────────

export const IST = 'Asia/Kolkata'

/** "22 August 2026" — for documents, invoices and emails. */
export function formatDate(d = new Date()) {
  return new Date(d).toLocaleDateString('en-IN', {
    timeZone: IST, day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** "22 Aug 2026" — where space is tight. */
export function formatShortDate(d = new Date()) {
  return new Date(d).toLocaleDateString('en-IN', {
    timeZone: IST, day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** "22 Aug 2026, 5:14 pm" — anywhere the time of day matters. */
export function formatDateTime(d = new Date()) {
  return new Date(d).toLocaleString('en-IN', {
    timeZone: IST, dateStyle: 'medium', timeStyle: 'short',
  })
}

/** "22 Aug" — for a subject line. */
export function formatDayMonth(d = new Date()) {
  return new Date(d).toLocaleDateString('en-IN', {
    timeZone: IST, day: 'numeric', month: 'short',
  })
}

/**
 * The calendar date in India, as YYYY-MM-DD.
 *
 * Anything that buckets by day — an invoice series, a financial year,
 * a daily report — must ask India what day it is, not UTC.
 */
export function istDateParts(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(d))
  const get = (t) => Number(parts.find(p => p.type === t)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}
