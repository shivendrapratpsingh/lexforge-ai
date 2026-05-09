import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

// AI route — needs > 10s on Vercel Hobby plan.
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pro-gate: this is a Pro tier tool. hasProAccess respects the global
    // proEnforcementEnabled toggle and any active promos, so when
    // enforcement is off everyone passes through.
    const userIsPro = await hasProAccess(session.user.email, session.user.tier)
    if (!userIsPro) {
      return NextResponse.json({
        error: 'The Document Amendment tool is a Pro feature. Upgrade to Pro to continue.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body?.originalContent?.trim() || !body?.amendments?.trim())
      return NextResponse.json({ error: 'Original content and amendments are required.' }, { status: 400 })

    const { originalContent, amendments, documentType, court, language = 'english', draftId } = body

    const { generateAmendedDocument } = await import('@/lib/groq')
    const content = await generateAmendedDocument(originalContent, amendments, documentType || 'PETITION', court || null, language)

    // If draftId provided, save as new version and return clone info
    let savedDraft = null
    if (draftId) {
      const { prisma } = await import('@/lib/prisma')
      const original = await prisma.draft.findFirst({ where: { id: draftId, userId: session.user.id } })
      if (original) {
        // Save current as version first
        const lastVer = await prisma.draftVersion.findFirst({ where: { draftId }, orderBy: { version: 'desc' }, select: { version: true } })
        await prisma.draftVersion.create({
          data: { draftId, version: (lastVer?.version || 0) + 1, content: original.content, changeNote: 'Before amendment' },
        })
        // Create amendment clone
        savedDraft = await prisma.draft.create({
          data: {
            userId:        session.user.id,
            clientId:      original.clientId,
            parentDraftId: original.id,
            title:         `${original.title} [Amended]`,
            content,
            documentType:  original.documentType,
            status:        'draft',
            caseStatus:    'active',
            amendmentNote: amendments.substring(0, 200),
            templateData:  original.templateData,
            caseLaws:      original.caseLaws,
            court:         original.court,
            language:      original.language,
          },
        })
      }
    }

    return NextResponse.json({ content, draft: savedDraft })
  } catch (err) {
    console.error('[POST /api/analyze/amendment]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Amendment failed: ${err?.message}` : 'Failed to generate amendment.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
