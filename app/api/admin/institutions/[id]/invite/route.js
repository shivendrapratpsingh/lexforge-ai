// POST /api/admin/institutions/[id]/invite
//
// Paste a class list; everyone on it gets access when they sign up.
//
// This exists because many Indian law colleges do not issue student email
// addresses at all — those students sign up with Gmail, and matching on
// domain alone would exclude exactly the people least able to pay for a
// legal database.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const batch = typeof body.batch === 'string' && body.batch.trim() ? body.batch.trim() : null

    // Accepts anything: commas, newlines, a pasted spreadsheet column,
    // "Name <email>" pairs. An admin pasting a class list off a PDF
    // should not have to clean it up first.
    const matches = String(body.emails || '').match(EMAIL_RE) || []
    const found = [...new Set(matches.map(e => e.toLowerCase()))]

    if (!found.length) {
      return NextResponse.json({ error: 'No email addresses found in that text.' }, { status: 400 })
    }
    if (found.length > 2000) {
      return NextResponse.json({ error: 'Too many at once — paste up to 2000 addresses.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const inst = await prisma.institution.findUnique({ where: { id } })
    if (!inst) return NextResponse.json({ error: 'Institution not found.' }, { status: 404 })

    // skipDuplicates: re-pasting a list that overlaps last term's is the
    // normal case, not an error worth failing the whole upload over.
    const created = await prisma.institutionInvite.createMany({
      data: found.map(email => ({ institutionId: id, email, batch })),
      skipDuplicates: true,
    })

    // Anyone on the list who already has an account is linked right away,
    // rather than being made to sign up again.
    const linked = await prisma.user.updateMany({
      where: { email: { in: found }, institutionId: null },
      data: { institutionId: id, ...(batch ? { batch } : {}) },
    })
    if (linked.count) {
      await prisma.institutionInvite.updateMany({
        where: { institutionId: id, email: { in: found }, claimedAt: null },
        data: { claimedAt: new Date() },
      })
    }

    return NextResponse.json({
      ok: true,
      found: found.length,
      invited: created.count,
      alreadyInvited: found.length - created.count,
      linkedExistingUsers: linked.count,
    })
  } catch (err) {
    console.error('[admin/institutions/invite]', err)
    return NextResponse.json({ error: 'Could not create invites.' }, { status: 500 })
  }
}
