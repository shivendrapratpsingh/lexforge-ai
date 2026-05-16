// ─────────────────────────────────────────────────────────────────
//  POST /api/future-lawyer/qa
//  Body: { question: string }
//  Returns: { answer: string }
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const maxDuration = 30
export const runtime    = 'nodejs'
export const dynamic    = 'force-dynamic'

export async function POST(req) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const question = (body?.question || '').toString().trim()
  if (!question || question.length < 5) {
    return NextResponse.json({ error: 'Please ask a more specific question (at least 5 characters).' }, { status: 400 })
  }
  try {
    const { answerLegalQuestion } = await import('@/lib/groq')
    const { hasProAccess } = await import('@/lib/admin')
    const isPro = await hasProAccess(session.user.email, session.user.tier)
    const answer = await answerLegalQuestion(question, { isPro })
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[future-lawyer/qa]', err)
    return NextResponse.json({ error: 'Failed to answer the question. Please try again.' }, { status: 500 })
  }
}
