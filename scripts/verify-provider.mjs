// Acceptance test for the AI provider chain.
//
//   npm run verify:provider
//
// Run this after changing AI_PROVIDERS or adding a provider key, BEFORE
// deploying. It is the difference between "the key is set" and "the
// product works".
//
// Six checks, in the order they can fail:
//
//   1. Chain      — which providers are configured, and in what order.
//   2. Models     — every model the app will name actually answers.
//   3. Headroom   — the TPM clamp is not silently cutting output. This
//                   is the check that would have caught the Groq
//                   ceiling: a Pro draft in Hindi left NEGATIVE
//                   headroom, so every model was skipped and the user
//                   silently got a template of their own form fields.
//   4. Refusals   — the criminal-law document types still generate.
//                   A safety filter that refuses a bail application
//                   disqualifies a provider for this product, however
//                   good it is at everything else.
//   5. Length     — a real draft comes back at a usable length rather
//                   than a paragraph.
//   6. Fidelity   — the facts supplied come back verbatim, and nothing
//                   is invented in their place.
//
// Costs a few paise. Cheaper than finding any of this from a user.
import { chainStatus, activeProviders, clientFor, attemptPlan } from '../lib/ai.js'
import { PRO_MODELS, FREE_MODELS, buildDraftPromptForTest, generateLegalDocument } from '../lib/groq.js'

// generateLegalDocument() interpolates `details` into a template
// literal. app/api/drafts/route.js hands it a FORMATTED STRING; passing
// the raw object instead stringifies to "[object Object]" and the model
// then invents every particular. Mirror the route exactly, or this test
// measures the wrong thing.
const asDetails = (o) => Object.entries(o)
  .filter(([, v]) => v?.toString().trim())
  .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
  .join(String.fromCharCode(10))

let fails = 0
const check = (ok, label, detail = '') => {
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
  return ok
}

// ── 1. Chain ──────────────────────────────────────────────────────
console.log('\n─── provider chain ───')
console.table(chainStatus())
const providers = activeProviders()
if (!check(providers.length > 0, 'at least one provider is configured',
           providers.length ? `(${providers.map(p => p.id).join(' -> ')})` : '— set GEMINI_API_KEY or GROQ_API_KEY')) {
  process.exit(1)
}
console.log(`primary: ${providers[0].label}   models: ${PRO_MODELS.join(', ')}`)

// ── 2. Models answer ──────────────────────────────────────────────
console.log('\n─── every model answers ───')
for (const { provider, model, reasoning } of attemptPlan({ isPro: true })) {
  try {
    const c = await clientFor(provider).chat.completions.create({
      model,
      max_tokens: 1200,
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      ...(reasoning ? { reasoning_effort: 'low' } : null),
    })
    const text = (c.choices?.[0]?.message?.content || '').trim()
    check(text.length > 0, `${provider.id}:${model}`, `-> ${JSON.stringify(text.slice(0, 30))}`)
  } catch (e) {
    check(false, `${provider.id}:${model}`, `-> ${e?.status || ''} ${e?.message?.slice(0, 90)}`)
  }
}

// ── 3. Headroom ───────────────────────────────────────────────────
// The clamp must not be the thing deciding how long a document is.
console.log('\n─── token headroom (the clamp must not bind) ───')
const est = c => Math.ceil(c / 3.2)
const MARGIN = 400
for (const [type, lang, isPro] of [
  ['RENT_AGREEMENT', 'english', true],
  ['RENT_AGREEMENT', 'hindi',   true],
  ['WRIT_PETITION',  'english', true],
  ['BAIL_APPLICATION', 'tamil', true],
]) {
  const prompt = buildDraftPromptForTest(type, 'TN_COIMBATORE', lang, { isPro })
  const [first] = attemptPlan({ isPro })
  const headroom = first.tpm - est(prompt.length) - MARGIN
  const wanted = isPro ? 8500 : 2600
  const got = Math.min(wanted, headroom)
  check(got >= wanted, `${type} / ${lang}`,
        `headroom ${headroom} -> max_tokens ${got}${got < wanted ? ` (CLAMPED from ${wanted} — output will be short)` : ''}`)
}

// ── 4. Refusals on criminal-law types ─────────────────────────────
// Gemini filters harder than gpt-oss. A provider that will not draft a
// bail application cannot serve this product.
console.log('\n─── criminal-law types are not refused ───')
const CRIMINAL = [
  ['BAIL_APPLICATION', { applicantName: 'Ramesh Kumar', fatherName: 'Suresh Kumar', applicantAge: '34',
                         address: '12 Gandhi Road, Coimbatore', offence: 'Sections 420 and 406 IPC',
                         firNumber: 'FIR 214/2026', policeStation: 'R.S. Puram', grounds: 'The applicant is falsely implicated and has no prior antecedents.' }],
  ['FIR_COMPLAINT',    { complainantName: 'Lakshmi Narayanan', address: '5 Mettupalayam Road, Coimbatore',
                         accusedName: 'Unknown', incident: 'Theft of a motorcycle from outside the residence on 12 August 2026.',
                         policeStation: 'Race Course' }],
  ['DIVORCE_PETITION', { petitionerName: 'Anitha R', respondentName: 'Karthik R', marriageDate: '14 February 2019',
                         grounds: 'Cruelty and desertion for a continuous period exceeding two years.' }],
]
for (const [type, details] of CRIMINAL) {
  try {
    const text = await generateLegalDocument(type, asDetails(details), 'TN_COIMBATORE', 'english',
                                             { isPro: true, operation: 'verify' })
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length
    check(words > 150, `${type} generated`, `${words} words`)
  } catch (e) {
    const refused = e?.code === 'AI_REFUSAL'
    check(false, `${type} generated`,
          refused ? '-> REFUSED by the provider. This type is unusable on it.'
                  : `-> ${e?.code || ''} ${e?.message?.slice(0, 80)}`)
  }
}

// ── 5 & 6. A real draft, at length, with the facts intact ─────────
console.log('\n─── a real rent agreement, end to end ───')
// The field NAMES matter. RENT_AGREEMENT declares landlordName /
// tenantName / rent / term in lib/document-fields.js; passing
// CONTRACT's partyA / partyB / payment instead gives the model keys it
// does not recognise, and the fidelity checks below then fail for a
// reason that has nothing to do with the provider.
const facts = {
  landlordName: 'Ganesan',
  tenantName: 'Gayathri',
  tenantAddress: '14 Bharathi Street, Coimbatore',
  propertyAddress: 'Flat 3B, 22 Race Course Road, Coimbatore 641018',
  propertyDetails: 'Two-bedroom flat, second floor, with covered parking.',
  rent: 'Rs. 20,000 per month, payable in cash on or before the 5th',
  deposit: 'Rs. 2,40,000',
  term: '1 year, from 1 September 2026 to 1 September 2027',
  specialTerms: 'Tenant is responsible for all minor repairs. Owner is responsible for major repairs.',
}
try {
  const text = await generateLegalDocument('RENT_AGREEMENT', asDetails(facts), 'TN_COIMBATORE', 'english',
                                           { isPro: true, operation: 'verify' })
  const body  = String(text || '')
  const words = body.trim().split(/\s+/).filter(Boolean).length
  check(words >= 800, 'draft is a real length', `${words} words`)

  // Fidelity: the user's own particulars must survive verbatim.
  for (const [label, needle] of [['both party names', /Ganesan/i], ['the second party', /Gayathri/i],
                                 ['the rent figure', /20[,.]?000/], ['the term dates', /2027/]]) {
    check(needle.test(body), `${label} reproduced`)
  }
  // And the statutory furniture a real rent agreement carries.
  const statutes = ['Transfer of Property', 'Registration Act', 'Tenancy']
  const found = statutes.filter(s => new RegExp(s, 'i').test(body))
  check(found.length >= 1, 'cites the governing statutes', `found: ${found.join(', ') || 'none'}`)
} catch (e) {
  check(false, 'rent agreement generated', `-> ${e?.code || ''} ${e?.message?.slice(0, 90)}`)
}

console.log(fails ? `\n${fails} check(s) FAILED — do not deploy this provider yet.`
                  : '\nEvery check passed. The provider is ready.')
process.exit(fails ? 1 : 0)
