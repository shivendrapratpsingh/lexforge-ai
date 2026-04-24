import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin, ADMIN_EMAIL } from '@/lib/admin'

export async function PATCH(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const data = {}

    if (body.tier === 'free' || body.tier === 'pro') data.tier = body.tier
    if (typeof body.suspended === 'boolean') data.suspended = body.suspended

    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')

    // Safety: never let admin accidentally suspend/downgrade themselves
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } })
    if (!target)
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (data.suspended === true)
        return NextResponse.json({ error: 'Cannot suspend the admin account.' }, { status: 400 })
      if (data.tier === 'free')
        return NextResponse.json({ error: 'Cannot downgrade the admin account.' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, tier: true, suspended: true },
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[PATCH /api/admin/users/[id]]', err)
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const { prisma } = await import('@/lib/prisma')

    // Safety: admin cannot delete themselves
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true } })
    if (!target)
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
      return NextResponse.json({ error: 'Cannot delete the admin account.' }, { status: 400 })

    // Prisma will cascade-delete drafts, clients, court dates via schema.
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/users/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 })
  }
}
