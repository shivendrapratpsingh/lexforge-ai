// Invoice numbering, totals, and the amount-in-words line a finance
// officer checks the figures against.
import { PrismaClient } from '@prisma/client'
import {
  financialYear, nextInvoiceNumber, computeTotals, amountInWords, rupees,
} from '../lib/invoicing.js'

const prisma = new PrismaClient()
let fails = 0
const check = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}
const made = { insts: [], invoices: [] }

try {
  // ── financial year ─────────────────────────────────────────────
  // India runs April–March, so a January invoice belongs to the year
  // that started the previous April.
  check('April starts a new year', financialYear(new Date('2026-04-01')), '2026-27')
  check('March is still the old one', financialYear(new Date('2026-03-31')), '2025-26')
  check('January belongs to the year before', financialYear(new Date('2027-01-15')), '2026-27')

  // ── totals ─────────────────────────────────────────────────────
  check('seats times rate', computeTotals({ seats: 300, unitPaise: 30000, taxPercent: 0 }).amountPaise, 9000000)
  const withGst = computeTotals({ seats: 100, unitPaise: 50000, taxPercent: 18 })
  check('GST is added, not included', withGst.taxPaise, 900000)
  check('and the total carries it', withGst.totalPaise, 5900000)
  check('no registration means no tax', computeTotals({ seats: 10, unitPaise: 10000, taxPercent: 0 }).taxPaise, 0)

  // ── amount in words ────────────────────────────────────────────
  // Lakh and crore, because this is read by an Indian finance officer.
  check('simple', amountInWords(50000), 'Five Hundred Rupees Only')
  check('thousands', amountInWords(1250000), 'Twelve Thousand Five Hundred Rupees Only')
  check('a lakh', amountInWords(15000000), 'One Lakh Fifty Thousand Rupees Only')
  check('a crore', amountInWords(1250000000), 'One Crore Twenty Five Lakh Rupees Only')  // ₹1,25,00,000
  check('paise are named', amountInWords(50050), 'Five Hundred Rupees and Fifty Paise Only')
  check('teens are not two words', amountInWords(1700000), 'Seventeen Thousand Rupees Only')
  check('zero says so', amountInWords(0), 'Zero Rupees Only')
  check('Indian digit grouping', rupees(12345600), '1,23,456.00')

  // ── numbering ──────────────────────────────────────────────────
  const inst = await prisma.institution.create({
    data: { name: 'ZZ Invoice Test', slug: 'zz-inv-' + Date.now(), emailDomains: '', joinCode: 'ZZTE-ST' + Math.floor(Math.random() * 9) },
  })
  made.insts.push(inst.id)

  const n1 = await nextInvoiceNumber(prisma)
  const totals = computeTotals({ seats: 300, unitPaise: 30000, taxPercent: 0 })
  const iv1 = await prisma.invoice.create({
    data: {
      number: n1, institutionId: inst.id, description: 'Annual licence', seats: 300,
      unitPaise: 30000, ...totals, issuedAt: new Date(),
    },
  })
  made.invoices.push(iv1.id)
  check('numbers are prefixed by the financial year', n1.startsWith(`LF/${financialYear()}/`), true)
  check('and zero-padded', /\/\d{4}$/.test(n1), true)

  const n2 = await nextInvoiceNumber(prisma)
  check('the series advances', Number(n2.split('/')[2]), Number(n1.split('/')[2]) + 1)

  // A cancelled invoice must keep its number — reusing it is the one
  // thing a sequential series exists to prevent.
  await prisma.invoice.update({ where: { id: iv1.id }, data: { status: 'cancelled' } })
  const n3 = await nextInvoiceNumber(prisma)
  check('a cancelled invoice does not free its number', n3, n2)
} catch (e) {
  console.error('FAILED:', e.message)
  fails++
} finally {
  if (made.invoices.length) await prisma.invoice.deleteMany({ where: { id: { in: made.invoices } } })
  if (made.insts.length) await prisma.institution.deleteMany({ where: { id: { in: made.insts } } })
  await prisma.$disconnect()
  console.log(fails ? `\n${fails} FAILED` : '\ninvoicing behaves')
  process.exitCode = fails ? 1 : 0
}
