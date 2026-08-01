// POST /api/push/test — send a single notification to the signed-in
// user's devices, so switching notifications on can be confirmed
// immediately instead of waiting until tomorrow morning.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendPush, pushConfigured } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ error: 'Push is not configured on this deployment.' }, { status: 503 })

  const { prisma } = await import('@/lib/prisma')
  const devices = await prisma.pushSubscription.findMany({ where: { userId: session.user.id } })
  if (!devices.length) return NextResponse.json({ error: 'This device is not subscribed yet.' }, { status: 400 })

  const payload = {
    title: 'LexForge notifications are on',
    body: 'This is what your daily brief will look like — hearings, quota and a study prompt, once a day.',
    url: '/dashboard',
    tag: 'lexforge-test',
  }

  let sent = 0
  for (const d of devices) {
    const r = await sendPush(d, payload)
    if (r.ok) sent++
    else if (r.gone) await prisma.pushSubscription.delete({ where: { id: d.id } }).catch(() => {})
  }

  return sent
    ? NextResponse.json({ ok: true, sent })
    : NextResponse.json({ error: 'Could not reach any of your devices. Try turning notifications off and on again.' }, { status: 502 })
}
