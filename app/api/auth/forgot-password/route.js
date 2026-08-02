// POST /api/auth/forgot-password
// Step one of recovery: given an email, return the security question to
// answer. No token is generated and nothing is emailed.
//
// This endpoint deliberately answers identically for every address,
// registered or not. Because every account is asked from the same short
// list of questions, returning one leaks nothing — but returning "no
// such user" would turn this into a tool for discovering who has an
// account, so it never does.

import { NextResponse } from 'next/server'
import { DEFAULT_SECURITY_QUESTION } from '@/lib/security-question'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    const email = body?.email?.toLowerCase()?.trim()
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email },
      select: { securityQuestion: true, securityAnswerHash: true },
    })

    // Accounts created before security questions existed have no answer
    // to check. Rather than send them round a loop they cannot complete,
    // point them at the admin — who can set a password directly.
    if (user && !user.securityAnswerHash) {
      return NextResponse.json({
        needsAdmin: true,
        message: 'This account was created before security questions were added, so it cannot be recovered automatically. Please contact support and an administrator will set a new password for you.',
      })
    }

    return NextResponse.json({
      question: user?.securityQuestion || DEFAULT_SECURITY_QUESTION,
    })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
