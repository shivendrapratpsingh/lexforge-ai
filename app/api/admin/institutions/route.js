// GET  /api/admin/institutions — list, with member counts and spend
// POST /api/admin/institutions — create a college or firm
//
// Platform admin only. This is what replaces adding 300 students one at
// a time: create the institution with its email domains, and every
// student who signs up from that domain is linked and granted access.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { parseDomains, rejectPublicDomains, isActive, generateJoinCode } from '@/lib/institutions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const slugify = (s) =>
  String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/prisma')
    const rows = await prisma.institution.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true, invites: true } } },
    })

    // Spend per institution over the last 30 days — the figure that
    // answers "is this pilot costing us anything real?"
    const since = new Date(Date.now() - 30 * 86400000)
    const spend = await prisma.apiUsage.groupBy({
      by: ['institutionId'],
      where: { createdAt: { gte: since }, institutionId: { not: null } },
      _sum: { costPaise: true },
    })
    const byInst = new Map(spend.map(s => [s.institutionId, s._sum.costPaise || 0]))

    return NextResponse.json({
      institutions: rows.map(i => ({
        id: i.id, name: i.name, slug: i.slug, kind: i.kind, plan: i.plan,
        emailDomains: i.emailDomains, seats: i.seats, joinCode: i.joinCode,
        startsAt: i.startsAt, endsAt: i.endsAt,
        contactName: i.contactName, contactEmail: i.contactEmail, notes: i.notes,
        members: i._count.members, invites: i._count.invites,
        active: isActive(i),
        spend30dRupees: Math.round(byInst.get(i.id) || 0) / 100,
      })),
    })
  } catch (err) {
    console.error('[admin/institutions GET]', err)
    return NextResponse.json({ error: 'Could not load institutions.' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const b = await req.json().catch(() => ({}))
    const name = String(b.name || '').trim()
    if (name.length < 3) {
      return NextResponse.json({ error: 'Give the institution a name.' }, { status: 400 })
    }

    const domains = parseDomains(b.emailDomains)
    // A public provider claimed as an institution domain would hand Pro
    // to every user who ever signs up with that address. Refused here,
    // where it is cheap, rather than discovered in the billing later.
    const publics = rejectPublicDomains(domains)
    if (publics.length) {
      return NextResponse.json({
        error: `${publics.join(', ')} is a public email provider and cannot be an institution domain — anyone in the world could claim access. Invite those students by email instead.`,
      }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    let slug = slugify(b.slug || name)
    // Slugs are unique; a second "School of Law" should not 500.
    for (let n = 2; await prisma.institution.findUnique({ where: { slug } }); n++) {
      slug = `${slugify(b.slug || name)}-${n}`
    }

    // A code from the start. The whole value of it is that a convenor
    // can read it out the moment the college is set up, so making an
    // admin go and generate one first defeats it.
    let joinCode = generateJoinCode()
    while (await prisma.institution.findUnique({ where: { joinCode } })) joinCode = generateJoinCode()

    const inst = await prisma.institution.create({
      data: {
        name, slug, joinCode,
        emailDomains: domains.join(','),
        kind: ['college', 'firm', 'chamber'].includes(b.kind) ? b.kind : 'college',
        plan: ['pilot', 'paid', 'expired'].includes(b.plan) ? b.plan : 'pilot',
        seats: Number.isFinite(Number(b.seats)) ? Math.max(0, Number(b.seats)) : 0,
        startsAt: b.startsAt ? new Date(b.startsAt) : new Date(),
        endsAt: b.endsAt ? new Date(b.endsAt) : null,
        contactName: b.contactName || null,
        contactEmail: b.contactEmail || null,
        notes: b.notes || null,
      },
    })

    // Anyone who already signed up from this domain is linked now, so a
    // college created after its students arrived still works.
    let linked = 0
    if (domains.length) {
      for (const d of domains) {
        const r = await prisma.user.updateMany({
          where: { email: { endsWith: `@${d}` }, institutionId: null },
          data: { institutionId: inst.id },
        })
        linked += r.count
      }
    }

    return NextResponse.json({ institution: inst, linkedExistingUsers: linked }, { status: 201 })
  } catch (err) {
    console.error('[admin/institutions POST]', err)
    return NextResponse.json({ error: 'Could not create the institution.' }, { status: 500 })
  }
}
