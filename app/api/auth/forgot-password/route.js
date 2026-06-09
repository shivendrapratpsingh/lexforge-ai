// POST /api/auth/forgot-password
// Generates a password-reset token and returns it (or logs it for admin to forward).
//
// In a production system this should send an email via Resend / Nodemailer.
// Until an email service is configured, the token is returned in the JSON
// response so the admin can copy-paste the reset link to the user manually.
// Set RESET_TOKEN_SECRET in env to enable production-safe HMAC tokens.

import { NextResponse } from 'next/server'
import { randomBytes, createHmac } from 'crypto'

export const runtime = 'nodejs'

function generateToken(email) {
  const raw = randomBytes(32).toString('hex')
  const secret = process.env.RESET_TOKEN_SECRET
  if (secret) {
    // HMAC-signed token — harder to brute-force
    const sig = createHmac('sha256', secret).update(`${email}:${raw}`).digest('hex')
    return `${raw}.${sig}`
  }
  return raw
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null)
    const email = body?.email?.toLowerCase()?.trim()
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return 200 — don't leak whether an email exists in the DB
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: 'If that email is registered, a reset link has been issued.',
      })
    }

    const token   = generateToken(email)
    const expiry  = new Date(Date.now() + 60 * 60 * 1000)  // 1 hour

    await prisma.user.update({
      where: { email },
      data:  { resetToken: token, resetTokenExpiry: expiry },
    })

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    // TODO: replace this console.log with an actual email send via Resend/Nodemailer
    // Example: await resend.emails.send({ to: email, subject: 'Reset your password', html: `<a href="${resetLink}">Reset password</a>` })
    console.log(`[forgot-password] Reset link for ${email}:\n${resetLink}`)

    const isProd = process.env.NODE_ENV === 'production'
    return NextResponse.json({
      ok: true,
      message: 'If that email is registered, a reset link has been issued.',
      // In dev expose the link so you can test without an email service.
      // In production this field is omitted — the user must receive an email.
      ...(isProd ? {} : { resetLink, note: 'DEV ONLY — this link is hidden in production.' }),
    })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
