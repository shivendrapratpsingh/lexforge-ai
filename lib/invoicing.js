import { istDateParts, formatShortDate } from './dates.js'
// ─────────────────────────────────────────────────────────────────
//  Invoices a college's accounts department will accept.
//
//  A college cannot pay against an email. It needs a document with a
//  number, a date, an amount in words, and a name and address to pay —
//  and the number has to belong to an unbroken series, because under GST
//  a gap or a repeat in the series is a defect in the return.
//
//  Everything about the seller comes from the environment, because at
//  the time of writing there is no GST registration and no registered
//  address. Without them this issues a proforma invoice — which is the
//  correct document for an unregistered seller, states no tax, and is
//  still enough for a college to raise a purchase order against.
// ─────────────────────────────────────────────────────────────────

export const SELLER = {
  name: process.env.SELLER_NAME || 'LexForge AI',
  address: process.env.SELLER_ADDRESS || '',
  email: process.env.SELLER_EMAIL || process.env.ADMIN_EMAIL || '',
  phone: process.env.SELLER_PHONE || '',
  gstin: process.env.SELLER_GSTIN || '',
  pan: process.env.SELLER_PAN || '',
  bankName: process.env.SELLER_BANK_NAME || '',
  bankAccount: process.env.SELLER_BANK_ACCOUNT || '',
  bankIfsc: process.env.SELLER_BANK_IFSC || '',
  upi: process.env.SELLER_UPI || '',
}

// No GSTIN means no tax may be charged. Charging GST without a
// registration is not a paperwork slip, it is collecting a tax that
// cannot be remitted.
export const IS_GST_REGISTERED = Boolean(SELLER.gstin)
export const TAX_PERCENT = IS_GST_REGISTERED ? Number(process.env.GST_PERCENT || 18) : 0

// India's financial year runs April to March, and the invoice series
// restarts with it — so the year in the number has to be derived, not
// taken from the calendar.
export function financialYear(d = new Date()) {
  // Asked of India, not of the server. getMonth() and getFullYear() read
  // UTC on Vercel, so an invoice raised at 1 AM IST on 1 April would be
  // filed under the financial year that ended the previous night.
  const { year, month } = istDateParts(d)
  const start = month >= 4 ? year : year - 1
  return `${start}-${String(start + 1).slice(-2)}`
}

export async function nextInvoiceNumber(prisma, when = new Date()) {
  const fy = financialYear(when)
  const prefix = `LF/${fy}/`

  // The highest number issued this year, not a count: a cancelled
  // invoice still consumes its number and must never be reused.
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  const n = last ? Number(last.number.slice(prefix.length)) + 1 : 1
  return prefix + String(n).padStart(4, '0')
}

export function computeTotals({ seats, unitPaise, taxPercent = TAX_PERCENT }) {
  const amountPaise = Math.max(0, Math.round(seats * unitPaise))
  const taxPaise = Math.round(amountPaise * (taxPercent / 100))
  return { amountPaise, taxPaise, totalPaise: amountPaise + taxPaise, taxPercent }
}

export const rupees = (paise) =>
  (Math.round(paise) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Amount in words ──────────────────────────────────────────────
// Required on an Indian invoice, and in the Indian system — lakh and
// crore, not million. A finance officer checks this line against the
// figures, so it has to be right.

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n) {
  if (n < 20) return ONES[n]
  return (TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '')).trim()
}

function threeDigits(n) {
  const h = Math.floor(n / 100)
  const rest = n % 100
  return [h ? ONES[h] + ' Hundred' : '', rest ? twoDigits(rest) : ''].filter(Boolean).join(' ')
}

export function amountInWords(paise) {
  const total = Math.round(paise)
  const whole = Math.floor(total / 100)
  const fraction = total % 100

  if (whole === 0 && fraction === 0) return 'Zero Rupees Only'

  const parts = []
  let n = whole
  const crore = Math.floor(n / 10000000); n %= 10000000
  const lakh = Math.floor(n / 100000); n %= 100000
  const thousand = Math.floor(n / 1000); n %= 1000

  if (crore) parts.push(threeDigits(crore) + ' Crore')
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh')
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand')
  if (n) parts.push(threeDigits(n))

  const rupeeWords = parts.join(' ')
  const out = whole ? `${rupeeWords} Rupees` : ''
  const paiseWords = fraction ? `${twoDigits(fraction)} Paise` : ''

  return [out, paiseWords].filter(Boolean).join(' and ') + ' Only'
}

export function formatDate(d) {
  if (!d) return '—'
  return formatShortDate(d)
}
