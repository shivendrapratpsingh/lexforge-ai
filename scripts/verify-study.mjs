// The three features whose dead model references were fixed but whose
// routes were never actually run: the quiz generator, the tutor, and the
// case-brief pipeline.
//
// The model list was verified separately; what is unproven here is
// everything around it — that the seed data still loads, the prompt
// builds, the model answers, and the answer parses. Each of these is
// advertised on the pricing page, so "it compiles" is not enough.
//
// This reproduces each route's own Groq call exactly rather than going
// over HTTP, because the routes require a signed-in session.
import Groq from 'groq-sdk'
import { PRO_MODELS } from '../lib/groq.js'
import { LANDMARK_JUDGMENTS, LEGAL_PRINCIPLES } from '../lib/study-content.js'
import { INDIAN_LAWS } from '../lib/indian-laws.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60000, maxRetries: 1 })
const MODEL = PRO_MODELS[0]
let fails = 0
const fail = (why) => { fails++; console.log(`FAIL  ${why}`) }
const pass = (what) => console.log(`PASS  ${what}`)

// ── 1. The seed data the quiz and tutor draw on ──────────────────
console.log(`corpus: ${LANDMARK_JUDGMENTS.length} judgments, ${LEGAL_PRINCIPLES.length} principles, ${INDIAN_LAWS.length} acts\n`)
if (!LANDMARK_JUDGMENTS.length || !INDIAN_LAWS.length) fail('study corpus is empty — quiz and tutor have nothing to ground on')
else pass('study corpus loads')

// ── 2. Quiz generator — the route's exact call ───────────────────
try {
  const t = Date.now()
  const c = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    max_tokens: 2200,
    reasoning_effort: 'low',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an Indian law professor preparing exam-style questions. Output ONLY valid JSON matching the schema. All citations must be REAL.' },
      { role: 'user', content: `Generate 3 MCQs on the topic: "constitutional law".

Reference material (use these — do NOT invent):
${LANDMARK_JUDGMENTS.slice(0, 4).map(j => `${j.name} (${j.year}) — ${j.ratio}`).join('\n')}

Schema (strict): {"type":"mcq","items":[{"question":"string","options":["A — s","B — s","C — s","D — s"],"answer":"A","explanation":"string"}]}

Now produce the JSON.` },
    ],
  })

  const raw = c.choices?.[0]?.message?.content || ''
  if (!raw.trim()) throw new Error('model returned an empty string')

  let parsed
  try { parsed = JSON.parse(raw) } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('response was not JSON and had no JSON in it')
    parsed = JSON.parse(m[0])
  }

  const items = parsed.items || []
  if (!items.length) throw new Error('parsed, but contained no questions')
  const shapeOk = items.every(i => i.question && Array.isArray(i.options) && i.options.length === 4 && i.answer && i.explanation)
  if (!shapeOk) throw new Error('a question is missing options, an answer, or an explanation')

  pass(`quiz generator — ${items.length} MCQs, correct shape, ${((Date.now() - t) / 1000).toFixed(1)}s`)
  console.log(`      e.g. "${items[0].question.slice(0, 70)}…" → ${items[0].answer}`)
} catch (e) {
  fail(`quiz generator: ${e.message}`)
}

// ── 3. Tutor ─────────────────────────────────────────────────────
try {
  const t = Date.now()
  const c = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 1500,
    reasoning_effort: 'low',
    messages: [
      { role: 'system', content: 'You are LexForge AI — Tutor Mode, a law professor specialising in Indian law. Give a direct answer, the doctrine, the authority, and a practical takeaway.' },
      { role: 'user', content: 'What is the difference between bailable and non-bailable offences under Indian law?' },
    ],
  })

  const answer = c.choices?.[0]?.message?.content || ''
  // The route rejects anything under 10 characters as a failure.
  if (answer.trim().length < 10) throw new Error(`answer too short (${answer.trim().length} chars) — the route would return a 500`)
  pass(`tutor — ${answer.length} chars, ${((Date.now() - t) / 1000).toFixed(1)}s`)
  console.log(`      "${answer.replace(/\s+/g, ' ').slice(0, 90)}…"`)
} catch (e) {
  fail(`tutor: ${e.message}`)
}

// ── 4. Case brief — the real exported function ───────────────────
try {
  const t = Date.now()
  const { generateShortCaseBrief } = await import('../lib/groq.js')
  const brief = await generateShortCaseBrief(`
IN THE SUPREME COURT OF INDIA. The appellant was convicted under Section 138 of the
Negotiable Instruments Act, 1881 after a cheque for Rs. 5,00,000 issued towards a
legally enforceable debt was dishonoured for insufficiency of funds. The appellant
contended that the cheque was given as security and not towards a debt, and that the
statutory notice was not served at the correct address. The trial court convicted; the
High Court affirmed. On appeal, this Court considered whether the presumption under
Section 139 stood rebutted on the material placed on record.`, { isPro: true })

  if (!brief || String(brief).trim().length < 100) throw new Error('brief came back empty or far too short')
  pass(`case brief pipeline — ${String(brief).length} chars, ${((Date.now() - t) / 1000).toFixed(1)}s`)
  console.log(`      "${String(brief).replace(/\s+/g, ' ').slice(0, 90)}…"`)
} catch (e) {
  fail(`case brief: ${e.message}`)
}

console.log(fails ? `\n${fails} FAILED — do not ship these` : '\nall three work')
process.exitCode = fails ? 1 : 0
