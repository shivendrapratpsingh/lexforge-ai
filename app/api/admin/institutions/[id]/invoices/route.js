// GET  /api/admin/institutions/[id]/invoices — everything raised so far
// POST /api/admin/institutions/[id]/invoices — raise a new one
//
// A college cannot pay against an email. It needs a numbered document to
// raise a purchase order against, and the number has to belong to an
// unbroken series.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { nextInvoiceNumber, computeTotals, TAX_PERCENT } from '@/lib/invoicing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAdmin(session)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { session }
}

export async function GET(_req, { params }) {
  const g = await guard(); if (g.error) return g.error
  try {
    const { id } = await params
    const { prisma } = await import('@/lib/prisma')
    const invoices = await prisma.invoice.findMany({
      where: { institutionId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ invoices, taxPercent: TAX_PERCENT })
  } catch (err) {
    console.error('[admin/invoices GET]', err)
    return NextResponse.json({ error: 'Could not load invoices.' }, { status: 500 })
  }
}

export async function POST(req, { params }) {
  const g = await guard(); if (g.error) return g.error
  try {
    const { id } = await params
    const b = await req.json().catch(() => ({}))

    const seats = Math.max(1, Math.round(Number(b.seats) || 0))
    const unitPaise = Math.max(0, Math.round(Number(b.unitRupees) * 100) || 0)
    const description = String(b.description || '').trim()

    if (!description) return NextResponse.json({ error: 'What is being charged for?' }, { status: 400 })
    if (!unitPaise) return NextResponse.json({ error: 'Set a price per seat.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const inst = await prisma.institution.findUnique({ where: { id } })
    if (!inst) return NextResponse.json({ error: 'Institution not found.' }, { status: 404 })

    const totals = computeTotals({ seats, unitPaise })

    // The number is taken at issue and never recomputed. Totals are
    // frozen here too: a price change next term must not rewrite an
    // invoice a college has already paid.
    const invoice = await prisma.invoice.create({
      data: {
        number: await nextInvoiceNumber(prisma),
        institutionId: id,
        // Without a GST registration this is a proforma invoice, which
        // is the correct document for an unregistered seller and is
        // still enough for a college to raise a purchase order against.
        status: TAX_PERCENT > 0 ? 'issued' : 'proforma',
        description: description.slice(0, 300),
        seats,
        unitPaise,
        amountPaise: totals.amountPaise,
        taxPercent: totals.taxPercent,
        taxPaise: totals.taxPaise,
        totalPaise: totals.totalPaise,
        periodStart: b.periodStart ? new Date(b.periodStart) : null,
        periodEnd: b.periodEnd ? new Date(b.periodEnd) : null,
        issuedAt: new Date(),
        notes: String(b.notes || '').trim().slice(0, 500) || null,
      },
    })

    console.log(`[invoice] ${invoice.number} raised against ${inst.name} for ₹${invoice.totalPaise / 100}`)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    console.error('[admin/invoices POST]', err)
    return NextResponse.json({ error: 'Could not raise the invoice.' }, { status: 500 })
  }
}

// PATCH — mark paid or cancelled. A cancelled invoice keeps its number:
// reusing it would break the series, which is the one thing the series
// exists to prevent.
export async function PATCH(req, { params }) {
  const g = await guard(); if (g.error) return g.error
  try {
    const { id } = await params
    const b = await req.json().catch(() => ({}))
    if (!b.invoiceId) return NextResponse.json({ error: 'Which invoice?' }, { status: 400 })
    if (!['proforma', 'issued', 'paid', 'cancelled'].includes(b.status)) {
      return NextResponse.json({ error: 'Unknown status.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const invoice = await prisma.invoice.update({
      where: { id: b.invoiceId },
      data: {
        status: b.status,
        paidAt: b.status === 'paid' ? new Date() : null,
      },
    })
    if (invoice.institutionId !== id) {
      return NextResponse.json({ error: 'That invoice belongs to another institution.' }, { status: 400 })
    }
    return NextResponse.json({ invoice })
  } catch (err) {
    console.error('[admin/invoices PATCH]', err)
    return NextResponse.json({ error: 'Could not update the invoice.' }, { status: 500 })
  }
}
