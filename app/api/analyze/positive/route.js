// POST /api/analyze/positive
// Analyzes case details and returns positive arguments, strengths & suggestions
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
