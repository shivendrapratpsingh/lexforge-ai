// Shared client/server validation helpers.
//
// Goal: every field the user is asked for must contain a *real, usable answer*.
// Reject placeholders like "NA", "no", "don't know", "nil", "-", "...", etc.
// so the AI never sees junk and never has to invent content to fill the gap.

// Words/phrases that count as "no real answer".
// Match is case-insensitive and ignores surrounding whitespace + punctuation.
const JUNK_TOKENS = [
  'na', 'n/a', 'n.a.', 'n/a.', 'not applicable',
  'no', 'nope', 'none', 'nil', 'null', 'nothing',
  'dont know', "don't know", 'do not know', 'idk', 'no idea',
  'unknown', 'not known', 'not sure', 'unsure',
  'tbd', 'to be decided', 'to be determined', 'to be filled',
  'pending', 'later', 'will update', 'will provide later',
  '-', '--', '---', '.', '..', '...', '?', 'xx', 'xxx', 'tba',
]

// Returns true if `value` is missing OR is one of the junk placeholders.
export function isJunkValue(value) {
  if (value === null || value === undefined) return true
  const s = String(value).trim()
  if (s.length === 0) return true
  // Strip surrounding punctuation/quotes for the comparison
  const normalized = s.toLowerCase().replace(/^[\s"'`.,;:!?\-_/\\(){}\[\]]+|[\s"'`.,;:!?\-_/\\(){}\[\]]+$/g, '')
  if (normalized.length === 0) return true
  if (JUNK_TOKENS.includes(normalized)) return true
  // A single non-letter character (e.g. "/", "*") is also junk
  if (s.length === 1 && !/[a-z0-9]/i.test(s)) return true
  return false
}

// Validate a templateData object against a list of required fields.
// `requiredFields` is an array of `{ name, label }` (matches the FIELDS shape
// in app/(dashboard)/new-draft/page.js) — only `name` is strictly required.
//
// Returns: { valid: boolean, missing: string[], junk: string[] }
//   missing — fields that are absent or empty
//   junk    — fields whose value is "NA", "no", etc.
export function validateTemplateData(templateData, requiredFields) {
  const data = templateData || {}
  const missing = []
  const junk = []
  for (const field of requiredFields || []) {
    const name = field?.name
    if (!name) continue
    const v = data[name]
    if (v === null || v === undefined || String(v).trim().length === 0) {
      missing.push(field.label || name)
    } else if (isJunkValue(v)) {
      junk.push(field.label || name)
    }
  }
  return { valid: missing.length === 0 && junk.length === 0, missing, junk }
}

// Build a friendly error message from a validation result.
export function buildValidationError({ missing, junk }) {
  const parts = []
  if (missing.length > 0) {
    parts.push(`Please fill in: ${missing.join(', ')}.`)
  }
  if (junk.length > 0) {
    parts.push(
      `These fields need a real answer (not "NA", "no", or "don't know"): ${junk.join(', ')}.`
    )
  }
  return parts.join(' ')
}
