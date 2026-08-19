// GET    — one institution with its members, usage and top features
// PATCH  — edit it
// DELETE — remove it (members are unlinked, never deleted)
//
// The GET is the answer to a Principal asking "how many of my students
// use this, and for what".

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { parseDomains, rejectPublicDomains, isActive } from '@/lib/institutions'
import { usageSummary } from '@/lib/usage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAdmin(session)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { session }
}

export async function GET(_req, { params }) {
  const g = await guard(); if (g.error) return g.error
  try {
    const { id } = await params
    const { prisma } = await import('@/lib/prisma')

    const inst = await prisma.institution.findUnique({
      where: { id },
      include: { _count: { select: { members: true, invites: true } } },
    })
    if (!inst) return NextResponse.json({ error: 'Institution not found.' }, { status: 404 })

    const since30 = new Date(Date.now() - 30 * 86400000)
    const [members, invites, summary, byFeature, activeIds] = await Promise.all([
      prisma.user.findMany({
        where: { institutionId: id },
        select: {
          id: true, name: true, email: true, role: true, batch: true, createdAt: true,
          _count: { select: { drafts: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.institutionInvite.findMany({
        where: { institutionId: id }, orderBy: { createdAt: 'desc' }, take: 200,
      }),
      usageSummary({ days: 30, institutionId: id }),
      prisma.apiUsage.groupBy({
        by: ['operation'],
        where: { institutionId: id, createdAt: { gte: since30 } },
        _sum: { costPaise: true, calls: true },
      }),
      prisma.apiUsage.findMany({
        where: { institutionId: id, createdAt: { gte: since30 }, userId: { not: null } },
        distinct: ['userId'], select: { userId: true },
      }),
    ])

    return NextResponse.json({
      institution: {
        ...inst,
        active: isActive(inst),
        members: inst._count.members,
        invites: inst._count.invites,
      },
      // What they actually do with it — the difference between "300
      // students signed up" and "300 students use it".
      activity: {
        signedUp: inst._count.members,
        activeLast30Days: activeIds.length,
        draftsCreated: members.reduce((n, m) => n + m._count.drafts, 0),
        byFeature: byFeature
          .map(f => ({
            feature: f.operation,
            calls: f._sum.calls || 0,
            rupees: Math.round(f._sum.costPaise || 0) / 100,
          }))
          .sort((a, b) => b.calls - a.calls),
      },
      cost: summary,
      memberList: members.map(m => ({
        id: m.id, name: m.name, email: m.email, role: m.role, batch: m.batch,
        drafts: m._count.drafts, joinedAt: m.createdAt,
      })),
      inviteList: invites,
    })
  } catch (err) {
    console.error('[admin/institutions/[id] GET]', err)
    return NextResponse.json({ error: 'Could not load the institution.' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  const g = await guard(); if (g.error) return g.error
  try {
    const { id } = await params
    const b = await req.json().catch(() => ({}))
    const data = {}

    if (typeof b.name === 'string' && b.name.trim().length >= 3) data.name = b.name.trim()
    if (typeof b.contactName === 'string') data.contactName = b.contactName || null
    if (typeof b.contactEmail === 'string') data.contactEmail = b.contactEmail || null
    if (typeof b.notes === 'string') data.notes = b.notes || null
    if (['college', 'firm', 'chamber'].includes(b.kind)) data.kind = b.kind
    if (['pilot', 'paid', 'expired'].includes(b.plan)) data.plan = b.plan
    if (b.seats !== undefined && Number.isFinite(Number(b.seats))) data.seats = Math.max(0, Number(b.seats))
    if (b.startsAt !== undefined) data.startsAt = b.startsAt ? new Date(b.startsAt) : new Date()
    if (b.endsAt !== undefined) data.endsAt = b.endsAt ? new Date(b.endsAt) : null

    if (b.emailDomains !== undefined) {
      const domains = parseDomains(b.emailDomains)
      const publics = rejectPublicDomains(domains)
      if (publics.length) {
        return NextResponse.json({
          error: `${publics.join(', ')} is a public email provider and cannot be an institution domain.`,
        }, { status: 400 })
      }
      data.emailDomains = domains.join(',')
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const inst = await prisma.institution.update({ where: { id }, data })

    // Domains may have changed — pick up anyone already signed up who now
    // matches, so editing a college does not leave its students unlinked.
    let linked = 0
    if (data.emailDomains) {
      for (const d of parseDomains(data.emailDomains)) {
        const r = await prisma.user.updateMany({
          where: { email: { endsWith: `@${d}` }, institutionId: null },
          data: { institutionId: id },
        })
        linked += r.count
      }
    }

    return NextResponse.json({ institution: inst, linkedExistingUsers: linked })
  } catch (err) {
    console.error('[admin/institutions/[id] PATCH]', err)
    return NextResponse.json({ error: 'Could not update the institution.' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  const g = await guard(); if (g.error) return g.error
  try {
    const { id } = await params
    const { prisma } = await import('@/lib/prisma')

    // Members are unlinked, not deleted. Ending a pilot must never delete
    // a student account and all of their work with it.
    await prisma.user.updateMany({ where: { institutionId: id }, data: { institutionId: null } })
    await prisma.institution.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/institutions/[id] DELETE]', err)
    return NextResponse.json({ error: 'Could not delete the institution.' }, { status: 500 })
  }
}
