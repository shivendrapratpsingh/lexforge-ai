// -----------------------------------------------------------------
//  Taking the machine-readable block back off the answer.
//
//  If any of these leak, a paying user sees raw JSON under a legal
//  answer they may be about to show a client. The block must come off
//  cleanly even when the model emits it badly.
//
//  Run:  node scripts/test-assistant-parser.mjs
// -----------------------------------------------------------------
import { extractAction } from '../lib/assistant-actions.js'

const OPEN  = '<<<ACTION>>>'
const CLOSE = '<<<END_ACTION>>>'
const NL = String.fromCharCode(10)

let pass = 0, fail = 0
function check(name, got, want) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log('  ok   ' + name) }
  else { fail++; console.log('  FAIL ' + name + '  got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
function noLeak(name, raw) {
  const { reply } = extractAction(raw)
  if (reply.includes('<<<') || reply.includes('>>>') || reply.includes('"action"')) {
    fail++; console.log('  FAIL ' + name + '  LEAKED: ' + JSON.stringify(reply))
  } else { pass++; console.log('  ok   ' + name) }
}
function head(t) { console.log(''); console.log(t) }

const ANSWER = 'Section 138 of the Negotiable Instruments Act applies. Issue the demand notice within 30 days of the bank memo.'
const GOOD = OPEN + '{"action":"draft","args":{"documentType":"CHEQUE_BOUNCE"}}' + CLOSE

head('THE NORMAL CASE')
{
  const r = extractAction(ANSWER + NL + GOOD)
  check('prose survives intact', r.reply, ANSWER)
  check('action resolves', r.action && r.action.href, '/new-draft?type=CHEQUE_BOUNCE')
  check('label is carried for the button', r.action && r.action.label, 'Draft this document')
}

head('NO BLOCK AT ALL')
check('reply unchanged', extractAction(ANSWER).reply, ANSWER)
check('no action', extractAction(ANSWER).action, null)
check('empty input', extractAction(''), { reply: '', action: null })
check('null input', extractAction(null), { reply: '', action: null })
check('a number', extractAction(42).reply, '42')

head('THE MODEL EMITS IT BADLY')
noLeak('unterminated block (ran out of tokens)', ANSWER + NL + OPEN + '{"action":"draft","args":{"docum')
noLeak('empty block',                            ANSWER + NL + OPEN + CLOSE)
noLeak('malformed JSON',                         ANSWER + NL + OPEN + '{not json at all}' + CLOSE)
noLeak('block first, prose after',               GOOD + NL + ANSWER)
noLeak('block alone, no prose',                  GOOD)
noLeak('two blocks',                             ANSWER + GOOD + GOOD)
noLeak('markers, nothing between',               OPEN + CLOSE)
noLeak('close marker with no open',              ANSWER + CLOSE)
noLeak('open marker at the very start',          OPEN + '{"action":"act","args":{"query":"NI Act"}}' + CLOSE + ANSWER)

head('A BAD BLOCK COSTS THE BUTTON, NEVER THE ANSWER')
const bad = [
  ['malformed JSON',    OPEN + '{oops}' + CLOSE],
  ['unknown action',    OPEN + '{"action":"delete_everything"}' + CLOSE],
  ['invented doc type', OPEN + '{"action":"draft","args":{"documentType":"CHEQUE_BOUNCE_NOTICE"}}' + CLOSE],
  ['unterminated',      OPEN + '{"action":"dra'],
  ['JSON that is not an object', OPEN + '"draft"' + CLOSE],
]
for (const [name, b] of bad) {
  const r = extractAction(ANSWER + NL + b)
  if (r.reply === ANSWER && r.action === null) { pass++; console.log('  ok   ' + name) }
  else { fail++; console.log('  FAIL ' + name + ' -> ' + JSON.stringify(r)) }
}

head('PROSE MENTIONING ANGLE BRACKETS IS NOT A BLOCK')
const prose = 'Use <> brackets in the prayer clause, not >>> arrows.'
check('left alone', extractAction(prose).reply, prose)

console.log('')
console.log(pass + ' passed, ' + fail + ' failed')
console.log('')
process.exit(fail ? 1 : 0)
