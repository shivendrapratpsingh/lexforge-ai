// The daily report only earns its place if it shouts when something is
// wrong. A digest that always says "all well" is worse than no digest,
// because it converts an outage into reassurance.
//
// So this injects the failures that actually happened in this project's
// history and checks the email says so.
import { PrismaClient } from '@prisma/client'
import { buildDailyDigest, digestEmail } from '../lib/digest.js'

const prisma = new PrismaClient()
const made = []
let fails = 0
const check = (n, cond) => {
  if (!cond) fails++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${n}`)
}

async function failedCalls(n, provider = 'groq') {
  for (let i = 0; i < n; i++) {
    const row = await prisma.apiUsage.create({
      data: { provider, operation: 'generate', calls: 1, costPaise: 0, ok: false },
    })
    made.push(row.id)
  }
}

try {
  // ── a quiet day ────────────────────────────────────────────────
  const quiet = await buildDailyDigest()
  const quietMail = digestEmail(quiet)
  console.log(`baseline: ${quiet.alerts.length} alert(s) — "${quietMail.subject}"\n`)

  // ── the Groq outage, as it actually happened ───────────────────
  // Every AI call failing, with nothing crashing and no error surfacing.
  await failedCalls(12)
  const broken = await buildDailyDigest()
  const brokenMail = digestEmail(broken)

  check('a wave of failed calls raises an alert',
    broken.alerts.some(a => /upstream calls failed/i.test(a)))
  check('the success rate drops below 90%', broken.upstream.successRate < 90)
  check('the provider is named', broken.alerts.some(a => /groq/i.test(a)))
  check('the subject line says something is wrong, not "all well"',
    /need/i.test(brokenMail.subject) && !/all well/.test(brokenMail.subject))
  check('the failure count reaches the body', /12 of/.test(brokenMail.text))

  console.log(`\n  subject: "${brokenMail.subject}"`)
  brokenMail.text.split('\n').filter(l => l.trim().startsWith('•')).forEach(l => console.log('  ' + l.trim()))

  // ── people here, nothing produced ──────────────────────────────
  // The signal that would have caught it on day one: users active, zero
  // documents generated. Those failed rows carry a userId, so the digest
  // sees somebody trying and nothing coming out.
  const someone = await prisma.user.findFirst({ select: { id: true } })
  if (someone) {
    const row = await prisma.apiUsage.create({
      data: { provider: 'groq', operation: 'generate', calls: 1, costPaise: 0, ok: false, userId: someone.id },
    })
    made.push(row.id)
    const d = await buildDailyDigest()
    const todaysDrafts = d.drafts.new
    check('active users with no documents is called out',
      todaysDrafts > 0 || d.alerts.some(a => /not one document/i.test(a)))
    if (todaysDrafts > 0) console.log('      (drafts were created today, so this alert correctly stayed silent)')
  }

  // ── a failed legal sync ────────────────────────────────────────
  const sync = await prisma.legalSyncRun.create({
    data: { job: 'acts', ok: false, error: 'India Code responded 404', finishedAt: new Date() },
  })
  const withSync = await buildDailyDigest()
  check('a failed sync is reported', withSync.alerts.some(a => /sync failed/i.test(a)))
  check('with the actual reason', withSync.alerts.some(a => /404/.test(a)))
  await prisma.legalSyncRun.delete({ where: { id: sync.id } })

  // ── a college waiting for a reply ──────────────────────────────
  const req = await prisma.pilotRequest.create({
    data: { college: 'ZZ Digest Test College', contactName: 'T', contactEmail: 'zz@verify.invalid' },
  })
  const withPilot = await buildDailyDigest()
  check('a waiting college is surfaced', withPilot.alerts.some(a => /waiting for a reply/i.test(a)))
  await prisma.pilotRequest.delete({ where: { id: req.id } })

  check('html renders with no leftover placeholders', !/\$\{/.test(brokenMail.html))
} catch (e) {
  console.error('FAILED:', e.message)
  fails++
} finally {
  if (made.length) await prisma.apiUsage.deleteMany({ where: { id: { in: made } } })
  await prisma.$disconnect()
  console.log(fails ? `\n${fails} FAILED` : '\nthe digest shouts when it should')
  process.exitCode = fails ? 1 : 0
}
