import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function PATCH(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')

    const existing = await prisma.courtDate.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const allowed = ['title', 'date', 'type', 'caseNumber', 'draftId', 'clientId', 'notes', 'completed']
    const data = {}
    for (const f of allowed) {
      if (f in body) {
        if (f === 'date') data[f] = new Date(body[f])
        else data[f] = body[f]
      }
    }

    const courtDate = await prisma.courtDate.update({
      where: { id },
      data,
      include: {
        draft:  { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ courtDate })
  } catch (err) {
    console.error('[PATCH /api/court-dates/[id]]', err)
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { prisma } = await import('@/lib/prisma')

    const existing = await prisma.courtDate.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.courtDate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/court-dates/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 })
  }
}
