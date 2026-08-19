// Join codes, seat limits, pilot requests, and the moot placeholder
// parser. Runs on throwaway rows and cleans up after itself.
import { PrismaClient } from '@prisma/client'
import { generateJoinCode, normaliseJoinCode, joinByCode } from '../lib/institutions.js'
import { extractPropositions } from '../lib/moot-placeholders.js'

const prisma = new PrismaClient()
let fails = 0
const check = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}
const cleanup = { users: [], insts: [], requests: [] }

try {
  // ── code shape ─────────────────────────────────────────────────
  const code = generateJoinCode()
  check('code is grouped for reading', /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code), true)
  check('no characters that get misread aloud', /[01OIL]/.test(code.replace('-', '')), false)
  check('lowercase and spaces forgiven', normaliseJoinCode(' lexf 2k9m '), 'LEXF-2K9M')
  check('a dash typed anywhere is fine', normaliseJoinCode('LE-XF2K9M'), 'LEXF-2K9M')
  check('too short is refused', normaliseJoinCode('ABC'), null)

  // ── joining ────────────────────────────────────────────────────
  const inst = await prisma.institution.create({
    data: {
      name: 'ZZ Join Test College', slug: 'zz-join-' + Date.now(),
      emailDomains: '', kind: 'college', plan: 'pilot', seats: 1, joinCode: code,
    },
  })
  cleanup.insts.push(inst.id)

  const mkUser = async (tag) => {
    const u = await prisma.user.create({
      data: { email: `zz-join-${tag}-${Date.now()}@verify.invalid`, name: 'join test', password: 'x' },
    })
    cleanup.users.push(u.id)
    return u
  }

  const student = await mkUser('a')
  const good = await joinByCode(student, code.toLowerCase(), prisma)
  check('a student joins with the code', good.institution?.id, inst.id)

  const wrong = await joinByCode(await mkUser('b'), 'ZZZZ-ZZZZ', prisma)
  check('an unknown code is refused', Boolean(wrong.error), true)

  // seats: 1, and the seat is taken
  const overflow = await joinByCode(await mkUser('c'), code, prisma)
  check('a full college turns the next student away', Boolean(overflow.error), true)
  check('and says why', /seats/.test(overflow.error || ''), true)

  // an expired pilot grants nothing
  await prisma.institution.update({ where: { id: inst.id }, data: { endsAt: new Date(Date.now() - 86400000), seats: 0 } })
  const expired = await joinByCode(await mkUser('d'), code, prisma)
  check('an expired plan cannot be joined', Boolean(expired.error), true)

  // ── pilot requests ─────────────────────────────────────────────
  const req = await prisma.pilotRequest.create({
    data: { college: 'ZZ Verify Law College', contactName: 'Test', contactEmail: 'zz@verify.invalid', role: 'society' },
  })
  cleanup.requests.push(req.id)
  check('a request lands as new', req.status, 'new')
  const moved = await prisma.pilotRequest.update({ where: { id: req.id }, data: { status: 'contacted' } })
  check('and can be moved along', moved.status, 'contacted')

  // ── moot placeholders ──────────────────────────────────────────
  const memorial = `
ARGUMENTS ADVANCED
1. The detention is bad in law [FIND AUTHORITY — preventive detention requires contemporaneous supply of grounds].
2. Delay vitiates the order [FIND AUTHORITY - unexplained delay in considering a representation vitiates detention].
3. Repeated for good measure [FIND AUTHORITY — preventive detention requires contemporaneous supply of grounds].
4. Nothing here.
`
  const props = extractPropositions(memorial)
  check('every placeholder is found, whatever dash it used', props.length, 2)
  check('duplicates are not searched twice', new Set(props).size, 2)
  check('the proposition is what gets searched', props[0], 'preventive detention requires contemporaneous supply of grounds')
  check('no placeholders means no panel', extractPropositions('plain memorial text').length, 0)
} catch (e) {
  console.error('FAILED:', e.message)
  fails++
} finally {
  if (cleanup.users.length) await prisma.user.deleteMany({ where: { id: { in: cleanup.users } } })
  if (cleanup.requests.length) await prisma.pilotRequest.deleteMany({ where: { id: { in: cleanup.requests } } })
  if (cleanup.insts.length) await prisma.institution.deleteMany({ where: { id: { in: cleanup.insts } } })
  await prisma.$disconnect()
  console.log(fails ? `\n${fails} FAILED` : '\ncollege tier behaves')
  process.exitCode = fails ? 1 : 0
}
