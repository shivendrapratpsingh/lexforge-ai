import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.judgmentText?.trim())
      return NextResponse.json({ error: 'Judgment text is required.' }, { status: 400 })

    const { judgmentText, appealType = 'HIGH_COURT', court, language = 'english', additionalGrounds, clientId } = body

    const { generateAppeal } = await import('@/lib/groq')
    const content = await generateAppeal(judgmentText, appealType, court || null, language, additionalGrounds || '')

    // Auto-save draft
    const { prisma } = await import('@/lib/prisma')
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Appeal - ${new Date().toLocaleDateString('en-IN')}`,
        content,
        documentType: 'PETITION',
        status:       'draft',
        caseStatus:   'active',
        court:        court || null,
        language,
        intakeMethod: 'tool',
      },
    })

    return NextResponse.json({ content, draft }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/analyze/appeal]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Appeal generation failed: ${err?.message}` : 'Failed to generate appeal.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
