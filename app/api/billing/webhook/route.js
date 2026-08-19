// POST /api/billing/webhook — Razorpay's own account of what happened.
//
// The browser callback in /verify is best-effort: users close the tab,
// lose signal on the train, or pay through a UPI app that never returns
// to the page. The money still moved. This route is the one that must
// not be missed, so it credits access on Razorpay's word alone and is
// safe to receive twice for the same payment.
//
// Configure at Razorpay Dashboard → Settings → Webhooks:
//   URL     https://<your-domain>/api/billing/webhook
//   Events  payment.captured, payment.failed, refund.processed
//   Secret  the same value as RAZORPAY_WEBHOOK_SECRET

import { NextResponse } from 'next/server'
import { verifyWebhookSignature, webhookConfigured, planFor, extendFrom } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    if (!webhookConfigured()) {
      console.warn('[billing/webhook] received but RAZORPAY_WEBHOOK_SECRET is not set')
      return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
    }

    // The raw body, byte for byte — the HMAC is over the exact bytes
    // Razorpay sent, so re-serialising parsed JSON would break it.
    const raw = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    if (!verifyWebhookSignature(raw, signature)) {
      console.warn('[billing/webhook] rejected: bad signature')
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
    }

    const event = JSON.parse(raw)
    const payment = event?.payload?.payment?.entity
    const { prisma } = await import('@/lib/prisma')

    switch (event.event) {
      case 'payment.captured':
      case 'payment.authorized': {
        if (!payment?.order_id) break
        const sub = await prisma.subscription.findFirst({ where: { razorpayOrderId: payment.order_id } })
        if (!sub) {
          console.warn(`[billing/webhook] no subscription for order ${payment.order_id}`)
          break
        }
        // Idempotent: Razorpay retries for up to 24 hours, and /verify
        // may already have credited this exact payment.
        if (sub.razorpayPaymentId === payment.id && sub.status === 'active') {
          console.log(`[billing/webhook] ${payment.id} already applied`)
          break
        }
        if (Number(payment.amount) < sub.amountPaise) {
          console.warn(`[billing/webhook] short payment ${payment.amount} < ${sub.amountPaise}`)
          break
        }

        const plan = planFor(sub.plan) || { days: 30 }
        const currentEnd = extendFrom(sub.currentEnd, plan.days)
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'active', razorpayPaymentId: payment.id,
              startsAt: sub.startsAt || new Date(),
              currentEnd, lastPaymentAt: new Date(), cancelledAt: null, failCount: 0,
            },
          }),
          prisma.user.update({ where: { id: sub.userId }, data: { tier: 'pro' } }),
        ])
        console.log(`[billing/webhook] credited ${sub.userId} until ${currentEnd.toISOString()}`)
        break
      }

      case 'payment.failed': {
        if (!payment?.order_id) break
        const sub = await prisma.subscription.findFirst({ where: { razorpayOrderId: payment.order_id } })
        // A failure never removes access already paid for — someone
        // mid-term whose renewal card is declined keeps the days they
        // bought. Only the counter moves.
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { failCount: { increment: 1 } },
          })
        }
        break
      }

      case 'refund.created':
      case 'refund.processed': {
        const refund = event?.payload?.refund?.entity
        if (!refund?.payment_id) break
        const sub = await prisma.subscription.findFirst({ where: { razorpayPaymentId: refund.payment_id } })
        if (!sub) break
        // Refunded means the term is over now, not at its natural end.
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'cancelled', cancelledAt: new Date(), currentEnd: new Date() },
          }),
          prisma.user.update({ where: { id: sub.userId }, data: { tier: 'free' } }),
        ])
        console.log(`[billing/webhook] refunded ${sub.userId}, access ended`)
        break
      }

      default:
        // Razorpay sends more events than are subscribed to; ignoring an
        // unknown one quietly is correct, and 200 stops the retries.
        break
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[billing/webhook]', err)
    // 500 makes Razorpay retry, which is what we want for a transient
    // database failure — the payment must not be lost.
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 })
  }
}
