import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const upcoming  = searchParams.get('upcoming') === '1'
    const completed = searchParams.get('completed') === '1'
    const limit     = parseInt(searchParams.get('limit') || '50')

    const { prisma } = await import('@/lib/prisma')

    const where = { userId: session.user.id }
    if (upcoming)  { where.date = { gte: new Date() }; where.completed = false }
    if (completed) { where.completed = true }

    const courtDates = await prisma.courtDate.findMany({
      where,
      orderBy: { date: 'asc' },
      take: limit,
      include: {
        draft:  { select: { id: true, title: true, documentType: true } },
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ courtDates })
  } catch (err) {
    console.error('[GET /api/court-dates]', err)
    return NextResponse.json({ error: 'Failed to fetch court dates.' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const { title, date, type = 'hearing', caseNumber, draftId, clientId, notes } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    if (!date)          return NextResponse.json({ error: 'Date is required.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')

    const courtDate = await prisma.courtDate.create({
      data: {
        userId:     session.user.id,
        title:      title.trim(),
        date:       new Date(date),
        type,
        caseNumber: caseNumber || null,
        draftId:    draftId    || null,
        clientId:   clientId   || null,
        notes:      notes      || null,
      },
      include: {
        draft:  { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ courtDate }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/court-dates]', err)
    return NextResponse.json({ error: 'Failed to create court date.' }, { status: 500 })
  }
}
