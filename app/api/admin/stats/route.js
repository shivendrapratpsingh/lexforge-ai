import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prisma } = await import('@/lib/prisma')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      proUsers,
      suspendedUsers,
      totalDrafts,
      draftsThisMonth,
      draftsToday,
      draftsLast7Days,
      totalClients,
      totalCourtDates,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { tier: 'pro' } }),
      prisma.user.count({ where: { suspended: true } }),
      prisma.draft.count(),
      prisma.draft.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.draft.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.draft.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.client.count(),
      prisma.courtDate.count(),
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        proUsers,
        freeUsers: totalUsers - proUsers,
        suspendedUsers,
        totalDrafts,
        draftsToday,
        draftsLast7Days,
        draftsThisMonth,
        totalClients,
        totalCourtDates,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/stats]', err)
    return NextResponse.json({ error: 'Failed to fetch stats.' }, { status: 500 })
  }
}
