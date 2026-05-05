// AI Tutor endpoint — exam-ready Q&A for law students.
// Uses the same Groq stack as the rest of the app, but with a tutor-
// specific system prompt and the laws + judgments seed catalog
// injected as grounding so answers cite real provisions and cases.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildLawsPromptBlock } from '@/lib/indian-laws'
import { LANDMARK_JUDGMENTS, LEGAL_PRINCIPLES } from '@/lib/study-content'

const TUTOR_SYSTEM = `You are LexForge AI — Tutor Mode, an experienced law professor specialising in Indian law.
You help law students and curious citizens understand Indian legal concepts.

ANSWER STRUCTURE (always follow):
1. **Direct answer in 1–2 sentences** — give the bottom line first.
2. **Doctrinal explanation** — explain the underlying principle in clear, exam-ready prose.
3. **Authority** — cite at least one landmark case AND the relevant statutory provision (full official act name + section/article + year).
4. **Comparison / nuance** — distinguish from related concepts, note exceptions, mention dissenting views if any.
5. **Practical takeaway** — one sentence on how this applies in real practice.

CITATION RULES:
- Cite statutes by FULL official name + EXACT section: e.g. "Section 138 of the Negotiable Instruments Act, 1881".
- Cite cases by name + year + reporter citation if available.
- If unsure of a citation, write "[verify before using in exam]" instead of inventing.

TONE:
- Direct, precise, exam-focused. Avoid filler.
- Use simple English unless the student asks for hindi/regional language.
- 200–400 words for typical answers; longer only if the student asks for detail.`

function shortJudgment(j) {
  return `${j.name} (${j.year}) [${j.citation}] — ${j.ratio}`
}
function shortPrinciple(p) {
  return `${p.name} — ${p.definition}`
}

// Pick the most relevant seed cases / principles to ground the model
// based on the student's question.
function buildSeedBlock(question) {
  const q = (question || '').toLowerCase()
  const judgments = LANDMARK_JUDGMENTS
    .map(j => ({
      j,
      score:
        (q.includes(j.name.toLowerCase().split(' v.')[0].toLowerCase()) ? 5 : 0) +
        (q.includes(j.area.toLowerCase()) ? 2 : 0) +
        (j.ratio.toLowerCase().split(/[^a-z]+/).filter(t => t && q.includes(t)).length),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(x => x.j)

  const principles = LEGAL_PRINCIPLES
    .map(p => ({
      p,
      score:
        (q.includes(p.name.toLowerCase()) ? 5 : 0) +
        (q.includes(p.area.toLowerCase()) ? 2 : 0) +
        (p.definition.toLowerCase().split(/[^a-z]+/).filter(t => t && t.length > 3 && q.includes(t)).length),
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.p)

  if (judgments.length === 0 && principles.length === 0) return ''
  return `\n\n═══════ CURATED REFERENCE MATERIAL (cite these by name) ═══════
${judgments.length ? `\nLandmark judgments:\n${judgments.map(shortJudgment).join('\n')}` : ''}
${principles.length ? `\nLegal principles:\n${principles.map(shortPrinciple).join('\n')}` : ''}
═══════ END REFERENCE MATERIAL ═══════`
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Please sign in to use the AI Tutor.' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.question || typeof body.question !== 'string' || body.question.length < 3)
      return NextResponse.json({ error: 'Please ask a question (3+ characters).' }, { status: 400 })

    const question = String(body.question).slice(0, 2000)
    const seedBlock = buildSeedBlock(question)
    const lawsBlock = buildLawsPromptBlock(question, 8)

    const { default: Groq } = await import('groq-sdk')
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 60000, maxRetries: 1 })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: TUTOR_SYSTEM + seedBlock + (lawsBlock ? `\n\n${lawsBlock}` : '') },
        { role: 'user',   content: question },
      ],
    })
    const answer = completion.choices?.[0]?.message?.content
    if (!answer || answer.trim().length < 10)
      return NextResponse.json({ error: 'Sorry, the tutor could not produce an answer. Please rephrase and try again.' }, { status: 500 })

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[POST /api/study/tutor]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Tutor failed: ${err?.message}` : 'The tutor is temporarily unavailable. Please try again in a moment.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
