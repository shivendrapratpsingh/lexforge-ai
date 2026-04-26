// GET    /api/clients/[id]  — get single client + drafts + attachment list + payment summary
// PUT    /api/clients/[id]  — update client (including tags, photo)
// DELETE /api/clients/[id]  — delete client
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const { prisma } = await import('@/lib/prisma')
    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
      include: {
        drafts: {
          orderBy: { updatedAt: 'desc' },
          select: { id: true, title: true, documentType: true, status: true, caseStatus: true, court: true, language: true, updatedAt: true, createdAt: true },
        },
        attachments: {
          select: { id: true, name: true, label: true, docType: true, mimeType: true, size: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
        _count: { select: { drafts: true, attachments: true, payments: true } },
      },
    })

    if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })

    // Total paid
    const totalPaid = client.payments.reduce((s, p) => s + p.amount, 0)
    return NextResponse.json({ client, totalPaid })
  } catch (err) {
    console.error('[GET client]', err)
    return NextResponse.json({ error: 'Failed to fetch client.' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const existing = await prisma.client.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })

    // Validate Aadhaar if provided
    if (body.aadhaarNumber) {
      const clean = body.aadhaarNumber.replace(/\s|-/g, '')
      if (!/^\d{12}$/.test(clean)) return NextResponse.json({ error: 'Aadhaar must be exactly 12 digits.' }, { status: 400 })
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name:          body.name?.trim()                          || existing.name,
        fatherName:    'fatherName'    in body ? (body.fatherName?.trim()    || null) : existing.fatherName,
        age:           'age'           in body ? (body.age?.trim()           || null) : existing.age,
        gender:        'gender'        in body ? (body.gender?.trim()        || null) : existing.gender,
        phone:         'phone'         in body ? (body.phone?.trim()         || null) : existing.phone,
        email:         'email'         in body ? (body.email?.trim()         || null) : existing.email,
        address:       'address'       in body ? (body.address?.trim()       || null) : existing.address,
        city:          'city'          in body ? (body.city?.trim()          || null) : existing.city,
        district:      'district'      in body ? (body.district?.trim()      || null) : existing.district,
        state:         'state'         in body ? (body.state?.trim()         || null) : existing.state,
        pincode:       'pincode'       in body ? (body.pincode?.trim()       || null) : existing.pincode,
        aadhaarNumber: 'aadhaarNumber' in body ? (body.aadhaarNumber?.replace(/\s|-/g, '') || null) : existing.aadhaarNumber,
        tags:          'tags'          in body ? (body.tags?.trim()          || null) : existing.tags,
        notes:         'notes'         in body ? (body.notes?.trim()         || null) : existing.notes,
        photo:         'photo'         in body ? (body.photo                 || null) : existing.photo,
      },
    })

    return NextResponse.json({ client })
  } catch (err) {
    console.error('[PUT client]', err)
    return NextResponse.json({ error: 'Failed to update client.' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const { prisma } = await import('@/lib/prisma')
    const existing = await prisma.client.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })

    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE client]', err)
    return NextResponse.json({ error: 'Failed to delete client.' }, { status: 500 })
  }
}
