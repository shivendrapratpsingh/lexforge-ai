// Quiz / flashcard generator endpoint.
// Generates exam-style multiple-choice questions OR flashcards from
// the curated landmark-judgments + legal-principles + Indian-laws
// catalogs. Topic is provided by the student; the AI is asked to
// produce strict JSON which we parse and return.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { LANDMARK_JUDGMENTS, LEGAL_PRINCIPLES } from '@/lib/study-content'
import { INDIAN_LAWS } from '@/lib/indian-laws'

// AI route — needs > 10s on Vercel Hobby plan.
export const maxDuration = 60
export const runtime = 'nodejs'

function pickSeed(topic) {
  const t = (topic || '').toLowerCase()
  const cases = LANDMARK_JUDGMENTS.filter(j =>
    !t || j.area.toLowerCase().includes(t) || j.name.toLowerCase().includes(t) || j.ratio.toLowerCase().includes(t),
  ).slice(0, 6)
  const principles = LEGAL_PRINCIPLES.filter(p =>
    !t || p.area.toLowerCase().includes(t) || p.name.toLowerCase().includes(t) || p.definition.toLowerCase().includes(t),
  ).slice(0, 6)
  const laws = INDIAN_LAWS.filter(l =>
    !t || l.category.toLowerCase().includes(t) || l.shortName.toLowerCase().includes(t) || (l.tags || []).some(tag => tag.includes(t)),
  ).slice(0, 6)
  return { cases, principles, laws }
}

function buildSeedSummary({ cases, principles, laws }) {
  const c = cases.map(j => `${j.name} (${j.year}) — ${j.ratio}`).join('\n')
  const p = principles.map(pp => `${pp.name} — ${pp.definition}`).join('\n')
  const l = laws.map(ll => `${ll.fullName} — key sections: ${ll.keySections.slice(0,4).map(s => s.n).join(', ')}`).join('\n')
  return [
    cases.length ? `Cases:\n${c}` : '',
    principles.length ? `Principles:\n${p}` : '',
    laws.length ? `Acts:\n${l}` : '',
  ].filter(Boolean).join('\n\n')
}

const QUIZ_SYS = `You are an Indian law professor preparing exam-style questions for law students.

OUTPUT RULES — STRICTLY:
- Output ONLY valid JSON. No markdown, no commentary, no \`\`\` fences.
- The JSON must match the schema requested by the user exactly.
- All citations must be REAL — use the cases, principles, and acts in the reference material below. Do not invent.
- Distractor options for MCQs must be plausible but clearly wrong on careful reading.
- Each question's "explanation" must point to the specific provision or case that confirms the answer.`

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Please sign in to use the quiz generator.' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const mode  = body?.mode === 'flashcards' ? 'flashcards' : 'mcq'
    const topic = String(body?.topic || '').slice(0, 200)
    const count = Math.max(3, Math.min(10, Number(body?.count) || 5))

    const seed = pickSeed(topic)
    const seedSummary = buildSeedSummary(seed)

    const schema = mode === 'mcq'
      ? `{
  "type": "mcq",
  "items": [
    {
      "question": "string — the exam question",
      "options": ["A — string", "B — string", "C — string", "D — string"],
      "answer": "A" | "B" | "C" | "D",
      "explanation": "string — 1–3 sentences citing the specific authority"
    }
  ]
}`
      : `{
  "type": "flashcards",
  "items": [
    {
      "front": "string — short prompt or term",
      "back": "string — 2–4 sentence answer with full citation"
    }
  ]
}`

    const userMsg = `Generate ${count} ${mode === 'mcq' ? 'MCQs' : 'flashcards'}${topic ? ` on the topic: "${topic}"` : ' across mixed Indian-law topics'}.

Reference material (use these — do NOT invent):
${seedSummary || '(no specific reference selected — draw from your training knowledge of Indian law, but only cite real, well-known provisions)'}

Schema (strict — output JSON exactly matching this shape):
${schema}

Now produce the JSON.`

    const { default: Groq } = await import('groq-sdk')
    const { PRO_MODELS } = await import('@/lib/groq')
    // Whatever lib/groq.js is on. Naming a model here is how this route
    // came to be calling one Groq had retired.
    const STUDY_MODEL = PRO_MODELS[0]
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60000, maxRetries: 1 })

    const completion = await groq.chat.completions.create({
      model: STUDY_MODEL,
      temperature: 0.4,
      max_tokens: 2200,
      // A reasoning model spends part of max_tokens thinking before it
      // writes anything, so a low effort setting is what leaves room for
      // the answer. Without it a short budget returns an empty string.
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: QUIZ_SYS },
        { role: 'user',   content: userMsg },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content || ''
    let parsed
    try { parsed = JSON.parse(raw) } catch {
      // Fallback: try to extract JSON from markdown fence
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) try { parsed = JSON.parse(m[0]) } catch {}
    }
    if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return NextResponse.json({ error: 'Could not generate quiz items. Try a more specific topic.' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[POST /api/study/quiz]', err)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'development'
        ? `Quiz failed: ${err?.message}`
        : 'The quiz generator is temporarily unavailable. Try again in a moment.',
    }, { status: 500 })
  }
}
