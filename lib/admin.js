// ─────────────────────────────────────────────────────────────────
//  LexForge AI — admin.js
//  Admin identity + permission helpers
// ─────────────────────────────────────────────────────────────────

// The single admin email.
// PRIMARY source of truth: ADMIN_EMAIL in your .env / Vercel environment.
// FALLBACK (only if the env var is unset, e.g. on a fresh dev clone):
// the literal below. Setting ADMIN_EMAIL in env lets you rotate the
// admin without committing a code change to Git.
// Deliberately NOT defaulted to a real address. This repository is
// public, and a hardcoded admin email tells anyone reading it exactly
// which account to attack — turning "guess the admin" into
// "brute-force one known account". The address lives in ADMIN_EMAIL in
// the deployment environment and nowhere else.
//
// Empty means nobody is admin, which fails closed: a missing variable
// locks the console rather than opening it.
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase()

// Free-tier quota fallback: documents per calendar month.
// The live value comes from SystemConfig.freeDocsLimit (admin-editable).
// This constant is kept for backwards-compatibility with any caller that
// hasn't been migrated to the async getter yet.
export const FREE_DOCS_PER_MONTH = 10

// Async getter — preferred. Reads the live value from SystemConfig.
export async function getFreeDocsLimit() {
  const { getSystemConfig } = await import('./system-config')
  const cfg = await getSystemConfig()
  return cfg.freeDocsLimit || FREE_DOCS_PER_MONTH
}

// Document types that require Pro tier.
// PRODUCT DECISION: Free tier has access to ALL document types. The only
// gate for Free is the monthly quota (freeDocsLimit). Once quota is hit,
// generation is blocked. Pro = unlimited.
// Leave this Set empty unless we ever want to put a specific type back behind Pro.
export const PRO_ONLY_DOCUMENT_TYPES = new Set([])

// Routes that require Pro tier.
// PRODUCT DECISION: Free tier has access to ALL workflow routes. Pro is
// differentiated by quota (unlimited) and by Pro-only features such as
// the AI Case Assistant chatbot - not by route gating.
export const PRO_ONLY_ROUTES = []

export function isAdmin(session) {
  return !!session?.user?.email && session.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function isPro(session) {
  return session?.user?.tier === 'pro' || isAdmin(session)
}

export function isProOrAdminEmail(email, tier) {
  if (!email) return false
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true
  return tier === 'pro'
}

// Synchronous version — kept for backwards-compatibility.
// New callers should prefer the async `requiresProDocumentDynamic` which
// also respects the runtime `proEnforcementEnabled` toggle.
export function requiresProDocument(documentType) {
  return PRO_ONLY_DOCUMENT_TYPES.has(documentType)
}

// Returns true only if the doc type is Pro-only AND admin has turned
// Pro enforcement on. When enforcement is OFF (default), every doc type
// is accessible to free users.
export async function requiresProDocumentDynamic(documentType) {
  const { getSystemConfig } = await import('./system-config')
  const cfg = await getSystemConfig()
  if (!cfg.proEnforcementEnabled) return false  // global Pro mode
  return PRO_ONLY_DOCUMENT_TYPES.has(documentType)
}

// ─────────────────────────────────────────────────────────────────
//  Promo-aware Pro access check (async — hits DB).
//
//  Precedence:
//   1. Real paid Pro tier on User row → pro
//   2. Admin email → pro
//   3. Active GlobalPromo window (anyone) → pro
//   4. Active EmailPromo window for this email → pro
//  When all promo windows expire, the user reverts to whatever
//  their User.tier says (so paying users are never downgraded).
// ─────────────────────────────────────────────────────────────────
export async function hasProAccess(email, tier) {
  if (!email) return false
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true
  if (tier === 'pro') return true

  // Runtime toggle: if admin hasn't enabled Pro enforcement, every signed-in
  // user gets Pro features (the default for "for now make it free").
  const { getSystemConfig } = await import('./system-config')
  const cfg = await getSystemConfig()
  if (!cfg.proEnforcementEnabled) return true

  // Lazy-import to avoid pulling prisma into edge bundles that don't need it.
  const { prisma } = await import('./prisma')
  const now = new Date()

  const globalActive = await prisma.globalPromo.findFirst({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { createdAt: 'desc' },
  })
  if (globalActive) return true

  const emailActive = await prisma.emailPromo.findFirst({
    where: {
      email: email.toLowerCase(),
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (emailActive) return true

  // Institutional access. A student whose college has an active pilot
  // gets Pro because of who they are, with nobody adding them by hand —
  // this is what makes onboarding a 300-student college possible.
  const { institutionGrantsPro } = await import('./institutions.js')
  if (await institutionGrantsPro(email)) return true

  // Grandfathered users keep Pro permanently. They signed up while
  // everything was free; taking it away the day enforcement is switched
  // on would punish exactly the people who took the earliest risk.
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { grandfathered: true, subscription: { select: { status: true, currentEnd: true } } },
  }).catch(() => null)
  if (user?.grandfathered) return true

  // A paid subscription grants access until the period it paid for ends,
  // even after cancellation — someone who cancels on day 2 of a month
  // they paid for keeps it until day 30.
  const sub = user?.subscription
  if (sub && ['active', 'cancelled'].includes(sub.status) && sub.currentEnd && new Date(sub.currentEnd) > now) {
    return true
  }

  return false
}

// Session-based async helper that mirrors isPro() but is promo-aware.
export async function hasProAccessForSession(session) {
  return hasProAccess(session?.user?.email, session?.user?.tier)
}
