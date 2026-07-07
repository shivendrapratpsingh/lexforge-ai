import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

// Edge-safe proxy (Next 16 renamed `middleware` -> `proxy`).
// Uses authConfig (no Prisma, no bcrypt) so it can run on the Edge runtime.
// Protects dashboard routes and redirects unauthenticated users to /login.
const { auth: pageAuthProxy } = NextAuth(authConfig)

// Lets the mobile app authenticate with a plain `Authorization: Bearer <token>`
// header instead of a cookie jar (which React Native's fetch doesn't manage
// the way a browser does). The token is minted by /api/auth/mobile-login using
// the exact same encrypted-JWT format next-auth puts in its session cookie
// (see lib/mobile-auth.js), so translating it into that cookie here means every
// existing `auth()` call in app/api/** keeps working unmodified for mobile too.
function bearerToCookie(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.next()

  const cookieName = req.nextUrl.protocol === 'https:'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'

  const existingCookie = req.headers.get('cookie') || ''
  if (existingCookie.includes(`${cookieName}=`)) return NextResponse.next() // real browser session wins

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return NextResponse.next()

  const headers = new Headers(req.headers)
  headers.set('cookie', existingCookie ? `${existingCookie}; ${cookieName}=${token}` : `${cookieName}=${token}`)

  return NextResponse.next({ request: { headers } })
}

export default function proxy(req, ev) {
  if (req.nextUrl.pathname.startsWith('/api/')) return bearerToCookie(req)
  return pageAuthProxy(req, ev)
}

export const config = {
  matcher: [
    // Page routes (existing behavior): everything except Next.js internals/static assets.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // API routes: only for the Bearer-token translation above.
    '/api/:path*',
  ],
}
