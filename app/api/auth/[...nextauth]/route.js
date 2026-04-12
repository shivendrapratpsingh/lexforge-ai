import { handlers } from '@/lib/auth'

// NextAuth v5 App Router handler
// GET  — handles /api/auth/session, /api/auth/csrf, /api/auth/providers, etc.
// POST — handles /api/auth/signin, /api/auth/signout, /api/auth/callback
export const { GET, POST } = handlers
