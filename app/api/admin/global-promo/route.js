import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

// ─────────────────────────────────────────────────────────────────
//  GET /api/admin/global-promo
//   Returns the most recently created GlobalPromo row (the one the
//   admin is currently editing / the one in effect), plus a computed
//   `status` field: 'upcoming' | 'active' | 'expired' | null.
// ─────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/prisma')
    const promo = await prisma.globalPromo.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!promo) return NextResponse.json({ promo: null })

    const now = new Date()
    const status =
      now < promo.startsAt ? 'upcoming' :
      now > promo.endsAt   ? 'expired'  : 'active'

    return NextResponse.json({ promo: { ...promo, status } })
  } catch (err) {
    console.error('[GET /api/admin/global-promo]', err)
    return NextResponse.json({ error: 'Failed to fetch global promo.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────
//  POST /api/admin/global-promo
//   Creates a new GlobalPromo row. Body: { startsAt, endsAt, note? }.
//   The app always reads the most recent row, so this effectively
//   replaces the active window.
// ─────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const { startsAt, endsAt, note } = body || {}

    if (!startsAt || !endsAt)
      return NextResponse.json({ error: 'startsAt and endsAt are required.' }, { status: 400 })

    const start = new Date(startsAt)
    const end   = new Date(endsAt)
    if (isNaN(start) || isNaN(end))
      return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 })
    if (end <= start)
      return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const promo = await prisma.globalPromo.create({
      data: { startsAt: start, endsAt: end, note: (note || '').trim() || null },
    })

    return NextResponse.json({ promo })
  } catch (err) {
    console.error('[POST /api/admin/global-promo]', err)
    return NextResponse.json({ error: 'Failed to save global promo.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────
//  DELETE /api/admin/global-promo
//   Deletes ALL GlobalPromo rows — i.e. cancels any active/upcoming
//   window cleanly. History is lost, which is fine here because
//   only the latest row is ever read.
// ─────────────────────────────────────────────────────────────────
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/prisma')
    const { count } = await prisma.globalPromo.deleteMany({})

    return NextResponse.json({ deleted: count })
  } catch (err) {
    console.error('[DELETE /api/admin/global-promo]', err)
    return NextResponse.json({ error: 'Failed to cancel global promo.' }, { status: 500 })
  }
}
