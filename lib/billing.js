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
// deploy. Defaults are a starting point, not a decision — set them from
// the real cost-per-active-user in the admin console.
// One price for everyone who buys directly — a lawyer and a law student
// pay the same ₹420 a month. The old ₹149 student tier is gone: it was
// worth ₹25 a month against a ₹499 monthly plan, a twentyfold gap that
// only held because it was locked to college members. Students who are
// at a participating college now pay nothing at all (their college
// does), and students who are not pay what everyone else pays.
//
// Yearly is 20% off twelve months. Institutions get 30% off, priced per
// seat — see INSTITUTION_SEAT below.
export const PLANS = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    amountPaise: paise(process.env.PRICE_MONTHLY_PAISE, 42000),      // ₹420
    days: 30,
    blurb: 'Billed once. Nothing auto-renews.',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    amountPaise: paise(process.env.PRICE_YEARLY_PAISE, 403200),      // ₹4,032 — 20% off ₹5,040
    days: 365,
    blurb: '20% less than paying monthly.',
  },
}

// What a college pays per student. Charged per seat rather than as a
// flat licence, so a college with forty active students is not billed
// like one with four hundred.
export const INSTITUTION_SEAT = {
  monthlyPaise: paise(process.env.PRICE_SEAT_MONTHLY_PAISE, 42000),  // ₹420 per student per month
  yearlyPaise:  paise(process.env.PRICE_SEAT_YEARLY_PAISE, 352800),  // ₹3,528 per student per year — 30% off
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
