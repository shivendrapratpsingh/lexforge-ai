// ─────────────────────────────────────────────────────────────────
//  LexForge AI — markdown.js
//  Shared utilities for converting the model's markdown-flavoured
//  output into the right shape for each export format.
//
//  Three exports:
//    stripMarkdown(text)     -> plain text  (used for TXT export)
//    parseInline(line)       -> [{text, bold, italic}]  (DOCX runs)
//    pdfRenderLine(doc, line, x, y, maxW, opts) -> y'  (jsPDF)
//
//  All three handle:
//    **bold**   __bold__
//    *italic*   _italic_
//    `code`            (kept inline, marker stripped)
//    # / ## / ### headings (stripped, line is treated as bold)
//    > blockquote      (marker stripped)
//    -, *, • bullets at start of line (preserved as bullets)
//    1. numbered lists (preserved)
// ─────────────────────────────────────────────────────────────────

// ─── 1. Strip everything to plain text (TXT export) ────────────────
export function stripMarkdown(text) {
  if (!text) return ''
  return text
    // bold/italic: keep inner text
    .replace(/\*\*([^\*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/(^|[^\*])\*([^\*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1$2')
    // inline code
    .replace(/`([^`\n]+)`/g, '$1')
    // headings
    .replace(/^#{1,6}\s+/gm, '')
    // blockquote markers
    .replace(/^>\s?/gm, '')
    // horizontal rules
    .replace(/^[-=_]{3,}\s*$/gm, '')
}

// ─── 2. Inline parser → list of styled runs (DOCX export) ──────────
// Walks a single line and returns an ordered list of chunks with
// {text, bold, italic, code} flags. Headings are flagged as bold.
// Returns the parsed runs; the CALLER decides how to wrap them.
export function parseInline(line) {
  if (line === null || line === undefined) return [{ text: '', bold: false, italic: false }]

  let raw = String(line)
  let isHeading = false

  // Strip blockquote marker
  if (/^>\s?/.test(raw)) raw = raw.replace(/^>\s?/, '')

  // Headings → strip ##, mark line as bold
  const h = raw.match(/^(#{1,6})\s+(.*)$/)
  if (h) {
    raw = h[2]
    isHeading = true
  }

  // Tokeniser: walk char-by-char, track open spans.
  // Markers we recognise: **, __, *, _, `
  const out = []
  let buf = ''
  let bold = false
  let italic = false
  let code = false
  let i = 0

  const flush = () => {
    if (buf.length === 0) return
    out.push({ text: buf, bold: bold || isHeading, italic, code })
    buf = ''
  }

  while (i < raw.length) {
    const two = raw.slice(i, i + 2)
    const ch = raw[i]

    if (!code && (two === '**' || two === '__')) {
      flush()
      bold = !bold
      i += 2
      continue
    }
    if (!code && (ch === '*' || ch === '_')) {
      // single underscore inside a word should not toggle italic
      const prev = raw[i - 1] || ' '
      const next = raw[i + 1] || ' '
      const isBoundary = /[\s\W]/.test(prev) || /[\s\W]/.test(next)
      if (isBoundary) {
        flush()
        italic = !italic
        i += 1
        continue
      }
    }
    if (ch === '`') {
      flush()
      code = !code
      i += 1
      continue
    }

    buf += ch
    i += 1
  }
  flush()

  if (out.length === 0) out.push({ text: '', bold: isHeading, italic: false, code: false })
  return out
}

// ─── 3. PDF helper — render one logical line with bold/italic chunks
// jsPDF can't natively switch font mid-line, so we manually walk the
// chunks, switch font weight, advance x, and wrap to next line when
// we run out of width.
//
// Usage:
//   y = pdfRenderLine(doc, line, x, y, maxW, { lineHeight: 5.5, fontSize: 11 })
export function pdfRenderLine(doc, line, x, y, maxW, opts = {}) {
  const lineHeight = opts.lineHeight || 5.5
  const fontSize   = opts.fontSize   || 11
  const fontFamily = opts.fontFamily || 'helvetica'
  const onWrap     = opts.onWrap     // optional: called when y advances; can return new y

  doc.setFontSize(fontSize)

  const runs = parseInline(line)
  let curX = x
  const startX = x

  for (const r of runs) {
    if (!r.text) continue
    const style = r.bold && r.italic ? 'bolditalic'
                : r.bold ? 'bold'
                : r.italic ? 'italic'
                : 'normal'
    doc.setFont(fontFamily, style)

    // word-wrap each run independently
    const words = r.text.split(/(\s+)/) // keep whitespace tokens
    for (const w of words) {
      if (!w) continue
      const wWidth = doc.getTextWidth(w)
      if (curX + wWidth > startX + maxW && curX > startX) {
        // wrap
        y += lineHeight
        curX = startX
        if (onWrap) {
          const newY = onWrap(y)
          if (typeof newY === 'number') y = newY
        }
        // skip leading whitespace after a wrap
        if (/^\s+$/.test(w)) continue
      }
      doc.text(w, curX, y)
      curX += wWidth
    }
  }

  return y + lineHeight
}
