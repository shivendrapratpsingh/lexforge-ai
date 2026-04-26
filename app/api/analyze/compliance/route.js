import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.orderText?.trim())
      return NextResponse.json({ error: 'Order text is required.' }, { status: 400 })

    const { orderText, complianceDetails, court, language = 'english', clientId } = body

    const { generateComplianceReport } = await import('@/lib/groq')
    const content = await generateComplianceReport(orderText, complianceDetails || '', court || null, language)

    const { prisma } = await import('@/lib/prisma')
    const draft = await prisma.draft.create({
      data: {
        userId:       session.user.id,
        clientId:     clientId || null,
        title:        `Compliance Report - ${new Date().toLocaleDateString('en-IN')}`,
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
    console.error('[POST /api/analyze/compliance]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Compliance report failed: ${err?.message}` : 'Failed to generate compliance report.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
