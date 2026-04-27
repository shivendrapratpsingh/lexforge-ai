// ─────────────────────────────────────────────────────────────────
//  LexForge AI — system-config.js
//  Runtime, admin-controlled feature flags
// ─────────────────────────────────────────────────────────────────
//
// Reads the singleton SystemConfig row (id="default") from Prisma.
// Caches the value for 30 seconds so we don't hit the DB on every
// request. The admin's "save settings" handler should call
// invalidateSystemConfig() to flush the cache immediately.

const CACHE_TTL_MS = 30 * 1000

let _cache = null
let _cachedAt = 0

const DEFAULTS = {
  proEnforcementEnabled: false,  // false = everyone gets Pro features
  freeDocsLimit: 10,             // documents per month for free users
}

export function invalidateSystemConfig() {
  _cache = null
  _cachedAt = 0
}

// Returns the live config. Always resolves to a complete object,
// even if the SystemConfig row doesn't exist yet (first-time setup)
// or if the DB call fails — in which case we fall back to DEFAULTS.
export async function getSystemConfig() {
  const now = Date.now()
  if (_cache && now - _cachedAt < CACHE_TTL_MS) return _cache

  try {
    const { prisma } = await import('./prisma')
    let row = await prisma.systemConfig.findUnique({ where: { id: 'default' } })
    if (!row) {
      // Lazy-create the singleton on first read so subsequent admin saves
      // can simply update it.
      row = await prisma.systemConfig.create({ data: { id: 'default' } })
    }
    _cache = {
      proEnforcementEnabled: !!row.proEnforcementEnabled,
      freeDocsLimit: typeof row.freeDocsLimit === 'number' && row.freeDocsLimit > 0
        ? row.freeDocsLimit : DEFAULTS.freeDocsLimit,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy || null,
    }
    _cachedAt = now
    return _cache
  } catch (err) {
    // DB unreachable / schema not migrated yet → fall back to defaults
    // so the app still works.
    console.warn('[system-config] falling back to defaults:', err?.message)
    return { ...DEFAULTS, updatedAt: null, updatedBy: null, _fallback: true }
  }
}

// Convenience: synchronous-ish helpers for callers that already have config.
export function isProEnforcedFromConfig(config) {
  return !!config?.proEnforcementEnabled
}
