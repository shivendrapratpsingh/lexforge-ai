import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Edge-safe middleware — uses authConfig (no Prisma, no bcrypt)
// Protects dashboard routes and redirects unauthenticated users to /login
export const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
