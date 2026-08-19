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
export const PLANS = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    amountPaise: paise(process.env.PRICE_MONTHLY_PAISE, 49900),
    days: 30,
    blurb: 'Billed once. Nothing auto-renews.',
  },
  yearly: {
    id: 'yearly',
    label: 'Yearly',
    amountPaise: paise(process.env.PRICE_YEARLY_PAISE, 499000),
    days: 365,
    blurb: 'Two months free against the monthly price.',
  },
  // Priced for someone with no income. Only offered to a verified
  // member of a college — enforced server-side, not by the UI.
  student: {
    id: 'student',
    label: 'Student',
    amountPaise: paise(process.env.PRICE_STUDENT_PAISE, 14900),
    days: 180,
    blurb: 'Six months, for students at a registered college.',
    requiresInstitution: true,
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
