// Server-only half of the security-question logic. Kept apart from
// ./security-question so client components can import the question text
// without pulling bcrypt into the browser bundle.
import bcrypt from 'bcryptjs'
import { normaliseAnswer } from './security-question.js'

// Same cost as the password hash: the answer can set a new password, so
// it is worth exactly as much to an attacker as the password itself.
const COST = 12

export async function hashAnswer(answer) {
  return bcrypt.hash(normaliseAnswer(answer), COST)
}

export async function verifyAnswer(answer, hash) {
  if (!hash) return false
  // bcrypt.compare is constant-time over the digest.
  return bcrypt.compare(normaliseAnswer(answer), hash)
}
