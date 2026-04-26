import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.rejectionOrderText?.trim())
      return NextResponse.json({ error: 'Rejection order text is required.' }, { status: 400 })

    const {
      rejectionOrderText,
      documentType = 'BAIL_APPLICATION',
      court,
      language = 'english',
      additionalGrounds,
      clientId,
    } = body

    const { generateFreshApplication } = await import('@/lib/groq')
    const content = await generateFreshApplication(rejectionOrderText, documentType, court || null, language, additionalGrounds || '')

    const { prisma } = await import('@/lib/prisma')
    const dtLabel = documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Fresh ${dtLabel} - ${new Date().toLocaleDateString('en-IN')}`,
        content,
        documentType,
        status:       'draft',
        caseStatus:   'active',
        court:        court || null,
        language,
        intakeMethod: 'tool',
      },
    })

    return NextResponse.json({ content, draft }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/analyze/fresh]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Fresh application failed: ${err?.message}` : 'Failed to generate fresh application.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
