// POST /api/study/case-comment — a full case comment on a judgment the
// student uploaded, in the same shape as the landmark cases that ship
// with /study, plus the parts a comment needs that a summary does not.
//
// Unlike the other two study routes, this one goes through
// lib/groq.js rather than reaching for the provider client directly.
// That is deliberate: it means this call gets the provider fallback
// chain, the per-minute token clamp and the usage record that the
// direct path skips. A judgment is the largest input any student
// feature accepts, so it is the last place to bypass the token clamp.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

// AI route — a long judgment takes well over the 10s default.
export const maxDuration = 60
export const runtime = 'nodejs'

// A generous ceiling on the raw upload. Judgments are long, but past
// this we are being handed a book, and the sampler would throw most of
// it away anyway.
const MAX_CHARS = 600_000

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to use this.' }, { status: 401 })
    }

    const rl = checkRateLimit(session.user.id, 'assistant')
    if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 })

    const body = await req.json().catch(() => null)
    const text = typeof body?.text === 'string' ? body.text : ''

    if (!text.trim()) {
      return NextResponse.json({
        error: 'Upload a judgment, or paste its text, and I will comment on it.',
      }, { status: 400 })
    }
    if (text.length > MAX_CHARS) {
      return NextResponse.json({
        error: 'That file is very large. Upload the judgment on its own rather than a whole bundle.',
      }, { status: 413 })
    }

    const { hasProAccess } = await import('@/lib/admin')
    const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)

    const { generateCaseComment } = await import('@/lib/groq')
    const comment = await generateCaseComment(text, { isPro, userId: session.user.id })

    return NextResponse.json({
      comment,
      // Free accounts are sampled far harder than Pro, so the comment is
      // built on a thinner view of the judgment. The student should be
      // told that, rather than wondering why a section reads shallow.
      sampled: !isPro,
    })
  } catch (err) {
    const map = {
      SOURCE_TOO_SHORT: [400, err?.message],
      BAD_SHAPE: [502, 'The case comment came back in a form we could not read. Please try again.'],
      AI_EMPTY: [502, 'The model returned nothing. Please try again.'],
      NO_AI_PROVIDER: [503, 'No AI provider is configured for this deployment.'],
    }
    const [status, message] = map[err?.code] || [500, 'Could not produce a case comment.']
    if (!map[err?.code]) console.error('[POST /api/study/case-comment]', err)
    return NextResponse.json({ error: message, code: err?.code || 'ERROR' }, { status })
  }
}
