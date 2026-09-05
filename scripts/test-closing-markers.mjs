// -----------------------------------------------------------------
//  Does a finished filing look finished?
//
//  looksStructurallyComplete() decides two things: whether to spend a
//  repair call on the document, and whether to append a standard
//  closing block to it. Get it wrong in the "incomplete" direction and
//  every draft is charged for a repair it does not need AND ends up
//  with TWO verification clauses - which is what a bench sees, and what
//  a lawyer's client sees.
//
//  It has been wrong exactly that way in production. A backslash-b in
//  the English pattern was written to the file as a literal BACKSPACE
//  byte (0x08). No legal document contains one, so the English branch
//  could never match, and every English filing took the repair path.
//  The file parsed, the build passed, and nothing failed loudly.
//
//  Hence this test: the markers are checked against real document
//  endings in all seven drafting languages, and against text that
//  genuinely stops mid-sentence.
//
//  Run:  node scripts/test-closing-markers.mjs
// -----------------------------------------------------------------
import { readFileSync } from 'node:fs'

// CLOSING_MARKERS and looksStructurallyComplete are internal to
// lib/groq.js, which pulls in the whole provider chain on import. The
// two definitions are lifted out and evaluated on their own.
const src = readFileSync(new URL('../lib/groq.js', import.meta.url), 'utf8')
const from = src.indexOf('const CLOSING_MARKERS')
const to   = src.indexOf('\n}', src.indexOf('function looksStructurallyComplete')) + 2
if (from === -1 || to < from) {
  console.error('Could not find CLOSING_MARKERS / looksStructurallyComplete in lib/groq.js')
  process.exit(2)
}
const looksStructurallyComplete = eval(src.slice(from, to) + ';looksStructurallyComplete')

// A control byte anywhere in that block means an escape was mangled on
// the way to disk - the exact failure above, caught directly.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/

const CASES = [
  [
    "English affidavit",
    "...deposed on oath.\n\nVERIFICATION\nVerified at Prayagraj on this 5th day of September, 2026.\n\nDEPONENT",
    true
  ],
  [
    "English rent deed",
    "...binding on both parties.\n\nIN WITNESS WHEREOF the parties have set their hands.\n\nWITNESSES:\n1.\n2.",
    true
  ],
  [
    "Place / Date pair",
    "...as prayed for.\n\nPlace : Kanpur\nDate  : 05.09.2026\n\nCounsel for the Petitioner",
    true
  ],
  [
    "Advocate signature",
    "...most respectfully submitted.\n\nADVOCATE FOR THE PETITIONER",
    true
  ],
  [
    "Hindi",
    "...निवेदन है।\n\nसत्यापन\nमैं सत्य सत्यापित करता हूँ।\n\nअभिसाक्षी",
    true
  ],
  [
    "Tamil",
    "...மனுதாரர்.\n\nசரிபார்ப்பு\nமேற்கண்டவை உண்மை.\n\nவழக்கறிஞர்",
    true
  ],
  [
    "Telugu",
    "...ప్రార్థన.\n\nధృవీకరణ\nపైవి సత్యమని ధృవీకరిస్తున్నాను.\n\nడిపోనెంట్",
    true
  ],
  [
    "Kannada",
    "...ಪ್ರಾರ್ಥನೆ.\n\nಪರಿಶೀಲನೆ\nಮೇಲಿನವು ಸತ್ಯ.\n\nವಕೀಲ",
    true
  ],
  [
    "Urdu",
    "...گزارش ہے۔\n\nتصدیق\nمندرجہ بالا درست ہے۔\n\nوکیل",
    true
  ],
  [
    "Truncated mid-sentence",
    "5. That the applicant has been in custody since 14 March 2026 and the investigation is complete. It is further submitted that the co-accused was enlarged on bail by this",
    false
  ],
  [
    "Truncated mid-word",
    "...the learned Magistrate erred in holding that the presumption under Section 139 stood rebutt",
    false
  ]
]

let pass = 0, fail = 0

if (CONTROL.test(src.slice(from, to))) {
  fail++
  console.log('  FAIL a control byte is embedded in the marker block - an escape was mangled')
} else {
  pass++
  console.log('  ok   no control bytes in the marker block')
}

console.log('')
for (const [name, text, want] of CASES) {
  const got = looksStructurallyComplete(text)
  if (got === want) { pass++; console.log('  ok   ' + name) }
  else {
    fail++
    console.log('  FAIL ' + name + '  complete=' + got + ', expected ' + want +
      (want ? '  -> a finished filing would be charged for a repair and given a SECOND closing'
            : '  -> a truncated filing would ship as-is'))
  }
}

console.log('')
console.log(pass + ' passed, ' + fail + ' failed')
process.exit(fail ? 1 : 0)
