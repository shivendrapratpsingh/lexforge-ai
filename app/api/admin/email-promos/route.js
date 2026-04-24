import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

// ─────────────────────────────────────────────────────────────────
//  GET /api/admin/email-promos
//   Returns all per-email grants, newest first, each tagged with a
//   computed status ('upcoming' | 'active' | 'expired').
// ─────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/prisma')
    const rows = await prisma.emailPromo.findMany({ orderBy: { createdAt: 'desc' } })

    const now = new Date()
    const promos = rows.map(p => ({
      ...p,
      status: now < p.startsAt ? 'upcoming' : now > p.endsAt ? 'expired' : 'active',
    }))

    return NextResponse.json({ promos })
  } catch (err) {
    console.error('[GET /api/admin/email-promos]', err)
    return NextResponse.json({ error: 'Failed to fetch email promos.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────
//  POST /api/admin/email-promos
//   Body: { email, startsAt, endsAt, note? }.
//   Creates a grant for any email string — even one that hasn't
//   registered yet. Email is lowercased for consistent matching.
// ─────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const { email, startsAt, endsAt, note } = body || {}

    const normEmail = (email || '').trim().toLowerCase()
    if (!normEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail))
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    if (!startsAt || !endsAt)
      return NextResponse.json({ error: 'startsAt and endsAt are required.' }, { status: 400 })

    const start = new Date(startsAt)
    const end   = new Date(endsAt)
    if (isNaN(start) || isNaN(end))
      return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 })
    if (end <= start)
      return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const promo = await prisma.emailPromo.create({
      data: {
        email: normEmail,
        startsAt: start,
        endsAt: end,
        note: (note || '').trim() || null,
      },
    })

    return NextResponse.json({ promo })
  } catch (err) {
    console.error('[POST /api/admin/email-promos]', err)
    return NextResponse.json({ error: 'Failed to create email promo.' }, { status: 500 })
  }
}
