import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export async function DELETE(_req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const { prisma } = await import('@/lib/prisma')

    const draft = await prisma.draft.findUnique({ where: { id }, select: { id: true } })
    if (!draft)
      return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })

    await prisma.draft.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/drafts/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete draft.' }, { status: 500 })
  }
}
