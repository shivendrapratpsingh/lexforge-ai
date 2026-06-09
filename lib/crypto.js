// ─────────────────────────────────────────────────────────────────
//  lib/crypto.js
//
//  AES-256-GCM helpers for encrypting sensitive PII fields
//  (Aadhaar number, etc.) before storing in the database.
//
//  Env var required:
//    FIELD_ENCRYPTION_KEY  — 64 hex chars (= 32 bytes for AES-256)
//    Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
//  Encrypted format (all stored as a single string):
//    <iv_hex>:<authTag_hex>:<ciphertext_hex>
//
//  If FIELD_ENCRYPTION_KEY is not set the helpers are no-ops so the
//  app still runs in dev without the key (with a warning logged once).
// ─────────────────────────────────────────────────────────────────

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
let warned = false

function getKey() {
  const hex = process.env.FIELD_ENCRYPTION_KEY
  if (!hex) {
    if (!warned) {
      console.warn('[crypto] FIELD_ENCRYPTION_KEY is not set — Aadhaar numbers will be stored unencrypted. Set this env var in production.')
      warned = true
    }
    return null
  }
  if (hex.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypt a plaintext value. Returns the encrypted string or the original
 * value unchanged if no key is configured.
 *
 * @param {string | null | undefined} value
 * @returns {string | null | undefined}
 */
export function encrypt(value) {
  if (value == null || value === '') return value
  const key = getKey()
  if (!key) return value   // no-op if key not configured

  const iv = randomBytes(12)   // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

/**
 * Decrypt a value encrypted by `encrypt()`. Returns the original value if
 * it wasn't encrypted (no key, or value is plaintext).
 *
 * @param {string | null | undefined} value
 * @returns {string | null | undefined}
 */
export function decrypt(value) {
  if (value == null || value === '') return value
  const key = getKey()
  if (!key) return value   // no-op if key not configured

  const parts = String(value).split(':')
  if (parts.length !== 3) return value   // not in our format — return as-is

  try {
    const [ivHex, authTagHex, cipherHex] = parts
    const iv       = Buffer.from(ivHex,      'hex')
    const authTag  = Buffer.from(authTagHex, 'hex')
    const cipher   = Buffer.from(cipherHex,  'hex')
    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(cipher), decipher.final()]).toString('utf8')
  } catch {
    // If decryption fails (wrong key, corrupt data) return as-is rather than crashing
    return value
  }
}
