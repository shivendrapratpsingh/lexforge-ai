// ─────────────────────────────────────────────────────────────────
//  lib/security-question.js — account recovery without emailed tokens.
//
//  Set at registration, checked at recovery. The answer is treated as a
//  password in every respect, because that is what it is:
//
//    * only a bcrypt hash is ever stored, never the answer
//    * it is never returned by any API, to anyone, including admins
//    * attempts are counted and the account locks after a few failures
//
//  That last point is not optional. A best friend's nickname carries
//  maybe 10-20 bits of entropy — far less than a password — so without
//  a lockout an attacker could simply work through a list of common
//  nicknames until one hit. The lockout is what makes a low-entropy
//  secret survivable.
//
//  It is also worth being clear about the trade this makes: unlike a
//  reset link, a security answer proves nothing about who controls the
//  mailbox, and it cannot be rotated if it ever leaks. The admin
//  override in the console exists as the fallback for both cases.
//
//  This file stays free of bcrypt so the register page can import the
//  question text without dragging a hashing library into the browser
//  bundle. Hashing and verification live in ./security-question-server.
// ─────────────────────────────────────────────────────────────────

export const DEFAULT_SECURITY_QUESTION =
  'What is the nickname you have kept for your best friend?'

// Kept as a list so the question can be varied later without a migration:
// the chosen text is stored per user alongside the hash.
export const SECURITY_QUESTIONS = [
  DEFAULT_SECURITY_QUESTION,
  'What was the name of your first school?',
  'What is the name of the town where you were born?',
  'What was the name of your first pet?',
]

export const MAX_ATTEMPTS = 5
export const LOCKOUT_MINUTES = 30
export const MIN_ANSWER_LENGTH = 2

/**
 * Fold away the differences a person will not remember making.
 * "Bunty", " bunty " and "Bun-ty" must all verify, or the feature
 * becomes a lockout generator rather than a recovery route.
 */
export function normaliseAnswer(answer) {
  return String(answer || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')   // drop punctuation, keep any script
    .replace(/\s+/g, ' ')                // collapse runs of whitespace
    .trim()
}

export function isValidAnswer(answer) {
  return normaliseAnswer(answer).length >= MIN_ANSWER_LENGTH
}

/** Minutes remaining on a lockout, or 0 if the account is not locked. */
export function lockoutRemaining(lockedUntil) {
  if (!lockedUntil) return 0
  const ms = new Date(lockedUntil).getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 60000) : 0
}
