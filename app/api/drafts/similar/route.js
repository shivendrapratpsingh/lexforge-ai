// ─────────────────────────────────────────────────────────────────
//  GET /api/drafts/similar?documentType=WRIT_PETITION&court=PRAYAGRAJ_HC
//  Returns the user's last 5 finalized drafts of the same type + court
//  Powers the "Load from History" / AI learning feature
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const documentType = searchParams.get('documentType')
    const court        = searchParams.get('court') || undefined

    if (!documentType)
      return NextResponse.json({ error: 'documentType is required.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')

    const where = {
      userId: session.user.id,
      documentType,
      // Only return finalized or draft documents that have content
      content: { not: '' },
    }
    // If court provided, prefer same court — but also return others as fallback
    const [sameCourt, others] = await Promise.all([
      court
        ? prisma.draft.findMany({ where: { ...where, court }, orderBy: { updatedAt: 'desc' }, take: 3, select: { id: true, title: true, templateData: true, court: true, language: true, updatedAt: true } })
        : Promise.resolve([]),
      prisma.draft.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, templateData: true, court: true, language: true, updatedAt: true } }),
    ])

    // Merge: same-court first, then dedupe
    const seen = new Set()
    const merged = [...sameCourt, ...others].filter(d => {
      if (seen.has(d.id)) return false
      seen.add(d.id)
      return true
    }).slice(0, 5)

    return NextResponse.json({ similar: merged }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/drafts/similar]', err)
    return NextResponse.json({ error: 'Failed to fetch similar drafts.' }, { status: 500 })
  }
}
