import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from '../auth.config'

// bcrypt is imported statically — safe for Node.js API routes
// Prisma is imported lazily — avoids crash if @prisma/client not yet generated

// How long a tier in the session token is trusted before it is re-read.
// Without this a user who has just paid stays on Free until they sign
// out and back in, and one whose term ended keeps Pro for the life of
// the token. Ten minutes is short enough that neither is noticeable and
// long enough that it is not a database read per request.
const TIER_TTL_MS = 10 * 60 * 1000

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Overridden only here, in the Node instance. The Edge config keeps
    // its database-free version, because middleware cannot reach Prisma.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params)
      if (params.user) token.tierAt = Date.now()

      if (token?.id && Date.now() - (token.tierAt || 0) > TIER_TTL_MS) {
        try {
          const { prisma } = await import('./prisma.js')
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: { tier: true, suspended: true },
          })
          if (fresh) {
            token.tier = fresh.tier || 'free'
            token.suspended = !!fresh.suspended
          }
        } catch (err) {
          // A database blip must not sign anyone out — the token keeps
          // what it had and tries again after the next interval.
          console.error('[Auth] tier refresh failed:', err?.message)
        }
        // Stamped either way, so a persistent outage cannot turn into a
        // database read on every single request.
        token.tierAt = Date.now()
      }
      return token
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { prisma } = await import('./prisma.js')

          const user = await prisma.user.findUnique({
            where: { email: String(credentials.email).toLowerCase() },
          })
          if (!user?.password) return null

          // Block suspended users
          if (user.suspended) {
            const err = new Error('Account suspended. Contact the administrator.')
            err.code = 'ACCOUNT_SUSPENDED'
            throw err
          }

          const valid = await bcrypt.compare(String(credentials.password), user.password)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier || 'free',
            suspended: !!user.suspended,
          }
        } catch (err) {
          console.error('[Auth] authorize error:', err?.message)
          return null
        }
      },
    }),
  ],
})
