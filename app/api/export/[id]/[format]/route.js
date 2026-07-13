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

// ─── Centred-line detector ─────────────────────────────────────────
// Indian filings centre the cause title (court name), the word VERSUS,
// the document title, and section headings. Party lines with dotted
// leaders ("RAM KUMAR ... PETITIONER") stay left-aligned even though
// they are ALL CAPS.
function isCenteredLine(line) {
  const t = line.trim()
  if (!t) return false
  if (/^(VERSUS|VS\.?|V\/S\.?)$/i.test(t)) return true
  if (/\.{3,}|…/.test(t)) return false     // dotted-leader party lines: keep left
  return isCourtHeading(t)
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
    // Court-filing standard (Supreme Court A4 norms, accepted across
    // High Courts and district courts):
    //   Paper    : A4, printed one side
    //   Font     : Times New Roman 14 pt (body and headings)
    //   Margins  : 4 cm left (binding) / 2 cm right / 2.5 cm top & bottom
    //   Spacing  : 1.5 lines (line: 360 in OOXML 240ths)
    //   Body     : justified; cause title / VERSUS / headings centred, bold
    //   Footer   : centred page number
    if (format === 'docx') {
      const { Document, Paragraph, TextRun, Packer, AlignmentType, Footer, PageNumber } = await import('docx')

      const lines = cleanContent.split('\n')

      const contentParagraphs = lines.map(rawLine => {
        const trimmed  = rawLine.trim()
        const empty    = !trimmed
        const heading  = !empty && isCourtHeading(trimmed)
        const centered = !empty && isCenteredLine(trimmed)

        if (empty) {
          // Blank line → short spacer paragraph
          return new Paragraph({
            spacing: { before: 0, after: 80, line: 240 },
            children: [new TextRun({ text: '', font: 'Times New Roman', size: 28 })],
          })
        }

        return new Paragraph({
          alignment: centered ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
          spacing: heading
            ? { before: 320, after: 200, line: 360 }  // extra space around headings
            : { before: 0,   after: 120, line: 360 }, // 1.5 line spacing for body
          children: [
            new TextRun({
              text: trimmed,
              font: 'Times New Roman',
              size: 28,                 // 14 pt (SC A4 filing standard)
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
              run:       { font: 'Times New Roman', size: 28, color: '000000' },
              paragraph: { spacing: { line: 360 } },
            },
          },
        },
        sections: [{
          properties: {
            page: {
              // A4, margins in twips (1440 = 1 inch; 567 = 1 cm)
              size:   { width: 11906, height: 16838 },
              margin: { top: 1418, right: 1134, bottom: 1418, left: 2268 },
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ children: ['- ', PageNumber.CURRENT, ' -'], font: 'Times New Roman', size: 22 }),
                  ],
                }),
              ],
            }),
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
    // Court-filing standard (Supreme Court A4 norms):
    //   Font     : Times (Times New Roman equivalent in jsPDF), 14 pt
    //   Margins  : 40 mm left (binding) / 20 mm right / 25 mm top & bottom
    //   Spacing  : 1.5 lines (~7.5 mm per line at 14 pt)
    //   Layout   : cause title / VERSUS / headings centred + bold,
    //              centred page number in the footer of every page
    if (format === 'pdf') {
      const { jsPDF } = await import('jspdf')
      const doc       = new jsPDF({ unit: 'mm', format: 'a4' })
      const mLeft     = 40   // 4 cm binding margin
      const mRight    = 20   // 2 cm right margin
      const pageW     = doc.internal.pageSize.getWidth()
      const maxW      = pageW - mLeft - mRight
      const pageH     = doc.internal.pageSize.getHeight()
      const LINE      = 7.5  // ~1.5 line spacing at 14 pt
      let   y         = 25   // 2.5 cm top margin

      const checkPage = (need = LINE + 1) => {
        if (y + need > pageH - 25) { doc.addPage(); y = 25 }
      }

      const lines = cleanContent.split('\n')

      for (const rawLine of lines) {
        const trimmed = rawLine.trim()

        // Blank lines — paragraph gap
        if (!trimmed) {
          y += 5
          checkPage()
          continue
        }

        const heading  = isCourtHeading(trimmed)
        const centered = isCenteredLine(trimmed)

        doc.setFontSize(14)
        doc.setFont('times', heading ? 'bold' : 'normal')
        doc.setTextColor(0, 0, 0)

        if (heading) { y += 4; checkPage(LINE + 4) }  // space above headings

        const wrapped = doc.splitTextToSize(trimmed, maxW)
        for (const wl of wrapped) {
          checkPage()
          if (centered) doc.text(wl, mLeft + maxW / 2, y, { align: 'center' })
          else          doc.text(wl, mLeft, y)
          y += LINE
        }

        if (heading) y += 2                            // space below headings
      }

      // Centred page numbers — "- N -" in the bottom margin of every page
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(11)
        doc.setFont('times', 'normal')
        doc.text(`- ${i} -`, pageW / 2, pageH - 12, { align: 'center' })
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
