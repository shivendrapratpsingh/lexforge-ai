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

// AI route — chunked map-reduce + paced extractions are tuned to finish in
// ≤55s. Vercel Hobby caps at 60s; Pro/Enterprise honour up to 300.
// Set explicit `dynamic` so Next never tries to pre-render or cache this.
export const maxDuration = 60
export const runtime = 'nodejs'
export const dynamic  = 'force-dynamic'
export const fetchCache = 'force-no-store'

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
  const tStart = Date.now()
  console.log('[case-brief-folder] POST received')

  // Fail-fast configuration check — surfaces a clear error in Vercel logs
  // when the GROQ_API_KEY env var hasn't been set up on the deploy.
  if (!process.env.GROQ_API_KEY) {
    console.error('[case-brief-folder] FATAL: GROQ_API_KEY env var is missing on this deployment')
    return NextResponse.json({
      error: 'Server is missing GROQ_API_KEY. Set it in Vercel → Settings → Environment Variables and redeploy.',
    }, { status: 503 })
  }

  let session
  try {
    session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      console.warn('[case-brief-folder] no session — returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (err) {
    console.error('[case-brief-folder] auth() threw:', err?.message)
    return NextResponse.json({ error: 'Unauthorized (auth failed)' }, { status: 401 })
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
  console.log(`[case-brief-folder] user=${session.user.email} isPro=${isPro} chars=${text.length} stream=${wantStream}`)

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

      // Emit a primer so the client knows the connection is alive even
      // before the first model token arrives.  This also forces Vercel's
      // edge layer to commit to streaming mode instead of buffering.
      safeEnqueue('[[META]]{"kind":"start"}[[/META]]')

      // Heartbeat: keep the connection warm during the early Groq calls
      // (which can take 3-5s with no output). 200-byte spaces are emitted
      // every 5s and filtered by the client.
      const heartbeat = setInterval(() => {
        safeEnqueue('[[META]]{"kind":"ping"}[[/META]]')
      }, 5000)

      try {
        await generateShortCaseBriefStream(text, opts, (delta) => safeEnqueue(delta))
        clearInterval(heartbeat)
        const tEnd = Date.now()
        console.log(`[case-brief-folder] OK in ${tEnd - tStart}ms`)
        closed = true
        controller.close()
      } catch (err) {
        clearInterval(heartbeat)
        const tag = err?.code === 'AI_REFUSAL' ? '\n\n[ERROR: REFUSAL] ' : '\n\n[ERROR] '
        safeEnqueue(tag + (err?.message || 'brief generation failed.'))
        closed = true
        try { controller.close() } catch (_e) { /* already closed */ }
        console.error('[case-brief-folder] stream FAILED:', err?.message, err)
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
      'Cache-Control':     'no-cache, no-transform, no-store',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
      'Connection':        'keep-alive',
      'Transfer-Encoding': 'chunked',
    },
  })
}
