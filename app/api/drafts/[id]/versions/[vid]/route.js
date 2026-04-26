import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// GET a specific version's full content
export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, vid } = await params
    const { prisma } = await import('@/lib/prisma')

    const draft = await prisma.draft.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const version = await prisma.draftVersion.findFirst({ where: { id: vid, draftId: id } })
    if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

    return NextResponse.json({ version })
  } catch (err) {
    console.error('[GET /api/drafts/[id]/versions/[vid]]', err)
    return NextResponse.json({ error: 'Failed to fetch version.' }, { status: 500 })
  }
}

// DELETE a specific version
export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, vid } = await params
    const { prisma } = await import('@/lib/prisma')

    const draft = await prisma.draft.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
    if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.draftVersion.deleteMany({ where: { id: vid, draftId: id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/drafts/[id]/versions/[vid]]', err)
    return NextResponse.json({ error: 'Failed to delete version.' }, { status: 500 })
  }
}
