// ─────────────────────────────────────────────────────────────────
//  lib/mail.js — outbound email.
//
//  Two providers, whichever is configured. They are checked in this
//  order, so setting SMTP wins if both are present:
//
//    SMTP    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//            Works with a Gmail app password and needs no domain of
//            your own, which is why it is first: lexforge-ai.vercel.app
//            cannot be verified as a sending domain.
//
//    Resend  RESEND_API_KEY
//            Better deliverability, but requires a domain you own and
//            have verified. Sent over HTTPS, no SDK needed.
//
//  MAIL_FROM sets the From header, e.g. "LexForge AI <no-reply@…>".
//  It defaults to SMTP_USER when unset, which is what a Gmail sender
//  needs anyway — Gmail rewrites a From that is not the authenticated
//  account, so overriding it there achieves nothing.
//
//  Nothing here throws on a missing config. Callers ask mailConfigured()
//  first and tell the user honestly when email is off, rather than
//  reporting a send that never happened.
// ─────────────────────────────────────────────────────────────────

export function mailProvider() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  if (process.env.RESEND_API_KEY) return 'resend'
  return null
}

export function mailConfigured() {
  return mailProvider() !== null
}

export function mailFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@lexforge.ai'
}

async function sendViaSmtp({ to, subject, html, text }) {
  // Imported lazily so a Resend-only deployment never loads it, and so
  // the module graph stays clean for routes that do not send mail.
  const nodemailer = (await import('nodemailer')).default
  const port = Number(process.env.SMTP_PORT || 587)

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const info = await transport.sendMail({ from: mailFrom(), to, subject, html, text })
  return { ok: true, id: info.messageId, provider: 'smtp' }
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: mailFrom(), to: [to], subject, html, text }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.message || `Resend responded ${res.status}`)
  }
  return { ok: true, id: body?.id, provider: 'resend' }
}

/**
 * Send one email. Throws on failure — callers should catch and report,
 * never swallow, because a silently dropped password-reset mail is the
 * exact failure this module exists to end.
 */
export async function sendMail({ to, subject, html, text }) {
  const provider = mailProvider()
  if (!provider) throw new Error('MAIL_NOT_CONFIGURED')
  if (!to || !subject) throw new Error('sendMail requires `to` and `subject`')

  return provider === 'smtp'
    ? sendViaSmtp({ to, subject, html, text })
    : sendViaResend({ to, subject, html, text })
}

// ── Templates ─────────────────────────────────────────────────────
// Inline styles and a table-free layout: every serious mail client
// strips <style> blocks, and several ignore flexbox entirely.

export function resetPasswordEmail({ resetLink, name, expiresInMinutes = 60 }) {
  const greeting = name ? `Hello ${name},` : 'Hello,'

  const text = [
    greeting,
    '',
    'Someone asked to reset the password on your LexForge AI account.',
    'Open this link to choose a new one:',
    '',
    resetLink,
    '',
    `The link expires in ${expiresInMinutes} minutes and can be used once.`,
    'If this was not you, ignore this email — your password stays as it is.',
    '',
    '— LexForge AI',
  ].join('\n')

  const html = `
<div style="margin:0;padding:32px 16px;background:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#141414;border:1px solid #2A2A2A;border-radius:16px;padding:32px;">

    <div style="margin-bottom:26px;">
      <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#D4A017;border-radius:9px;color:#0D0D0D;font-weight:900;font-size:13px;vertical-align:middle;">LF</span>
      <span style="margin-left:10px;font-size:19px;font-weight:800;color:#F0F0F0;vertical-align:middle;">LexForge AI</span>
    </div>

    <h1 style="margin:0 0 12px;font-size:21px;font-weight:800;color:#F0F0F0;">Reset your password</h1>

    <p style="margin:0 0 8px;font-size:14px;line-height:1.65;color:#A3A39C;">${greeting}</p>
    <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#A3A39C;">
      Someone asked to reset the password on your LexForge AI account.
      Choose a new one using the button below.
    </p>

    <a href="${resetLink}"
       style="display:block;text-align:center;background:#D4A017;color:#0D0D0D;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:10px;margin-bottom:22px;">
      Choose a new password
    </a>

    <p style="margin:0 0 18px;font-size:12.5px;line-height:1.6;color:#6E6E68;">
      The link expires in ${expiresInMinutes} minutes and can only be used once.
      If the button does not work, copy this address into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:11.5px;line-height:1.6;color:#8A7748;word-break:break-all;">
      ${resetLink}
    </p>

    <div style="border-top:1px solid #232323;padding-top:16px;">
      <p style="margin:0;font-size:12.5px;line-height:1.6;color:#6E6E68;">
        If you did not ask for this, you can ignore this email — your password
        will stay exactly as it is, and nobody can change it without this link.
      </p>
    </div>
  </div>
</div>`.trim()

  return { subject: 'Reset your LexForge AI password', html, text }
}
