// POST /api/account/security-question — set or change your recovery answer.
//
// This is the route that closes the gap for everyone who registered
// before security questions existed: they have no answer, so recovery
// currently has to go through an administrator. Setting one here puts
// them back in control of their own account.
//
// The current password is required. Without that check, anyone who got
// hold of a live session could quietly replace the recovery answer and
// then own the account permanently — the owner's own password would
// still work, so nothing would look wrong until the day they needed to
// recover, by which point the attacker holds the only way back in.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import {
  SECURITY_QUESTIONS,
  DEFAULT_SECURITY_QUESTION,
  isValidAnswer,
  MIN_ANSWER_LENGTH,
} from '@/lib/security-question'
import { hashAnswer } from '@/lib/security-question-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, question, answer } = await req.json().catch(() => ({}))

    if (!currentPassword) {
      return NextResponse.json({ error: 'Your current password is required to change this.' }, { status: 400 })
    }
    if (!isValidAnswer(answer)) {
      return NextResponse.json(
        { error: `Your answer must be at least ${MIN_ANSWER_LENGTH} characters.` },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })
    if (!user?.password) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    if (!(await bcrypt.compare(String(currentPassword), user.password))) {
      return NextResponse.json({ error: 'That password is not correct.' }, { status: 400 })
    }

    const chosen = SECURITY_QUESTIONS.includes(question) ? question : DEFAULT_SECURITY_QUESTION

    await prisma.user.update({
      where: { id: user.id },
      data: {
        securityQuestion: chosen,
        securityAnswerHash: await hashAnswer(answer),
        // Setting a new answer clears any lockout left over from someone
        // guessing at the old one.
        securityAttempts: 0,
        securityLockedUntil: null,
      },
    })

    return NextResponse.json({ ok: true, question: chosen, message: 'Security question saved.' })
  } catch (err) {
    console.error('[POST /api/account/security-question]', err)
    return NextResponse.json({ error: 'Could not save your security question.' }, { status: 500 })
  }
}
