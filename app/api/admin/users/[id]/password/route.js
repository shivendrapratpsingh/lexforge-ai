// POST /api/admin/users/[id]/password
// Admin override: set a new password for any account.
//
// This is the fallback for everything the security question cannot
// cover — accounts created before the question existed, users who have
// genuinely forgotten their answer, and anyone locked out by repeated
// failures. Without it those accounts would be unrecoverable, since
// there is no longer an emailed reset link.
//
// The generated password is returned ONCE, in this response, for the
// admin to pass on. It is never stored in the clear and cannot be read
// back afterwards.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Ambiguous characters removed: this gets read aloud over a phone or
// copied out of a chat message, and 0/O and 1/l/I cause support calls.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generatePassword(length = 14) {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    // An admin may supply a password, or let one be generated.
    let password = typeof body.password === 'string' ? body.password.trim() : ''
    const generated = !password
    if (generated) password = generatePassword()
    else if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const target = await prisma.user.findUnique({ where: { id }, select: { email: true, name: true } })
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    await prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(password, 12),
        // Clearing the lockout is the point of the override: an admin
        // stepping in should not leave the user still locked out.
        securityAttempts: 0,
        securityLockedUntil: null,
        passwordChangedAt: new Date(),
      },
    })

    console.log(`[admin] Password reset for ${target.email} by ${session.user.email}`)

    const { notifyQuietly, passwordChangedEmail } = await import('@/lib/mail')
    notifyQuietly({
      to: target.email,
      ...passwordChangedEmail({ name: target.name?.split(' ')[0], byAdmin: true }),
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      email: target.email,
      password,
      generated,
      message: 'Password set. Give this to the user now — it cannot be shown again.',
    })
  } catch (err) {
    console.error('[POST /api/admin/users/[id]/password]', err)
    return NextResponse.json({ error: 'Failed to set password.' }, { status: 500 })
  }
}
