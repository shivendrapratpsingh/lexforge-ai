import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

// ─────────────────────────────────────────────────────────────────
//  DELETE /api/admin/email-promos/[id]
//   Hard-delete a single per-email grant.
// ─────────────────────────────────────────────────────────────────
export async function DELETE(_req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    await prisma.emailPromo.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/email-promos/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete email promo.' }, { status: 500 })
  }
}
