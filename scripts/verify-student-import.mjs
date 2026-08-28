// A college's spreadsheet, end to end.
//
// Builds the file a real college would send — a title row above the
// headings, inconsistent heading spellings, a blank row in the middle,
// a duplicate, a bad address, and a totals row at the bottom — then
// imports it, re-imports a shorter one, and checks what happened to
// everybody.
//
// Runs on throwaway rows and deletes them.
import ExcelJS from 'exceljs'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { parseStudentSheet, applyStudentImport } from '../lib/student-import.js'

const prisma = new PrismaClient()
const TAG = 'zzimp' + Date.now().toString(36)
const mail = (n) => `${TAG}-${n}@verify.invalid`

let fails = 0
const check = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

async function sheet(rows) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Students')
  rows.forEach(r => ws.addRow(r))
  return Buffer.from(await wb.xlsx.writeBuffer())
}

const made = []
try {
  const inst = await prisma.institution.create({
    data: { name: 'ZZ Import College', slug: 'zz-imp-' + Date.now(), emailDomains: '', plan: 'paid' },
  })
  made.push(inst.id)

  // ── the messy file a college actually sends ────────────────────
  const buf = await sheet([
    ['ZZ Law College — BA LLB Student List 2027'],   // a title, above the headings
    [],                                              // a blank line
    ['S.No', 'Student Name', 'E-Mail ID', 'Password', 'Roll No.', 'Batch'],
    [1, 'Ravi Kumar',    mail('a'), 'Ravi@2027',  'BA101', 'BA LLB 2027'],
    [2, 'Sunita Rao',    mail('b'), 'Sunita#27',  'BA102', 'BA LLB 2027'],
    [],                                              // blank row mid-list
    [3, 'Imran Sheikh',  mail('c'), 'Imran@2027', 'BA103', 'BA LLB 2027'],
    [4, 'Duplicate',     mail('a'), 'x1234567',   'BA104', 'BA LLB 2027'],  // repeat
    [5, 'Bad Address',   'not-an-email', 'y1234567', 'BA105', ''],          // invalid
    [6, 'Short Pass',    mail('d'), '123',        'BA106', ''],             // too short
    [7, 'No Password',   mail('e'), '',           'BA107', 'BA LLB 2027'],  // blank -> generated
    ['', 'TOTAL: 7', '', '', '', ''],                                        // totals row
  ])

  const parsed = await parseStudentSheet(buf, 'students.xlsx')
  check('finds the heading row below a title and a blank', parsed.headings.includes('email'), true)
  check('reads the good rows', parsed.students.length, 4)          // a, b, c, e
  check('rejects duplicate, bad email and short password', parsed.errors.length, 3)
  check('a blank password becomes a generated one', parsed.students.find(s => s.email === mail('e')).password, null)
  check('name and batch are picked up', parsed.students[0].name, 'Ravi Kumar')

  // ── apply ──────────────────────────────────────────────────────
  const r1 = await applyStudentImport({
    institutionId: inst.id, students: parsed.students, batch: null, prisma, bcrypt,
  })
  check('creates an account for each good row', r1.created, 4)
  check('nothing removed on a first import', r1.removed, 0)
  check('generated passwords are returned once', r1.credentials.filter(c => c.generated).length, 1)

  const ravi = await prisma.user.findUnique({ where: { email: mail('a') } })
  // NOT tier='pro'. Access comes from the college being active, checked
  // at request time, so that an expiring trial actually revokes it —
  // see scripts/verify-trial.mjs. Stamping the column made access
  // permanent and a trial impossible to end.
  check('the student carries no standalone pro tier', ravi.tier, 'free')
  const { institutionGrantsPro } = await import('../lib/institutions.js')
  check('but the college grants them Pro', Boolean(await institutionGrantsPro(mail('a'))), true)
  check('and linked to the college', ravi.institutionId, inst.id)
  check('and must onboard before using the app', ravi.mustOnboard, true)
  check('the spreadsheet password works', await bcrypt.compare('Ravi@2027', ravi.password), true)
  check('and is NOT stored in the clear', ravi.password.startsWith('$2'), true)

  // ── someone who already had their own account ──────────────────
  const own = await prisma.user.create({
    data: { email: mail('z'), name: 'Prior User', password: await bcrypt.hash('theirOwnPassword', 12) },
  })
  const buf2 = await sheet([
    ['Email', 'Name', 'Password'],
    [mail('a'), 'Ravi Kumar', 'Ravi@2027'],
    [mail('b'), 'Sunita Rao', 'Sunita#27'],
    [mail('z'), 'Prior User', 'CollegeChosen1'],
  ])
  const p2 = await parseStudentSheet(buf2, 'term2.csv')
  const r2 = await applyStudentImport({ institutionId: inst.id, students: p2.students, prisma, bcrypt })

  check('an existing account is linked, not recreated', r2.relinked, 1)
  const prior = await prisma.user.findUnique({ where: { email: mail('z') } })
  check('and their own password is left alone', await bcrypt.compare('theirOwnPassword', prior.password), true)
  check('the college password does NOT overwrite it', await bcrypt.compare('CollegeChosen1', prior.password), false)

  // ── who fell off the list ──────────────────────────────────────
  check('students missing from the new list are removed', r2.removed, 2)   // c and e
  const gone = await prisma.user.findUnique({ where: { email: mail('c') } })
  check('removal unlinks rather than deletes', Boolean(gone), true)
  check('and drops them back to free', gone.tier, 'free')
  check('their institution link is cleared', gone.institutionId, null)

  console.log('\nremoved:', r2.removedEmails.length, 'accounts kept, access withdrawn')
} catch (e) {
  console.error('FAILED:', e.message)
  fails++
} finally {
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG } } })
  if (made.length) await prisma.institution.deleteMany({ where: { id: { in: made } } })
  await prisma.$disconnect()
  console.log(fails ? `\n${fails} FAILED` : '\nstudent import behaves')
  process.exitCode = fails ? 1 : 0
}
