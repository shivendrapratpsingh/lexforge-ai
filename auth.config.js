import Credentials from 'next-auth/providers/credentials'

// In production AUTH_SECRET MUST be set — crash fast if not.
if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET env var is not set. Set it in your Vercel environment variables before deploying.')
}

const DEV_SECRET = 'lexforge-dev-secret-v1-change-before-deployment-!!'

// The single platform admin. MUST match ADMIN_EMAIL in lib/admin.js. This is
// hard-coded (with an env override) so the Edge middleware recognises the
// admin even when the ADMIN_EMAIL environment variable is not set on the
// deployment — otherwise /admin would wrongly bounce the admin to /dashboard.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'pratapsinghshivendra21@gmail.com').toLowerCase()

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? DEV_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize() is intentionally null here — the real one is in lib/auth.js
      // This config is only used by middleware.js (Edge runtime)
      async authorize() { return null },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const email = (auth?.user?.email || '').toLowerCase()
      const isAdminUser = !!email && email === ADMIN_EMAIL

      const isAuthPage =
        nextUrl.pathname.startsWith('/login')            ||
        nextUrl.pathname.startsWith('/register')         ||
        nextUrl.pathname.startsWith('/forgot-password')  ||
        nextUrl.pathname.startsWith('/reset-password')
      const isProtected = ['/dashboard', '/drafts', '/new-draft', '/research', '/clients', '/court-dates', '/tools', '/admin', '/upgrade', '/study', '/future-lawyer'].some(
        p => nextUrl.pathname.startsWith(p)
      )
      const isAdminRoute = nextUrl.pathname.startsWith('/admin')

      if (isAuthPage && isLoggedIn)
        return Response.redirect(new URL('/dashboard', nextUrl))
      if (isProtected && !isLoggedIn)
        return Response.redirect(new URL('/login', nextUrl))
      // Admin routes: bounce non-admins. The /admin page ALSO guards itself
      // server-side (lib/admin.isAdmin), so this is defence-in-depth.
      if (isAdminRoute && isLoggedIn && !isAdminUser)
        return Response.redirect(new URL('/dashboard', nextUrl))
      // NOTE: Pro-route gating is deliberately NOT done here. The Edge
      // middleware cannot read the database, so it cannot know whether Pro
      // enforcement is off (the default — everyone gets Pro) or whether the
      // user has an active promo. The dashboard layout already computes real
      // Pro access via hasProAccess() and points each nav link at /upgrade
      // when appropriate, so a DB-blind gate here only produced false
      // /upgrade redirects for legitimately-Pro users.
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tier = user.tier || 'free'
        token.suspended = !!user.suspended
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id
      if (token?.tier) session.user.tier = token.tier
      if (typeof token?.suspended === 'boolean') session.user.suspended = token.suspended
      return session
    },
  },
}
