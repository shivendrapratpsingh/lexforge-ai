// POST /api/admin/diagnostics/test-email — actually send one.
//
// The connection check in the parent route proves the credentials are
// accepted. It does not prove a message arrives, and those are different
// failures with different fixes: an app password with the display spaces
// left in fails at authentication, while a brand-new Gmail account that
// authenticates perfectly can still have its first messages held back.
//
// So this sends a real email and reports what the mail server said. The
// only proof that email works is an email turning up.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin, ADMIN_EMAIL } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  // Defaults to the admin's own address. Anywhere else has to be asked
  // for explicitly — a test button that can mail strangers is a spam
  // cannon with a friendly label.
  const to = typeof body.to === 'string' && body.to.includes('@') ? body.to.trim() : ADMIN_EMAIL

  try {
    const { sendMail, mailConfigured, mailProvider, mailFrom } = await import('@/lib/mail')

    if (!mailConfigured()) {
      return NextResponse.json({
        ok: false,
        error: 'Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in Production, then redeploy.',
      }, { status: 503 })
    }

    const when = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

    await sendMail({
      to,
      subject: 'LexForge AI — email is working',
      text: [
        'This is a test from the LexForge AI admin console.',
        '',
        `Sent: ${when}`,
        `Via:  ${mailProvider()}`,
        `From: ${mailFrom()}`,
        '',
        'If you are reading this, payment receipts, password-change notices',
        'and the daily report will all reach their recipients.',
        '',
        '— LexForge AI',
      ].join('\n'),
      html: `
<div style="margin:0;padding:32px 16px;background:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:460px;margin:0 auto;background:#141414;border:1px solid #2A2A2A;border-radius:16px;padding:32px;">
    <div style="margin-bottom:22px;">
      <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#D4A017;border-radius:9px;color:#0D0D0D;font-weight:900;font-size:13px;vertical-align:middle;">LF</span>
      <span style="margin-left:10px;font-size:18px;font-weight:800;color:#F0F0F0;vertical-align:middle;">LexForge AI</span>
    </div>
    <h1 style="margin:0 0 14px;font-size:20px;font-weight:800;color:#5FCC8D;">Email is working</h1>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#A3A39C;">
      If you are reading this, payment receipts, password-change notices and
      the daily report will all reach their recipients.
    </p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #2A2A2A;">
      <tr><td style="padding:8px 0;font-size:13px;color:#6E6E68;">Sent</td><td style="padding:8px 0;font-size:13px;color:#C0C0C0;text-align:right;">${when}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#6E6E68;">Via</td><td style="padding:8px 0;font-size:13px;color:#C0C0C0;text-align:right;">${mailProvider()}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#6E6E68;">From</td><td style="padding:8px 0;font-size:13px;color:#C0C0C0;text-align:right;">${mailFrom()}</td></tr>
    </table>
  </div>
</div>`.trim(),
    })

    return NextResponse.json({
      ok: true,
      to,
      provider: mailProvider(),
      from: mailFrom(),
      message: `Sent to ${to}. Check the inbox — and the spam folder, since a new sending address has no reputation yet.`,
    })
  } catch (err) {
    const raw = err?.message || String(err)

    // The two failures that actually happen, named so the fix is obvious
    // rather than something to search for.
    let hint = null
    if (/invalid login|535|username and password not accepted|badcredentials/i.test(raw)) {
      hint = 'Gmail rejected the login. Almost always the app password still has its display spaces in it — it must be 16 characters with none. Check too that SMTP_USER is the account the app password was created on.'
    } else if (/MAIL_NOT_CONFIGURED/.test(raw)) {
      hint = 'No mail provider configured in this environment. Set the SMTP_* variables in Production and redeploy.'
    } else if (/etimedout|econnrefused|enotfound|timeout/i.test(raw)) {
      hint = 'Could not reach the mail server. Check SMTP_HOST is smtp.gmail.com and SMTP_PORT is 587.'
    }

    console.error('[diagnostics/test-email]', raw)
    return NextResponse.json({ ok: false, error: raw, hint }, { status: 500 })
  }
}
