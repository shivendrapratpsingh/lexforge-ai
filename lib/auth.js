import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from '../auth.config'

// bcrypt is imported statically — safe for Node.js API routes
// Prisma is imported lazily — avoids crash if @prisma/client not yet generated

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
