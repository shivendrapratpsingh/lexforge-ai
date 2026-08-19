// PATCH /api/college/batch — a co-ordinator sets which year a student is in.
//
// The one thing faculty need to change and nobody else can: students
// join by code with no batch attached, and "is the third year using it"
// is unanswerable until somebody says who the third year is.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, institutionId: true },
    })
    if (me?.role !== 'faculty' || !me.institutionId) {
      return NextResponse.json({ error: 'Faculty co-ordinators only.' }, { status: 403 })
    }

    const b = await req.json().catch(() => ({}))
    const batch = String(b.batch || '').trim().slice(0, 60) || null
    const userIds = (Array.isArray(b.userIds) ? b.userIds : []).map(String).slice(0, 500)
    if (!userIds.length) return NextResponse.json({ error: 'No students selected.' }, { status: 400 })

    // Scoped to their own college in the query itself, so a co-ordinator
    // cannot reach a student at another college by guessing an id.
    const r = await prisma.user.updateMany({
      where: { id: { in: userIds }, institutionId: me.institutionId },
      data: { batch },
    })

    return NextResponse.json({ ok: true, updated: r.count })
  } catch (err) {
    console.error('[college/batch]', err)
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 })
  }
}
