// ─────────────────────────────────────────────────────────────────
//  POST /api/case-brief-folder
//  Accepts the concatenated text of every file in a case folder (or
//  the text of a single uploaded document — Word doc / scanned PDF —
//  produced client-side by <FolderUploader/>) and returns a SHORT,
//  executive-style case brief.
//
//  Two response modes:
//    • Streaming (default) — Content-Type: text/plain; charset=utf-8
//      The model's deltas are forwarded straight to the browser as
//      they arrive, so the UI renders the brief in real time at the
//      same place.
//    • Blocking (legacy)   — pass { stream: false } in the body to
//      get the old JSON response { brief, charsUsed, fileBytes }.
//
//  Body:  { sourceText: string, court?: string, language?: string,
//           stream?: boolean }
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasProAccess } from '@/lib/admin'

// AI route — Llama 3.3 70B can take 20–40s on a long folder.
export const maxDuration = 60
export const runtime = 'nodejs'

function errorStatus(err) {
  if (err?.code === 'GROQ_AUTH' || err?.message?.includes('GROQ_API_KEY')) return 503
  if (err?.code === 'GROQ_RATE_LIMIT' || err?.status === 429)              return 429
  return 500
}

function errorMessage(err) {
  if (err?.code === 'GROQ_AUTH' || err?.message?.includes('GROQ_API_KEY')) {
    return 'Invalid or missing GROQ_API_KEY on the server.'
  }
  if (err?.code === 'GROQ_RATE_LIMIT' || err?.status === 429) {
    return 'Rate limit hit on the AI provider. Please wait a minute and try again.'
  }
  if (process.env.NODE_ENV === 'development') return `Brief generation failed: ${err?.message}`
  return 'Failed to generate brief. Please try again.'
}

export async function POST(req) {
  let session
  try {
    session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.sourceText || typeof body.sourceText !== 'string') {
    return NextResponse.json({ error: 'sourceText is required.' }, { status: 400 })
  }

  const text = body.sourceText.trim()
  if (text.length < 60) {
    return NextResponse.json({
      error: 'The uploaded content looks empty. Please upload a folder or a single readable .pdf, .docx, .txt file.',
    }, { status: 422 })
  }

  // Pro / free gating — heavier model when the user has Pro.
  const isPro = await hasProAccess(session.user.email, session.user.tier)
  const opts  = { court: body.court || null, language: body.language || 'english', isPro }
  const wantStream = body.stream !== false

  // ── Blocking JSON path (legacy / debug) ──
  if (!wantStream) {
    try {
      const { generateShortCaseBrief } = await import('@/lib/groq')
      const brief = await generateShortCaseBrief(text, opts)
      return NextResponse.json({
        brief,
        charsUsed: text.length,
        fileBytes: body.fileBytes || null,
      }, { status: 200 })
    } catch (err) {
      if (err?.code === 'AI_REFUSAL') {
        return NextResponse.json({
          error: err.message,
          hint: 'Please ensure the content contains professional case documents and try again.',
        }, { status: 422 })
      }
      console.error('[POST /api/case-brief-folder] (blocking)', err)
      return NextResponse.json({ error: errorMessage(err) }, { status: errorStatus(err) })
    }
  }

  // ── Streaming path (default) ──
  const { generateShortCaseBriefStream } = await import('@/lib/groq')
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const safeEnqueue = (s) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(s))
        } catch (_e) {
          closed = true
        }
      }
      try {
        await generateShortCaseBriefStream(text, opts, (delta) => safeEnqueue(delta))
        closed = true
        controller.close()
      } catch (err) {
        const tag = err?.code === 'AI_REFUSAL' ? '\n\n[ERROR: REFUSAL] ' : '\n\n[ERROR] '
        safeEnqueue(tag + (err?.message || 'brief generation failed.'))
        closed = true
        try { controller.close() } catch (_e) { /* already closed */ }
        console.error('[POST /api/case-brief-folder] (stream)', err)
      }
    },
    cancel() {
      // Client disconnected — no extra cleanup needed.
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type':      'text/plain; charset=utf-8',
      'Cache-Control':     'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Connection':        'keep-alive',
    },
  })
}
