// A draft must not invent a citation.
//
// The old rule told the model to name a judgment "only if you are
// certain". That is self-assessment, and the same rule had already
// failed on the chat assistant — the model is confident and wrong at
// the same time, which is exactly what a fabricated citation is. Users
// reported real-sounding case names with wrong citations.
//
// Drafting is now grounded. Judgments are retrieved from the real index
// before drafting and passed into the prompt; the model works from that
// list. Where nothing was retrieved it may name only the few judgments
// a person wrote into the prompts by hand, and nothing else.
//
// So the property under test is not "no case names". It is:
//
//     every case name in a draft comes from the retrieved index or
//     from the human-curated list — never from the model's recall.
//
// The static blocks always run. The live block generates a real
// document and reads what came back; it needs a GROQ key.
import { readFileSync } from 'node:fs'
import { buildDraftPromptForTest } from '../lib/groq.js'

let fails = 0
const check = (n, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

// Anything shaped like "X v. Y" / "X vs State".
const CASE_SHAPE = /\b([A-Z][A-Za-z.&'’\-/ ]{2,45})\s+(?:v\.?|vs\.?)\s+([A-Z][A-Za-z.&'’\-/ ]{2,45})/g
const names = (text) => [...text.matchAll(CASE_SHAPE)].map(m => m[0].replace(/\s+/g, ' ').trim())

// Matching on the whole string does not work. The model legitimately
// reformats an authority without changing it — expanding "CBI" to
// "Central Bureau of Investigation", writing "D.K. Basu" for "DK Basu" —
// and the regex also picks up the words leading into the citation
// ("Court's decision in ..."). Both look like new cases and are not.
//
// So an emitted name counts as allowed when a distinctive surname from
// some allowed authority appears in it. A genuinely invented case
// carries a surname that is in no allowed entry at all, which is the
// thing this needs to catch.
const COMMON = new Set(['state', 'union', 'india', 'court', 'others', 'anr', 'ors', 'government', 'bureau', 'central', 'investigation', 'decision'])
const surnames = (entry) => entry
  .split(/\s+(?:v\.?|vs\.?)\s+/i)[0]            // the party bringing it
  .toLowerCase().replace(/[^a-z ]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length > 4 && !COMMON.has(w))
const isAllowed = (emitted, allowed) => {
  const hay = emitted.toLowerCase()
  return allowed.some(a => {
    const s = surnames(a)
    return s.length > 0 && s.some(w => hay.includes(w))
  })
}

const RETRIEVED = [
  { title: 'Arnesh Kumar v. State of Bihar', court: 'Supreme Court of India', date: '2014-07-02', citation: '(2014) 8 SCC 273' },
  { title: 'Satender Kumar Antil v. CBI', court: 'Supreme Court of India', date: '2022-07-11', citation: '(2022) 10 SCC 51' },
]

// The curated allowlist is derived from the prompts themselves rather
// than kept in a second file — one source of truth, and the test then
// enforces that the model adds nothing outside it.
const CURATED = names(readFileSync(new URL('../lib/groq.js', import.meta.url), 'utf8'))

// ── Nothing retrieved: only what a person already checked ───────
{
  const p = buildDraftPromptForTest('BAIL_APPLICATION', null, 'english', { cases: [], acts: [] })
  console.log('\n— no judgments retrieved —')
  check('the old self-assessment wording is gone',
    /only if you are certain/i.test(p), false)
  check('naming is restricted to what is written out above',
    /ONLY if that exact case is written out/.test(p), true)
  check('adding any other case is forbidden',
    /Do NOT add any other case/.test(p), true)
  check('it cites the model’s own past failure',
    /case names that[\s\S]{0,20}do not exist/.test(p), true)
  check('citations may not be reconstructed',
    /Never complete, reconstruct or recall one/.test(p), true)
  check('it names the placeholder to use instead',
    p.includes('[CITE AUTHORITY — TO BE VERIFIED]'), true)
  check('statutes are still allowed',
    /Statutes are different/.test(p), true)
  check('no authority block is emitted',
    p.includes('AUTHORITY SUPPLIED FOR THIS DRAFT'), false)
}

// ── Judgments retrieved: only those, and no completing citations ──
{
  const p = buildDraftPromptForTest('BAIL_APPLICATION', 'SUPREME_COURT', 'english', {
    cases: RETRIEVED,
    acts: [{ shortName: 'CrPC', fullName: 'The Code of Criminal Procedure, 1973', sections: [{ n: '439', desc: 'Special powers regarding bail' }] }],
  })
  console.log('\n— judgments retrieved —')
  check('the retrieved judgments are in the prompt',
    RETRIEVED.every(c => p.includes(c.title)), true)
  check('their citations are supplied verbatim',
    p.includes('(2014) 8 SCC 273') && p.includes('(2022) 10 SCC 51'), true)
  check('the matched statute is supplied',
    p.includes('The Code of Criminal Procedure, 1973'), true)
  check('it restricts the model to those judgments',
    /may cite ONLY those judgments/.test(p), true)
  check('it forbids completing a citation from memory',
    /Never complete or[\s\S]{0,4}reconstruct a citation from memory/.test(p), true)
  check('it forbids naming any other case',
    /Do NOT name any other case/.test(p), true)
  check('the rule still claims final authority',
    /OVERRIDES EVERY INSTRUCTION ABOVE/.test(p), true)
}

// ── The rule has to survive its position in the prompt ───────────
{
  const p = buildDraftPromptForTest('WRIT_PETITION', null, 'english', { cases: [], acts: [] })
  const at = p.indexOf('CASE LAW — FINAL RULE')
  console.log('\n— placement —')
  check('the rule exists', at > -1, true)
  // Trailing instructions dominate. Measured previously: the same block
  // in the middle of the prompt was ignored outright.
  check('it sits in the last tenth of the prompt', at > p.length * 0.9, true)
}

// ── Does a real generation obey it? ──────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.log('\nno GROQ_API_KEY — skipping the live generation check')
} else {
  const { generateLegalDocument } = await import('../lib/groq.js')

  const run = async (label, opts, allowed) => {
    console.log(`\n— live generation, ${label} —`)
    try {
      const doc = await generateLegalDocument(
        'BAIL_APPLICATION',
        ['Applicant Name: Ramesh Kumar', 'Father Name: Suresh Kumar', 'Applicant Age: 34',
         'Address: 12 Nehru Road, Kanpur', 'FIR No: 214/2025 dated 3 March 2025, PS Kotwali',
         'Offence: Section 420 IPC', 'Custody Date: 5 March 2025',
         'Bail Type: Regular bail under Section 439 CrPC',
         'Bail Grounds: false implication, no antecedents, cooperating with investigation'].join('\n'),
        null, 'english', { isPro: false, targetWords: 420, operation: 'verify', ...opts },
      )
      const stray = names(doc)
        // The cause title is the document's own parties, not an authority.
        .filter(t => !/Ramesh Kumar|Suresh Kumar/i.test(t))
        .filter(t => !isAllowed(t, allowed))
      check(`every case named is from the allowed set (${label})`, stray.length, 0)
      if (stray.length) console.log('      not in the allowed set:', [...new Set(stray)].slice(0, 5))
      return true
    } catch (e) {
      if (e?.code === 'GROQ_RATE_LIMIT') { console.log('SKIP  rate-limited by the free tier — rerun in a minute'); return false }
      console.log('FAIL  live generation threw:', e?.message); fails++
      return false
    }
  }

  await run('nothing retrieved', { cases: [], acts: [] }, CURATED)
  await run('judgments retrieved', { cases: RETRIEVED, acts: [] },
    [...CURATED, ...RETRIEVED.map(c => c.title)])
}

console.log(fails ? `\n${fails} FAILED` : '\nevery case name in a draft is retrieved or human-curated')
process.exitCode = fails ? 1 : 0
