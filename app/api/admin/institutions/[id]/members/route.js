// PATCH /api/admin/institutions/[id]/members — set a member's role or batch.
//
// Marking somebody faculty gives them the roster of everyone at their
// college, so it is a platform-admin action taken after confirming with
// the college who the co-ordinator is — never something a user can
// claim for themselves.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const b = await req.json().catch(() => ({}))

    const data = {}
    if (['student', 'faculty'].includes(b.role)) data.role = b.role
    if (b.batch !== undefined) data.batch = String(b.batch || '').trim().slice(0, 60) || null
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')

    // Located by email, because that is what an admin has in front of
    // them, and scoped to this institution in the query so a typo cannot
    // promote somebody at another college.
    const where = b.userId
      ? { id: String(b.userId), institutionId: id }
      : { email: String(b.email || '').toLowerCase(), institutionId: id }

    const r = await prisma.user.updateMany({ where, data })
    if (!r.count) {
      return NextResponse.json({ error: 'No member of this institution matches that.' }, { status: 404 })
    }

    console.log(`[institutions] ${b.email || b.userId} → ${JSON.stringify(data)}`)
    return NextResponse.json({ ok: true, updated: r.count })
  } catch (err) {
    console.error('[admin/institutions/members]', err)
    return NextResponse.json({ error: 'Could not update the member.' }, { status: 500 })
  }
}
