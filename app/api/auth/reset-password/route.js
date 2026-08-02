// POST /api/auth/reset-password
// Step two of recovery: verify the security answer and set the new
// password. There is no token — nothing is stored that could be stolen
// and replayed, which is the point of moving off emailed reset links.
//
// A nickname is a low-entropy secret, so the lockout below is what makes
// it safe to use at all: five wrong answers and the account stops
// accepting attempts for thirty minutes.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  lockoutRemaining,
  MAX_ATTEMPTS,
  LOCKOUT_MINUTES,
} from '@/lib/security-question'
import { verifyAnswer } from '@/lib/security-question-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// One message for "no such account", "no security answer set" and "wrong
// answer" alike. Distinguishing them would tell an attacker which emails
// are registered and which are worth guessing at.
const REJECT = 'That answer does not match our records.'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    const { email, answer, password } = body || {}

    if (!email || !answer || !password) {
      return NextResponse.json({ error: 'Email, answer and new password are all required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        securityAnswerHash: true,
        securityAttempts: true,
        securityLockedUntil: true,
      },
    })

    if (!user || !user.securityAnswerHash) {
      return NextResponse.json({ error: REJECT }, { status: 400 })
    }

    const locked = lockoutRemaining(user.securityLockedUntil)
    if (locked > 0) {
      return NextResponse.json({
        error: `Too many incorrect answers. Try again in ${locked} minute${locked === 1 ? '' : 's'}, or contact support.`,
        lockedMinutes: locked,
      }, { status: 429 })
    }

    const ok = await verifyAnswer(answer, user.securityAnswerHash)

    if (!ok) {
      const attempts = (user.securityAttempts || 0) + 1
      const hitLimit = attempts >= MAX_ATTEMPTS
      await prisma.user.update({
        where: { id: user.id },
        data: {
          securityAttempts: hitLimit ? 0 : attempts,
          securityLockedUntil: hitLimit
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : null,
        },
      })
      return NextResponse.json({
        error: hitLimit
          ? `Too many incorrect answers. This account is locked for ${LOCKOUT_MINUTES} minutes.`
          : REJECT,
        attemptsLeft: hitLimit ? 0 : MAX_ATTEMPTS - attempts,
      }, { status: hitLimit ? 429 : 400 })
    }

    // Correct: set the password and clear the attempt counter.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 12),
        securityAttempts: 0,
        securityLockedUntil: null,
        passwordChangedAt: new Date(),
      },
    })

    // Tell the account holder out of band. If someone guessed the answer,
    // this is the only signal the real owner gets. Never blocks the reset.
    const { notifyQuietly, passwordChangedEmail } = await import('@/lib/mail')
    notifyQuietly({ to: user.email, ...passwordChangedEmail({ name: user.name?.split(' ')[0] }) })
      .catch(() => {})

    return NextResponse.json({ ok: true, message: 'Password updated. You can now sign in.' })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
