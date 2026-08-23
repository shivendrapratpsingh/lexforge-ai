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
      if (params.user) {
        token.tierAt = Date.now()
        token.sv = params.user.sessionVersion
        token.mustOnboard = params.user.mustOnboard
      }

      if (token?.id && Date.now() - (token.tierAt || 0) > TIER_TTL_MS) {
        try {
          const { prisma } = await import('./prisma.js')
          const fresh = await prisma.user.findUnique({
            where: { id: token.id },
            select: { tier: true, suspended: true, sessionVersion: true, mustOnboard: true },
          })
          if (fresh) {
            token.tier = fresh.tier || 'free'
            token.suspended = !!fresh.suspended
            token.mustOnboard = !!fresh.mustOnboard

            // Somebody signed in elsewhere. Returning null here ends
            // this session — the middleware sends them to /login, which
            // reads supersededAt and explains rather than looking like
            // a random sign-out.
            if (typeof token.sv === 'number' && fresh.sessionVersion > token.sv) {
              console.log(`[Auth] session for ${token.id} superseded by a newer login`)
              return null
            }
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

          // ── One device at a time ──────────────────────────────
          // JWTs are stateless: a token stays valid wherever it is
          // copied, and there is no list of live sessions to revoke. So
          // the server keeps a counter. Signing in bumps it, and every
          // token issued earlier stops matching on its next check —
          // which is how the laptop finds out the phone signed in.
          //
          // supersededAt is what lets the displaced device say why,
          // instead of dropping the user at a login page with no
          // explanation.
          const bumped = await prisma.user.update({
            where: { id: user.id },
            data: {
              sessionVersion: { increment: 1 },
              ...(user.sessionVersion > 0 ? { supersededAt: new Date() } : {}),
            },
            select: { sessionVersion: true },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier || 'free',
            suspended: !!user.suspended,
            sessionVersion: bumped.sessionVersion,
            mustOnboard: !!user.mustOnboard,
          }
        } catch (err) {
          console.error('[Auth] authorize error:', err?.message)
          return null
        }
      },
    }),
  ],
})
