// GET  /api/clients/[id]/attachments        — list attachments (no data field)
// POST /api/clients/[id]/attachments        — upload new attachment (base64)
// DELETE /api/clients/[id]/attachments?aid= — delete one attachment
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

async function ownsClient(userId, clientId) {
  const { prisma } = await import('@/lib/prisma')
  const c = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } })
  return c?.userId === userId
}

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await ownsClient(session.user.id, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { prisma } = await import('@/lib/prisma')
    const attachments = await prisma.clientAttachment.findMany({
      where: { clientId: id },
      select: { id: true, name: true, label: true, docType: true, mimeType: true, size: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ attachments })
  } catch (err) {
    console.error('[GET attachments]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await ownsClient(session.user.id, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json().catch(() => null)
    if (!body?.data || !body?.name) return NextResponse.json({ error: 'Missing file data or name' }, { status: 400 })

    // base64 size guard — ~5MB max (base64 ~1.37x raw)
    if (body.data.length > 7_000_000) return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 413 })

    const { prisma } = await import('@/lib/prisma')
    const attachment = await prisma.clientAttachment.create({
      data: {
        clientId: id,
        name:     body.name,
        label:    body.label    || null,
        docType:  body.docType  || 'other',
        mimeType: body.mimeType || 'application/octet-stream',
        size:     body.size     || null,
        data:     body.data,
      },
    })
    // Return without data field
    const { data: _omit, ...safe } = attachment
    return NextResponse.json({ attachment: safe }, { status: 201 })
  } catch (err) {
    console.error('[POST attachments]', err)
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await ownsClient(session.user.id, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const aid = searchParams.get('aid')
    if (!aid) return NextResponse.json({ error: 'Missing attachment id' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    await prisma.clientAttachment.deleteMany({ where: { id: aid, clientId: id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE attachment]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// GET single attachment (with data for download)
// /api/clients/[id]/attachments?aid=xxx&download=1
export async function PATCH(req, { params }) {
  // Used to fetch single attachment data for download
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await ownsClient(session.user.id, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const { prisma } = await import('@/lib/prisma')
    const att = await prisma.clientAttachment.findFirst({ where: { id: body.aid, clientId: id } })
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ attachment: att })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
