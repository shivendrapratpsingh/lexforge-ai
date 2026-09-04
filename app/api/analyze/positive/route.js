// POST /api/analyze/positive
// Analyzes case details and returns positive arguments, strengths & suggestions
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// AI route — needs > 10s on Vercel Hobby plan.
// AI_TIMEOUT_ROUTE - one of nine routes whose ceiling has to move
// together. Change them with `npm run timeouts:pro` / `:hobby`, not by
// hand, so none is left behind.
//
// Measured, not guessed: a full filing takes 98-232 seconds. At 60 the
// function is killed mid-generation and the user gets a timeout rather
// than a document - every time, for the longest and most valuable
// filings. 300 is the Vercel Pro maximum and the actual fix.
//
// Held at 60 because this project is on Hobby, where 60 IS the platform
// ceiling. A higher number here buys nothing on Hobby and risks the
// deployment being rejected outright for exceeding the plan limit - so
// it stays at the plan limit until the plan changes.
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(session.user.id, 'analyze')
    if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body?.caseDetails) return NextResponse.json({ error: 'caseDetails required.' }, { status: 400 })

    const { analyzePositivePoints } = await import('@/lib/groq')
    const analysis = await analyzePositivePoints(body.caseDetails, body.documentType, body.court)

    // Also save to draft if draftId provided
    if (body.draftId) {
      const { prisma } = await import('@/lib/prisma')
      await prisma.draft.updateMany({
        where: { id: body.draftId, userId: session.user.id },
        data:  { positivePoints: analysis },
      })
    }

    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[POST /api/analyze/positive]', err)
    return NextResponse.json({ error: 'Analysis failed.' }, { status: 500 })
  }
}
