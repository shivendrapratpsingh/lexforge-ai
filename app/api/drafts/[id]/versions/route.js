import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { prisma } = await import('@/lib/prisma')

    // Verify draft belongs to user
    const draft = await prisma.draft.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const versions = await prisma.draftVersion.findMany({
      where: { draftId: id },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, changeNote: true, createdAt: true },
    })

    return NextResponse.json({ versions })
  } catch (err) {
    console.error('[GET /api/drafts/[id]/versions]', err)
    return NextResponse.json({ error: 'Failed to fetch versions.' }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => null)
    const { changeNote } = body || {}

    const { prisma } = await import('@/lib/prisma')

    const draft = await prisma.draft.findFirst({ where: { id, userId: session.user.id } })
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get next version number
    const lastVersion = await prisma.draftVersion.findFirst({
      where: { draftId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (lastVersion?.version || 0) + 1

    const version = await prisma.draftVersion.create({
      data: {
        draftId: id,
        version: nextVersion,
        content: draft.content,
        changeNote: changeNote || null,
      },
    })

    return NextResponse.json({ version }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drafts/[id]/versions]', err)
    return NextResponse.json({ error: 'Failed to save version.' }, { status: 500 })
  }
}
