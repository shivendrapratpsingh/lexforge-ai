// GET  /api/billing/checkout — what can be bought, and for how much
// POST /api/billing/checkout — open a Razorpay order for one plan
//
// The GET exists so the upgrade page never has to hardcode a price: if
// PRICE_MONTHLY_PAISE changes, the page changes with it, and if no keys
// are configured the page shows the invite-only path instead of a Pay
// button that would fail on click.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { configured, IS_LIVE, KEY_ID, PLANS, planFor, createOrder, rupees } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Kept because a member of a college should not be sold anything at
  // all — their college is already paying per seat, so the checkout says
  // so instead of taking a second payment for the same access.
  let hasInstitution = false
  try {
    const { prisma } = await import('@/lib/prisma')
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    })
    hasInstitution = Boolean(u?.institutionId)
  } catch { /* fall through — the paid plans still show */ }

  const plans = Object.values(PLANS)
    .map(p => ({
      id: p.id, label: p.label, days: p.days, blurb: p.blurb,
      amountPaise: p.amountPaise, rupees: rupees(p.amountPaise),
    }))

  return NextResponse.json({
    configured: configured(), live: IS_LIVE, keyId: KEY_ID, plans,
    // The UI uses this to say "your college already covers this" rather
    // than showing a price to somebody who should not be charged.
    coveredByInstitution: hasInstitution,
  })
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!configured()) {
      return NextResponse.json({
        error: 'Payments are not switched on yet. Contact the administrator for access.',
      }, { status: 503 })
    }

    const { planId } = await req.json().catch(() => ({}))
    const plan = planFor(planId)
    if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, institutionId: true },
    })
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    // Someone whose college is already paying per seat must not be
    // charged again for the same access.
    if (user.institutionId) {
      return NextResponse.json({
        error: 'Your college already covers your access, so there is nothing to pay. If you think that is wrong, write to us.',
      }, { status: 400 })
    }

    const order = await createOrder({
      amountPaise: plan.amountPaise,
      receipt: `lf_${user.id.slice(-12)}_${Date.now().toString(36)}`,
      notes: { userId: user.id, email: user.email, plan: plan.id },
    })

    // One Subscription row per user, rewritten each purchase. `status`
    // stays "created" until a signature proves the money arrived — a row
    // written here grants nothing.
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id, plan: plan.id, status: 'created',
        amountPaise: plan.amountPaise, razorpayOrderId: order.id,
      },
      update: {
        plan: plan.id, status: 'created',
        amountPaise: plan.amountPaise, razorpayOrderId: order.id,
        razorpayPaymentId: null, razorpaySignature: null,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amountPaise: plan.amountPaise,
      currency: 'INR',
      keyId: KEY_ID,
      plan: { id: plan.id, label: plan.label, days: plan.days },
      prefill: { name: user.name || '', email: user.email || '' },
    })
  } catch (err) {
    console.error('[billing/checkout]', err)
    return NextResponse.json({
      error: err?.razorpay ? err.message : 'Could not start the payment. Please try again.',
    }, { status: 500 })
  }
}
