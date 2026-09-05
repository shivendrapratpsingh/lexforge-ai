// -----------------------------------------------------------------
//  The two pure parts of the treatment check.
//
//  classifyPassage decides how a quote is LABELLED - whether a student
//  sees "a later court used language of doubt" above it. Getting that
//  wrong in the negative direction makes somebody throw away good
//  authority; in the positive direction it reassures them wrongly. The
//  quote is always shown either way, which is what keeps the cost of a
//  mislabel bounded - but the label still has to be right.
//
//  caseNameQuery decides whether we find the passage at all. Indian
//  Kanoon requires EVERY word of a query to appear, so a full case name
//  matches nothing: a judgment writes "Kesavananda Bharati case", not
//  "Kesavananda Bharati v. State of Kerala". Party surnames recur;
//  "State of" and "Union of India" appear in half the reports and
//  discriminate nothing.
//
//  Run:  node scripts/test-treatment.mjs
// -----------------------------------------------------------------
import { classifyPassage, caseNameQuery } from '../lib/legal-data/indiankanoon.js'

let pass = 0, fail = 0
function eq(name, got, want) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log('  ok   ' + name) }
  else { fail++; console.log('  FAIL ' + name + '  got ' + JSON.stringify(got) + '  want ' + JSON.stringify(want)) }
}
function head(t) { console.log(''); console.log(t) }

head('LANGUAGE A COURT USES WHEN IT UNPICKS AN EARLIER DECISION')
const negatives = [
  'The decision in Bharati is no longer good law after the amendment.',
  'We hold that the earlier view stands overruled.',
  'That judgment was rendered per incuriam and cannot bind us.',
  'The reasoning in the said case is respectfully doubted.',
  'The view taken therein is disapproved.',
  'With respect, we think the case was wrongly decided.',
]
for (const p of negatives) eq(p.slice(0, 46) + '...', classifyPassage(p).signal, 'negative')

head('LANGUAGE THAT NARROWS RATHER THAN KILLS')
for (const p of [
  'The case relied upon is distinguished on facts.',
  'That decision must be confined to its own facts.',
  'The principle has no application to the present controversy.',
]) eq(p.slice(0, 46) + '...', classifyPassage(p).signal, 'narrowing')

head('LANGUAGE OF RELIANCE')
for (const p of [
  'We respectfully follow the principle laid down therein.',
  'The view expressed has been consistently reiterated.',
  'This Court has approved that line of reasoning.',
  'We follow the principle laid down therein.',
  'We approve the view taken by the High Court.',
  'The finding is affirmed.',
]) eq(p.slice(0, 46) + '...', classifyPassage(p).signal, 'positive')

head('SUBSTRING MATCHES THAT ARE NOT TREATMENTS')
// The reason this matches on word boundaries. Each of these contains a
// treatment verb as a substring and means nothing of the kind.
for (const p of [
  'The following submissions were advanced by counsel.',
  'In the following paragraphs we set out the facts.',
  'No doubtful question of law arises on these pleadings.',
]) eq(p.slice(0, 46) + '...', classifyPassage(p).signal, 'neutral')

head('A BARE MENTION IS NOT A TREATMENT')
for (const p of [
  'Counsel referred to the said judgment during arguments.',
  'The matter was listed along with the connected appeals.',
  '',
]) eq(JSON.stringify(p.slice(0, 40)), classifyPassage(p).signal, 'neutral')

head('PRECEDENCE - THE WORST NEWS WINS')
// A passage can carry more than one cue. A court that follows one part
// and overrules another must not be reported as merely "followed".
eq('overruled beats followed',
  classifyPassage('We follow the first proposition but the second stands overruled.').signal, 'negative')
eq('overruled beats distinguished',
  classifyPassage('The case is distinguished, and in any event is no longer good law.').signal, 'negative')
eq('distinguished beats followed',
  classifyPassage('Though followed elsewhere, it is distinguished on these facts.').signal, 'narrowing')

head('QUERY BUILDING - WHAT WE ASK A LATER JUDGMENT FOR')
eq('drops everything after "v."',
  caseNameQuery('Kesavananda Bharati v. State of Kerala'), 'Kesavananda Bharati')
eq('handles "vs"',
  caseNameQuery('Maneka Gandhi vs Union of India'), 'Maneka Gandhi')
eq('strips honorifics and punctuation',
  caseNameQuery('Justice K.S. Puttaswamy (Retd.) v. Union of India'), 'Puttaswamy Justice')
eq('drops a company suffix',
  caseNameQuery('Minerva Mills Ltd. v. Union of India'), 'Minerva Mills')
eq('empty in, empty out', caseNameQuery(''), '')
eq('null is safe', caseNameQuery(null), '')

head('THE QUERY MUST NOT BE A WORD THAT IS IN EVERY REPORT')
for (const bad of ['State', 'Union', 'the', 'of']) {
  const q = caseNameQuery('State of Punjab v. ' + bad)
  if (!q.split(' ').includes(bad)) { pass++; console.log('  ok   "' + bad + '" excluded') }
  else { fail++; console.log('  FAIL "' + bad + '" survived into the query: ' + q) }
}

console.log('')
console.log(pass + ' passed, ' + fail + ' failed')
process.exit(fail ? 1 : 0)
