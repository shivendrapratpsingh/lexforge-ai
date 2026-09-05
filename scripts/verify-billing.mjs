// Proves the billing rules without touching Razorpay or real money.
//
// The signature checks are the whole security model of the payment
// callback, so they are tested against a known secret with hand-computed
// HMACs — if these ever stop matching, anybody could forge a payment.
import crypto from 'crypto'

process.env.RAZORPAY_KEY_ID = 'rzp_test_verifyonly'
process.env.RAZORPAY_KEY_SECRET = 'test_secret_value'
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret'
process.env.PRICE_MONTHLY_PAISE = '39900'

const b = await import('../lib/billing.js')
let fails = 0
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// ── configuration ────────────────────────────────────────────────
check('configured with keys', b.configured(), true)
check('test key is not live', b.IS_LIVE, false)
check('price honours env override', b.PLANS.monthly.amountPaise, 39900)
check('price falls back when env absent', b.PLANS.yearly.amountPaise, 301200)   // ₹3,012 = ₹251 × 12
check('there is no separate student plan', b.PLANS.student, undefined)
check('unknown plan is refused', b.planFor('free-forever'), null)

// ── payment signature ────────────────────────────────────────────
const orderId = 'order_ABC123', paymentId = 'pay_XYZ789'
const goodSig = crypto.createHmac('sha256', 'test_secret_value')
  .update(`${orderId}|${paymentId}`).digest('hex')

check('genuine signature accepted', b.verifyPaymentSignature({ orderId, paymentId, signature: goodSig }), true)
check('forged signature refused', b.verifyPaymentSignature({ orderId, paymentId, signature: 'deadbeef'.repeat(8) }), false)
check('signature bound to the payment id',
  b.verifyPaymentSignature({ orderId, paymentId: 'pay_OTHER', signature: goodSig }), false)
check('signature bound to the order id',
  b.verifyPaymentSignature({ orderId: 'order_OTHER', paymentId, signature: goodSig }), false)
check('missing signature refused', b.verifyPaymentSignature({ orderId, paymentId, signature: '' }), false)
check('wrong-length signature refused (no throw)',
  b.verifyPaymentSignature({ orderId, paymentId, signature: 'ab' }), false)

// ── webhook signature ────────────────────────────────────────────
const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } })
const hookSig = crypto.createHmac('sha256', 'test_webhook_secret').update(raw).digest('hex')
check('genuine webhook accepted', b.verifyWebhookSignature(raw, hookSig), true)
check('tampered body refused', b.verifyWebhookSignature(raw.replace('pay_1', 'pay_2'), hookSig), false)
check('unsigned webhook refused', b.verifyWebhookSignature(raw, null), false)

// ── access window ────────────────────────────────────────────────
const now = new Date('2026-08-19T00:00:00Z')
check('first purchase runs 30 days from today',
  b.extendFrom(null, 30, now).toISOString(), '2026-09-18T00:00:00.000Z')
check('renewing early adds to the days left, never replaces them',
  b.extendFrom(new Date('2026-09-01T00:00:00Z'), 30, now).toISOString(), '2026-10-01T00:00:00.000Z')
check('renewing after a lapse starts from today',
  b.extendFrom(new Date('2026-07-01T00:00:00Z'), 30, now).toISOString(), '2026-09-18T00:00:00.000Z')
check('a year is a year', b.extendFrom(null, 365, now).toISOString(), '2027-08-19T00:00:00.000Z')

console.log(fails ? `\n${fails} FAILED` : '\nall billing rules hold')
process.exitCode = fails ? 1 : 0
