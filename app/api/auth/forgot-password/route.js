// POST /api/auth/forgot-password
// Issues a password-reset token and emails the link to the user.
//
// This route previously generated the token, logged the link to the
// server console, and told the user "a reset link has been issued" —
// so every request looked successful and no mail ever arrived. It now
// actually sends, and says so honestly when it cannot.
//
// Set SMTP_HOST/PORT/USER/PASS (or RESEND_API_KEY) to enable sending.
// Set RESET_TOKEN_SECRET to enable HMAC-signed tokens.

import { NextResponse } from 'next/server'
import { randomBytes, createHmac } from 'crypto'
import { sendMail, mailConfigured, resetPasswordEmail } from '@/lib/mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_TTL_MINUTES = 60

// The same reply for a registered and an unregistered address, so this
// endpoint cannot be used to discover who has an account.
const GENERIC_OK = {
  ok: true,
  message: 'If that email is registered, a reset link is on its way. Check your inbox, and your spam folder.',
}

function generateToken(email) {
  const raw = randomBytes(32).toString('hex')
  const secret = process.env.RESET_TOKEN_SECRET
  if (secret) {
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

    // In production, refuse rather than lie: telling someone a link is
    // on its way when no code path can produce one is the bug that
    // brought us here. Outside production the link comes back in the
    // response instead, so the flow stays testable without an SMTP box.
    const isProd = process.env.NODE_ENV === 'production'
    const canSend = mailConfigured()
    if (!canSend && isProd) {
      console.error('[forgot-password] No mail provider configured — set SMTP_HOST/USER/PASS or RESEND_API_KEY. Reset requested by:', email)
      return NextResponse.json({
        error: 'Password reset email is not available right now. Please contact support and we will reset it for you.',
      }, { status: 503 })
    }

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    })

    // Unknown address: stop here, but answer exactly as if we had sent.
    if (!user) return NextResponse.json(GENERIC_OK)

    const token = generateToken(email)
    const expiry = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    const baseUrl = (
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000'
    ).replace(/\/+$/, '')
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    // Dev without SMTP: hand the link straight back so the rest of the
    // flow can be exercised. Unreachable in production — guarded above.
    if (!canSend) {
      console.log(`[forgot-password] No mail provider; DEV link for ${email}:\n${resetLink}`)
      return NextResponse.json({
        ...GENERIC_OK,
        resetLink,
        note: 'DEV ONLY — no mail provider configured. This link is never returned in production.',
      })
    }

    try {
      const { subject, html, text } = resetPasswordEmail({
        resetLink,
        name: user.name?.split(' ')[0],
        expiresInMinutes: TOKEN_TTL_MINUTES,
      })
      const sent = await sendMail({ to: email, subject, html, text })
      console.log(`[forgot-password] Sent to ${email} via ${sent.provider} (${sent.id})`)
    } catch (mailErr) {
      // The token is already saved and still valid, so the link in the
      // logs works if support needs to forward it by hand.
      console.error(`[forgot-password] Send FAILED for ${email}:`, mailErr?.message)
      console.error(`[forgot-password] Link for manual delivery:\n${resetLink}`)
      return NextResponse.json({
        error: 'We could not send the reset email just now. Please try again in a minute, or contact support.',
      }, { status: 502 })
    }

    return NextResponse.json(GENERIC_OK)
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
