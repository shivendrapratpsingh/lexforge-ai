import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

// Edge-safe proxy (Next 16 renamed `middleware` -> `proxy`).
// Uses authConfig (no Prisma, no bcrypt) so it can run on the Edge runtime.
// Protects dashboard routes and redirects unauthenticated users to /login.
const { auth: pageAuthProxy } = NextAuth(authConfig)

// Lets the mobile app authenticate with a plain `Authorization: Bearer <token>`
// header instead of a cookie jar (which React Native's fetch doesn't manage
// the way a browser d