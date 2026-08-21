// GET/POST /api/push/daily — the daily digest job.
//
// Invoked by Vercel Cron (see vercel.json). Builds ONE notification per
// subscribed user covering every service they enabled — upcoming court
// dates, free-quota warnings, and a study prompt — and prunes dead
// endpoints as it goes.
//
// Auth: the same CRON_SECRET used by the brief-jobs worker. Vercel Cron
// sends `Authorization: Bearer <CRON_SECRET>`.
import { NextResponse } from 'next/server'
import { sendPush, buildDigest, pushConfigured } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorised(req) {
  const expected = process.env.CRON_SECRET
  if (!expected) return process.env.NODE_ENV !== 'production'
  const got = req.headers.get('x-cron-secret')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return got === expected
}

async function run() {
  if (!pushConfigured()) return { ok: false, reason: 'push not configured' }

  const { prisma } = await import('@/lib/prisma')
  const { getFreeDocsLimit, hasProAccess } = await import('@/lib/admin')

  const subs = await prisma.pushSubscription.findMany({
    include: { user: { select: { id: true, name: true, email: true, tier: true, suspended: true } } },
  })
  if (!subs.length) return { ok: true, sent: 0, pruned: 0, reason: 'no subscribers' }

  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const freeLimit = await getFreeDocsLimit()

  // Group by user so someone with a phone AND a laptop gets one digest
  // composed once, delivered to each device.
  const byUser = new Map()
  for (const s of subs) {
    if (!s.user || s.user.suspended) continue
    if (!byUser.has(s.userId)) byUser.set(s.userId, { user: s.user, devices: [] })
    byUser.get(s.userId).devices.push(s)
  }

  let sent = 0, pruned = 0, skipped = 0

  for (const [userId, { user, devices }] of byUser) {
    const [hearings, draftsThisMonth] = await Promise.all([
      prisma.courtDate.findMany({
        where: { userId, completed: false, date: { gte: now, lte: weekAhead } },
        orderBy: { date: 'asc' }, take: 5,
        select: { title: true, date: true },
      }),
      prisma.draft.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    ])

    const isPro = await hasProAccess(user.email, user.tier).catch(() => false)

    // Union of the topics enabled across this user's devices.
    const topics = [...new Set(devices.flatMap(d => String(d.topics || '').split(',')))].join(',')

    const payload = buildDigest({
      name: (user.name || '').split(' ')[0],
      topics, hearings, draftsThisMonth, freeLimit, isPro,
    })
    if (!payload) { skipped++; continue }

    for (const d of devices) {
      const res = await sendPush(d, payload)
      if (res.ok) {
        sent++
        await prisma.pushSubscription.update({
          where: { id: d.id }, data: { lastSentAt: new Date(), failCount: 0 },
        }).catch(() => {})
      } else if (res.gone) {
        pruned++
        await prisma.pushSubscription.delete({ where: { id: d.id } }).catch(() => {})
      } else {
        // Three consecutive failures and we stop trying this endpoint.
        const fails = (d.failCount || 0) + 1
        if (fails >= 3) { pruned++; await prisma.pushSubscription.delete({ where: { id: d.id } }).catch(() => {}) }
        else await prisma.pushSubscription.update({ where: { id: d.id }, data: { failCount: fails } }).catch(() => {})
      }
    }
  }

  return { ok: true, users: byUser.size, sent, pruned, skipped }
}

// The legal-data sync rides along with this job. Vercel Hobby allows two
// cron jobs and both are already spoken for, and this one already fires
// at 8 AM IST — which is when new Acts were asked to be checked anyway.
//
// It runs AFTER the notifications and on a small budget: a slow court
// API upstream must never be the reason somebody's hearing reminder does
// not go out. Its failure is recorded and swallowed for the same reason.
async function runLegalSync() {
  try {
    const { runDailySync } = await import('@/lib/legal-data/sync')
    return await runDailySync({ budgetMs: 20_000 })
  } catch (e) {
    console.error('[push/daily] legal sync failed:', e?.message)
    return { ok: false, error: e?.message }
  }
}

// Vercel's free plan allows two cron entries and both are spoken for, so
// the billing sweep rides along here. Its failure is swallowed for the
// same reason the legal sync's is: nobody's hearing reminder should be
// lost because a subscription check went wrong.
async function runBillingExpiry() {
  try {
    const { expireLapsedSubscriptions, remindExpiringSubscriptions } = await import('@/lib/billing')
    // Warn first, then expire. Reversed, somebody whose term ended today
    // would be warned about a plan they had already lost.
    const reminded = await remindExpiringSubscriptions()
    const expired = await expireLapsedSubscriptions()
    return { ...expired, ...reminded }
  } catch (e) {
    console.error('[push/daily] billing expiry failed:', e?.message)
    return { ok: false, error: e?.message }
  }
}

// The report that says whether yesterday actually worked. Runs last, so
// it can see the results of everything above it. Its own failure is
// swallowed for the same reason as the others.
async function runDailyDigest() {
  try {
    const { ADMIN_EMAIL } = await import('@/lib/admin')
    const { buildDailyDigest, digestEmail } = await import('@/lib/digest')
    const { notifyQuietly } = await import('@/lib/mail')

    const digest = await buildDailyDigest()
    await notifyQuietly({ to: ADMIN_EMAIL, ...digestEmail(digest) })
    return { alerts: digest.alerts.length, sent: true }
  } catch (e) {
    console.error('[push/daily] digest failed:', e?.message)
    return { ok: false, error: e?.message }
  }
}

export async function GET(req) {
  if (!authorised(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    const notifications = await run()
    const legal = await runLegalSync()
    const billing = await runBillingExpiry()
    const digest = await runDailyDigest()
    return NextResponse.json({ ...notifications, legal, billing, digest })
  }
  catch (e) { console.error('[push/daily]', e?.message); return NextResponse.json({ ok: false, error: e?.message }, { status: 500 }) }
}

export async function POST(req) {
  if (!authorised(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    const notifications = await run()
    const legal = await runLegalSync()
    const billing = await runBillingExpiry()
    const digest = await runDailyDigest()
    return NextResponse.json({ ...notifications, legal, billing, digest })
  }
  catch (e) { console.error('[push/daily]', e?.message); return NextResponse.json({ ok: false, error: e?.message }, { status: 500 }) }
}
