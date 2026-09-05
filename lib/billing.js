// ─────────────────────────────────────────────────────────────────
//  Razorpay, over plain HTTPS.
//
//  No SDK: the whole surface used here is three REST calls and two
//  HMACs, and a dependency that ships its own HTTP stack is not worth
//  carrying for that.
//
//  These are one-time orders, not Razorpay Subscriptions. Subscriptions
//  need eMandate/UPI-autopay approval which takes weeks and is refused
//  outright to accounts with no transaction history — so a plan is paid
//  for up front and extends `currentEnd`. Nothing auto-debits, which is
//  also what most Indian users prefer.
//
//  Everything degrades: with no keys configured, `configured()` is false
//  and the app stays invite-only rather than showing a Pay button that
//  cannot work.
// ─────────────────────────────────────────────────────────────────

import crypto from 'crypto'

const API = 'https://api.razorpay.com/v1'

export const KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || ''

// Live keys start rzp_live_, test keys rzp_test_. Worth surfacing, so a
// launch does not quietly run on test keys and take no real money.
export const IS_LIVE = KEY_ID.startsWith('rzp_live_')

export function configured() {
  return Boolean(KEY_ID && KEY_SECRET)
}

const paise = (v, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback
}

// Prices in paise, all env-overridable so they can change without a
// deploy.
//
// One price for everyone who buys directly — an advocate and a law
// student pay the same.
//
//   Direct   ₹251 / month           ·  ₹251 / month billed yearly (₹3,012)
//   College  ₹250 / student / month ·  ₹250 / student / month billed yearly (₹3,000)
//   Founding ₹150 / student / month for the first year (₹1,800)
//
// A college pays less per head than an individual, which is the reason
// for a college to fund it rather than leave students to buy their own.
//
// THE YEARLY RATE IS THE SAME AS THE MONTHLY RATE. That is deliberate
// and it is a decision, not an oversight: a year costs twelve months.
// It also means a yearly plan currently offers a buyer nothing except
// paying earlier, so nobody has a reason to choose it. Set
// PRICE_YEARLY_PAISE / PRICE_SEAT_YEARLY_PAISE to introduce a discount
// without a deploy if that changes.
//
// Against the measured cost of serving one active student — about ₹14 a
// month, see lib/usage.js — a ₹200 seat carries roughly a 14x margin
// before the fixed monthly bill, which is where it should sit for
// software with a real per-user upstream cost.
const MONTHLY_RATE        = 25100    // ₹251 a month
const YEARLY_MONTHLY_RATE = 25100    // ₹251 a month when a year is bought
const SEAT_MONTHLY_RATE   = 25000    // ₹250 per student per month
const SEAT_YEARLY_RATE    = 25000    // ₹250 per student per month, billed yearly

// The founding-college rate, and it exists for a specific reason.
//
// The first college WILL negotiate, and whatever it signs becomes the
// number every other college hears — faculty talk between institutions,
// which is how we know who NyayAssist has signed. A rate cut agreed
// across a table says the price is soft and invites the same push at
// renewal. A named programme with a stated limit is the same money and
// says something different: it can be closed, and the list rate is
// still the list rate.
//
// So it is a published rate with an expiry, not a concession. Anyone
// quoting it should also state what limits it — the first few colleges,
// first year only — because a discount with no boundary is just a lower
// price wearing a better name.
const SEAT_FOUNDING_RATE  = 15000    // ₹150 per student per month, first year

export const PLANS = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    amountPaise: paise(process.env.PRICE_MONTHLY_PAISE, MONTHLY_RATE),
    days: 30,
    blurb: 'Billed once. Nothing auto-renews.',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    // Charged as one payment covering twelve months at the lower rate.
    amountPaise: paise(process.env.PRICE_YEARLY_PAISE, YEARLY_MONTHLY_RATE * 12),
    days: 365,
    blurb: '₹251 a month, paid once for the year.',
  },
}

// What a college pays per student. Charged per seat rather than as a
// flat licence, so a college with forty active students is not billed
// like one with four hundred.
export const INSTITUTION_SEAT = {
  monthlyPaise: paise(process.env.PRICE_SEAT_MONTHLY_PAISE, SEAT_MONTHLY_RATE),
  yearlyPaise:  paise(process.env.PRICE_SEAT_YEARLY_PAISE, SEAT_YEARLY_RATE * 12),
  foundingMonthlyPaise: paise(process.env.PRICE_SEAT_FOUNDING_PAISE, SEAT_FOUNDING_RATE),
  foundingYearlyPaise:  paise(process.env.PRICE_SEAT_FOUNDING_PAISE, SEAT_FOUNDING_RATE) * 12,
}

// The monthly rate behind each figure, for anywhere that quotes "per
// student per month" rather than the annual total.
export const RATE_CARD = {
  direct: {
    monthly:      MONTHLY_RATE,
    yearlyPerMonth: YEARLY_MONTHLY_RATE,
    yearlyTotal:  YEARLY_MONTHLY_RATE * 12,
  },
  institution: {
    monthlyPerSeat:      SEAT_MONTHLY_RATE,
    yearlyPerSeatPerMonth: SEAT_YEARLY_RATE,
    yearlyPerSeatTotal:  SEAT_YEARLY_RATE * 12,
    foundingPerSeat:      SEAT_FOUNDING_RATE,
    foundingPerSeatTotal: SEAT_FOUNDING_RATE * 12,
  },
}

export function planFor(id) {
  return PLANS[id] || null
}

export const rupees = (p) => Math.round(p) / 100

function authHeader() {
  return 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')
}

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Razorpay's own message is far more useful than a status code —
    // "amount must be at least 100" beats "400".
    const msg = json?.error?.description || `Razorpay ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.razorpay = json?.error
    throw err
  }
  return json
}

export async function createOrder({ amountPaise, receipt, notes }) {
  return call('/orders', {
    method: 'POST',
    body: {
      amount: amountPaise,
      currency: 'INR',
      receipt: String(receipt).slice(0, 40), // Razorpay caps receipt at 40 chars
      notes: notes || {},
    },
  })
}

export async function fetchPayment(paymentId) {
  return call(`/payments/${paymentId}`)
}

// ── Signatures ───────────────────────────────────────────────────
// The browser callback is attacker-controlled: anyone can POST any
// payment id they like. Only the HMAC proves Razorpay produced it.

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature || !KEY_SECRET) return false
  const expected = crypto.createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return timingSafeEqual(expected, signature)
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET || !signature) return false
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  return timingSafeEqual(expected, signature)
}

export function webhookConfigured() {
  return Boolean(WEBHOOK_SECRET)
}

// Constant-time, and length-safe: crypto.timingSafeEqual throws on a
// length mismatch, which would itself leak the length.
function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  try { return crypto.timingSafeEqual(ba, bb) } catch { return false }
}

// ── Access window ────────────────────────────────────────────────

// Renewing before expiry adds to the time left rather than throwing it
// away. Paying early should never cost someone days.
export function extendFrom(currentEnd, days, now = new Date()) {
  const base = currentEnd && new Date(currentEnd) > now ? new Date(currentEnd) : now
  return new Date(base.getTime() + days * 86400000)
}

// ── Expiry ───────────────────────────────────────────────────────
//
// A prepaid term that has run out must stop granting Pro. `tier` is set
// to 'pro' when someone pays, and nothing would ever set it back — so
// this runs from the daily cron rather than adding a database read to
// every request.
//
// It only touches accounts that paid: a tier set by hand in the admin
// console has no subscription row and is left alone, as is anyone
// grandfathered or covered by their college.
export async function expireLapsedSubscriptions(now = new Date()) {
  const { prisma } = await import('./prisma.js')

  const lapsed = await prisma.subscription.findMany({
    where: {
      currentEnd: { lt: now },
      status: { in: ['active', 'cancelled'] },
      user: { tier: 'pro', grandfathered: false, institutionId: null },
    },
    select: { id: true, userId: true },
  })
  if (!lapsed.length) return { expired: 0 }

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { id: { in: lapsed.map(l => l.id) } },
      data: { status: 'expired' },
    }),
    prisma.user.updateMany({
      where: { id: { in: lapsed.map(l => l.userId) } },
      data: { tier: 'free' },
    }),
  ])

  console.log(`[billing] ${lapsed.length} subscription(s) reached the end of their term`)
  return { expired: lapsed.length }
}

// ── Expiry warning ───────────────────────────────────────────────
//
// Necessary precisely BECAUSE nothing auto-renews. Without a warning a
// user simply loses access one morning with no notice, which reads as
// the product breaking rather than a plan ending — and arrives as a
// support request, or a refund demand.
//
// Fires in a one-day window three days out. The cron runs daily, so the
// window catches each subscription exactly once and no "reminded at"
// column is needed.
export async function remindExpiringSubscriptions(now = new Date()) {
  const { prisma } = await import('./prisma.js')

  const from = new Date(now.getTime() + 3 * 86400000)
  const to = new Date(now.getTime() + 4 * 86400000)

  const soon = await prisma.subscription.findMany({
    where: {
      currentEnd: { gte: from, lt: to },
      status: { in: ['active', 'cancelled'] },
      // Somebody covered by their college, or grandfathered, is not
      // losing anything and should not be told they are.
      user: { grandfathered: false, institutionId: null },
    },
    select: {
      plan: true, currentEnd: true,
      user: { select: { email: true, name: true } },
    },
  })
  if (!soon.length) return { reminded: 0 }

  const { notifyQuietly, planExpiringEmail } = await import('../lib/mail.js')
  const { getFreeDocsLimit } = await import('./admin.js')
  const freeLimit = await getFreeDocsLimit().catch(() => 2)
  let sent = 0
  for (const s of soon) {
    if (!s.user?.email) continue
    notifyQuietly({
      to: s.user.email,
      ...planExpiringEmail({
        name: s.user.name?.split(' ')[0],
        planLabel: planFor(s.plan)?.label || s.plan,
        currentEnd: s.currentEnd,
        freeLimit,
      }),
    })
    sent++
  }

  console.log(`[billing] warned ${sent} user(s) that their plan ends in 3 days`)
  return { reminded: sent }
}
