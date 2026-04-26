// GET  /api/clients?q=&district=&city=&tag=&sort=name|recent|docs — list / search / filter
// POST /api/clients                                               — create single client
// POST /api/clients?bulk=1                                        — bulk import (JSON array from CSV)
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q        = searchParams.get('q')?.trim()        || ''
    const district = searchParams.get('district')?.trim() || ''
    const city     = searchParams.get('city')?.trim()     || ''
    const tag      = searchParams.get('tag')?.trim()      || ''
    const sort     = searchParams.get('sort')             || 'recent'   // name | recent | docs
    const limit    = parseInt(searchParams.get('limit'))  || 100

    const { prisma } = await import('@/lib/prisma')

    const where = {
      userId: session.user.id,
      ...(q && {
        OR: [
          { name:          { contains: q, mode: 'insensitive' } },
          { aadhaarNumber: { contains: q } },
          { phone:         { contains: q } },
          { fatherName:    { contains: q, mode: 'insensitive' } },
          { city:          { contains: q, mode: 'insensitive' } },
          { district:      { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(district && { district: { contains: district, mode: 'insensitive' } }),
      ...(city     && { city:     { contains: city,     mode: 'insensitive' } }),
      ...(tag      && { tags:     { contains: tag,      mode: 'insensitive' } }),
    }

    const orderBy = sort === 'name'   ? { name: 'asc' }
                  : sort === 'docs'   ? { drafts: { _count: 'desc' } }
                  :                    { updatedAt: 'desc' }   // recent

    const clients = await prisma.client.findMany({
      where,
      orderBy,
      take: limit,
      include: { _count: { select: { drafts: true, attachments: true, payments: true } } },
    })

    return NextResponse.json({ clients })
  } catch (err) {
    console.error('[GET /api/clients]', err)
    return NextResponse.json({ error: 'Failed to fetch clients.' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const bulk = searchParams.get('bulk') === '1'

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')

    // ── Bulk import ──────────────────────────────────────────────
    if (bulk) {
      if (!Array.isArray(body)) return NextResponse.json({ error: 'Expected array for bulk import' }, { status: 400 })
      const results = { created: 0, skipped: 0, errors: [] }
      for (const row of body) {
        if (!row?.name?.trim()) { results.skipped++; continue }
        try {
          // Duplicate check by name + phone
          const existing = await prisma.client.findFirst({
            where: {
              userId: session.user.id,
              name: { equals: row.name.trim(), mode: 'insensitive' },
              ...(row.phone ? { phone: row.phone.trim() } : {}),
            },
          })
          if (existing) { results.skipped++; continue }

          await prisma.client.create({
            data: {
              userId:        session.user.id,
              name:          row.name.trim(),
              fatherName:    row.fatherName?.trim()    || null,
              age:           row.age?.toString().trim()|| null,
              gender:        row.gender?.trim()        || null,
              phone:         row.phone?.trim()         || null,
              email:         row.email?.trim()         || null,
              address:       row.address?.trim()       || null,
              city:          row.city?.trim()          || null,
              district:      row.district?.trim()      || null,
              state:         row.state?.trim()         || 'Uttar Pradesh',
              pincode:       row.pincode?.trim()       || null,
              aadhaarNumber: row.aadhaarNumber?.replace(/\s/g, '') || null,
              tags:          row.tags?.trim()          || null,
              notes:         row.notes?.trim()         || null,
            },
          })
          results.created++
        } catch (e) {
          results.errors.push(row.name)
        }
      }
      return NextResponse.json(results, { status: 201 })
    }

    // ── Single create ────────────────────────────────────────────
    if (!body?.name?.trim()) return NextResponse.json({ error: 'Client name is required.' }, { status: 400 })

    // Validate Aadhaar format
    if (body.aadhaarNumber) {
      const clean = body.aadhaarNumber.replace(/\s|-/g, '')
      if (!/^\d{12}$/.test(clean)) return NextResponse.json({ error: 'Aadhaar must be exactly 12 digits.' }, { status: 400 })
    }

    // Duplicate check
    const dup = await prisma.client.findFirst({
      where: {
        userId: session.user.id,
        name:   { equals: body.name.trim(), mode: 'insensitive' },
        ...(body.phone ? { phone: body.phone.trim() } : {}),
      },
    })
    if (dup) return NextResponse.json({ error: 'A client with this name and phone already exists.', duplicate: true, existingId: dup.id }, { status: 409 })

    const client = await prisma.client.create({
      data: {
        userId:        session.user.id,
        name:          body.name.trim(),
        fatherName:    body.fatherName?.trim()              || null,
        age:           body.age?.trim()                     || null,
        gender:        body.gender?.trim()                  || null,
        phone:         body.phone?.trim()                   || null,
        email:         body.email?.trim()                   || null,
        address:       body.address?.trim()                 || null,
        city:          body.city?.trim()                    || null,
        district:      body.district?.trim()                || null,
        state:         body.state?.trim()                   || 'Uttar Pradesh',
        pincode:       body.pincode?.trim()                 || null,
        aadhaarNumber: body.aadhaarNumber?.replace(/\s|-/g, '') || null,
        tags:          body.tags?.trim()                    || null,
        notes:         body.notes?.trim()                   || null,
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clients]', err)
    return NextResponse.json({ error: 'Failed to create client.' }, { status: 500 })
  }
}
