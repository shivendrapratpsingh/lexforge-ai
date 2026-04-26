import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { amendmentNote } = body || {}

    const { prisma } = await import('@/lib/prisma')

    const original = await prisma.draft.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Create cloned draft with parent reference
    const clone = await prisma.draft.create({
      data: {
        userId:        session.user.id,
        clientId:      original.clientId,
        parentDraftId: original.id,
        title:         `${original.title} (Copy)`,
        content:       original.content,
        documentType:  original.documentType,
        status:        'draft',
        caseStatus:    'active',
        amendmentNote: amendmentNote || 'Cloned from original',
        templateData:  original.templateData,
        caseLaws:      original.caseLaws,
        legalReasoning: original.legalReasoning,
        court:         original.court,
        language:      original.language,
        intakeMethod:  original.intakeMethod,
        sourceText:    original.sourceText,
      },
      include: {
        client: { select: { id: true, name: true } },
        parentDraft: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json({ draft: clone }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drafts/[id]/clone]', err)
    return NextResponse.json({ error: 'Failed to clone document.' }, { status: 500 })
  }
}
