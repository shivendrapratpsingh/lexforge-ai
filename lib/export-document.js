// ─────────────────────────────────────────────────────────────────
//  Turning text into a file somebody can keep.
//
//  These builders were inside the draft export route, welded to a saved
//  draft. But a draft is not the only thing the app produces: an order
//  analysis, a legal analysis, a moot memorial, a set of judgments —
//  all of it appeared on screen and could be reached in no other way.
//
//  So the formatting lives here and takes plain text, and both the
//  saved-draft route and the ad-hoc route call it. The court layout
//  rules below are the reason this is worth sharing rather than
//  reimplementing: an export that needs reformatting before filing is
//  an export the advocate did half of themselves.
// ─────────────────────────────────────────────────────────────────

// ─── Court heading detector ───────────────────────────────────────
// A line is a heading if it is entirely uppercase, at least 4
// characters, does not start with a digit (excluding numbered
// paragraphs like "1. That...") and contains at least 3 consecutive
// capitals (excluding bare punctuation lines).
export function isCourtHeading(line) {
  const t = String(line || '').trim()
  if (!t || t.length < 4) return false
  if (/^\d/.test(t)) return false
  if (/^\[/.test(t)) return false
  return t === t.toUpperCase() && /[A-Z]{3,}/.test(t)
}

// ─── Centred-line detector ────────────────────────────────────────
// Indian filings centre the cause title, the word VERSUS, the document
// title and section headings. Party lines with dotted leaders
// ("RAM KUMAR ... PETITIONER") stay left even though they are caps.
export function isCenteredLine(line) {
  const t = String(line || '').trim()
  if (!t) return false
  if (/^(VERSUS|VS\.?|V\/S\.?)$/i.test(t)) return true
  if (/\.{3,}|…/.test(t)) return false
  return isCourtHeading(t)
}

/** A filename that survives every operating system. */
export function safeFileName(title) {
  return String(title || 'document')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 60) || 'document'
}

/** Plain text, with a short reference header for the file copy. */
export function buildTxt({ title, content, meta = [] }) {
  return [
    title,
    '='.repeat(60),
    ...meta.filter(Boolean).map(([k, v]) => `${String(k).padEnd(14)}: ${v}`),
    '',
    '─'.repeat(60),
    '',
    content,
  ].join('\n')
}

// ─── DOCX ─────────────────────────────────────────────────────────
// Court-filing standard (Supreme Court A4 norms, accepted across High
// Courts and district courts):
//   Paper   : A4, one side
//   Font    : Times New Roman 14 pt
//   Margins : 4 cm left (binding) / 2 cm right / 2.5 cm top and bottom
//   Spacing : 1.5 lines (360 in OOXML 240ths)
//   Body    : justified; cause title / VERSUS / headings centred, bold
//   Footer  : centred page number
export async function buildDocx({ content }) {
  const { Document, Paragraph, TextRun, Packer, AlignmentType, Footer, PageNumber } = await import('docx')

  const contentParagraphs = String(content || '').split('\n').map(rawLine => {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      return new Paragraph({
        spacing: { before: 0, after: 80, line: 240 },
        children: [new TextRun({ text: '', font: 'Times New Roman', size: 28 })],
      })
    }
    const heading  = isCourtHeading(trimmed)
    const centered = isCenteredLine(trimmed)
    return new Paragraph({
      alignment: centered ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
      spacing: heading
        ? { before: 320, after: 200, line: 360 }
        : { before: 0, after: 120, line: 360 },
      children: [new TextRun({
        text: trimmed, font: 'Times New Roman', size: 28,
        bold: heading, color: '000000',
      })],
    })
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 28, color: '000000' },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1418, right: 1134, bottom: 1418, left: 2268 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              children: [PageNumber.CURRENT],
              font: 'Times New Roman', size: 22, color: '000000',
            })],
          })],
        }),
      },
      children: contentParagraphs,
    }],
  })

  return Packer.toBuffer(doc)
}

// ─── PDF ──────────────────────────────────────────────────────────
// Same page geometry as the DOCX, so the two are interchangeable.
export async function buildPdf({ content }) {
  const { jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' })
  const mLeft  = 40   // 4 cm binding margin
  const mRight = 20
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const maxW   = pageW - mLeft - mRight
  const LINE   = 7.5  // ~1.5 line spacing at 14 pt
  let   y      = 25

  const checkPage = (need = LINE + 1) => {
    if (y + need > pageH - 25) { doc.addPage(); y = 25 }
  }

  for (const rawLine of String(content || '').split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) { y += 5; checkPage(); continue }

    const heading  = isCourtHeading(trimmed)
    const centered = isCenteredLine(trimmed)

    doc.setFontSize(14)
    doc.setFont('times', heading ? 'bold' : 'normal')
    doc.setTextColor(0, 0, 0)

    if (heading) { y += 4; checkPage(LINE + 4) }

    for (const wl of doc.splitTextToSize(trimmed, maxW)) {
      checkPage()
      if (centered) doc.text(wl, mLeft + maxW / 2, y, { align: 'center' })
      else          doc.text(wl, mLeft, y)
      y += LINE
    }
    if (heading) y += 2
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(11)
    doc.setFont('times', 'normal')
    doc.text(`- ${i} -`, pageW / 2, pageH - 12, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}

/** One call: text in, a downloadable file out. */
export async function buildExport({ title, content, format, meta = [] }) {
  const name = safeFileName(title)
  if (format === 'txt') {
    return {
      body: buildTxt({ title, content, meta }),
      type: 'text/plain; charset=utf-8',
      filename: `${name}.txt`,
    }
  }
  if (format === 'docx') {
    return {
      body: await buildDocx({ content }),
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      filename: `${name}.docx`,
    }
  }
  return {
    body: await buildPdf({ content }),
    type: 'application/pdf',
    filename: `${name}.pdf`,
  }
}

export const EXPORT_FORMATS = ['pdf', 'docx', 'txt']
