// -----------------------------------------------------------------
//  The six analysis tools, plus the two student generators, actually
//  run against the real provider.
//
//  WHY THIS EXISTS
//
//  Until now nothing had ever called them. Not a test, not a script,
//  not a bench run. /tools is a third of what Pro is sold on - order
//  analysis, appeals, replies, amendments, fresh applications,
//  compliance reports - and the only evidence any of it worked was
//  that drafting works and goes through the same provider chain.
//
//  "Should work, same code path" is how the Groq TPM failure survived
//  for weeks: drafting a short document worked, so nobody generated a
//  long one, and bail applications were silently returning the user's
//  own form fields back to them.
//
//  So this runs each one on a realistic Indian input and asserts on
//  what comes back. It costs real money - roughly Rs 20 a full run -
//  which is why it is not in `npm run verify`.
//
//    npm run verify:tools            all eight
//    npm run verify:tools order      just one
//
//  A tool passes only if it returns something a lawyer could use: the
//  right shape, enough length to be a real document, and none of the
//  tells of a fallback template.
// -----------------------------------------------------------------
import {
  analyzeCourtOrder,
  generateAppeal,
  generateCounter,
  generateAmendedDocument,
  generateFreshApplication,
  generateComplianceReport,
  buildMootMemorial,
  answerLegalQuestion,
} from '../lib/groq.js'

let fails = 0
const ok = (name, pass, detail = '') => {
  if (!pass) fails++
  console.log('  ' + (pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : ''))
}
const words = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length

// The fallback template is what a user gets when every model was
// skipped or refused. It is the single most important thing to catch,
// because it looks like output rather than like an error.
const FALLBACK_TELLS = [
  'THIS IS NOT A FINISHED DOCUMENT',
  'check your GROQ_API_KEY',
  'Analysis unavailable',
  'unavailable. Please check',
]
const looksLikeFallback = (t) => FALLBACK_TELLS.some(s => String(t || '').includes(s))

// ── Realistic inputs. Short enough to keep the run cheap, real enough
//    that a wrong answer is visible.
const ORDER = `IN THE COURT OF THE ADDITIONAL DISTRICT JUDGE, PRAYAGRAJ
Civil Suit No. 442 of 2025
Ram Prakash Verma versus Sunil Kumar Gupta

ORDER dated 14 August 2026

Heard learned counsel for the parties. The application under Order XXXIX
Rules 1 and 2 CPC is allowed in part. The defendant is restrained from
creating any third-party interest in the suit property being House No.
14/2, Civil Lines, Prayagraj, till the next date of hearing.

The plaintiff shall file his affidavit of documents within three weeks
from today. The defendant shall file his written statement within thirty
days, failing which the right to file the same shall stand closed.

List on 30 September 2026 for framing of issues.`

const JUDGMENT = `IN THE COURT OF THE CIVIL JUDGE (SENIOR DIVISION), KANPUR NAGAR
Original Suit No. 118 of 2023
Judgment dated 2 July 2026

The plaintiff sued for recovery of Rs 8,50,000 advanced to the defendant
in March 2021, relying on an acknowledgment of debt dated 5 April 2022.
The defendant denied execution of the acknowledgment.

The plaintiff examined himself as PW-1 and produced the acknowledgment as
Ex. P-1. No handwriting expert was examined. The court held that the
plaintiff failed to prove execution of Ex. P-1 and that the suit was in
any event barred by limitation, the loan having been advanced in March
2021 and the suit filed in November 2023.

The suit is dismissed with costs.`

const OPPOSITE = `WRITTEN STATEMENT ON BEHALF OF THE DEFENDANT

1. That the contents of paragraph 1 of the plaint are denied.
2. That the defendant never executed any acknowledgment of debt.
3. That the suit is barred by limitation.
4. That this Hon'ble Court has no territorial jurisdiction, the cause of
   action having arisen wholly at Lucknow.
5. That the plaint discloses no cause of action and is liable to be
   rejected under Order VII Rule 11 CPC.`

const ORIGINAL = `IN THE HIGH COURT OF JUDICATURE AT ALLAHABAD
Civil Misc. Writ Petition No. ____ of 2026
Ram Prakash Verma ... Petitioner
versus
State of Uttar Pradesh and others ... Respondents

1. That the petitioner is a resident of 14/2 Civil Lines, Prayagraj.
2. That the petitioner has been in possession of Khasra No. 221 since 1998.
3. That the respondents issued a notification dated 12 January 2026.

PRAYER
It is prayed that the impugned notification be quashed.`

const REJECTION = `IN THE COURT OF THE SESSIONS JUDGE, KANPUR NAGAR
Bail Application No. 2210 of 2026
Order dated 20 July 2026

The applicant seeks regular bail in Case Crime No. 331 of 2026 under
Sections 318(4) and 316(2) of the Bharatiya Nyaya Sanhita, 2023.

Considering that the investigation is at an early stage and the
recovery is yet to be effected, this Court is not inclined to enlarge
the applicant on bail at this stage. The application is rejected.`

const MOOT = `The State of Aryavarta enacted the Digital Communications (Lawful
Interception) Act, 2025, empowering a designated officer to intercept
any electronic communication on written authorisation, without prior
judicial approval and without notice to the subject at any stage.

Ms. Iravati Rao, a journalist, discovered that her communications had
been intercepted for eleven months. She has petitioned the Supreme
Court of Aryavarta under its writ jurisdiction, contending that the Act
violates the right to privacy and the freedom of the press. The State
contends that national security requires executive flexibility and that
the Act contains adequate internal safeguards.`

// ── Each check: does it come back, is it long enough to be real, and
//    does it carry the marks of the thing it is supposed to be.
const TESTS = {
  order: {
    label: 'Order Analyser',
    run: () => analyzeCourtOrder(ORDER, 'DISTRICT_PRAYAGRAJ'),
    assert: (r) => {
      // This one returns a parsed object, not prose.
      ok('returns an object', r && typeof r === 'object' && !Array.isArray(r))
      const flat = JSON.stringify(r || {})
      ok('found the directions', /affidavit of documents|written statement|third-party/i.test(flat))
      ok('found a deadline', /three weeks|thirty days|30 September|2026-09-30/i.test(flat))
      ok('did not invent a different court', !/Supreme Court/i.test(flat))
      return flat.length
    },
  },
  appeal: {
    label: 'Appeal Generator',
    run: () => generateAppeal(JUDGMENT, 'HIGH_COURT', 'PRAYAGRAJ_HC', 'english',
      'The trial court ignored the acknowledgment of debt on record.'),
    assert: (r) => {
      ok('is a real length', words(r) > 400, words(r) + ' words')
      ok('states grounds of appeal', /GROUNDS/i.test(r))
      ok('carries a prayer', /PRAY/i.test(r))
      ok('kept the sum from the judgment', /8,?50,?000/.test(r))
      return words(r)
    },
  },
  counter: {
    label: 'Counter / Reply',
    run: () => generateCounter(OPPOSITE, 'AFFIDAVIT', 'DISTRICT_PRAYAGRAJ', 'english',
      'The plaintiff maintains that the acknowledgment was duly executed.'),
    assert: (r) => {
      ok('is a real length', words(r) > 300, words(r) + ' words')
      ok('answers the limitation plea', /limitation/i.test(r))
      ok('answers the jurisdiction plea', /jurisdiction/i.test(r))
      ok('carries a verification', /VERIF/i.test(r))
      return words(r)
    },
  },
  amendment: {
    label: 'Document Amendment',
    run: () => generateAmendedDocument(ORIGINAL,
      'Add a paragraph 4 stating that no notice under Section 21 was served, and add a prayer for interim stay.',
      'WRIT_PETITION', 'PRAYAGRAJ_HC', 'english'),
    assert: (r) => {
      ok('is a real length', words(r) > 200, words(r) + ' words')
      ok('kept the original party', /Ram Prakash Verma/i.test(r))
      ok('kept the khasra number', /221/.test(r))
      ok('made the requested change', /Section 21|interim stay/i.test(r))
      return words(r)
    },
  },
  fresh: {
    label: 'Fresh Application',
    run: () => generateFreshApplication(REJECTION, 'BAIL_APPLICATION', 'DISTRICT_KANPUR_NAGAR', 'english',
      'The chargesheet has since been filed and the recovery is complete.'),
    assert: (r) => {
      ok('is a real length', words(r) > 400, words(r) + ' words')
      ok('carries the crime number forward', /331/.test(r))
      ok('pleads the changed circumstance', /chargesheet|charge-sheet|recovery/i.test(r))
      ok('uses BNS, not the repealed IPC', !/\bIndian Penal Code\b/i.test(r) || /Bharatiya Nyaya Sanhita/i.test(r))
      return words(r)
    },
  },
  compliance: {
    label: 'Compliance Report',
    run: () => generateComplianceReport(ORDER,
      'The affidavit of documents was filed on 2 September 2026 and served on the defendant the same day.',
      'DISTRICT_PRAYAGRAJ', 'english'),
    assert: (r) => {
      ok('is a real length', words(r) > 200, words(r) + ' words')
      ok('reports the compliance', /affidavit of documents/i.test(r))
      ok('carries the date of compliance', /2 September|02\.09|2026-09-02/i.test(r))
      ok('carries a verification', /VERIF/i.test(r))
      return words(r)
    },
  },
  moot: {
    label: 'Moot Memorial',
    run: () => buildMootMemorial({ problem: MOOT, side: 'petitioner', isPro: true }),
    assert: (r) => {
      ok('is a real length', words(r) > 500, words(r) + ' words')
      ok('states jurisdiction', /JURISDICTION/i.test(r))
      ok('frames issues', /ISSUE/i.test(r))
      ok('carries a prayer', /PRAYER|PRAY/i.test(r))
      ok('argued for the side asked for', /petitioner/i.test(r))
      return words(r)
    },
  },
  qa: {
    label: 'Legal Q&A',
    run: () => answerLegalQuestion(
      'Is a WhatsApp message admissible as evidence in an Indian criminal trial?',
      { isPro: true }),
    assert: (r) => {
      ok('answers at length', words(r) > 100, words(r) + ' words')
      ok('names the governing statute', /Bharatiya Sakshya|Evidence Act|Sakshya Adhiniyam/i.test(r))
      ok('mentions the certificate requirement', /certificate|65B|63/i.test(r))
      return words(r)
    },
  },
}

const only = process.argv[2]
const names = only ? [only] : Object.keys(TESTS)
if (only && !TESTS[only]) {
  console.error('Unknown tool "' + only + '". One of: ' + Object.keys(TESTS).join(', '))
  process.exit(2)
}

console.log('')
console.log('Running ' + names.length + ' of ' + Object.keys(TESTS).length +
            ' against the live provider. This costs real money.')

for (const name of names) {
  const t = TESTS[name]
  console.log('')
  console.log(t.label)
  const started = Date.now()
  let result
  try {
    result = await t.run()
  } catch (e) {
    fails++
    console.log('  FAIL  threw: ' + (e?.code || '') + ' ' + (e?.message || e))
    continue
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1)

  if (!result) {
    fails++
    console.log('  FAIL  returned nothing after ' + secs + 's')
    continue
  }
  // Checked before anything else: a fallback is not an error, it is
  // plausible-looking output, and that is what makes it dangerous.
  if (looksLikeFallback(typeof result === 'string' ? result : JSON.stringify(result))) {
    fails++
    console.log('  FAIL  returned the FALLBACK TEMPLATE, not a real answer')
    continue
  }

  const size = t.assert(result)
  console.log('  ' + secs + 's' + (size ? ', ' + size + ' units' : ''))
}

console.log('')
console.log(fails ? fails + ' FAILED' : 'every tool returned something a lawyer could use')
process.exit(fails ? 1 : 0)
