// POST /api/account/onboarding — a student's first login, finished.
//
// An account created from a college's spreadsheet arrives with two
// problems: the password is one the college chose and can read, and
// there is no security question, which in this app is the only way back
// into a forgotten account.
//
// Both are fixed here, before the student reaches anything else. After
// this the spreadsheet password no longer opens the account.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import {
  SECURITY_QUESTIONS, DEFAULT_SECURITY_QUESTION, isValidAnswer, MIN_ANSWER_LENGTH,
} from '@/lib/security-question'
import { hashAnswer } from '@/lib/security-question-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const b = await req.json().catch(() => ({}))
    const name = String(b.name || '').trim()
    const password = String(b.password || '')
    const securityAnswer = String(b.securityAnswer || '')

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please give your name as it should appear on your documents.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Choose a password of at least 8 characters.' }, { status: 400 })
    }
    if (!isValidAnswer(securityAnswer)) {
      return NextResponse.json({
        error: `Answer the security question — at least ${MIN_ANSWER_LENGTH} characters. It is the only way back if you forget your password.`,
      }, { status: 400 })
    }

    const question = SECURITY_QUESTIONS.includes(b.securityQuestion)
      ? b.securityQuestion
      : DEFAULT_SECURITY_QUESTION

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    // Refusing to let them keep the college's password is the entire
    // point — otherwise the one in the spreadsheet still works.
    if (user.password && await bcrypt.compare(password, user.password)) {
      return NextResponse.json({
        error: 'Choose a different password from the one your college gave you. That one is written in a spreadsheet other people can read.',
      }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        password: await bcrypt.hash(password, 12),
        securityQuestion: question,
        securityAnswerHash: await hashAnswer(securityAnswer),
        securityAttempts: 0,
        securityLockedUntil: null,
        passwordChangedAt: new Date(),
        mustOnboard: false,
        // Their own password now, so every other session goes. If the
        // college's list leaked and somebody else signed in first, this
        // is what pushes them out.
        sessionVersion: { increment: 1 },
      },
    })

    console.log(`[onboarding] ${session.user.email} set their own password`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/onboarding]', err)
    return NextResponse.json({ error: 'Could not save that. Please try again.' }, { status: 500 })
  }
}
