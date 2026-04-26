// GET    /api/clients/[id]/payments      — list payments
// POST   /api/clients/[id]/payments      — add payment
// DELETE /api/clients/[id]/payments?pid= — delete payment
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
    const payments = await prisma.clientPayment.findMany({
      where: { clientId: id },
      orderBy: { date: 'desc' },
    })
    const total = payments.reduce((sum, p) => sum + p.amount, 0)
    return NextResponse.json({ payments, total })
  } catch (err) {
    console.error('[GET payments]', err)
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
    if (!body?.amount || !body?.date) return NextResponse.json({ error: 'Amount and date are required' }, { status: 400 })

    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const payment = await prisma.clientPayment.create({
      data: {
        clientId:    id,
        amount,
        date:        new Date(body.date),
        mode:        body.mode        || 'cash',
        description: body.description?.trim() || null,
      },
    })
    return NextResponse.json({ payment }, { status: 201 })
  } catch (err) {
    console.error('[POST payment]', err)
    return NextResponse.json({ error: 'Failed to add payment' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!await ownsClient(session.user.id, id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const pid = searchParams.get('pid')
    if (!pid) return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    await prisma.clientPayment.deleteMany({ where: { id: pid, clientId: id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE payment]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
