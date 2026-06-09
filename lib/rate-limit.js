// ─────────────────────────────────────────────────────────────────
//  lib/rate-limit.js
//
//  Sliding-window in-memory rate limiter for AI generation routes.
//
//  LIMITATION: In a serverless (Vercel) deployment each function
//  invocation may run in a fresh process — the in-memory store is
//  not shared across instances.  This gives per-instance limiting,
//  which is still an effective brake against a single client hammering
//  the same cold function.  For true cross-instance rate limiting,
//  swap the Map for Upstash Redis (free tier sufficient).
//
//  Usage:
//    import { checkRateLimit } from '@/lib/rate-limit'
//    const rl = checkRateLimit(userId, 'drafts')
//    if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 })
// ─────────────────────────────────────────────────────────────────

// windowMs  — sliding window in milliseconds
// max       — max requests per window per key
const LIMITS = {
  drafts:    { windowMs: 60_000, max: 5  },   // 5 drafts / minute
  analyze:   { windowMs: 60_000, max: 10 },   // 10 analyses / minute
  assistant: { windowMs: 60_000, max: 15 },   // 15 chat messages / minute
  extract:   { windowMs: 60_000, max: 5  },   // 5 OCR extractions / minute
  default:   { windowMs: 60_000, max: 20 },
}

// Map<key, number[]>  — timestamps of recent requests
const store = new Map()

// Prune entries older than 5 minutes periodically to avoid memory leaks.
let lastPrune = Date.now()
function maybePrune() {
  if (Date.now() - lastPrune < 300_000) return
  lastPrune = Date.now()
  const cutoff = Date.now() - 300_000
  for (const [key, times] of store) {
    const fresh = times.filter(t => t > cutoff)
    if (fresh.length === 0) store.delete(key)
    else store.set(key, fresh)
  }
}

/**
 * @param {string}  userId  - unique identifier (session.user.id)
 * @param {string}  bucket  - one of the LIMITS keys
 * @returns {{ ok: boolean, remaining: number, message?: string }}
 */
export function checkRateLimit(userId, bucket = 'default') {
  maybePrune()
  const cfg = LIMITS[bucket] || LIMITS.default
  const key = `${bucket}:${userId}`
  const now = Date.now()
  const windowStart = now - cfg.windowMs

  const times = (store.get(key) || []).filter(t => t > windowStart)
  if (times.length >= cfg.max) {
    const retryAfterSec = Math.ceil((times[0] - windowStart) / 1000)
    return {
      ok: false,
      remaining: 0,
      message: `Too many requests. Please wait ${retryAfterSec}s before trying again.`,
      retryAfter: retryAfterSec,
    }
  }

  times.push(now)
  store.set(key, times)
  return { ok: true, remaining: cfg.max - times.length }
}
