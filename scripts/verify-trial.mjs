// The trial has to be able to END.
//
// That sounds obvious and was not true. Students imported from a
// college's spreadsheet are linked by institutionId and usually have a
// personal Gmail — no domain to match, no invite row — and
// institutionForEmail did not look at institutionId at all. It returned
// null for exactly the students a college is paying for.
//
// The import hid that by stamping tier='pro' on every student, which
// hasProAccess honours before it ever consults the institution. The
// result: expiring a trial revoked nothing, and a trial that cannot end
// is a giveaway rather than a sales motion.
//
// So this walks the whole lifecycle: active trial grants Pro, expired
// trial takes it away, conversion restores it, and no student account
// is touched at any point.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { isActive, institutionGrantsPro } from '../lib/institutions.js'
import { hasProAccess } from '../lib/admin.js'
import { applyStudentImport } from '../lib/student-import.js'

const prisma = new PrismaClient()
// Neon's free tier suspends; the first query after that can time out.
for (let i = 0; i < 3; i++) {
  try { await prisma.$queryRawUnsafe('SELECT 1'); break } catch { await new Promise(r => setTimeout(r, 3000)) }
}

const TAG = 'zztrial' + Date.now().toString(36)
const made = []
let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

try {
  // Pro enforcement must be ON for any of this to mean anything — with
  // it off, hasProAccess returns true for everybody and the test would
  // pass while proving nothing.
  const cfg = await prisma.systemConfig.findUnique({ where: { id: 'default' } })
  const wasEnforcing = cfg.proEnforcementEnabled
  await prisma.systemConfig.update({ where: { id: 'default' }, data: { proEnforcementEnabled: true } })

  const inst = await prisma.institution.create({
    data: {
      name: 'ZZ Trial College', slug: TAG, emailDomains: '',
      plan: 'pilot', endsAt: new Date(Date.now() + 30 * 86400000),
    },
  })
  made.push(inst.id)

  // A student as the importer creates one: personal Gmail-style address,
  // no domain match, no invite — linked only by institutionId.
  const email = `${TAG}@gmail.com`
  await applyStudentImport({
    institutionId: inst.id,
    students: [{ email, password: 'Trial@2027', name: 'Ravi Kumar', batch: 'BA LLB 2027' }],
    prisma, bcrypt,
  })
  const student = await prisma.user.findUnique({ where: { email } })

  check('the student is linked to the college', student.institutionId, inst.id)
  check('and is NOT given a standalone pro tier', student.tier, 'free')

  // ── during the trial ──────────────────────────────────────────
  check('an active trial is active', isActive(inst), true)
  check('a personal-email student still matches the college',
    Boolean(await institutionGrantsPro(email)), true)
  check('and therefore has Pro', await hasProAccess(email, student.tier), true)

  // ── after it ends ─────────────────────────────────────────────
  const expired = await prisma.institution.update({
    where: { id: inst.id }, data: { endsAt: new Date(Date.now() - 86400000) },
  })
  check('an expired trial is not active', isActive(expired), false)
  check('the college no longer grants Pro', await institutionGrantsPro(email), null)

  const after = await prisma.user.findUnique({ where: { email } })
  check('THE STUDENT LOSES PRO', await hasProAccess(email, after.tier), false)
  check('but the account survives', Boolean(after), true)
  check('and stays linked, so re-activating restores it', after.institutionId, inst.id)

  // ── conversion ────────────────────────────────────────────────
  await prisma.institution.update({
    where: { id: inst.id }, data: { plan: 'paid', endsAt: new Date(Date.now() + 365 * 86400000) },
  })
  const converted = await prisma.user.findUnique({ where: { email } })
  check('conversion restores Pro', await hasProAccess(email, converted.tier), true)
  check('without touching the student row', converted.password, student.password)

  await prisma.systemConfig.update({ where: { id: 'default' }, data: { proEnforcementEnabled: wasEnforcing } })
} catch (e) {
  console.error('FAILED:', e.message)
  fails++
} finally {
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG } } })
  if (made.length) await prisma.institution.deleteMany({ where: { id: { in: made } } })
  await prisma.$disconnect()
  console.log(fails ? `\n${fails} FAILED` : '\na trial can begin, end, and be converted')
  process.exitCode = fails ? 1 : 0
}
