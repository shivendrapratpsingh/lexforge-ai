import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Edge-safe proxy (Next 16 renamed `middleware` -> `proxy`).
// Uses authConfig (no Prisma, no bcrypt) so it can run on the Edge runtime.
// Protects dashboard routes and redirects unauthenticated users to /login.
export const { auth: proxy } = NextAuth(authConfig)

export default proxy

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
