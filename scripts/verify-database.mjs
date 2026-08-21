// What the database will and will not survive on launch day.
//
// Two things kill a Postgres-behind-serverless setup, and neither shows
// up in development: connection exhaustion when many instances each open
// their own connection, and the free tier's autosuspend, which makes the
// first request after an idle period pay a cold start.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const url = process.env.DATABASE_URL || ''

// Neon's pooler endpoint has "-pooler" in the host. Without it, every
// serverless instance holds its own direct connection and the limit is
// reached long before the traffic is interesting.
const pooled = /-pooler\./.test(url)
console.log(`Connection:  ${pooled ? 'POOLED — correct for serverless' : 'DIRECT — will exhaust connections under load'}`)
console.log(`Host:        ${(url.match(/@([^/?]+)/) || [])[1] || 'unknown'}`)

// First query pays whatever wake-up cost there is; the rest are warm.
const t0 = Date.now()
await prisma.$queryRawUnsafe('SELECT 1')
const first = Date.now() - t0

const warm = []
for (let i = 0; i < 5; i++) {
  const t = Date.now()
  await prisma.$queryRawUnsafe('SELECT 1')
  warm.push(Date.now() - t)
}
const avgWarm = Math.round(warm.reduce((a, b) => a + b, 0) / warm.length)

console.log(`\nFirst query: ${first} ms${first > 800 ? '  ← cold start, the database had suspended' : ''}`)
console.log(`Warm query:  ${avgWarm} ms average over ${warm.length}`)

// A real query, not SELECT 1 — this is what a page load actually costs.
const t1 = Date.now()
const [users, drafts] = await Promise.all([prisma.user.count(), prisma.draft.count()])
console.log(`Dashboard-style read: ${Date.now() - t1} ms`)

const size = await prisma.$queryRawUnsafe(`
  SELECT pg_database_size(current_database()) AS bytes,
         pg_size_pretty(pg_database_size(current_database())) AS pretty,
         (SELECT pg_total_relation_size('"Draft"')) AS draft_bytes`)

const bytes = Number(size[0].bytes)
const draftBytes = Number(size[0].draft_bytes)
const perDraft = drafts ? Math.round(draftBytes / drafts) : 0
const FREE_TIER = 512 * 1024 * 1024

console.log(`\nDatabase:    ${size[0].pretty} of 512 MB free tier (${(bytes / FREE_TIER * 100).toFixed(1)}% used)`)
console.log(`Drafts:      ${drafts} rows, about ${(perDraft / 1024).toFixed(1)} KB each`)
if (perDraft) {
  const room = Math.floor((FREE_TIER - bytes) / perDraft)
  console.log(`Headroom:    roughly ${room.toLocaleString()} more documents before the free tier is full`)
}
console.log(`Users:       ${users}`)

console.log(`
Autosuspend: Neon's free tier suspends compute after about 5 minutes idle.
The next request wakes it, which is the cold start measured above. At
launch, with steady traffic, it rarely suspends — the person it hurts is
the first visitor of the morning, and the reviewer opening your site once.`)

await prisma.$disconnect()
