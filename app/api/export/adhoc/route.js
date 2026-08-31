import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin, hasProAccess } from '@/lib/admin'
import { stripMarkdown } from '@/lib/markdown'
import { buildExport, EXPORT_FORMATS } from '@/lib/export-document'

// ─────────────────────────────────────────────────────────────────
//  Download something that was never saved.
//
//  /api/export/[id]/[format] exports a draft, which needs the draft to
//  exist. Most of what the app produces never becomes one: an order
//  analysis, a legal analysis, a moot memorial, a page of judgments.
//  All of it appeared on screen and could be reached in no other way —
//  a student on a phone had no route to it at all.
//
//  This takes the text the user is looking at and hands it back as a
//  file, formatted the same way a draft is.
//
//  A FORM POST, deliberately, not fetch + blob. A blob download is
//  awkward on a phone: iOS Safari often opens it in a viewer instead of
//  saving it. A form post is an ordinary navigation, so the browser
//  sees Content-Disposition and does what it always does with a
//  download — on every device, including the ones students use.
// ─────────────────────────────────────────────────────────────────

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Long enough for a full memorial, short enough that this cannot be
// used to push arbitrary volume through the server.
const MAX_CHARS = 200_000

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Downloading is Pro. A free account can generate and read what it
    // generated; keeping the file is what the plan is for.
    const pro = isAdmin(session) || await hasProAccess(session.user.email, session.user.tier)
    if (!pro) {
      return NextResponse.json({
        error: 'Downloading is part of Pro. Your work stays here and you can still copy it.',
        code: 'PRO_REQUIRED',
        upgrade: '/upgrade',
      }, { status: 402 })
    }

    // The form post sends urlencoded; keep JSON working too so the same
    // route can be called programmatically.
    let title, content, format
    const ctype = req.headers.get('content-type') || ''
    if (ctype.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      ;({ title, content, format } = body)
    } else {
      const form = await req.formData()
      title   = form.get('title')
      content = form.get('content')
      format  = form.get('format')
    }

    title   = String(title || 'LexForge document').trim().slice(0, 200)
    content = String(content || '')
    format  = String(format || 'pdf').toLowerCase()

    if (!EXPORT_FORMATS.includes(format)) {
      return NextResponse.json({ error: 'Use pdf, docx or txt.' }, { status: 400 })
    }
    if (!content.trim()) {
      return NextResponse.json({ error: 'There is nothing to export.' }, { status: 400 })
    }
    if (content.length > MAX_CHARS) {
      return NextResponse.json({ error: 'That is too long to export in one file.' }, { status: 413 })
    }

    // The AI writes markdown symbols the exporters should never render.
    const clean = stripMarkdown(content)

    const { body, type, filename } = await buildExport({
      title,
      content: clean,
      format,
      meta: [['Generated', new Date().toLocaleDateString('en-IN')], ['Source', 'LexForge AI']],
    })

    return new NextResponse(body, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[POST /api/export/adhoc]', err)
    return NextResponse.json({ error: 'Could not build that file.' }, { status: 500 })
  }
}
