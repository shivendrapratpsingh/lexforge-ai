import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const take = Math.min(Number(searchParams.get('take') || 100), 500)

    const { prisma } = await import('@/lib/prisma')

    const drafts = await prisma.draft.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        documentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    })

    return NextResponse.json({ drafts })
  } catch (err) {
    console.error('[GET /api/admin/drafts]', err)
    return NextResponse.json({ error: 'Failed to fetch drafts.' }, { status: 500 })
  }
}
