// Dates render in the reader's timezone, not the server's.
//
// Vercel runs UTC. Between midnight and 05:30 IST the UTC rendering is
// not merely a few hours out — it is the wrong DAY, which on an invoice
// means the wrong month, quarter and possibly financial year.
//
// So these tests run with TZ forced to UTC, reproducing production, and
// check the output is still Indian time.
process.env.TZ = 'UTC'

const { formatDate, formatDateTime, formatShortDate, istDateParts } = await import('../lib/dates.js')
const { financialYear } = await import('../lib/invoicing.js')

let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `\n        got  ${got}\n        want ${want}`}`)
}

console.log(`server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`)

// The exact failure seen in the test email: sent 5:14 PM IST, printed
// 11:44 am because the server rendered UTC with Indian formatting.
const sent = new Date('2026-08-22T11:44:00Z')
check('an evening send does not print as morning', formatDateTime(sent), '22 Aug 2026, 5:14 pm')

// 00:30 IST on 1 April is 19:00 UTC on 31 March — a different day, a
// different month, and a different financial year.
const midnightIST = new Date('2026-03-31T19:00:00Z')
check('after midnight IST it is already the next day', formatDate(midnightIST), '1 April 2026')
check('and the short form agrees', formatShortDate(midnightIST), '01 Apr 2026')
check('the financial year turns over with it', financialYear(midnightIST), '2026-27')

// The same instant, read as UTC, would have filed under the old year.
check('the previous evening IST is still the old year',
  financialYear(new Date('2026-03-31T18:00:00Z')), '2025-26')

// A plain daytime date should be unremarkable in both zones.
check('a midday date is itself', formatDate(new Date('2026-08-22T09:00:00Z')), '22 August 2026')

const p = istDateParts(midnightIST)
check('date parts are Indian', `${p.year}-${p.month}-${p.day}`, '2026-4-1')

console.log(fails ? `\n${fails} FAILED` : '\ndates are Indian, wherever the server is')
process.exitCode = fails ? 1 : 0
