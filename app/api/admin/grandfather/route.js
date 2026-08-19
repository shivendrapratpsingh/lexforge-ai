// POST /api/admin/grandfather — keep the early users on Pro forever.
//
// Everyone who signed up while proEnforcementEnabled was false has had
// full Pro, unlimited, for free. The day enforcement is switched on they
// would all be cut off at once — which would punish exactly the people
// who took a chance on an unknown product first, and they are the ones
// whose word of mouth matters most.
//
// So they are marked permanently, before enforcement is ever considered.
// hasProAccess honours the flag ahead of any payment check.
//
// GET reports who would be affected, so this can be inspected before it
// is run.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAdmin(session)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const g = await guard(); if (g.error) return g.error
  try {
    const { prisma } = await import('@/lib/prisma')
    const [total, already, eligible] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { grandfathered: true } }),
      prisma.user.count({ where: { grandfathered: false } }),
    ])
    return NextResponse.json({ totalUsers: total, alreadyGrandfathered: already, eligible })
  } catch (err) {
    console.error('[admin/grandfather GET]', err)
    return NextResponse.json({ error: 'Could not read user counts.' }, { status: 500 })
  }
}

export async function POST(req) {
  const g = await guard(); if (g.error) return g.error
  try {
    const body = await req.json().catch(() => ({}))

    // A cut-off makes this safe to run more than once: only people who
    // joined before the given moment are covered, so running it again
    // next month does not quietly hand Pro to everyone who signed up
    // since. Defaults to now.
    const before = body.before ? new Date(body.before) : new Date()
    if (Number.isNaN(before.getTime())) {
      return NextResponse.json({ error: 'That is not a valid date.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const result = await prisma.user.updateMany({
      where: { createdAt: { lte: before }, grandfathered: false },
      data: { grandfathered: true },
    })

    console.log(`[admin] grandfathered ${result.count} users who joined before ${before.toISOString()}`)

    return NextResponse.json({
      ok: true,
      grandfathered: result.count,
      before: before.toISOString(),
      totalGrandfathered: await prisma.user.count({ where: { grandfathered: true } }),
    })
  } catch (err) {
    console.error('[admin/grandfather POST]', err)
    return NextResponse.json({ error: 'Could not grandfather users.' }, { status: 500 })
  }
}
