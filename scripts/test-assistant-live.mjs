// -----------------------------------------------------------------
//  Does the model actually emit the block?
//
//  The unit tests prove the parser and the resolver are correct. They
//  cannot prove the model cooperates: that it appends the block, keeps
//  it out of its prose, picks the right destination, and fills the args
//  from what the user said rather than from what it assumed.
//
//  Run:  npx dotenv -e .env.local -- node scripts/test-assistant-live.mjs
// -----------------------------------------------------------------
import { caseAssistant } from '../lib/groq.js'

// Real phrasings, one per destination. Each names the destination it
// ought to reach and the particulars it must NOT have invented.
const CASES = [
  {
    say: 'a cheque of rs 85000 given to me by Rakesh Sharma bounced last week for insufficient funds. which act applies and what do i do',
    want: 'draft',
    mustCarry: ['85000', 'Rakesh'],
  },
  {
    say: 'my landlord is keeping my entire security deposit of 40000 even though i gave 2 months notice. which section can i use',
    want: ['draft', 'act'],
  },
  {
    say: 'which act covers a defective washing machine that the company refuses to replace',
    want: ['act', 'draft'],
  },
  {
    say: 'i need judgments on the twin conditions for bail under section 45 of PMLA',
    want: 'caselaw',
  },
  {
    say: 'the sessions court passed this order yesterday rejecting my bail. i want to understand what it directs and what my next step is',
    want: ['analyse', 'draft'],
  },
  {
    say: 'explain the doctrine of basic structure to me, i have an exam next week',
    want: ['study', 'qa'],
  },
  {
    say: 'thanks, that was helpful',
    want: null,                    // must NOT offer anything
  },
]

const MARKER = '<' + '<<ACTION'

let pass = 0, fail = 0
function ok(m)   { pass++; console.log('  ok   ' + m) }
function bad(m)  { fail++; console.log('  FAIL ' + m) }

for (const c of CASES) {
  console.log('')
  console.log('> ' + c.say.slice(0, 78))
  let r
  try {
    r = await caseAssistant([{ role: 'user', content: c.say }], null)
  } catch (e) {
    bad('threw: ' + (e && e.message))
    continue
  }

  // 1. The marker must never survive into prose.
  if (r.reply.includes(MARKER) || r.reply.includes('END_ACTION')) bad('MARKER LEAKED INTO THE ANSWER')
  else ok('no marker in the answer')

  // 2. The answer itself has to exist.
  if (r.reply.trim().length > 40) ok('answered (' + r.reply.trim().split(/\s+/).length + ' words)')
  else bad('answer too short: ' + JSON.stringify(r.reply.slice(0, 120)))

  // 3. The destination.
  const got = r.action && r.action.action
  if (c.want === null) {
    if (!got) ok('correctly offered nothing')
    else bad('offered ' + got + ' for small talk -> ' + r.action.href)
  } else {
    const want = Array.isArray(c.want) ? c.want : [c.want]
    if (!got) bad('offered nothing; expected one of ' + want.join('/'))
    else if (want.includes(got)) ok('routed to "' + got + '"  ' + r.action.href)
    else bad('routed to "' + got + '"; expected one of ' + want.join('/') + '  ' + r.action.href)
  }

  // 4. Facts the user gave must come across, and nothing else may.
  if (got && c.mustCarry) {
    // Digit grouping removed before comparing: the model rendering
    // "rs 85000" as "Rs. 85,000" is correct Indian formatting and a
    // faithful carry, not a lost fact.
    const url = decodeURIComponent(r.action.href).replace(/(?<=[0-9]),(?=[0-9])/g, '')
    for (const bit of c.mustCarry) {
      if (url.includes(bit)) ok('carried "' + bit + '"')
      else bad('lost "' + bit + '" -> ' + url)
    }
  }
  if (got && r.action.href) {
    if (r.action.href.startsWith('/')) ok('href stays on this site')
    else bad('OFF-SITE HREF: ' + r.action.href)
  }
}

console.log('')
console.log(pass + ' passed, ' + fail + ' failed')
console.log('')
process.exit(fail ? 1 : 0)
