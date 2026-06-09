import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { stripMarkdown } from '@/lib/markdown'

// ─── Court heading detector ────────────────────────────────────────
// A line is treated as a section heading if it is entirely uppercase,
// at least 4 characters, does not start with a digit (to exclude
// numbered paragraphs like "1. That..."), and contains at least 3
// consecutive capital letters (to exclude bare punctuation lines).
function isCourtHeading(line) {
  const t = line.trim()
  if (!t || t.length < 4) return false
  if (/^\d/.test(t)) return false          // numbered paragraphs: not headings
  if (/^\[/.test(t)) return false          // placeholder lines: not headings
  return t === t.toUpperCase() && /[A-Z]{3,}/.test(t)
}

export async function GET(req, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, format } = await params
    if (!['pdf', 'docx', 'txt'].includes(format))
      return NextResponse.json({ error: 'Invalid format. Use: pdf, docx, txt' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    // Admins can export any draft; users only their own.
    const where = isAdmin(session) ? { id } : { id, userId: session.user.id }
    const draft = await prisma.draft.findFirst({ where })
    if (!draft) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

    const safeName = draft.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
    const dateStr  = new Date(draft.createdAt).toLocaleDateString('en-IN')

    // Strip any residual markdown symbols from AI output before export
    const cleanContent = stripMarkdown(draft.content || '')

    // ─── TXT ──────────────────────────────────────────────────────
    if (format === 'txt') {
      // TXT includes a reference header (for the advocate's file copy)
      // but the document body is plain — no markdown symbols.
      const text = [
        draft.title,
        '='.repeat(60),
        `Document Type : ${draft.documentType.replace(/_/g, ' ')}`,
        `Status        : ${draft.status}`,
        `Date          : ${dateStr}`,
        '',
        '─'.repeat(60),
        '',
        cleanContent,
      ].join('\n')

      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeName}.txt"`,
        },
      })
    }

    // ─── DOCX ─────────────────────────────────────────────────────
    // Court-standard Word document:
    //   Font     : Times New Roman 12 pt (body) / 13 pt (headings)
    //   Margins  : 1.25 in left (binding) / 1 in right / 1 in top & bottom
    //   Spacing  : 1.5 lines (line: 360 in OOXML twentieths-of-a-point)
    //   Headings : ALL CAPS, bold, with spacing before/after
    //   No metadata header, no AI footer
    if (format === 'docx') {
      const { Document, Paragraph, TextRun, Packer } = await import('docx')

      const lines = cleanContent.split('\n')

      const contentParagraphs = lines.map(rawLine => {
        const trimmed = rawLine.trim()
        const empty   = !trimmed
        const heading = !empty && isCourtHeading(trimmed)

        if (empty) {
          // Blank line → short spacer paragraph
          return new Paragraph({
            spacing: { before: 0, after: 80, line: 240 },
            children: [new TextRun({ text: '', font: 'Times New Roman', size: 24 })],
          })
        }

        return new Paragraph({
          spacing: heading
            ? { before: 320, after: 160, line: 360 }  // extra space around headings
            : { before: 0,   after: 80,  line: 360 },  // 1.5 line spacing for body
          children: [
            new TextRun({
              text: rawLine,
              font: 'Times New Roman',
              size: heading ? 26 : 24,   // 13 pt heading / 12 pt body
              bold: heading,
              color: '000000',
            }),
          ],
        })
      })

      const doc = new Document({
        styles: {
          default: {
            document: {
              run:       { font: 'Times New Roman', size: 24, color: '000000' },
              paragraph: { spacing: { line: 360 } },
            },
          },
        },
        sections: [{
          properties: {
            page: {
              // Margins in twentieths-of-a-point (1440 = 1 inch)
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
            },
          },
          children: contentParagraphs,
        }],
      })

      const buf = await Packer.toBuffer(doc)
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeName}.docx"`,
        },
      })
    }

    // ─── PDF ──────────────────────────────────────────────────────
    // Court-standard PDF:
    //   Font     : Times (Times New Roman equivalent in jsPDF)
    //   Margins  : 30 mm left (~1.2 in) / 20 mm right / 25 mm top & bottom
    //   Size     : 12 pt body, 12 pt bold for ALL CAPS section headings
    //   Spacing  : ~1.5× line height (7 mm per line at 12 pt)
    //   No metadata header, no AI footer
    if (format === 'pdf') {
      const { jsPDF } = await import('jspdf')
      const doc       = new jsPDF({ unit: 'mm', format: 'a4' })
      const mLeft     = 30   // 1.2 in left margin (binding allowance)
      const mRight    = 20   // 0.8 in right margin
      const maxW      = doc.internal.pageSize.getWidth() - mLeft - mRight
      const pageH     = doc.internal.pageSize.getHeight()
      let   y         = 25   // 1-inch top margin

      const checkPage = (need = 8) => {
        if (y + need > pageH - 20) { doc.addPage(); y = 25 }
      }

      const lines = cleanContent.split('\n')

      for (const rawLine of lines) {
        const trimmed = rawLine.trim()

        // Blank lines — paragraph gap
        if (!trimmed) {
          y += 5
          checkPage(7)
          continue
        }

        if (isCourtHeading(trimmed)) {
          // ── Section heading: Times bold 12 pt, extra vertical space ──
          y += 5              // space above heading
          checkPage(11)
          doc.setFontSize(12)
          doc.setFont('times', 'bold')
          doc.setTextColor(0, 0, 0)

          const wrapped = doc.splitTextToSize(rawLine, maxW)
          for (const wl of wrapped) {
            checkPage(8)
            doc.text(wl, mLeft, y)
            y += 7
          }
          y += 3              // space below heading

        } else {
          // ── Body text: Times normal 12 pt, 1.5 line spacing ──
          doc.setFontSize(12)
          doc.setFont('times', 'normal')
          doc.setTextColor(0, 0, 0)

          const wrapped = doc.splitTextToSize(rawLine, maxW)
          for (const wl of wrapped) {
            checkPage(7)
            doc.text(wl, mLeft, y)
            y += 7
          }
        }
      }

      return new NextResponse(Buffer.from(doc.output('arraybuffer')), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
        },
      })
    }

  } catch (err) {
    console.error('[GET /api/export]', err)
    return NextResponse.json({ error: `Export failed: ${err?.message}` }, { status: 500 })
  }
}
