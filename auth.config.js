import Credentials from 'next-auth/providers/credentials'

// DEV FALLBACK: if AUTH_SECRET is missing, use this so the app never crashes
// Replace with a real secret in .env.local for production
const DEV_SECRET = 'lexforge-dev-secret-v1-change-before-deployment-!!'

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
      const isAuthPage =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register')
      const isProtected = ['/dashboard', '/drafts', '/new-draft', '/research'].some(
        p => nextUrl.pathname.startsWith(p)
      )
      if (isAuthPage && isLoggedIn)
        return Response.redirect(new URL('/dashboard', nextUrl))
      if (isProtected && !isLoggedIn)
        return Response.redirect(new URL('/login', nextUrl))
      return true
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id
      return session
    },
  },
}
