// ─────────────────────────────────────────────────────────────────
//  What the assistant is allowed to send somebody to.
//
//  resolveAction is the only thing standing between a model's JSON and
//  a router.push. Every case here is a way that could go wrong: an
//  invented document type, a parameter that was never declared, an
//  off-site href smuggled through a field that looks harmless.
//
//  Run:  node scripts/test-assistant-actions.mjs
// ─────────────────────────────────────────────────────────────────
import { resolveAction, ACTIONS, actionCatalogueForPrompt, ACTION_EXAMPLES } from '../lib/assistant-actions.js'
import { DOC_FIELDS } from '../lib/document-fields.js'

let pass = 0, fail = 0
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log(`  ok   ${name}`) }
  else { fail++; console.log(`  FAIL ${name}\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`) }
}
function checkHref(name, raw, wantHref) {
  const r = resolveAction(raw)
  check(name, r && r.href, wantHref)
}
function checkNull(name, raw) {
  const r = resolveAction(raw)
  if (r === null) { pass++; console.log(`  ok   ${name}`) }
  else { fail++; console.log(`  FAIL ${name}\n        expected null, got ${JSON.stringify(r)}`) }
}

console.log('\nGARBAGE IN')
for (const [name, raw] of [
  ['null',                 null],
  ['a string',             'draft'],
  ['an array',             [{ action: 'draft' }]],
  ['unknown action',       { action: 'wipe_database', args: {} }],
  ['no args at all',       { action: 'draft' }],
  ['empty required field', { action: 'act', args: { query: '' } }],
  ['whitespace query',     { action: 'act', args: { query: '   ' } }],
  ['prototype pollution',  { action: '__proto__', args: {} }],
]) checkNull(name, raw)

console.log('\nINVENTED VALUES ARE REFUSED')
checkNull('a document type that does not exist', { action: 'draft', args: { documentType: 'EVICTION_ORDER' } })
checkNull('a lowercase doc type',                { action: 'draft', args: { documentType: 'legal_notice' } })
checkNull('an analyser that does not exist',     { action: 'analyse', args: { tool: 'summarise' } })
checkNull('a moot problem too short to be one',  { action: 'moot', args: { problem: 'contract dispute' } })

console.log('\nUNDECLARED PARAMETERS ARE DROPPED')
checkHref('a stray param cannot reach the URL',
  { action: 'act', args: { query: 'Section 138 NI Act', redirect: 'https://evil.example', admin: true } },
  '/acts?q=Section%20138%20NI%20Act')
checkHref('court is not a draft-only smuggling route',
  { action: 'caselaw', args: { query: 'anticipatory bail', court: 'SUPREME_COURT' } },
  '/case-law?q=anticipatory%20bail')

console.log('\nHREFS STAY ON THIS SITE')
for (const q of ['//evil.example/x', 'https://evil.example', 'javascript:alert(1)', '../../etc/passwd']) {
  const r = resolveAction({ action: 'act', args: { query: q } })
  if (r && !r.href.startsWith('/acts?')) { fail++; console.log(`  FAIL escaped with ${q} -> ${r.href}`) }
  else { pass++; console.log(`  ok   contained: ${q}`) }
}

console.log('\nTHE HAPPY PATH')
checkHref('draft with type only',
  { action: 'draft', args: { documentType: 'LEGAL_NOTICE' } },
  '/new-draft?type=LEGAL_NOTICE')
checkHref('draft carrying court, language and facts',
  { action: 'draft', args: {
      documentType: 'RENT_AGREEMENT', court: 'PRAYAGRAJ_HC', language: 'hindi',
      fields: { landlordName: 'Ram Prasad', monthlyRent: '12000' } } },
  '/new-draft?type=RENT_AGREEMENT&court=PRAYAGRAJ_HC&language=hindi&prefill=%7B%22landlordName%22%3A%22Ram+Prasad%22%2C%22monthlyRent%22%3A%2212000%22%7D')
checkHref('english is the default, so it is not carried',
  { action: 'draft', args: { documentType: 'AFFIDAVIT', language: 'english' } },
  '/new-draft?type=AFFIDAVIT')
checkHref('analyse an order',
  { action: 'analyse', args: { tool: 'order', text: 'The application is rejected.' } },
  '/tools?tool=order&prefill=%7B%22text%22%3A%22The+application+is+rejected.%22%7D')
checkHref('study defaults to the tutor',
  { action: 'study', args: { topic: 'doctrine of basic structure' } },
  '/study?topic=doctrine+of+basic+structure')
checkHref('study a quiz',
  { action: 'study', args: { topic: 'BNS 2023', mode: 'quiz' } },
  '/study?topic=BNS+2023&tab=quiz')
checkHref('legal Q&A',
  { action: 'qa', args: { question: 'Is a WhatsApp message admissible under the BSA?' } },
  '/future-lawyer/qa?q=Is%20a%20WhatsApp%20message%20admissible%20under%20the%20BSA%3F')

console.log('\nFIELD HYGIENE')
const r = resolveAction({ action: 'draft', args: { documentType: 'LEGAL_NOTICE', fields: {
  good: 'kept', blank: '   ', nothing: null, missing: undefined,
  huge: 'x'.repeat(5000),
} } })
const f = JSON.parse(new URL('http://x' + r.href).searchParams.get('prefill'))
check('empty and null fields are dropped', Object.keys(f).sort(), ['good', 'huge'])
check('a runaway value is capped', f.huge.length, 2000)
checkNull('fields as an array is refused', { action: 'draft', args: { documentType: 'PIL', fields: ['a'] } })

console.log('\nTHE PROMPT MENU MATCHES THE CODE')
const menu = actionCatalogueForPrompt()
for (const id of Object.keys(ACTIONS)) {
  if (menu.includes(`"${id}"`)) { pass++; console.log(`  ok   ${id} is offered to the model`) }
  else { fail++; console.log(`  FAIL ${id} exists but the model is never told about it`) }
}

console.log('')
console.log('THE PROMPT EXAMPLES ARE THEMSELVES VALID')
// An example that does not resolve is worse than no example: it teaches
// the model to emit a block that is then silently thrown away.
for (const e of ACTION_EXAMPLES) {
  const label = e.user.slice(0, 46)
  if (e.action === null) { pass++; console.log('  ok   ' + label + ' -- no block, as intended'); continue }
  const r = resolveAction(e.action)
  if (!r) { fail++; console.log('  FAIL ' + label + ' -- example does not resolve'); continue }
  pass++; console.log('  ok   ' + label + ' -> ' + r.href.slice(0, 52))

  // A draft example teaches field names. Wrong ones survive
  // resolveAction and are then dropped by the /new-draft page, so the
  // user gets an empty form and nothing says why.
  const t = e.action.args && e.action.args.documentType
  const fields = e.action.args && e.action.args.fields
  if (t && fields) {
    const real = new Set((DOC_FIELDS[t] || []).map(f => f.name))
    const wrong = Object.keys(fields).filter(k => !real.has(k))
    if (wrong.length) { fail++; console.log('  FAIL ' + t + ' example uses field names that do not exist: ' + wrong.join(', ')) }
    else { pass++; console.log('  ok   ' + t + ' field names are real') }
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
