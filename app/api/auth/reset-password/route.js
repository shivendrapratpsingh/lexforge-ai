// POST /api/auth/reset-password
// Validates the reset token and sets the new password.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    const { token, email, password } = body || {}

    if (!token || !email || !password) {
      return NextResponse.json({ error: 'Token, email, and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, resetToken: true, resetTokenExpiry: true },
    })

    if (!user || user.resetToken !== token) {
      return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 })
    }
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data:  { password: hashed, resetToken: null, resetTokenExpiry: null },
    })

    return NextResponse.json({ ok: true, message: 'Password updated successfully. You can now sign in.' })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
