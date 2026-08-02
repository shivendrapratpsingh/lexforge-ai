// ─────────────────────────────────────────────────────────────────
//  lib/push.js — Web Push (VAPID) helpers.
//
//  Works on installed PWAs: Android/Chrome, desktop Chrome/Edge/Firefox,
//  and iOS 16.4+ (iOS only delivers push to an app added to the Home
//  Screen — in Safari's normal browser tab it will never fire, which is
//  an Apple restriction, not a bug here).
//
//  Env:
//    VAPID_PUBLIC_KEY   also exposed to the browser via /api/push/key
//    VAPID_PRIVATE_KEY  server only
//    VAPID_SUBJECT      mailto: or https: contact, required by the spec
// ─────────────────────────────────────────────────────────────────
import webpush from 'web-push'
import { lineAsText, lineForDay, studyPromptForDay } from './daily-lines.js'

let configured = false

export function pushConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

function configure() {
  if (configured) return
  if (!pushConfigured()) throw Object.assign(new Error('Push is not configured on this deployment.'), { code: 'PUSH_UNCONFIGURED' })
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@lexforge.ai',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
  configured = true
}

/**
 * Send one notification. Returns { ok } or { ok:false, gone:true } when the
 * push service says the subscription is dead (404/410) so the caller can
 * delete it — that is the only reliable "user uninstalled" signal we get.
 */
export async function sendPush(sub, payload) {
  configure()
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 12 * 60 * 60, urgency: 'normal' },
    )
    return { ok: true }
  } catch (err) {
    const code = err?.statusCode
    if (code === 404 || code === 410) return { ok: false, gone: true }
    return { ok: false, error: err?.body || err?.message || 'send failed' }
  }
}

// ─── Digest builder ───────────────────────────────────────────────
// Assembles ONE notification per user covering every service they have
// switched on, rather than several competing notifications. Returns null
// when there is genuinely nothing to say, so we never send a hollow
// "nothing to report" ping — the fastest way to get notifications muted.
export function buildDigest({ name, topics, hearings = [], draftsThisMonth = 0, freeLimit = null, isPro = false }) {
  const want = new Set(String(topics || '').split(',').map(s => s.trim()).filter(Boolean))
  const lines = []
  let url = '/dashboard'

  if (want.has('dates') && hearings.length) {
    const first = hearings[0]
    const when = new Date(first.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    lines.push(hearings.length === 1
      ? `${first.title} on ${when}`
      : `${hearings.length} dates coming up — next: ${first.title} on ${when}`)
    url = '/court-dates'
  }

  if (want.has('drafts') && !isPro && freeLimit) {
    const left = Math.max(0, freeLimit - draftsThisMonth)
    if (left <= 3) lines.push(`${left} of your ${freeLimit} free drafts left this month`)
  }

  if (want.has('study')) {
    lines.push(studyPromptForDay())
    if (lines.length === 1) url = '/study'
  }

  if (!lines.length) return null

  // The day's line closes the digest, and it is the same entry the
  // dashboard widget is showing — one voice across every surface.
  const line = lineForDay()

  return {
    title: hearings.length ? `Today in your practice, ${name || 'Counsel'}` : `LexForge — daily brief`,
    body: `${lines.join(' · ')}\n${lineAsText(line)}`,
    url,
    tag: 'lexforge-daily',
  }
}
