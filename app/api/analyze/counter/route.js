import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.oppositePartyDoc?.trim())
      return NextResponse.json({ error: 'Opposite party document is required.' }, { status: 400 })

    const { oppositePartyDoc, documentType = 'AFFIDAVIT', court, language = 'english', clientPosition, clientId } = body

    const { generateCounter } = await import('@/lib/groq')
    const content = await generateCounter(oppositePartyDoc, documentType, court || null, language, clientPosition || '')

    const { prisma } = await import('@/lib/prisma')
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Counter Affidavit - ${new Date().toLocaleDateString('en-IN')}`,
        content,
        documentType: 'AFFIDAVIT',
        status:       'draft',
        caseStatus:   'active',
        court:        court || null,
        language,
        intakeMethod: 'tool',
      },
    })

    return NextResponse.json({ content, draft }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/analyze/counter]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Counter generation failed: ${err?.message}` : 'Failed to generate counter.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
