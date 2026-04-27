// ─────────────────────────────────────────────────────────────────
//  /api/assistant — Pro Case Assistant chatbot
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Gate by Pro access (admin / pro tier / active promo / global Pro mode).
    const userIsPro = await hasProAccess(session.user.email, session.user.tier)
    if (!userIsPro) {
      return NextResponse.json({
        error: 'The Case Assistant is a Pro feature. Contact the administrator to upgrade.',
        code: 'PRO_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'Invalid request: messages array required.' }, { status: 400 })
    }

    // Optional: pull case context from a specific draft so the assistant
    // knows what the user is working on.
    let draftContext = null
    if (body.draftId) {
      try {
        const { prisma } = await import('@/lib/prisma')
        const draft = await prisma.draft.findFirst({
          where: { id: body.draftId, userId: session.user.id },
          select: {
            documentType: true,
            court: true,
            title: true,
            content: true,
            templateData: true,
          },
        })
        if (draft) draftContext = draft
      } catch (e) {
        console.warn('[assistant] draft lookup failed:', e?.message)
      }
    } else if (body.draftContext && typeof body.draftContext === 'object') {
      // Allow the client to pass an inline context (e.g., live form data
      // before the draft has been saved).
      draftContext = body.draftContext
    }

    const { caseAssistant } = await import('@/lib/groq')
    const reply = await caseAssistant(body.messages, draftContext)

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[POST /api/assistant]', err)
    const msg = process.env.NODE_ENV === 'development'
      ? `Assistant error: ${err?.message}`
      : 'The assistant is temporarily unavailable.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
