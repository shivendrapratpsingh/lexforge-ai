import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { stripMarkdown } from '@/lib/markdown'
import { buildExport, safeFileName, EXPORT_FORMATS } from '@/lib/export-document'

// Exports a SAVED draft. The formatting itself — the court layout rules,
// the A4 filing geometry, the page numbers — lives in lib/export-document
// so that /api/export/adhoc can hand back the same file for the things
// the app produces that never become a draft.

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, format } = await params
    if (!EXPORT_FORMATS.includes(format))
      return NextResponse.json({ error: 'Invalid format. Use: pdf, docx or txt' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    // Admins can export any draft; users only their own.
    const where = isAdmin(session) ? { id } : { id, userId: session.user.id }
    const draft = await prisma.draft.findFirst({ where })
    if (!draft) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

    const { body, type, filename } = await buildExport({
      title: draft.title,
      content: stripMarkdown(draft.content || ''),
      format,
      meta: [
        ['Document Type', draft.documentType.replace(/_/g, ' ')],
        ['Status', draft.status],
        ['Date', new Date(draft.createdAt).toLocaleDateString('en-IN')],
      ],
    })

    return new NextResponse(body, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': `attachment; filename="${safeFileName(draft.title)}.${format}"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/export]', err)
    return NextResponse.json({ error: `Export failed: ${err?.message}` }, { status: 500 })
  }
}
