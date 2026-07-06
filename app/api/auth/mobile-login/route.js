// POST /api/auth/mobile-login
// Mobile-only credential login. Web uses next-auth's cookie session directly;
// React Native can't manage that cookie jar, so this validates the same way
// lib/auth.js's authorize() does and hands back a signed token the mobile app
// can store and send as `Authorization: Bearer <token>` on every request.
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signMobileToken } from '@/lib/mobile-auth'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    const email = body?.email?.toLowerCase()?.trim()
    const password = body?.password

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.password)
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

    if (user.suspended)
      return NextResponse.json({ error: 'Account suspended. Contact the administrator.' }, { status: 403 })

    const valid = await bcrypt.compare(String(password), user.password)
    if (!valid)
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

    const token = await signMobileToken(user)
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier || 'free' },
    })
  } catch (err) {
    console.error('[POST /api/auth/mobile-login]', err)
    return NextResponse.json({ error: 'Sign in failed. Please try again.' }, { status: 500 })
  }
}
