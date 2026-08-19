// Exercises exactly the queries the admin routes run, against the real DB,
// so the panel's data is proven before anyone opens the screen.
import { PrismaClient } from '@prisma/client'
import { parseDomains, rejectPublicDomains, isActive } from '../lib/institutions.js'
import { usageSummary, topSpenders } from '../lib/usage.js'

const prisma = new PrismaClient()
const log = (...a) => console.log(...a)
let instId = null

try {
  // ── 1. Create, exactly as POST does ────────────────────────────
  const domains = parseDomains('verifytest-lexforge.ac.in')
  log('parseDomains:', domains, '| public rejected:', rejectPublicDomains(parseDomains('gmail.com, x.ac.in')))

  const inst = await prisma.institution.create({
    data: {
      name: 'ZZ Verify College', slug: 'zz-verify-college-' + Date.now(),
      emailDomains: domains.join(','), kind: 'college', plan: 'pilot',
      seats: 0, startsAt: new Date(), endsAt: null,
    },
  })
  instId = inst.id
  log('created:', inst.name, '| active:', isActive(inst))

  // ── 2. Invite flow, exactly as the invite route does ───────────
  const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
  const pasted = 'Ravi Kumar <zz.ravi@example.com>\nzz.sunita@example.com, zz.ravi@example.com'
  const found = [...new Set((pasted.match(EMAIL_RE) || []).map(e => e.toLowerCase()))]
  const created = await prisma.institutionInvite.createMany({
    data: found.map(email => ({ institutionId: instId, email, batch: 'BA LLB 2027' })),
    skipDuplicates: true,
  })
  log('invite: found', found.length, '| created', created.count, '| dedup ok:', found.length === 2)

  // re-paste the same list — must not throw
  const again = await prisma.institutionInvite.createMany({
    data: found.map(email => ({ institutionId: instId, email, batch: 'BA LLB 2027' })),
    skipDuplicates: true,
  })
  log('re-paste: created', again.count, '(expect 0, no error)')

  // ── 3. Detail GET query set ────────────────────────────────────
  const since30 = new Date(Date.now() - 30 * 86400000)
  const full = await prisma.institution.findUnique({
    where: { id: instId }, include: { _count: { select: { members: true, invites: true } } },
  })
  const [members, invites, summary, byFeature, activeIds] = await Promise.all([
    prisma.user.findMany({
      where: { institutionId: instId },
      select: { id: true, name: true, email: true, role: true, batch: true, createdAt: true, _count: { select: { drafts: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    }),
    prisma.institutionInvite.findMany({ where: { institutionId: instId }, take: 200 }),
    usageSummary({ days: 30, institutionId: instId }),
    prisma.apiUsage.groupBy({ by: ['operation'], where: { institutionId: instId, createdAt: { gte: since30 } }, _sum: { costPaise: true, calls: true } }),
    prisma.apiUsage.findMany({ where: { institutionId: instId, createdAt: { gte: since30 }, userId: { not: null } }, distinct: ['userId'], select: { userId: true } }),
  ])
  log('detail: members', full._count.members, '| invites', full._count.invites,
      '| cost', summary.totalRupees, '| features', byFeature.length, '| active', activeIds.length)

  // ── 4. List GET query set ──────────────────────────────────────
  const rows = await prisma.institution.findMany({ include: { _count: { select: { members: true, invites: true } } } })
  const spend = await prisma.apiUsage.groupBy({
    by: ['institutionId'], where: { createdAt: { gte: since30 }, institutionId: { not: null } }, _sum: { costPaise: true },
  })
  log('list:', rows.length, 'institution(s) | spend rows', spend.length)

  // ── 5. Platform cost panel ─────────────────────────────────────
  const s = await usageSummary({ days: 30 })
  const top = await topSpenders({ days: 30, limit: 5 })
  log('costs: total ₹' + s.totalRupees, '| active', s.activeUsers, '| perUser ₹' + s.perActiveUserRupees,
      '| providers', s.byProvider.map(p => p.provider + ':' + p.rupees).join(' '), '| top', top.length)

  // ── 6. Grandfather counts (read only) ──────────────────────────
  const [total, already, eligible] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { grandfathered: true } }),
    prisma.user.count({ where: { grandfathered: false } }),
  ])
  log('grandfather: total', total, '| already', already, '| eligible', eligible)
} catch (e) {
  console.error('FAILED:', e.message)
  process.exitCode = 1
} finally {
  if (instId) {
    await prisma.institutionInvite.deleteMany({ where: { institutionId: instId } })
    await prisma.user.updateMany({ where: { institutionId: instId }, data: { institutionId: null } })
    await prisma.institution.delete({ where: { id: instId } })
    log('cleaned up test institution')
  }
  await prisma.$disconnect()
}
