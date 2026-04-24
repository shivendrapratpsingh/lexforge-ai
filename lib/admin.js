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
