// A document asked for in Kannada must come back in Kannada.
//
// The failure this guards against is not a crash. A model handed an
// unfamiliar language instruction will happily answer in English, or
// produce a transliteration — "Arji" rather than ಅರ್ಜಿ — and the draft
// looks fine until a Bengaluru munsiff reads it.
//
// So this checks the script itself, by Unicode range, and looks for the
// court vocabulary rather than merely "some Kannada".
import { SUPPORTED_DRAFT_LANGUAGES } from '../lib/legal-dictionary.js'
import { generateLegalDocument } from '../lib/groq.js'
import { LANGUAGES } from '../lib/utils.js'

const SCRIPTS = {
  kannada: { re: /[ಀ-೿]/g, name: 'Kannada' },
  hindi:   { re: /[ऀ-ॿ]/g, name: 'Devanagari' },
  tamil:   { re: /[஀-௿]/g, name: 'Tamil' },
  telugu:  { re: /[ఀ-౿]/g, name: 'Telugu' },
}

// Terms a real court document in Kannada would use.
const COURT_WORDS = ['ಅರ್ಜಿ', 'ವಕೀಲ', 'ನ್ಯಾಯಾಲಯ', 'ಪ್ರಮಾಣ', 'ಸಾಕ್ಷಿ', 'ಪ್ರಾರ್ಥನೆ', 'ನೋಟಿಸ್', 'ಬಾಡಿಗೆ', 'ಮಾಲೀಕ']

let fails = 0
const check = (n, ok, detail = '') => {
  if (!ok) fails++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${detail ? `  ${detail}` : ''}`)
}

// ── wiring ───────────────────────────────────────────────────────
check('kannada is a supported draft language', SUPPORTED_DRAFT_LANGUAGES.includes('kannada'))
check('and is offered in the UI', LANGUAGES.some(l => l.value === 'kannada'))
check('every UI language is actually supported',
  LANGUAGES.every(l => SUPPORTED_DRAFT_LANGUAGES.includes(l.value)),
  `(${LANGUAGES.map(l => l.value).join(', ')})`)

// ── the real test ────────────────────────────────────────────────
const target = process.argv[2] || 'kannada'
const script = SCRIPTS[target]

console.log(`\ndrafting a legal notice in ${target}…`)
try {
  const doc = String(await generateLegalDocument(
    'legal-notice',
    {
      senderName: 'Ramesh Gowda',
      recipientName: 'Suresh Kumar',
      subject: 'Recovery of unpaid rent of Rs. 90,000',
      facts: 'The tenant has not paid rent for six months for a shop in Jayanagar, Bengaluru. Repeated verbal reminders were ignored.',
    },
    null, target, { isPro: true }
  ))

  const hits = (doc.match(script.re) || []).length
  const ratio = hits / Math.max(doc.length, 1)

  check(`the document is in ${script.name} script`, ratio > 0.25,
    `${(ratio * 100).toFixed(0)}% of characters, ${doc.length} chars total`)

  const found = COURT_WORDS.filter(w => doc.includes(w))
  check('it uses court vocabulary, not everyday words', found.length >= 2,
    found.length ? `found: ${found.join(', ')}` : 'found none of the court terms')

  // Names, amounts and section numbers must survive verbatim.
  check('the amount is preserved', /90,?000/.test(doc))
  check('party names are not transliterated away', /Ramesh|ರಮೇಶ್/.test(doc))

  console.log('\n--- first lines ---')
  console.log(doc.split('\n').filter(l => l.trim()).slice(0, 6).join('\n'))
} catch (e) {
  check(`drafting in ${target}`, false, e.message)
}

console.log(fails ? `\n${fails} FAILED` : `\n${target} drafting works`)
process.exitCode = fails ? 1 : 0
