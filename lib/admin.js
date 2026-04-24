// ─────────────────────────────────────────────────────────────────
//  LexForge AI — admin.js
//  Admin identity + permission helpers
// ─────────────────────────────────────────────────────────────────

// The single admin email (hardcoded for safety).
// To transfer admin to someone else, change this value.
export const ADMIN_EMAIL = 'pratapsinghshivendra21@gmail.com'

// Free-tier quota: documents per calendar month.
export const FREE_DOCS_PER_MONTH = 5

// Document types that require Pro tier (referenced by value from DOCUMENT_TYPES).
// Free users can still see them in the picker but will get an upgrade prompt.
export const PRO_ONLY_DOCUMENT_TYPES = new Set([
  'WRIT_PETITION',
  'PIL',
  'PETITION',
  'BAIL_APPLICATION',
  'DIVORCE_PETITION',
  'SALE_DEED',
  'CONTRACT',
])

// Routes that require Pro tier. Free users get redirected to /upgrade.
export const PRO_ONLY_ROUTES = [
  '/clients',
  '/court-dates',
  '/tools',
  '/research',
]

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

export function requiresProDocument(documentType) {
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

  return false
}

// Session-based async helper that mirrors isPro() but is promo-aware.
export async function hasProAccessForSession(session) {
  return hasProAccess(session?.user?.email, session?.user?.tier)
}
