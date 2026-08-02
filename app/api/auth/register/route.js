import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  DEFAULT_SECURITY_QUESTION,
  SECURITY_QUESTIONS,
  isValidAnswer,
  MIN_ANSWER_LENGTH,
} from '@/lib/security-question'
import { hashAnswer } from '@/lib/security-question-server'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

    const { name, email, password, securityAnswer, securityQuestion } = body

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })

    // Required at sign-up: it is the only way back into the account, so an
    // account created without one would be unrecoverable except by an admin.
    if (!isValidAnswer(securityAnswer)) {
      return NextResponse.json(
        { error: `Please answer the security question — at least ${MIN_ANSWER_LENGTH} characters. You will need it if you ever forget your password.` },
        { status: 400 }
      )
    }
    const question = SECURITY_QUESTIONS.includes(securityQuestion)
      ? securityQuestion
      : DEFAULT_SECURITY_QUESTION

    // Check env vars
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('user:password@host')) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured. Fill in .env.local with your Neon database URL.' },
        { status: 503 }
      )
    }

    // Import Prisma lazily so missing generated client gives a clear error
    let prisma
    try {
      const mod = await import('@/lib/prisma')
      prisma = mod.prisma
    } catch (e) {
      return NextResponse.json(
        { error: 'Prisma client not generated. Run: npx prisma generate' },
        { status: 503 }
      )
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing)
      return NextResponse.json({ error: 'Email already registered. Please sign in.' }, { status: 409 })

    // Hash and create user. The security answer is hashed with the same
    // cost as the password — it can set a new password, so it is worth
    // exactly as much to an attacker.
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashed,
        securityQuestion: question,
        securityAnswerHash: await hashAnswer(securityAnswer),
        passwordChangedAt: new Date(),
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    // Show actual error in development for debugging
    const message = process.env.NODE_ENV === 'development'
      ? `Registration failed: ${err?.message || err}`
      : 'Registration failed. Check server logs.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
