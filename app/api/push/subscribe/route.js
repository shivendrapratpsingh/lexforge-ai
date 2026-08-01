// GET    /api/push/subscribe  → { configured, publicKey, subscribed, topics }
// POST   /api/push/subscribe  → save/refresh this device's subscription
// DELETE /api/push/subscribe  → turn notifications off for this device
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pushConfigured } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configured = pushConfigured()
  let subscribed = false
  let topics = 'dates,drafts,study'

  const endpoint = new URL(req.url).searchParams.get('endpoint')
  if (configured && endpoint) {
    try {
      const { prisma } = await import('@/lib/prisma')
      const row = await prisma.pushSubscription.findUnique({ where: { endpoint } })
      if (row && row.userId === session.user.id) { subscribed = true; topics = row.topics }
    } catch (_) { /* table missing / DB blip — report as not subscribed */ }
  }

  return NextResponse.json({
    configured,
    publicKey: configured ? process.env.VAPID_PUBLIC_KEY : null,
    subscribed,
    topics,
  })
}

export async function POST(req) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!pushConfigured()) {
    return NextResponse.json({ error: 'Push notifications are not configured on this deployment.' }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const sub = body?.subscription
  const endpoint = sub?.endpoint
  const p256dh = sub?.keys?.p256dh
  const authKey = sub?.keys?.auth
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: 'A complete push subscription is required.' }, { status: 400 })
  }

  const topics = Array.isArray(body?.topics) && body.topics.length
    ? body.topics.filter(t => ['dates', 'drafts', 'study'].includes(t)).join(',')
    : 'dates,drafts,study'

  try {
    const { prisma } = await import('@/lib/prisma')
    // Upsert on endpoint: re-subscribing the same device (or a device that
    // changed hands) updates the row instead of creating duplicates, so a
    // user never receives the same digest twice.
    const row = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: session.user.id, p256dh, auth: authKey, topics, failCount: 0 },
      create: { userId: session.user.id, endpoint, p256dh, auth: authKey, topics },
    })
    return NextResponse.json({ ok: true, topics: row.topics })
  } catch (err) {
    console.error('[push/subscribe]', err?.message)
    return NextResponse.json({ error: 'Could not save your notification settings.' }, { status: 500 })
  }
}

export async function DELETE(req) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const endpoint = body?.endpoint || new URL(req.url).searchParams.get('endpoint')
  if (!endpoint) return NextResponse.json({ error: 'endpoint is required.' }, { status: 400 })

  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/unsubscribe]', err?.message)
    return NextResponse.json({ error: 'Could not turn notifications off.' }, { status: 500 })
  }
}
