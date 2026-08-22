import { formatDate, formatDateTime } from './dates.js'
import { emailShell, h1, p as para, rule, facts, note, button, COLORS } from './email-theme.js'
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
//
// Every one of these is a letter, not a notification. Same shell, same
// letterhead, same footer — see lib/email-theme.js for why it is ivory
// and not the app's black.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexforge-ai.vercel.app'
const inr = (paise) => '₹' + (Math.round(paise) / 100).toLocaleString('en-IN')

/**
 * Sent after a password changes, whether through the security question
 * or an admin override.
 *
 * This is the safety net for the recovery design: a security answer is
 * a low-entropy secret that someone close to the account holder might
 * guess, and unlike an emailed link it proves nothing about who controls
 * the mailbox. This notice is the only way the real owner finds out that
 * a takeover happened, so it is worth sending even though nothing else
 * in the recovery flow needs email.
 */
export function passwordChangedEmail({ name, byAdmin = false, when = new Date() }) {
  const greeting = name ? `Hello ${name},` : 'Hello,'
  const stamp = formatDateTime(when)
  const how = byAdmin
    ? 'An administrator set a new password on your LexForge AI account.'
    : 'The password on your LexForge AI account was changed using your security question.'

  const text = [
    greeting, '', how, `This happened on ${stamp}.`, '',
    'If this was you, nothing further is needed.',
    'If it was NOT you, someone else has access to your account. Write to us at once.',
    '', '— LexForge AI',
  ].join('\n')

  return {
    subject: 'Your LexForge AI password was changed',
    text,
    html: emailShell({
      title: 'Password changed',
      preheader: `Changed on ${stamp}. If this was not you, act now.`,
      site: SITE,
      body: [
        h1('Your password was changed'),
        para(greeting),
        para(how),
        facts([['When', stamp, true]]),
        note('<b>If this was not you</b>, someone else has access to your account. Write to us immediately and we will lock it.', 'warn'),
      ].join(''),
    }),
  }
}

/**
 * The receipt for a payment.
 *
 * Someone paying money and receiving nothing in writing is the fastest
 * way to a chargeback, and the first thing a support request asks for.
 * It states the end date prominently because these plans do not renew —
 * the date is the whole contract.
 */
export function paymentReceiptEmail({ name, planLabel, amountPaise, currentEnd, paymentId }) {
  const greeting = name ? `Hello ${name},` : 'Hello,'
  const until = formatDate(currentEnd)

  const text = [
    greeting, '',
    `Your payment for LexForge AI ${planLabel} has gone through. Pro is active on your account now.`,
    '',
    `Plan:         ${planLabel}`,
    `Amount:       ${inr(amountPaise)}`,
    `Active until: ${until}`,
    paymentId ? `Payment ID:   ${paymentId}` : '',
    '',
    'This plan does NOT renew automatically. Nothing will be debited again.',
    `To continue past ${until}, pay again from your account — and paying before`,
    'it ends adds to the days you have rather than replacing them.',
    '',
    'Keep this email. The payment ID makes any refund or query quick.',
    '', '— LexForge AI',
  ].filter(Boolean).join('\n')

  return {
    subject: `Payment received — LexForge AI ${planLabel}`,
    text,
    html: emailShell({
      title: 'Payment received',
      preheader: `${inr(amountPaise)} received. Pro is active until ${until}.`,
      site: SITE,
      body: [
        h1('Payment received'),
        para(greeting),
        para('Your payment has gone through and Pro is active on your account now.'),
        facts([
          ['Plan', planLabel],
          ['Amount', inr(amountPaise)],
          ['Active until', until, true],
          paymentId ? ['Payment ID', `<span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;">${paymentId}</span>`] : null,
        ]),
        note(`<b>Nothing renews automatically.</b> No card is stored and you will not be debited again. To continue past ${until}, pay again from your account — paying before it ends adds to the days you have rather than replacing them.`),
        button('Open LexForge', `${SITE}/dashboard`),
        rule(),
        para('Keep this email — the payment ID makes any refund or query quick.', { muted: true }),
      ].join(''),
    }),
  }
}

/**
 * Sent a few days before a prepaid term runs out.
 *
 * Necessary precisely BECAUSE nothing auto-renews: without it a user
 * simply loses access one morning with no warning, which reads as the
 * product breaking rather than a plan ending.
 */
export function planExpiringEmail({ name, planLabel, currentEnd }) {
  const greeting = name ? `Hello ${name},` : 'Hello,'
  const until = formatDate(currentEnd)

  const text = [
    greeting, '',
    `Your LexForge AI ${planLabel} ends on ${until}.`,
    '',
    'Because these plans are prepaid, nothing will be charged automatically — which',
    'also means access simply stops on that date unless you pay again.',
    '',
    'Paying before it ends adds the new days to what you have left, so nothing is wasted.',
    '',
    'If you do nothing: your account, your documents and all your work stay exactly',
    'where they are. You move back to the free plan — ten documents a month.',
    '', '— LexForge AI',
  ].join('\n')

  return {
    subject: `Your LexForge AI plan ends on ${until}`,
    text,
    html: emailShell({
      title: 'Your plan ends soon',
      preheader: `${planLabel} ends ${until}. Nothing renews on its own.`,
      site: SITE,
      body: [
        h1('Your plan ends soon'),
        para(greeting),
        para(`Your <b>${planLabel}</b> plan ends on <b>${until}</b>. Nothing will be charged automatically — which also means access stops on that date unless you pay again.`),
        facts([['Plan', planLabel], ['Ends on', until, true]]),
        para('Paying before it ends adds the new days to what you have left, so nothing is wasted.', { muted: true }),
        button('Continue on Pro', `${SITE}/upgrade`),
        note('<b>If you do nothing</b>, you keep your account and every document you have written. You simply move back to the free plan — ten documents a month.', 'good'),
      ].join(''),
    }),
  }
}

/**
 * Fire-and-forget: recovery must not fail because a mail server is
 * unreachable or unconfigured. Logs and moves on.
 */
export async function notifyQuietly({ to, subject, html, text }) {
  if (!mailConfigured()) return { ok: false, skipped: 'not configured' }
  try {
    return await sendMail({ to, subject, html, text })
  } catch (err) {
    console.error('[mail] notification failed for', to, '-', err?.message)
    return { ok: false, error: err?.message }
  }
}

// resetPasswordEmail used to live here. Recovery no longer sends a link:
// the reset token was dropped from the schema entirely, because a
// long-lived token sitting in the users table is a breach waiting for
// somebody to read it. /forgot-password asks the security question set
// at sign-up instead, and the template went with the flow it served.
