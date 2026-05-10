// ─────────────────────────────────────────────────────────────────
//  POST /api/case-brief-folder
//  Accepts the concatenated text of every file in a case folder
//  (extracted client-side by <FolderUploader/>) and returns a
//  SHORT, executive-style case brief.
//
//  Body:  { sourceText: string, court?: string, language?: string }
//  Reply: { brief: string, fileBytes: number, charsUsed: number }
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

// AI route — Llama 3.3 70B can take 20–40s on a long folder.
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.sourceText || typeof body.sourceText !== 'string')
      return NextResponse.json({ error: 'sourceText is required.' }, { status: 400 })

    const text = body.sourceText.trim()
    if (text.length < 60)
      return NextResponse.json({
        error: 'The folder contents look empty. Please upload a folder with readable .pdf, .docx, .txt files.',
      }, { status: 422 })

    // Pro / free gating — folder upload is heavier so we prefer the bigger
    // model when the user has Pro. Free still works, just shorter output.
    const isPro = await hasProAccess(session.user.email, session.user.tier)

    const { generateShortCaseBrief } = await import('@/lib/groq')
    let brief
    try {
      brief = await generateShortCaseBrief(text, {
        court:    body.court || null,
        language: body.language || 'english',
        isPro,
      })
    } catch (err) {
      if (err?.code === 'AI_REFUSAL') {
        return NextResponse.json({
          error: err.message,
          hint: 'Please ensure the folder contains professional case documents and try again.',
        }, { status: 422 })
      }
      throw err
    }

    return NextResponse.json({
      brief,
      charsUsed: text.length,
      fileBytes: body.fileBytes || null,
    }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/case-brief-folder]', err)
    let msg = 'Failed to generate brief. Please try again.'
    let status = 500
    if (err?.code === 'GROQ_AUTH' || err?.message?.includes('GROQ_API_KEY')) {
      msg = 'Invalid or missing GROQ_API_KEY on the server.'
      status = 503
    } else if (err?.code === 'GROQ_RATE_LIMIT' || err?.status === 429) {
      msg = 'Rate limit hit on the AI provider. Please wait a minute and try again.'
      status = 429
    } else if (process.env.NODE_ENV === 'development') {
      msg = `Brief generation failed: ${err?.message}`
    }
    return NextResponse.json({ error: msg }, { status })
  }
}
