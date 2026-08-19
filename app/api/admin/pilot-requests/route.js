// GET   /api/admin/pilot-requests — colleges that have asked to be set up
// PATCH /api/admin/pilot-requests — move one along, or note something on it
//
// A form that posts into a void is worse than no form: the Principal who
// filled it in is waiting for a reply nobody knows they owe.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function guard() {
  const session = await auth()
  if (!session?.user?.id) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isAdmin(session)) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const g = await guard(); if (g.error) return g.error
  try {
    const { prisma } = await import('@/lib/prisma')
    const requests = await prisma.pilotRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    })
    return NextResponse.json({
      requests,
      // The count that matters: somebody is waiting on a reply.
      waiting: requests.filter(r => r.status === 'new').length,
    })
  } catch (err) {
    console.error('[admin/pilot-requests GET]', err)
    return NextResponse.json({ error: 'Could not load requests.' }, { status: 500 })
  }
}

export async function PATCH(req) {
  const g = await guard(); if (g.error) return g.error
  try {
    const b = await req.json().catch(() => ({}))
    if (!b.id) return NextResponse.json({ error: 'Which request?' }, { status: 400 })

    const data = {}
    if (['new', 'contacted', 'converted', 'declined'].includes(b.status)) data.status = b.status
    if (typeof b.notes === 'string') data.notes = b.notes || null
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const request = await prisma.pilotRequest.update({ where: { id: b.id }, data })
    return NextResponse.json({ request })
  } catch (err) {
    console.error('[admin/pilot-requests PATCH]', err)
    return NextResponse.json({ error: 'Could not update the request.' }, { status: 500 })
  }
}
