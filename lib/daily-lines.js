// ─────────────────────────────────────────────────────────────────
//  The day's line — one short thing to steady a lawyer at 8 in the
//  morning. Shown in the Aurora widget on the dashboard, carried into
//  the daily push notification, and echoed on the add-to-home-screen
//  card, so every surface says the same thing on the same day.
//
//  Four registers, held in lib/quotes/* and interleaved here so the
//  tone rotates day to day instead of running 126 Latin maxims and
//  then 160 pep talks:
//
//    maxim     a classical maxim with its plain-English gloss
//    heart     encouragement, for the mornings that need it
//    craft     drafting, pleading, advocacy, evidence
//    practice  the working life — clients, fees, seniors, ethics
//
//  Over 500 entries: more than a year of daily lines with no repeat,
//  and no register ever repeating two days running.
//
//  Everything here is pure data and pure functions, with no Node-only
//  imports, so the client widget, the server page and the push worker
//  can all resolve the same line without talking to each other.
// ─────────────────────────────────────────────────────────────────
import { MAXIMS } from './quotes/maxims.js'
import { HEART } from './quotes/heart.js'
import { CRAFT } from './quotes/craft.js'
import { PRACTICE } from './quotes/practice.js'

export { MAXIMS, HEART, CRAFT, PRACTICE }

// Round-robin across the four lists. The lists are different lengths,
// so the shorter ones simply drop out near the end of the cycle rather
// than repeating — a repeat would be far more noticeable than a gap.
function interleave(groups) {
  const longest = Math.max(...groups.map(g => g.length))
  const out = []
  for (let i = 0; i < longest; i++) {
    for (const group of groups) if (group[i]) out.push(group[i])
  }
  return out
}

export const DAILY_LINES = interleave([
  MAXIMS.map(m => ({ kind: 'maxim', text: m.text, attrib: m.attrib })),
  HEART.map(text => ({ kind: 'heart', text })),
  CRAFT.map(text => ({ kind: 'craft', text })),
  PRACTICE.map(text => ({ kind: 'practice', text })),
])

// ─────────────────────────────────────────────────────────────────
//  The study prompt. Lives here rather than in lib/push.js so the
//  dashboard widget can import it too — lib/push.js pulls in web-push
//  and is Node-only, which a client component cannot touch.
// ─────────────────────────────────────────────────────────────────
export const STUDY_PROMPTS = [
  'What makes a confession admissible under the Bharatiya Sakshya Adhiniyam, 2023?',
  'Doctrine of the day — audi alteram partem.',
  'The twin conditions for bail under Section 45, PMLA 2002.',
  'What did Maneka Gandhi (1978) change about Article 21?',
  'Which section of the Negotiable Instruments Act, 1881 sets the 15-day demand?',
  'The three-fold test for an interim injunction.',
  'BNS check — which section replaced IPC 420?',
  'When does Section 138 NI Act limitation actually begin to run?',
  'The difference between res judicata and constructive res judicata.',
  'Order VII Rule 11 CPC — on what grounds is a plaint rejected?',
  'What is the scope of Article 226 against a private body?',
  'Section 34 Arbitration Act — the grounds to set aside an award.',
  'What must a Section 41A BNSS notice contain?',
  'The Vishaka guidelines — what replaced them, and when?',
  'Section 65B Evidence certificate — who can sign it, and when?',
  'What is the difference between a review, a revision and an appeal?',
  'Order XXXIX Rules 1 and 2 CPC — what exactly must you show?',
  'When is a second appeal maintainable under Section 100 CPC?',
  'The doctrine of basic structure — where did it come from?',
  'What is the effect of non-registration under Section 49 of the Registration Act?',
  'Specific Relief Act after 2018 — when is specific performance still discretionary?',
  'What is the limitation period for a suit on a written contract?',
  'Anticipatory bail — which section of the BNSS now governs it?',
  'What is the difference between cognizable and non-cognizable offences?',
  'When can a court frame an additional issue after trial has begun?',
  'What is the doctrine of merger, and when does it not apply?',
  'Section 11 Arbitration Act — what is the court’s scope after the 2019 amendment?',
  'What makes a dying declaration reliable without corroboration?',
]

// ── Day resolution ────────────────────────────────────────────────

// Day-of-year, computed in UTC so a device in a different timezone
// still lands on the same entry the server picked.
function dayOfYear(d) {
  const startOfYear = Date.UTC(d.getUTCFullYear(), 0, 1)
  const thisDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.floor((thisDay - startOfYear) / 86400000)
}

// Years are not a multiple of the pool length, so a naive day-of-year
// index would restart at the same entry every 1 January. Folding the
// year in shifts the whole sequence each year instead.
function indexFor(date, poolSize) {
  return (dayOfYear(date) + date.getUTCFullYear() * 7) % poolSize
}

/**
 * The line for a given day. Deterministic: the dashboard, the push
 * notification and the home-screen card all resolve to the same entry
 * with no shared state between them.
 */
export function lineForDay(date = new Date()) {
  return DAILY_LINES[indexFor(date, DAILY_LINES.length)]
}

/** "Fiat justitia ruat caelum — Let justice be done…" for a notification body. */
export function lineAsText(line = lineForDay()) {
  return line?.attrib ? `${line.text} — ${line.attrib}` : (line?.text || '')
}

/** Today's study prompt, on the same clock as the line. */
export function studyPromptForDay(date = new Date()) {
  return STUDY_PROMPTS[indexFor(date, STUDY_PROMPTS.length)]
}
