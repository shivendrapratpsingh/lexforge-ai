// GET /api/college — what a faculty co-ordinator can see about their own college.
//
// Deliberately not the admin endpoint with a different guard. A
// co-ordinator gets their roster and their activity —
// never costs, never other institutions, and never anything a student
// wrote. Being able to see that a student is active is a register; being
// able to read their draft is surveillance, and it would make honest
// students stop using it.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isActive } from '@/lib/institutions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, institutionId: true },
    })

    if (!me?.institutionId) {
      return NextResponse.json({ error: 'You are not a member of a college.' }, { status: 403 })
    }
    if (me.role !== 'faculty') {
      return NextResponse.json({
        error: 'This is for faculty co-ordinators. Ask us to mark your account, and we will confirm with the college first.',
      }, { status: 403 })
    }

    const inst = await prisma.institution.findUnique({
      where: { id: me.institutionId },
      include: { _count: { select: { members: true, invites: true } } },
    })
    if (!inst) return NextResponse.json({ error: 'College not found.' }, { status: 404 })

    const since30 = new Date(Date.now() - 30 * 86400000)
    const [members, activeIds] = await Promise.all([
      prisma.user.findMany({
        where: { institutionId: inst.id },
        select: {
          id: true, name: true, email: true, role: true, batch: true, createdAt: true,
          _count: { select: { drafts: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.apiUsage.findMany({
        where: { institutionId: inst.id, createdAt: { gte: since30 }, userId: { not: null } },
        distinct: ['userId'], select: { userId: true },
      }),
    ])

    const active = new Set(activeIds.map(a => a.userId))

    // Grouped by batch, because a co-ordinator thinks in years, not in a
    // list of 300 names: "is the third year using it" is the question.
    const batches = {}
    for (const m of members) {
      const key = m.batch || 'No batch set'
      batches[key] ||= { batch: key, members: 0, active: 0, drafts: 0 }
      batches[key].members++
      batches[key].drafts += m._count.drafts
      if (active.has(m.id)) batches[key].active++
    }

    return NextResponse.json({
      institution: {
        name: inst.name,
        kind: inst.kind,
        plan: inst.plan,
        endsAt: inst.endsAt,
        seats: inst.seats,
        active: isActive(inst),
      },
      totals: {
        signedUp: inst._count.members,
        activeLast30Days: active.size,
        drafts: members.reduce((n, m) => n + m._count.drafts, 0),
        invited: inst._count.invites,
        seatsLeft: inst.seats > 0 ? Math.max(0, inst.seats - inst._count.members) : null,
      },
      batches: Object.values(batches).sort((a, b) => b.members - a.members),
      members: members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        batch: m.batch,
        joinedAt: m.createdAt,
        drafts: m._count.drafts,          // how many, never what
        activeRecently: active.has(m.id),
      })),
    })
  } catch (err) {
    console.error('[college GET]', err)
    return NextResponse.json({ error: 'Could not load your college.' }, { status: 500 })
  }
}
