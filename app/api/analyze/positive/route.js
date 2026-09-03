// POST /api/analyze/positive
// Analyzes case details and returns positive arguments, strengths & suggestions
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

// AI route — needs > 10s on Vercel Hobby plan.
// Measured, not guessed: a full filing takes 98-232 seconds. At the old
// ceiling of 60 the function was killed mid-generation and the user got
// a timeout rather than a document - every time, for the longest and
// most valuable filings. 300 is the Vercel Pro maximum.
//
// THIS REQUIRES THE VERCEL PRO PLAN. On Hobby the platform caps the
// function at 60s regardless of what is written here, so on Hobby this
// line is inert and long drafts will still fail.
export const maxDuration = 300
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
