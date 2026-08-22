// Break-glass. Sets a new password on any account, straight in the
// database, for when nothing else can get you back in.
//
// This is the last resort and the only one that cannot be locked out,
// because it needs no email, no security answer and no session — only
// DATABASE_URL, which is yours.
//
// Recovery in this app is by security question; there are no reset
// tokens, because a long-lived token sitting in the users table is a
// breach waiting for someone to read it. That is the right trade, but
// it means an account with no security answer set has no way back at
// all. This is that way back.
//
//   npx dotenv -e .env.local -- node scripts/reset-admin-password.mjs you@example.com
//
// The password is typed at a prompt and never appears in a command, so
// it stays out of your shell history and out of any process listing.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import readline from 'node:readline'
import { Writable } from 'node:stream'

const email = (process.argv[2] || '').trim().toLowerCase()
if (!email) {
  console.error('Usage: node scripts/reset-admin-password.mjs <email>')
  process.exit(1)
}

// Echo suppressed so the password is not left on screen or in a scrollback.
function askHidden(question) {
  return new Promise(resolve => {
    let muted = false
    const out = new Writable({
      write(chunk, enc, cb) { if (!muted) process.stdout.write(chunk, enc); cb() },
    })
    const rl = readline.createInterface({ input: process.stdin, output: out, terminal: true })
    rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer) })
    muted = true
  })
}

const prisma = new PrismaClient()
try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, securityQuestion: true },
  })
  if (!user) {
    console.error(`No account for ${email}.`)
    process.exit(1)
  }

  console.log(`Account: ${user.name || '(no name)'} <${user.email}>`)
  console.log(`Security question: ${user.securityQuestion || 'NOT SET — set one at /account once you are back in'}`)

  const pw = await askHidden('New password (at least 8 characters): ')
  if (!pw || pw.length < 8) {
    console.error('Too short. Nothing changed.')
    process.exit(1)
  }
  const again = await askHidden('Type it again: ')
  if (pw !== again) {
    console.error('They do not match. Nothing changed.')
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Same cost as registration uses, so this password is no weaker
      // than one set through the app.
      password: await bcrypt.hash(pw, 12),
      passwordChangedAt: new Date(),
      // Any recovery lockout from failed attempts is cleared too —
      // otherwise getting back in could still leave you shut out of
      // recovery afterwards.
      securityAttempts: 0,
      securityLockedUntil: null,
    },
  })

  console.log(`\nDone. Sign in at /login as ${user.email}.`)
  if (!user.securityQuestion) {
    console.log('Then set a security question at /account — this script should not be the only way back.')
  }
} finally {
  await prisma.$disconnect()
}
