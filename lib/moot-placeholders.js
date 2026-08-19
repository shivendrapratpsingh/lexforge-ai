// Pulling the deliberate holes out of a memorial.
//
// The memorial builder writes [FIND AUTHORITY — proposition] rather than
// inventing a case, because a fabricated citation is the one mistake a
// moot bench always catches. This finds them so they can be searched
// for real.
//
// Kept apart from the component that renders them so the parsing can be
// tested on its own — it is the part that silently breaks when a model
// reaches for a different dash.

// Models emit em dash, en dash or hyphen more or less at random, so all
// three are accepted.
const PLACEHOLDER = /\[FIND AUTHORITY\s*[—–-]\s*([^\]]+)\]/gi

export function extractPropositions(memorial) {
  const out = []
  const seen = new Set()
  for (const m of String(memorial || '').matchAll(PLACEHOLDER)) {
    const p = m[1].trim()
    const key = p.toLowerCase()
    // Each one costs a billed search, so the same proposition written
    // twice is searched once.
    if (p.length >= 8 && !seen.has(key)) { seen.add(key); out.push(p) }
  }
  return out
}
