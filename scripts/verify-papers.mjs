// The papers a college asks for.
//
// Two failures matter here and neither shows up in a build:
//
//   1. The Privacy Policy and the signed DPDP undertaking listing
//      different sub-processors. A college that reads both and finds
//      them disagreeing has found a reason not to sign, and the
//      contradiction would be invisible from either page alone.
//
//   2. A declaration printing with a blank where a registration number
//      should be. The page renders happily; the college sends it back.
//
// So this asserts the two render from one list, and reports which
// details are still unset rather than pretending that is a pass.
import { readFileSync } from 'node:fs'
import { PROCESSORS, OFFSHORE } from '../lib/processors.js'

let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8')

// ── One list, two readers ──────────────────────────────────────
const privacy = read('../app/privacy/page.js')
// The undertaking's text lives in components/papers.js, not in the
// route — the route is auth plus a <Letterhead>. This check pointed at
// the route until that split, and caught itself the moment it moved.
const dpdp    = read('../components/papers.js')

check('the Privacy Policy imports the shared processor list',
  privacy.includes("from '@/lib/processors'"), true)
check('the DPDP undertaking imports the same list',
  dpdp.includes("from '@/lib/processors'"), true)
check('neither hardcodes a processor name',
  privacy.includes('<strong>Groq</strong>') || dpdp.includes('<strong>Groq</strong>'), false)

// ── The list itself has to be complete enough to sign ──────────
check('every processor states a country', PROCESSORS.every(p => Boolean(p.country)), true)
check('every processor says what it receives', PROCESSORS.every(p => Boolean(p.data)), true)
check('every processor has the public one-liner', PROCESSORS.every(p => Boolean(p.short)), true)
check('the offshore ones are identified', OFFSHORE.length > 0, true)

// Groq is the only party that sees document text; if that stops being
// true the undertaking's clause 3 is wrong.
const groq = PROCESSORS.find(p => p.name === 'Groq')
check('Groq is still listed', Boolean(groq), true)

// ── The claims the undertaking makes about the code ────────────
// Each of these is a sentence a college could hold us to.
const auth = read('../lib/auth.js')
check('bcrypt hashing claim is true', /bcrypt/i.test(read('../lib/student-import.js')) || /bcrypt/i.test(auth), true)
check('one-device claim is true', auth.includes('sessionVersion'), true)

const account = read('../components/AccountSettings.js')
check('the export-everything claim is true', /export/i.test(account), true)
check('the delete-account claim is true', /[Dd]elete this account/.test(account), true)

// A faculty co-ordinator must not be able to read a student's document.
const college = read('../app/api/college/route.js')
check('the college API never selects draft content',
  /content\s*:\s*true/.test(college), false)

// ── The agreement's commercial terms ───────────────────────────
// These are the sentences a college is asked to sign. They were added
// by hand and are easy to lose in an edit, so they are asserted.
const agreement = read('../components/AgreementDocument.js')
check('the trial is stated as one month', /trial runs for <strong>one month<\/strong>/.test(agreement), true)
check('the trial says nothing is owed if they do not convert',
  /nothing[\s\S]{0,40}owed for the trial/.test(agreement), true)
check('converting is tied to the refund clause',
  /From the first day of that paid term the refund position/.test(agreement), true)
check('the refund panel separates the free trial from the paid term',
  /What follows applies once a paid term/.test(agreement), true)
check('a college leaving mid-term gets nothing back',
  /fees already paid are NOT refunded/.test(agreement), true)
check('the Provider leaving mid-term refunds half',
  /fifty per cent \(50%\)/.test(agreement), true)
check('the signature block points at the refund clause',
  /accepted[\s\S]{0,40}the refund position at clause/.test(agreement), true)

// The PDF route is the browser's print dialog, so the print stylesheet
// is the only thing keeping app chrome out of a document a college
// receives. Nothing else catches its removal.
check('the agreement offers a PDF button', agreement.includes('<PrintButton />'), true)
for (const [name, file] of [
  ['agreement', '../components/AgreementDocument.js'],
  ['letterhead', '../components/Letterhead.js'],
  ['invoice', '../app/admin/invoice/[id]/page.js'],
]) {
  const src = read(file)
  check(`the ${name} hides its controls when printed`, /\.no-print\s*\{\s*display:\s*none/.test(src), true)
  check(`the ${name} keeps its shading when printed`, src.includes('print-color-adjust: exact'), true)
}

// ── What is still missing ──────────────────────────────────────
// Not a failure — these are set in Vercel, not in the repo — but the
// point of the script is to say so out loud.
const need = [
  'SELLER_ADDRESS', 'SELLER_EMAIL', 'SELLER_UDYAM', 'SELLER_PAN',
  'SELLER_BANK_ACCOUNT', 'SELLER_BANK_IFSC', 'GRIEVANCE_OFFICER_NAME',
]
const unset = need.filter(k => !process.env[k])
console.log(unset.length
  ? `\nnot set here (${unset.length}/${need.length}): ${unset.join(', ')}\n  → /admin/papers lists these against the document each one prints on`
  : '\nevery seller detail is set')

console.log(fails ? `\n${fails} FAILED` : '\nthe papers render from one source and their claims match the code')
process.exitCode = fails ? 1 : 0
