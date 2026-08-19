// GET    /api/billing/subscription — what this account is paying, if anything
// DELETE /api/billing/subscription — stop renewing
//
// Cancelling here does not cut anyone off. These are prepaid terms: a
// user who paid for a year and cancels in month two keeps ten months.
// Ending access on the day someone asks to stop paying would be taking
// money for nothing.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { planFor, rupees } from '@/lib/billing'
import { hasProAccessForSession } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        grandfathered: true,
        subscription: true,
        institution: { select: { name: true, plan: true, endsAt: true } },
      },
    })

    const sub = user?.subscription || null
    const plan = sub ? planFor(sub.plan) : null

    return NextResponse.json({
      pro: await hasProAccessForSession(session),
      // Why they have Pro matters more than whether they do: someone on
      // an institutional plan should not be shown a renewal notice, and
      // a grandfathered user should never see a price at all.
      via: user?.grandfathered ? 'grandfathered'
        : user?.institution ? 'institution'
        : sub?.status === 'active' ? 'paid'
        : null,
      grandfathered: Boolean(user?.grandfathered),
      institution: user?.institution || null,
      subscription: sub ? {
        plan: sub.plan,
        planLabel: plan?.label || sub.plan,
        status: sub.status,
        rupees: rupees(sub.amountPaise),
        startsAt: sub.startsAt,
        currentEnd: sub.currentEnd,
        cancelledAt: sub.cancelledAt,
        lastPaymentAt: sub.lastPaymentAt,
        expired: Boolean(sub.currentEnd && new Date(sub.currentEnd) < new Date()),
      } : null,
    })
  } catch (err) {
    console.error('[billing/subscription GET]', err)
    return NextResponse.json({ error: 'Could not read the subscription.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    if (!sub || sub.status !== 'active') {
      return NextResponse.json({ error: 'There is no active plan to cancel.' }, { status: 400 })
    }

    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })

    // tier stays 'pro'; hasProAccess honours currentEnd for a cancelled
    // subscription, so the paid-for days remain.
    return NextResponse.json({
      ok: true,
      currentEnd: sub.currentEnd,
      message: sub.currentEnd
        ? `Cancelled. Your access continues until ${new Date(sub.currentEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`
        : 'Cancelled.',
    })
  } catch (err) {
    console.error('[billing/subscription DELETE]', err)
    return NextResponse.json({ error: 'Could not cancel.' }, { status: 500 })
  }
}
