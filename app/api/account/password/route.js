// POST /api/account/password — change your own password.
//
// The current password is required even though the caller is already
// signed in. That is the point: it stops someone who walks up to an
// unlocked laptop, or who has stolen a session token, from locking the
// real owner out of their own account.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, newPassword } = await req.json().catch(() => ({}))

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both your current and new password are required.' }, { status: 400 })
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }
    if (String(newPassword) === String(currentPassword)) {
      return NextResponse.json({ error: 'The new password is the same as your current one.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, password: true },
    })
    if (!user?.password) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    if (!(await bcrypt.compare(String(currentPassword), user.password))) {
      return NextResponse.json({ error: 'Your current password is not correct.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(String(newPassword), 12),
        passwordChangedAt: new Date(),
      },
    })

    const { notifyQuietly, passwordChangedEmail } = await import('@/lib/mail')
    notifyQuietly({ to: user.email, ...passwordChangedEmail({ name: user.name?.split(' ')[0] }) })
      .catch(() => {})

    return NextResponse.json({ ok: true, message: 'Password changed.' })
  } catch (err) {
    console.error('[POST /api/account/password]', err)
    return NextResponse.json({ error: 'Could not change your password.' }, { status: 500 })
  }
}
