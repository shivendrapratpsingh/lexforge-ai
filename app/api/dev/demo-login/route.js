// ─────────────────────────────────────────────────────────────────
//  GET /api/dev/demo-login  —  DEVELOPMENT ONLY
//
//  One-click demo sign-in for local testing (browser, phone on LAN,
//  Android emulator). Ensures the demo account exists, mints the same
//  encrypted session JWT next-auth uses, sets it as the session cookie
//  and redirects to /dashboard.
//
//  Hard-disabled outside `next dev`: in production this route returns
//  404 unconditionally, so it can never become a login bypass on a
//  deployed instance.
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signMobileToken, sessionCookieName } from '@/lib/mobile-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEMO_EMAIL    = 'demo@lexforge.ai'
const DEMO_PASSWORD = 'Demo@12345'
const DEMO_NAME     = 'Demo Advocate'

export async function GET(req) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')

    // Ensure the demo account exists (idempotent).
    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: DEMO_NAME,
          email: DEMO_EMAIL,
          password: await bcrypt.hash(DEMO_PASSWORD, 12),
        },
      })
    }

    const token = await signMobileToken(user)

    // Build the redirect from the caller's Host header — req.url can
    // normalise to localhost, which is wrong for phones/emulators that
    // reach the dev server via a LAN IP or 10.0.2.2.
    const host  = req.headers.get('host') || 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const res = NextResponse.redirect(`${proto}://${host}/dashboard`)
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })
    return res
  } catch (err) {
    console.error('[dev/demo-login]', err)
    return NextResponse.json({ error: 'Demo login failed. Is the database reachable?' }, { status: 500 })
  }
}
