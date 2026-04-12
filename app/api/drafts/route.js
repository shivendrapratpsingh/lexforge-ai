import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES, searchCaseLaws } from '@/lib/utils'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const drafts = await prisma.draft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ drafts })
  } catch (err) {
    console.error('[GET /api/drafts]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Failed to fetch: ${err?.message}` : 'Failed to fetch documents.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const { documentType, templateData } = body

    if (!documentType || !DOCUMENT_TYPES.find(t => t.value === documentType))
      return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })

    const { generateLegalDocument } = await import('@/lib/groq')
    const { prisma } = await import('@/lib/prisma')

    // Build detail string from template fields
    const details = Object.entries(templateData || {})
      .filter(([, v]) => v?.toString().trim())
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
      .join('\n')

    // Find relevant case laws automatically
    const searchTerms = Object.values(templateData || {}).join(' ')
    const caseLaws = searchCaseLaws(searchTerms).slice(0, 3)

    // Call Groq AI
    const content = await generateLegalDocument(documentType, details)

    const dtLabel = DOCUMENT_TYPES.find(t => t.value === documentType)?.label
    const titleKey =
      templateData?.subject ||
      templateData?.caseName ||
      templateData?.purpose ||
      templateData?.to ||
      'Document'
    const title = `${dtLabel}: ${String(titleKey).substring(0, 55)}`

    const draft = await prisma.draft.create({
      data: {
        userId: session.user.id,
        title,
        content,
        documentType,
        templateData: templateData || {},
        caseLaws,
        status: 'draft',
        legalReasoning:
          caseLaws.length > 0
            ? `Relevant precedents: ${caseLaws.map(c => `${c.name} (${c.citation})`).join(', ')}`
            : null,
      },
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drafts]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Generation failed: ${err?.message}` : 'Failed to generate document.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
