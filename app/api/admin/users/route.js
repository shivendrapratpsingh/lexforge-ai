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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        suspended: true,
        createdAt: true,
        _count: {
          select: { drafts: true, clients: true, courtDates: true },
        },
      },
    })

    return NextResponse.json({ users })
  } catch (err) {
    console.error('[GET /api/admin/users]', err)
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 })
  }
}
