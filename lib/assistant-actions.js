// ─────────────────────────────────────────────────────────────────
//  Where the assistant can send somebody, and what it may carry.
//
//  THE PROBLEM THIS SOLVES
//
//  A person types "my landlord kept my deposit, which act applies?".
//  The assistant answers well — and then the conversation ends there.
//  The user still has to work out that the answer is a Legal Notice,
//  find New Document, pick the right tile out of twenty, and retype
//  every fact they just finished explaining. Most of them do not.
//
//  So an answer is no longer the end of the exchange. The assistant
//  also names a DESTINATION and hands over the particulars it already
//  heard, and the widget offers that as one button. The user never
//  types the same fact twice.
//
//  DESIGN RULES
//
//  1. The assistant PROPOSES, the user DISPOSES. Nothing navigates on
//     its own. A wrong guess that hijacks the page would destroy the
//     context the user is in the middle of typing, and the assistant
//     will be wrong sometimes.
//
//  2. Only fields declared here are carried. The model does not get to
//     invent query parameters, and anything it emits outside this
//     catalogue is dropped rather than passed through to a URL.
//
//  3. Values are the USER'S OWN WORDS. This is the same fidelity rule
//     the drafting engine runs under: prefill carries what the person
//     actually said, never a paraphrase and never an inference. A
//     prefilled form that quietly invents a date is worse than an
//     empty one, because the user will not re-read a field that is
//     already filled.
// ─────────────────────────────────────────────────────────────────
import { DOCUMENT_TYPES, LANGUAGES } from './utils.js'

// Mirrors SIDES in app/(dashboard)/future-lawyer/moot/page.js and the
// tab keys in app/(dashboard)/study/page.js. Both pages re-validate what
// arrives, so a drift here costs a dropped button, never a bad URL.
const MOOT_SIDES  = ['petitioner', 'respondent', 'prosecution']
const STUDY_MODES = ['tutor', 'quiz']

// The six analysers on /tools, keyed by the id that page expects.
const ANALYSERS = {
  order:      'Read a court order and extract directions, deadlines and next steps',
  appeal:     'Build grounds of appeal from a judgment',
  counter:    'Draft a reply to the opposite party’s filing',
  amendment:  'Amend an existing document',
  fresh:      'Prepare a fresh application after a rejection',
  compliance: 'Report compliance with a court order',
}

/**
 * Every destination, with the fields it will accept.
 *
 * `build` returns the href. It is the ONLY place a URL is assembled,
 * so a destination cannot leak a parameter it never declared.
 */
export const ACTIONS = {
  draft: {
    id: 'draft',
    label: 'Draft this document',
    when: 'The user needs a legal document produced — a notice, petition, application, agreement, complaint or deed.',
    needs: ['documentType'],
    optional: ['court', 'language', 'fields'],
    build: ({ documentType, court, language, fields }) => {
      const p = new URLSearchParams({ type: documentType })
      if (court) p.set('court', court)
      if (language && language !== 'english') p.set('language', language)
      if (fields && Object.keys(fields).length) p.set('prefill', JSON.stringify(fields))
      return `/new-draft?${p}`
    },
    validate: ({ documentType, language }) =>
      DOCUMENT_TYPES.some(t => t.value === documentType) &&
      (language === undefined || LANGUAGES.some(l => l.value === language)),
    describe: ({ documentType }) =>
      DOCUMENT_TYPES.find(t => t.value === documentType)?.label || documentType,
  },

  analyse: {
    id: 'analyse',
    label: 'Analyse this',
    when: 'The user has received a court order, judgment, notice or opposite-party filing and needs it read, answered, appealed or complied with. Correct EVEN IF they have not pasted the text yet — this page is where they paste it, so send them there and leave "text" out.',
    needs: ['tool'],
    optional: ['text', 'court'],
    build: ({ tool, text, court }) => {
      const p = new URLSearchParams({ tool })
      if (court) p.set('court', court)
      if (text) p.set('prefill', JSON.stringify({ text }))
      return `/tools?${p}`
    },
    validate: ({ tool }) => Object.hasOwn(ANALYSERS, tool),
    describe: ({ tool }) => ANALYSERS[tool] || tool,
  },

  act: {
    id: 'act',
    label: 'Open the Act',
    when: 'The user is asking which statute or section governs something, or wants to read a provision.',
    needs: ['query'],
    optional: [],
    build: ({ query }) => `/acts?q=${encodeURIComponent(query)}`,
    validate: ({ query }) => typeof query === 'string' && query.trim().length > 1,
    describe: ({ query }) => `Act search: ${query}`,
  },

  caselaw: {
    id: 'caselaw',
    label: 'Find judgments',
    when: 'The user wants case law, precedent, or the status of a reported matter.',
    needs: ['query'],
    optional: [],
    build: ({ query }) => `/case-law?q=${encodeURIComponent(query)}`,
    validate: ({ query }) => typeof query === 'string' && query.trim().length > 1,
    describe: ({ query }) => `Case law: ${query}`,
  },

  moot: {
    id: 'moot',
    label: 'Build the memorial',
    when: 'The user has a moot court problem and needs a memorial.',
    needs: ['problem'],
    optional: ['side'],
    build: ({ problem, side }) => {
      const p = new URLSearchParams()
      p.set('prefill', JSON.stringify({ problem, ...(side ? { side } : {}) }))
      return `/future-lawyer/moot?${p}`
    },
    validate: ({ problem, side }) =>
      typeof problem === 'string' && problem.trim().length > 20 &&
      (side === undefined || MOOT_SIDES.includes(side)),
    describe: ({ side }) => side ? `Memorial for the ${side}` : 'Moot memorial',
  },

  study: {
    id: 'study',
    label: 'Study this topic',
    when: 'The user is revising, preparing for an exam, or wants to understand a doctrine or landmark judgment.',
    needs: ['topic'],
    optional: ['mode'],
    build: ({ topic, mode }) => {
      const p = new URLSearchParams({ topic })
      if (mode) p.set('tab', mode)          // 'tutor' | 'quiz'
      return `/study?${p}`
    },
    validate: ({ topic, mode }) =>
      typeof topic === 'string' && topic.trim().length > 1 &&
      (mode === undefined || STUDY_MODES.includes(mode)),
    describe: ({ topic, mode }) => `${mode === 'quiz' ? 'Quiz' : 'Study'}: ${topic}`,
  },

  qa: {
    id: 'qa',
    label: 'Ask in Legal Q&A',
    when: 'A pure question of law that deserves a longer, citation-backed answer than a chat reply.',
    needs: ['question'],
    optional: [],
    build: ({ question }) => `/future-lawyer/qa?q=${encodeURIComponent(question)}`,
    validate: ({ question }) => typeof question === 'string' && question.trim().length > 5,
    describe: ({ question }) => question.slice(0, 60),
  },
}

/**
 * Turn whatever the model emitted into a safe, renderable action.
 * Returns null for anything unrecognised or invalid — a missing button
 * is a small loss; a button that navigates somewhere wrong, carrying
 * invented particulars, is a large one.
 */
export function resolveAction(raw) {
  if (!raw || typeof raw !== 'object') return null
  // Object.hasOwn, not a plain lookup: ACTIONS['__proto__'] resolves to
  // Object.prototype, which is truthy, and the next line then reads
  // .needs off it and throws. A model that emits {"action":"__proto__"}
  // would take the whole assistant route down with a 500.
  if (!Object.hasOwn(ACTIONS, raw.action)) return null
  const spec = ACTIONS[raw.action]

  const args = raw.args && typeof raw.args === 'object' ? raw.args : {}

  // Drop anything not declared. The model does not get to add params.
  const allowed = new Set([...spec.needs, ...spec.optional])
  const clean = {}
  for (const [k, v] of Object.entries(args)) if (allowed.has(k)) clean[k] = v

  if (spec.needs.some(k => clean[k] === undefined || clean[k] === null || clean[k] === '')) return null
  if (spec.validate && !spec.validate(clean)) return null

  // `fields` must be a flat object of strings — it is about to become a
  // JSON query parameter and then a form.
  if (clean.fields) {
    if (typeof clean.fields !== 'object' || Array.isArray(clean.fields)) return null
    clean.fields = Object.fromEntries(
      Object.entries(clean.fields)
        .filter(([, v]) => v != null && String(v).trim())
        .map(([k, v]) => [String(k).slice(0, 60), String(v).slice(0, 2000)])
        .slice(0, 40),
    )
  }

  let href
  try { href = spec.build(clean) } catch { return null }
  if (!href || !href.startsWith('/')) return null      // never off-site

  return { action: spec.id, label: spec.label, detail: spec.describe(clean), href }
}

/**
 * The menu handed to the model, generated so it can never drift.
 *
 * The enum block below is not decoration. When this rule was first
 * written by hand it named CHEQUE_BOUNCE_NOTICE and EMAIL_DRAFT; the
 * real values are CHEQUE_BOUNCE and LEGAL_EMAIL. Every such guess is
 * rejected by resolveAction, so the button would simply never have
 * appeared for a cheque-bounce notice — one of the most common matters
 * this app is used for — and nothing anywhere would have said why.
 */
export function actionCatalogueForPrompt() {
  const lines = Object.values(ACTIONS).map(a => {
    const fields = [...a.needs.map(n => n + ' (required)'), ...a.optional].join(', ')
    return `- "${a.id}": ${a.when}\n    args: ${fields}`
  })
  lines.push(
    '',
    'Exact values. Anything else is rejected and the offer is dropped:',
    `  draft.documentType: ${DOCUMENT_TYPES.map(t => t.value).join(', ')}`,
    `  draft.language:     ${LANGUAGES.map(l => l.value).join(', ')}`,
    `  analyse.tool:       ${Object.keys(ANALYSERS).join(', ')}`,
    `  moot.side:          ${MOOT_SIDES.join(', ')}`,
    `  study.mode:         ${STUDY_MODES.join(', ')}`,
    '  draft.court:        an exact court code, or omit it entirely.',
  )
  return lines.join('\n')
}

// ─── The block the model appends, and how it is taken back off ────
//
// The assistant is told to append one machine-readable line after its
// prose. Everything between these markers is stripped before a single
// character reaches the user: a leaked `<<<ACTION>>>{"action":…}` blob
// sitting under a legal answer reads as the product breaking, and the
// people paying for this are showing it to clients.
const NEWLINE = '\n'
const ACTION_OPEN  = '<<<ACTION>>>'
const ACTION_CLOSE = '<<<END_ACTION>>>'

export const ACTION_BLOCK_EXAMPLE =
  ACTION_OPEN + '{"action":"<id>","args":{...}}' + ACTION_CLOSE

/**
 * Split the model's text into prose and a validated action.
 *
 * Never throws and never leaks a marker. A block that is malformed,
 * unterminated, or names something that does not exist costs the user
 * the button and nothing else — the answer itself always survives.
 */
export function extractAction(raw) {
  const text = String(raw == null ? '' : raw)
  if (!text.includes(ACTION_OPEN) && !text.includes(ACTION_CLOSE)) {
    return { reply: text.trim(), action: null }
  }

  // Walked with indexOf rather than a regex, on purpose. This is the
  // last thing between a model and a paying user, and a character
  // class that gets mangled in transit fails silently and invisibly.
  let rest = text
  let out = ''
  let json = null

  for (;;) {
    const i = rest.indexOf(ACTION_OPEN)
    if (i === -1) break
    out += rest.slice(0, i)
    const after = rest.slice(i + ACTION_OPEN.length)
    const j = after.indexOf(ACTION_CLOSE)
    if (j === -1) {
      // Opened and never closed: the model ran out of tokens. Drop the
      // tail — half a JSON object is not something to show anybody.
      rest = ''
      break
    }
    // The first block is the offer. The prompt asks for at most one;
    // models disobey, and a second one left in place showed up in the
    // user's reply as raw JSON during testing. Later blocks are
    // stripped, not trusted.
    if (json === null) json = after.slice(0, j).trim()
    rest = after.slice(j + ACTION_CLOSE.length)
  }
  out += rest

  // A closing marker with no opening one is still a marker.
  out = out.split(ACTION_CLOSE).join('')

  let parsed = null
  if (json) {
    try { parsed = JSON.parse(json) } catch { /* malformed: drop it, keep the answer */ }
  }
  return { reply: out.trim(), action: resolveAction(parsed) }
}

// ─── Worked examples ──────────────────────────────────────────────
//
// A live test against the real provider offered a button on 1 of 6
// realistic messages. The answers were good and nothing leaked; the
// model simply would not emit the block. The instruction had told it to
// stay silent whenever it was unsure, which for a hedging model means
// almost always — so the feature was, in practice, off.
//
// Examples are the fix. Every one of them is asserted to resolve by
// scripts/test-assistant-actions.mjs, so an example cannot rot into a
// demonstration of an invalid block: field names are real DOC_FIELDS
// names, and document types are real DOCUMENT_TYPES values.
export const ACTION_EXAMPLES = [
  {
    user: 'a cheque of rs 85,000 given to me by Rakesh Sharma bounced last week for insufficient funds, which act applies',
    action: {
      action: 'draft',
      args: {
        documentType: 'CHEQUE_BOUNCE',
        fields: {
          drawerName: 'Rakesh Sharma',
          chequeDetails: 'Cheque for Rs. 85,000',
          dishonourReason: 'insufficient funds',
        },
      },
    },
  },
  {
    user: 'my landlord is keeping my entire security deposit of 40000 even though i gave 2 months notice',
    action: {
      action: 'draft',
      args: {
        documentType: 'LEGAL_NOTICE',
        fields: {
          grievance: 'Landlord has retained the entire security deposit of Rs. 40,000 despite two months notice having been given',
          demand: 'Refund of the security deposit of Rs. 40,000',
        },
      },
    },
  },
  {
    user: 'which act covers a defective washing machine the company refuses to replace',
    action: { action: 'act', args: { query: 'defective goods refusal to replace consumer' } },
  },
  {
    user: 'the sessions court passed an order yesterday rejecting my bail, what does it direct and what is my next step',
    action: { action: 'analyse', args: { tool: 'order' } },
  },
  {
    user: 'explain the doctrine of basic structure, i have an exam next week',
    action: { action: 'study', args: { topic: 'doctrine of basic structure', mode: 'tutor' } },
  },
  {
    user: 'thanks, that was helpful',
    action: null,
  },
]

/** The examples, rendered for the prompt. */
export function actionExamplesForPrompt() {
  return ACTION_EXAMPLES.map(e => {
    const line = e.action
      ? ACTION_OPEN + JSON.stringify(e.action) + ACTION_CLOSE
      : '(no block — this is small talk, not a request)'
    return '  user: ' + e.user + NEWLINE + '  you append: ' + line
  }).join(NEWLINE + NEWLINE)
}

export { ANALYSERS }
