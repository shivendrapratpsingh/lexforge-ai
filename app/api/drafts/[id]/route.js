import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { prisma } = await import('@/lib/prisma')
    const draft = await prisma.draft.findFirst({ where: { id, userId: session.user.id } })
    if (!draft) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    return NextResponse.json(draft)
  } catch (err) {
    console.error('[GET /api/drafts/[id]]', err)
    return NextResponse.json({ error: err?.message || 'Failed to fetch.' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const updates = await req.json()
    const allowed = ['title', 'content', 'status', 'caseStatus', 'clientId']
    const data = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
    // Allow explicit null for clientId (unlink client)
    if ('clientId' in updates && updates.clientId === null) data.clientId = null
    const { prisma } = await import('@/lib/prisma')
    await prisma.draft.updateMany({ where: { id, userId: session.user.id }, data })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/drafts/[id]]', err)
    return NextResponse.json({ error: err?.message || 'Failed to update.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { prisma } = await import('@/lib/prisma')
    await prisma.draft.deleteMany({ where: { id, userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/drafts/[id]]', err)
    return NextResponse.json({ error: err?.message || 'Failed to delete.' }, { status: 500 })
  }
}
