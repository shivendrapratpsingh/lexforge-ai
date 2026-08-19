// POST /api/billing/verify — the browser says it paid; prove it.
//
// This request comes from the user's own browser and is entirely under
// their control: the order id, the payment id and the amount are all
// just numbers someone can type. The only thing that cannot be forged
// is the HMAC signature, which is computed with a secret the browser
// never sees. So the signature is checked first, and then the payment
// is re-read from Razorpay's own API before a single day of access is
// granted.
//
// The webhook does the same job independently — this route exists so
// the user sees Pro immediately rather than waiting on a callback.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyPaymentSignature, fetchPayment, planFor, extendFrom, configured } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!configured()) return NextResponse.json({ error: 'Payments are not switched on.' }, { status: 503 })

    const b = await req.json().catch(() => ({}))
    const orderId = b.razorpay_order_id
    const paymentId = b.razorpay_payment_id
    const signature = b.razorpay_signature

    if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
      console.warn(`[billing] bad signature from user ${session.user.id} for order ${orderId}`)
      return NextResponse.json({ error: 'That payment could not be verified.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // The order must be the one we opened for this user. Without this,
    // a valid signature from somebody else's payment would upgrade the
    // account that replayed it.
    const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    if (!sub || sub.razorpayOrderId !== orderId) {
      return NextResponse.json({ error: 'That payment does not belong to this account.' }, { status: 400 })
    }

    // Already credited — the webhook usually wins the race. Return the
    // same success rather than an error, and never extend twice.
    if (sub.razorpayPaymentId === paymentId && sub.status === 'active') {
      return NextResponse.json({ ok: true, alreadyApplied: true, currentEnd: sub.currentEnd })
    }

    // Razorpay's own record of the payment, not the browser's claim.
    const payment = await fetchPayment(paymentId)
    if (payment.order_id !== orderId) {
      return NextResponse.json({ error: 'That payment does not match the order.' }, { status: 400 })
    }
    if (!['captured', 'authorized'].includes(payment.status)) {
      return NextResponse.json({ error: `Payment is ${payment.status}, not completed.` }, { status: 400 })
    }
    if (Number(payment.amount) < sub.amountPaise) {
      console.warn(`[billing] short payment: ${payment.amount} < ${sub.amountPaise} for order ${orderId}`)
      return NextResponse.json({ error: 'The amount paid does not match the plan.' }, { status: 400 })
    }

    const plan = planFor(sub.plan) || { days: 30 }
    const currentEnd = extendFrom(sub.currentEnd, plan.days)

    await prisma.$transaction([
      prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          status: 'active',
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          startsAt: sub.startsAt || new Date(),
          currentEnd,
          lastPaymentAt: new Date(),
          cancelledAt: null,
          failCount: 0,
        },
      }),
      prisma.user.update({ where: { id: session.user.id }, data: { tier: 'pro' } }),
    ])

    console.log(`[billing] ${session.user.email} paid for ${sub.plan}, access to ${currentEnd.toISOString()}`)

    return NextResponse.json({ ok: true, plan: sub.plan, currentEnd })
  } catch (err) {
    console.error('[billing/verify]', err)
    return NextResponse.json({
      error: 'We could not confirm the payment. If money left your account it will be credited within a few minutes — the receipt is safe.',
    }, { status: 500 })
  }
}
