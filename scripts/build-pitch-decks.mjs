// ─────────────────────────────────────────────────────────────────
//  The two decks you walk into a room with.
//
//    node scripts/build-pitch-decks.mjs
//
//  Output:
//    docs/LexForge-AI-Investor-Deck.pptx   — market, moat, economics
//    docs/LexForge-AI-College-Deck.pptx    — students, safety, pilot
//
//  Deliberately TWO files, not one. An investor is buying a company
//  and wants the moat and the unit economics; a Principal is buying an
//  outcome for students and wants to know who can read a student's
//  draft. A single deck that tries both ends up vague to each, and you
//  cannot skip slides gracefully in a live room.
//
//  RULE OBSERVED THROUGHOUT: there is not one invented metric in
//  either deck. Every number here is either counted from this
//  repository, read out of lib/billing.js, or explicitly labelled an
//  ASSUMPTION for the reader to challenge. There are no users yet and
//  neither deck pretends otherwise — a fabricated traction number is
//  the one thing that ends a fundraise permanently.
//
//  Same house style as scripts/build-deck.mjs: same palette, same flow
//  layout, same overflow guard. Blocks return where they ended and the
//  next one starts there.
// ─────────────────────────────────────────────────────────────────
import PptxGenJS from 'pptxgenjs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ─── Palette ──────────────────────────────────────────────────────
// The app's own colours, so the slides look like the thing they
// describe. Shared with scripts/build-deck.mjs.
const BG     = '0D0D0D'
const PANEL  = '161616'
const PANEL2 = '1C1C1C'
const LINE   = '2A2A2A'
const GOLD   = 'D4A017'
const GOLDLT = 'F0C550'
const GOLDXD = '3A2E12'
const INK    = 'F2F0EA'
const MUTED  = '9A958C'
const FAINT  = '6A6560'
const GREEN  = '5FCC8D'
const RED    = 'FF8A80'
const BLUE   = '7FB2F0'

const DISPLAY = 'Georgia'
const BODY    = 'Calibri'

// ─── Geometry ─────────────────────────────────────────────────────
const W = 13.333, H = 7.5
const M = 0.72
const CW = W - M * 2
const TOP = 1.82
const BOTTOM = 6.72
const GAP = 0.26

// ─── Facts ────────────────────────────────────────────────────────
// Single place for anything that would otherwise be retyped across
// slides and drift. Counted from this repo on the date below.
const F = {
  // Change this one line if the custom domain goes live.
  site: 'lexforge-ai.vercel.app',
  email: 'support.lexforge@gmail.com',
  counted: 'counted from the repository, 1 September 2026',

  docTypes: 20,        // lib/utils.js DOCUMENT_TYPES
  apiRoutes: 86,       // find app/api -name route.js
  analysers: 6,        // app/(dashboard)/tools — Order, Amendment, Fresh, Appeal, Counter, Compliance
  languages: 7,        // English, Hindi, Bilingual, Urdu, Tamil, Telugu, Kannada
  locales: 2,          // interface: en + hi
  linesOfCode: '37,600',
  files: 388,
  commits: 119,
  verifySuites: 17,    // npm run verify
  judgments: '50+',    // lib/study-content.js
  buildStart: 'April 2026',

  freeDocs: 2,         // documents per calendar month on the free plan
  freeWords: '1,200',
  proWords: '5,000',

  // lib/billing.js — the only place these live in the product.
  directMonthly: '₹2,250',
  directYearlyPerMonth: '₹2,000',
  seatMonthly: '₹2,000',
  seatYearlyPerMonth: '₹1,800',
  seatYearlyTotal: '₹21,600',
}

// ─── Deck factory ─────────────────────────────────────────────────
// One instance per output file — pptxgenjs cannot be reused across
// two writeFile() calls.
function makeDeck({ title, subject }) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'LexForge AI'
  pptx.company = 'LexForge AI'
  pptx.title = title
  pptx.subject = subject

  const state = { n: 0, overflows: [] }

  const begin = (s, y) => (y == null ? (s.__y ?? TOP) : y)
  function end(s, y, { flow = true } = {}) {
    if (flow) s.__y = y + GAP
    s.__max = Math.max(s.__max ?? 0, y)
    return y
  }

  /** The exploded-law-book motif from the website hero. */
  function bookMotif(s, { x, y, scale = 1 }) {
    const layers = [
      { dy: 0.00,  w: 3.00, h: 0.95, fill: GOLD, t: 78 },
      { dy: -0.42, w: 2.66, h: 0.84, fill: INK,  t: 88 },
      { dy: -0.80, w: 2.36, h: 0.75, fill: INK,  t: 91 },
      { dy: -1.16, w: 2.06, h: 0.66, fill: INK,  t: 94 },
    ]
    for (const l of layers) {
      s.addShape(pptx.ShapeType.diamond, {
        x: x - (l.w * scale) / 2, y: y + l.dy * scale,
        w: l.w * scale, h: l.h * scale,
        fill: { color: l.fill, transparency: l.t },
        line: { color: GOLD, width: 0.75, transparency: Math.min(94, l.t + 6) },
      })
    }
    const dw = 0.74 * scale, dh = 0.96 * scale
    const dx = x - dw / 2, dy = y - 2.20 * scale
    s.addShape(pptx.ShapeType.roundRect, {
      x: dx, y: dy, w: dw, h: dh, rectRadius: 0.05,
      fill: { color: 'E8E2D2', transparency: 60 }, line: { color: GOLD, width: 1, transparency: 30 },
    })
    s.addShape(pptx.ShapeType.rect, {
      x: dx, y: dy, w: dw, h: 0.13 * scale,
      fill: { color: GOLD, transparency: 30 }, line: { type: 'none' },
    })
    for (let i = 0; i < 4; i++) {
      s.addShape(pptx.ShapeType.rect, {
        x: dx + 0.11 * scale, y: dy + (0.27 + i * 0.135) * scale,
        w: (dw - 0.22 * scale) * (i === 3 ? 0.55 : 1), h: 0.032 * scale,
        fill: { color: '6E6A5E', transparency: 42 }, line: { type: 'none' },
      })
    }
    s.addShape(pptx.ShapeType.ellipse, {
      x: dx + dw - 0.30 * scale, y: dy + dh - 0.30 * scale,
      w: 0.19 * scale, h: 0.19 * scale,
      fill: { color: GOLD, transparency: 40 }, line: { color: GOLD, width: 0.75, transparency: 25 },
    })
  }

  function frame(s, { number = true } = {}) {
    s.background = { color: BG }
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.055, fill: { color: GOLD } })
    s.addText('LEXFORGE AI', {
      x: M, y: BOTTOM + 0.34, w: 3, h: 0.28, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 9, color: FAINT, bold: true, charSpacing: 2.2,
    })
    if (number) {
      s.addText(String(state.n), {
        x: W - M - 1, y: BOTTOM + 0.34, w: 1, h: 0.28, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 9.5, color: FAINT, align: 'right',
      })
    }
  }

  function slide(kicker, title, notes) {
    state.n++
    const s = pptx.addSlide()
    s.__name = `${state.n}. ${title}`
    s.__y = TOP
    frame(s)
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.46, w: CW, h: 0.26, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 10.5, color: GOLD, bold: true, charSpacing: 3,
    })
    s.addText(title, {
      x: M, y: 0.72, w: CW, h: 0.72, isTextBox: true, margin: 0,
      fontFace: DISPLAY, fontSize: 30, color: INK, bold: true, valign: 'top',
    })
    s.addShape(pptx.ShapeType.rect, { x: M, y: 1.55, w: 1.5, h: 0.028, fill: { color: GOLD } })
    s.addShape(pptx.ShapeType.rect, { x: M + 1.5, y: 1.55, w: CW - 1.5, h: 0.028, fill: { color: LINE } })
    if (notes) s.addNotes(notes)
    return s
  }

  function divider(num, title, blurb) {
    state.n++
    const s = pptx.addSlide()
    s.__name = `${state.n}. ${title} (divider)`
    frame(s, { number: false })
    s.addText(num, {
      x: W - 5.4, y: 0.9, w: 4.7, h: 5.6, isTextBox: true, margin: 0,
      fontFace: DISPLAY, fontSize: 200, color: GOLDXD, bold: true,
      align: 'right', valign: 'middle',
    })
    s.addText('PART', {
      x: M, y: 2.62, w: 7, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BODY, fontSize: 11, color: GOLD, bold: true, charSpacing: 4,
    })
    s.addText(title, {
      x: M, y: 2.95, w: 7.4, h: 1.1, isTextBox: true, margin: 0,
      fontFace: DISPLAY, fontSize: 44, color: INK, bold: true, valign: 'top',
    })
    s.addShape(pptx.ShapeType.rect, { x: M, y: 4.18, w: 1.9, h: 0.035, fill: { color: GOLD } })
    if (blurb) {
      s.addText(blurb, {
        x: M, y: 4.45, w: 6.4, h: 1, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 14.5, color: MUTED, lineSpacing: 22, valign: 'top',
      })
    }
    return s
  }

  /** Bulleted body text. */
  function list(s, y, items, opts = {}) {
    const y0 = begin(s, y)
    const x = opts.x ?? M
    const w = opts.w ?? CW
    const size = opts.size ?? 14.5
    const runs = []
    for (const it of items) {
      const [lead, rest] = Array.isArray(it) ? it : [null, it]
      const parts = []
      if (lead) parts.push({ text: lead + ' ', options: { bold: true, color: opts.leadColor || INK } })
      if (rest) parts.push({ text: rest, options: { color: MUTED } })
      parts[0].options.bullet = { characterCode: '2013', indent: 16 }
      parts[parts.length - 1].options.breakLine = true
      runs.push(...parts)
    }
    const lines = items.reduce((acc, it) => {
      const len = (Array.isArray(it) ? it.filter(Boolean).join(' ') : it).length
      return acc + Math.max(1, Math.ceil(len / (w * 8.6)))
    }, 0)
    const h = opts.h ?? lines * (size / 52) + items.length * 0.12 + 0.1
    s.addText(runs, {
      x, y: y0, w, h, isTextBox: true,
      fontFace: BODY, fontSize: size, lineSpacing: opts.lineSpacing ?? 24,
      color: MUTED, valign: 'top',
    })
    return end(s, y0 + h, opts)
  }

  /** Numbered steps, each in its own gold disc. */
  function stepList(s, y, items, opts = {}) {
    const y0 = begin(s, y)
    const x = opts.x ?? M
    const w = opts.w ?? CW
    const gap = opts.gap ?? 0.62
    items.forEach((it, i) => {
      const yy = y0 + i * gap
      s.addShape(pptx.ShapeType.ellipse, {
        x, y: yy + 0.02, w: 0.34, h: 0.34,
        fill: { color: GOLD, transparency: 84 }, line: { color: GOLD, width: 0.75 },
      })
      s.addText(String(i + 1), {
        x, y: yy + 0.02, w: 0.34, h: 0.34, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 12, color: GOLDLT, bold: true, align: 'center', valign: 'middle',
      })
      const [lead, rest] = Array.isArray(it) ? it : [null, it]
      const runs = []
      const sep = rest ? (/^\s*[—–→-]/.test(rest) ? ' ' : ' — ') : ''
      if (lead) runs.push({ text: lead + sep, options: { bold: true, color: INK } })
      if (rest) runs.push({ text: rest, options: { color: MUTED } })
      s.addText(runs, {
        x: x + 0.5, y: yy, w: w - 0.5, h: gap, isTextBox: true,
        fontFace: BODY, fontSize: opts.size ?? 14.5, lineSpacing: 21, valign: 'top',
      })
    })
    return end(s, y0 + items.length * gap, opts)
  }

  /**
   * A grid of cards. No edge stripe: the set apart is a tint and, where
   * the card is one of a counted series, a large ghosted numeral. The
   * count is the point of those slides, so it is the loudest thing in
   * the card.
   */
  function cards(s, y, items, opts = {}) {
    const y0 = begin(s, y)
    const cols = opts.cols ?? 3
    const gap  = opts.gap ?? 0.24
    const x0   = opts.x ?? M
    const totalW = opts.w ?? CW
    const rows = Math.ceil(items.length / cols)
    const cw = (totalW - gap * (cols - 1)) / cols
    const ch = opts.h ?? 1.4
    items.forEach((it, i) => {
      const cx = x0 + (i % cols) * (cw + gap)
      const cy = y0 + Math.floor(i / cols) * (ch + gap)
      s.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: cy, w: cw, h: ch, rectRadius: 0.05,
        fill: { color: PANEL2 }, line: { color: LINE, width: 1 },
      })
      if (it.num) {
        s.addText(it.num, {
          x: cx + cw - 1.05, y: cy + 0.04, w: 0.95, h: 0.7, isTextBox: true, margin: 0,
          fontFace: DISPLAY, fontSize: 34, color: GOLDXD, bold: true,
          align: 'right', valign: 'top',
        })
      }
      s.addText(it.title, {
        x: cx + 0.22, y: cy + 0.16, w: cw - (it.num ? 1.15 : 0.4), h: 0.5, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: opts.titleSize ?? 14, color: it.titleColor || INK, bold: true, valign: 'top',
      })
      if (it.body) {
        s.addText(it.body, {
          x: cx + 0.22, y: cy + (opts.bodyTop ?? 0.62), w: cw - 0.4, h: ch - (opts.bodyTop ?? 0.62) - 0.12,
          isTextBox: true, margin: 0,
          fontFace: BODY, fontSize: opts.bodySize ?? 11.5, color: MUTED, lineSpacing: 15, valign: 'top',
        })
      }
    })
    return end(s, y0 + rows * ch + (rows - 1) * gap, opts)
  }

  /**
   * Big-number callouts in a row. The "this is not a prototype" slide.
   *
   * The numeral's box is sized FROM its point size rather than fixed.
   * A 46pt digit needs ~0.86in of line box; in the 0.66in this used to
   * hardcode it rendered centred and bled into the label underneath.
   */
  function stats(s, y, items, opts = {}) {
    const y0 = begin(s, y)
    const cols = opts.cols ?? items.length
    const gap = opts.gap ?? 0.22
    const rows = Math.ceil(items.length / cols)
    const cw = (CW - gap * (cols - 1)) / cols
    const ch = opts.h ?? 1.5
    const vsize = opts.valueSize ?? 34
    const vh = Math.max(0.62, (vsize * 1.34) / 72)
    const labelTop = 0.14 + vh + 0.06
    items.forEach((it, i) => {
      const cx = M + (i % cols) * (cw + gap)
      const cy = y0 + Math.floor(i / cols) * (ch + gap)
      s.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: cy, w: cw, h: ch, rectRadius: 0.05,
        fill: { color: PANEL }, line: { color: LINE, width: 1 },
      })
      s.addText(it.value, {
        x: cx + 0.1, y: cy + 0.14, w: cw - 0.2, h: vh, isTextBox: true, margin: 0,
        fontFace: DISPLAY, fontSize: vsize, color: it.color || GOLDLT,
        bold: true, align: 'center', valign: 'middle',
      })
      s.addText(it.label, {
        x: cx + 0.12, y: cy + labelTop, w: cw - 0.24, h: ch - labelTop - 0.1,
        isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: opts.labelSize ?? 11, color: MUTED,
        align: 'center', valign: 'top', lineSpacing: 14,
      })
    })
    return end(s, y0 + rows * ch + (rows - 1) * gap, opts)
  }

  /** Two panels side by side — before/after, them/us. */
  function compare(s, y, left, right, opts = {}) {
    const y0 = begin(s, y)
    const gap = 0.3
    const cw = (CW - gap) / 2
    const ch = opts.h ?? 2.5
    ;[[left, M, RED], [right, M + cw + gap, GREEN]].forEach(([col, cx, defTone]) => {
      const tone = col.tone === 'good' ? GREEN : col.tone === 'bad' ? RED : defTone
      s.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: y0, w: cw, h: ch, rectRadius: 0.06,
        fill: { color: PANEL }, line: { color: tone, width: 1.1 },
      })
      s.addText(col.head.toUpperCase(), {
        x: cx + 0.26, y: y0 + 0.18, w: cw - 0.52, h: 0.3, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 10.5, color: tone, bold: true, charSpacing: 2.4,
      })
      s.addText(col.title, {
        x: cx + 0.26, y: y0 + 0.5, w: cw - 0.52, h: 0.56, isTextBox: true, margin: 0,
        fontFace: DISPLAY, fontSize: 19, color: INK, bold: true, valign: 'top',
      })
      const runs = []
      col.points.forEach((p, i) => {
        runs.push({
          text: p,
          options: {
            color: MUTED, breakLine: i < col.points.length - 1,
            bullet: { characterCode: '2013', indent: 15 },
          },
        })
      })
      s.addText(runs, {
        x: cx + 0.26, y: y0 + 1.12, w: cw - 0.52, h: ch - 1.26, isTextBox: true,
        fontFace: BODY, fontSize: opts.size ?? 13, lineSpacing: 20, valign: 'top',
      })
    })
    return end(s, y0 + ch, opts)
  }

  function callout(s, y, label, body, tone = 'gold', opts = {}) {
    const y0 = begin(s, y)
    const c = tone === 'danger' ? RED : tone === 'good' ? GREEN : tone === 'info' ? BLUE : GOLD
    const x = opts.x ?? M
    const w = opts.w ?? CW
    const size = opts.size ?? 14
    const chars = (label + '  ' + body).length
    const perLine = Math.max(20, (w - 0.6) / (size * 0.46 / 72))
    const lines = Math.max(1, Math.ceil(chars / perLine))
    const h = opts.h ?? Math.max(0.78, lines * (size + 6) / 72 + 0.34)
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: y0, w, h, rectRadius: 0.06,
      fill: { color: c, transparency: 92 }, line: { color: c, width: 1 },
    })
    s.addText([
      { text: label ? label + '  ' : '', options: { bold: true, color: c } },
      { text: body, options: { color: INK } },
    ], {
      x: x + 0.3, y: y0 + 0.08, w: w - 0.6, h: h - 0.16, isTextBox: true,
      fontFace: BODY, fontSize: size, lineSpacing: 20, valign: 'middle',
    })
    return end(s, y0 + h, opts)
  }

  function refTable(s, y, headers, rows, widths, opts = {}) {
    const y0 = begin(s, y)
    const head = headers.map(t => ({
      text: t.toUpperCase(),
      options: { bold: true, color: GOLD, fontSize: 10, charSpacing: 1.8, fill: { color: PANEL } },
    }))
    const bodyRows = rows.map(r => r.map((c, i) => ({
      text: c,
      options: { color: i === 0 ? INK : MUTED, bold: i === 0, fontSize: opts.size ?? 11.5 },
    })))
    const rh = opts.rowH ?? 0.375
    s.addTable([head, ...bodyRows], {
      x: M, y: y0, w: CW, colW: widths.map(p => (CW * p) / 100),
      rowH: rh,
      fontFace: BODY, border: { type: 'solid', color: LINE, pt: 0.5 },
      fill: { color: BG }, margin: [4, 9, 4, 9], valign: 'middle',
      autoPage: false,
    })
    return end(s, y0 + (rows.length + 1) * rh, opts)
  }

  /**
   * Cover and closing share a shape; both take the same arguments.
   *
   * Everything below the title FLOWS from it. The first version fixed
   * the rule at y=3.3 and the subtitle at 3.56, which is correct only
   * while the title stays on one line — "Introductions, not a cheque"
   * at 50pt wraps to two, and the second line landed on top of the
   * gold rule and the subtitle under it.
   */
  function bookend({ eyebrow, title, rule = true, subtitle, blurb, foot, notes, name }) {
    state.n++
    const s = pptx.addSlide()
    s.__name = name
    s.background = { color: BG }
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.055, fill: { color: GOLD } })
    bookMotif(s, { x: 10.55, y: 5.1, scale: 1.35 })

    // Wrap estimates. Georgia runs a little wider than Calibri, hence
    // the 0.52 advance ratio against the 0.50 used elsewhere.
    const wrap = (text, w, size, ratio = 0.52) =>
      Math.max(1, Math.ceil(text.length / Math.max(1, (w * 72) / (size * ratio))))

    const titleLines = wrap(title, 8.4, 50)
    const titleH = titleLines * (50 * 1.32) / 72
    // A wrapped title would push the stack into the contact line, so
    // the whole block starts higher instead.
    let y = titleLines > 1 ? 1.50 : 1.85

    if (eyebrow) {
      s.addText(eyebrow.toUpperCase(), {
        x: M, y, w: 8, h: 0.3, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 11, color: GOLD, bold: true, charSpacing: 4,
      })
    }
    y += 0.39
    s.addText(title, {
      x: M, y, w: 8.4, h: titleH, isTextBox: true, margin: 0,
      fontFace: DISPLAY, fontSize: 50, color: INK, bold: true, charSpacing: 2, valign: 'top',
    })
    y += titleH + 0.10

    if (rule) {
      s.addShape(pptx.ShapeType.rect, { x: M, y, w: 2.4, h: 0.04, fill: { color: GOLD } })
      y += 0.24
    }
    if (subtitle) {
      const subH = wrap(subtitle, 8.2, 24) * (24 * 1.32) / 72
      s.addText(subtitle, {
        x: M, y, w: 8.2, h: subH, isTextBox: true, margin: 0,
        fontFace: DISPLAY, fontSize: 24, color: GOLDLT, italic: true, valign: 'top',
      })
      y += subH + 0.18
    }
    if (blurb) {
      const blurbH = wrap(blurb, 7.6, 14.5, 0.50) * 23 / 72 + 0.1
      s.addText(blurb, {
        x: M, y, w: 7.6, h: blurbH, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 14.5, color: MUTED, lineSpacing: 23, valign: 'top',
      })
      y += blurbH
    }
    s.__max = Math.max(s.__max ?? 0, y)

    if (foot) {
      s.addText(foot, {
        x: M, y: 6.35, w: 10, h: 0.4, isTextBox: true, margin: 0,
        fontFace: BODY, fontSize: 12.5,
      })
    }
    if (notes) s.addNotes(notes)
    return s
  }

  function finish(outName) {
    for (const s of pptx.slides) {
      if (s.__max && s.__max > BOTTOM) {
        state.overflows.push(`${outName} — ${s.__name}: ends at ${s.__max.toFixed(2)}in, limit ${BOTTOM}in`)
      }
    }
    return { pptx, overflows: state.overflows }
  }

  return { pptx, slide, divider, list, stepList, cards, stats, compare, callout, refTable, bookend, bookMotif, frame, finish, state }
}

// The contact line, built the same way on every cover.
const footRuns = () => ([
  { text: F.site, options: { color: GOLD, bold: true } },
  { text: '     ·     ', options: { color: FAINT } },
  { text: F.email, options: { color: MUTED } },
])

// ══════════════════════════════════════════════════════════════════
//  DECK ONE — INVESTOR
// ══════════════════════════════════════════════════════════════════
function buildInvestorDeck() {
  const D = makeDeck({
    title: 'LexForge AI — Investor Deck',
    subject: 'Indian legal drafting that will not invent a citation',
  })
  const { slide, list, stepList, cards, stats, compare, callout, refTable, bookend } = D

  // ── Cover ───────────────────────────────────────────────────────
  bookend({
    name: 'cover',
    eyebrow: 'Legal technology · India',
    title: 'LexForge AI',
    subtitle: 'The drafting engine that refuses to invent a citation',
    blurb: 'Court-ready Indian legal documents in under a minute — grounded in retrieved judgments, ' +
           'with an automated test that proves no case name came from the model’s imagination.',
    foot: footRuns(),
    notes: 'Open on the sentence that matters: every general-purpose AI can write something that looks like a legal document. ' +
           'The entire question in this market is whether the citations are real. That is the only thing we optimised for, and it is testable.',
  })

  // ── Problem ─────────────────────────────────────────────────────
  {
    const s = slide('The problem', 'Legal AI has a truth problem',
      'Do not rush this slide. The fabricated-citation problem is the reason the product exists and the reason the moat is defensible. ' +
      'Courts in several jurisdictions have now sanctioned lawyers who filed AI-generated citations that did not exist. ' +
      'In law, a made-up citation is not a typo — it is professional misconduct.')
    compare(s,
      null,
      {
        head: 'General-purpose AI', tone: 'bad',
        title: 'Confident, fluent, and sometimes wrong',
        points: [
          'Invents case names that sound entirely plausible',
          'Cites real judgments against the wrong proposition',
          'Cannot tell you which parts it was unsure about',
          'A fabricated citation filed in court is misconduct, not a bug',
        ],
      },
      {
        head: 'What a practitioner needs', tone: 'good',
        title: 'Verifiable, or explicitly absent',
        points: [
          'Every authority traceable to a real reported judgment',
          'Silence where the index found nothing — not a plausible guess',
          'The user’s own facts reproduced exactly, never paraphrased',
          'Blanks marked as blanks, so nothing is quietly filled in',
        ],
      },
      { h: 2.55 })
    callout(s, null, 'Why this is the whole game.',
      'Speed is easy and every competitor will have it. Being trustworthy enough to file is the part that takes engineering — and it is what a lawyer is actually buying.')
  }

  // ── What it is ──────────────────────────────────────────────────
  {
    const s = slide('The product', 'Three surfaces, one legal engine',
      'Keep this short — it is orientation, not the pitch. The point is that the same grounded engine serves a practitioner and a student, ' +
      'which is why one product can sell into both markets without being rebuilt.')
    cards(s, null, [
      { title: 'Draft', body: `${F.docTypes} Indian document types — notice, petition, writ, bail, PIL, vakalatnama, sale deed, RTI, consumer complaint and more. Court-ready formatting, exported to PDF or DOCX.` },
      { title: 'Research', body: `Bare Act search and full text, case-law search and status, and ${F.analysers} analysers that read an order and build the appeal, counter, amendment or compliance report from it.` },
      { title: 'Learn', body: `A student hub: AI legal Q&A, a moot memorial builder, ${F.judgments} landmark judgments, an AI tutor, quizzes and a career roadmap.` },
    ], { cols: 3, h: 2.1, bodySize: 12.5, bodyTop: 0.68 })
    callout(s, null, 'One engine, two buyers.',
      'The practitioner pays for speed. The college pays for the same engine as a teaching instrument. Neither required a separate product to be built.', 'info')
  }

  // ── Built ───────────────────────────────────────────────────────
  {
    const s = slide('Status', 'This is built, not described',
      'Every figure here was counted from the repository, not estimated. Say that out loud — investors hear a lot of decks about products that do not exist yet. ' +
      'Offer a live demo on the spot; the product runs.')
    stats(s, null, [
      { value: String(F.docTypes), label: 'document types, each with its own intake form' },
      { value: String(F.apiRoutes), label: 'server routes in production' },
      { value: String(F.analysers), label: 'order and judgment analysers' },
      { value: String(F.languages), label: 'drafting languages, with real court vocabulary' },
    ], { cols: 4, h: 1.55 })
    stats(s, null, [
      { value: F.linesOfCode, label: 'lines of application code' },
      { value: String(F.verifySuites), label: 'verification suites, run by one command' },
      { value: String(F.commits), label: `commits since ${F.buildStart}` },
      { value: F.judgments, label: 'landmark judgments, structured for teaching' },
    ], { cols: 4, h: 1.55 })
    callout(s, null, 'No traction claimed.',
      'There are no live paying users yet, and nothing in this deck pretends there are. What exists is a finished product and a pilot ready to run.', 'info')
  }

  // ── The moat ────────────────────────────────────────────────────
  {
    const s = slide('The moat', 'Citations are retrieved, never recalled',
      'This is the single most important slide in the deck. The insight: asking a model to self-assess its own certainty does not work, ' +
      'because a fabricated citation is exactly the case where the model is confident and wrong at the same time. ' +
      'So we removed the model’s discretion entirely.')
    stepList(s, null, [
      ['Retrieve first', 'real judgments are pulled from the legal index before a single word is drafted.'],
      ['Draft from the list', 'the model is given those judgments and works only from them.'],
      ['Say nothing rather than guess', 'where the search returned nothing, the draft says so instead of inventing an authority to fill the gap.'],
      ['Prove it in CI', `npm run verify:grounding asserts that every case name in a generated draft traces back to the retrieved index or a human-curated list — never to the model’s recall.`],
    ], { gap: 0.66 })
    callout(s, null, 'From the codebase, not the brochure:',
      '“The old rule told the model to name a judgment only if you are certain. That is self-assessment — the model is confident and wrong at the same time, which is exactly what a fabricated citation is.”', 'good')
  }

  // ── Honesty as architecture ─────────────────────────────────────
  {
    const s = slide('The moat', 'Restraint, enforced in code',
      'The theme: most of the engineering effort went into stopping the model doing things, not making it do more. ' +
      'That is unusual, hard to retrofit, and exactly what a regulated profession will pay for.')
    cards(s, null, [
      { title: 'Input fidelity', body: 'Names, dates and amounts are reproduced verbatim. The model is forbidden from paraphrasing a party’s name or rounding a figure.' },
      { title: 'Bracketed blanks', body: 'A missing field becomes [TO BE FILLED], visible on the page. It is never silently invented so the document looks complete.' },
      { title: 'Junk rejected at the door', body: '“NA”, “no”, “don’t know”, “-” are stripped before they reach the prompt, and a form that is entirely junk is refused outright.' },
      { title: 'Promises are auditable', body: 'The Pro feature list is treated as a contractual promise. An overstated line is a consumer-law problem, so the list describes only what ships.' },
      { title: 'The assistant cites nothing', body: 'The chat assistant gives no citations by design — it was the surface where self-assessed confidence failed first.' },
      { title: 'Sources stay lawful', body: 'Court sites that disallow crawling are not crawled, and the CAPTCHA-protected cause list is not bypassed. Checked by an automated suite.' },
    ], { cols: 3, h: 1.62, bodySize: 11.5, bodyTop: 0.6 })
  }

  // ── Student value ───────────────────────────────────────────────
  {
    const s = slide('The wedge', 'Twelve reasons a law student opens it',
      'Count them out loud — the number is the argument. This is also the college deck’s centrepiece, so you can hand a Principal the same list. ' +
      'The point for an investor is that this is twelve separate habit loops, not one feature.')
    const ways = [
      'Draft real documents', 'Ask any law question', 'Build a moot memorial',
      'Study landmark judgments', 'Learn the doctrines', 'Ask the AI tutor',
      'Revise with quizzes', 'Plan a career', 'Search the Bare Acts',
      'Find case law', 'Analyse a real order', 'Run clients and dates',
    ]
    cards(s, null, ways.map((t, i) => ({ num: String(i + 1).padStart(2, '0'), title: t })),
      { cols: 4, h: 0.86, titleSize: 13 })
    callout(s, null, 'Twelve entry points, one account.',
      `Also inside: PDF and DOCX export, version history, ${F.languages} drafting languages and a mobile app. Every one of these is live today.`)
  }

  // ── Retention ───────────────────────────────────────────────────
  {
    const s = slide('Retention', 'Why year two is the student’s own decision',
      'The honest version of this argument: we are not claiming students love us. We are claiming that by month twelve their own work product lives here, ' +
      'and they are about to walk into a chamber where drafting speed decides whether they are kept on. That is switching cost plus career dependency.')
    stepList(s, null, [
      ['Months 1–3', 'the college pays. The student uses it because a teacher told them to.'],
      ['Months 4–8', 'their memorials, case briefs and drafts accumulate inside the account. It becomes where their work lives.'],
      ['Months 9–12', 'they take it into an internship. It stops being coursework and becomes the tool they are judged on.'],
      ['Graduation', 'leaving means abandoning their own archive and the drafting speed a senior is now timing them against.'],
    ], { gap: 0.6 })
    callout(s, null, 'The comparison that closes it:',
      `${F.directMonthly} a month against the value of a single brief kept rather than lost. The student is not buying software — they are buying the version of themselves that drafts in twenty minutes instead of two days.`, 'good')
  }

  // ── Model ───────────────────────────────────────────────────────
  {
    const s = slide('Business model', 'Prepaid, per seat, nothing auto-debits',
      'Two things to flag. First, a college pays less per head than an individual — that is deliberate, it is the reason for a college to fund it rather than leave students to buy their own. ' +
      'Second, nothing auto-renews: Razorpay subscriptions need eMandate approval that is refused to accounts with no history, so plans are prepaid and extend the term.')
    refTable(s, null, ['Who is buying', 'Monthly', 'Billed yearly', 'What that is per year'], [
      ['Individual — advocate or student', F.directMonthly, `${F.directYearlyPerMonth} / month`, '₹24,000'],
      ['College — per enrolled student', F.seatMonthly, `${F.seatYearlyPerMonth} / month`, F.seatYearlyTotal],
    ], [40, 18, 22, 20], { rowH: 0.46, size: 13 })
    list(s, null, [
      ['Per seat, not a flat licence.', 'A college with forty active students is not billed like one with four hundred.'],
      ['Access is time-boxed.', 'A pilot that has ended stops granting access without anyone remembering to switch it off.'],
      ['Renewing early adds to the term.', 'Paying before expiry never costs a user the days they already bought.'],
      ['The free tier is real but bounded.', `${F.freeDocs} documents a calendar month and roughly ${F.freeWords} words a draft; paid removes both.`],
    ], { size: 13.5, lineSpacing: 21 })
  }

  // ── Unit economics ──────────────────────────────────────────────
  {
    const s = slide('Unit economics', 'What one college is worth',
      'Every figure on this slide is arithmetic from the published rate card — there is no assumed conversion rate hidden in it. ' +
      'The only variable is the seat count, and that is the number you negotiate.')
    stats(s, null, [
      { value: '₹12.96L', label: 'a 60-seat pilot cohort, at the yearly rate, over twelve months' },
      { value: '₹64.80L', label: 'a 300-student college, same rate, same period' },
      { value: F.seatYearlyTotal, label: 'per student per year — the only unit that matters' },
    ], { cols: 3, h: 1.72, valueSize: 36 })
    callout(s, null, 'Read this honestly.',
      'These are list-price arithmetic, not forecasts. No college has signed yet. The pilot exists precisely to find out what a real institution will actually pay and to produce the reference that makes the second sale cheaper than the first.', 'info')
  }

  // ── Market ──────────────────────────────────────────────────────
  {
    const s = slide('Market', 'Sized from the bottom up, assumptions on the table',
      'Deliberately built from two inputs you can attack rather than a headline TAM. If an investor disputes either number the whole slide re-computes in front of them, ' +
      'which is a much better conversation than defending a figure from a report nobody has read.')
    refTable(s, null, ['Input', 'Value used', 'Status'], [
      ['BCI-approved law colleges in India', '~1,700', 'ASSUMPTION — verify before quoting'],
      ['Average enrolled students per college', '300', 'ASSUMPTION — varies widely'],
      ['Addressable students', '~510,000', 'Derived from the two rows above'],
      ['Revenue per student per year', F.seatYearlyTotal, 'Published rate card, lib/billing.js'],
    ], [40, 24, 36], { rowH: 0.44, size: 12.5 })
    stats(s, null, [
      { value: '₹11 cr', label: 'annual revenue at 1% of law students' },
      { value: '₹55 cr', label: 'annual revenue at 5% of law students' },
      { value: '₹6.5 cr', label: 'annual revenue at ten colleges of 300' },
    ], { cols: 3, h: 1.4, valueSize: 30 })
  }

  // ── GTM ─────────────────────────────────────────────────────────
  {
    const s = slide('Go to market', 'Colleges first, because enrolment is automatic',
      'The mechanical detail that makes college-first work: a student signing up with a college email domain is linked and granted access with nobody doing anything. ' +
      'And because many Indian colleges issue no student email at all, there is a second path by pre-authorised invite — otherwise domain matching would exclude exactly the students least able to pay.')
    stepList(s, null, [
      ['Land one college', 'a free single-semester pilot with a defined cohort. Costs us compute, not sales headcount.'],
      ['Enrol without administration', 'students on the college domain are linked automatically; the rest by spreadsheet import or invite.'],
      ['Produce the reference', 'a Principal who has seen a cohort through a semester is the only credible sales asset in Indian education.'],
      ['Expand to the graduate', 'the student who leaves keeps the account and pays the individual rate. The college paid for the acquisition.'],
    ], { gap: 0.64 })
    callout(s, null, 'The compliance folder is already built.',
      'A GST non-registration declaration, a DPDP data-protection undertaking and a rate card, all on letterhead — the three papers a college accounts department asks for before it will raise a purchase order.', 'good')
  }

  // ── Risk ────────────────────────────────────────────────────────
  {
    const s = slide('Where it stands', 'The honest list',
      'Volunteer the weaknesses. An investor will find all four anyway, and finding them yourself is the cheapest credibility available in a first meeting.')
    compare(s, null,
      {
        head: 'Done', tone: 'good',
        title: 'Built and testable today',
        points: [
          'The full product, running in production',
          'Grounded citations with an automated proof',
          'Billing, invoicing and institution management',
          'The compliance papers a college will ask for',
        ],
      },
      {
        head: 'Not done', tone: 'bad',
        title: 'What we are open about',
        points: [
          'No paying customers and no signed pilot yet',
          'Pricing is untested against a real purchase order',
          'Retention is argued from first principles, not measured',
          'Distribution is one founder, not a sales team',
        ],
      },
      { h: 2.5 })
    callout(s, null, 'Which is exactly what the next six months are for.',
      'One pilot, run properly, converts three of those four unknowns into evidence.')
  }

  // ── Ask ─────────────────────────────────────────────────────────
  bookend({
    name: 'the ask',
    eyebrow: 'What I am asking for',
    title: 'Three introductions',
    subtitle: 'And an hour of your judgement — not a cheque',
    blurb: 'An introduction to a law college Principal or Dean who would run a free semester pilot. ' +
           'An introduction to a practising advocate willing to break the drafting engine on real matters. ' +
           'And your view on the pricing before it is quoted to an institution for the first time.',
    foot: footRuns(),
    notes: 'Close deliberately soft. You are not raising money in this meeting — you are converting the meeting into a pilot and a critic. ' +
           'Both are worth more right now than a term sheet, and asking for them makes the eventual raise easier because you will have evidence.',
  })

  return D.finish('investor')
}

// ══════════════════════════════════════════════════════════════════
//  DECK TWO — COLLEGE
// ══════════════════════════════════════════════════════════════════
function buildCollegeDeck() {
  const D = makeDeck({
    title: 'LexForge AI — For Law Colleges',
    subject: 'What it gives your students, and the pilot we are proposing',
  })
  const { slide, list, stepList, cards, stats, compare, callout, refTable, bookend } = D

  // ── Cover ───────────────────────────────────────────────────────
  bookend({
    name: 'cover',
    eyebrow: 'For the Principal and the Faculty',
    title: 'LexForge AI',
    subtitle: 'What your students can do by the end of one semester',
    blurb: 'A drafting, research and study platform built for Indian law — and a proposal for a free single-semester pilot ' +
           'with one cohort of your students.',
    foot: footRuns(),
    notes: 'Open by naming the gap, not the software: a student can explain Article 21 in an examination and still cannot produce a bail application on the first morning of an internship. ' +
           'That gap is what this closes.',
  })

  // ── The gap ─────────────────────────────────────────────────────
  {
    const s = slide('The gap', 'The examination does not test the thing chambers hire for',
      'Say this gently but plainly — every Principal already knows it. The syllabus produces students who know the law and have never once produced a filing. ' +
      'The first internship is where they find out.')
    compare(s, null,
      {
        head: 'What we examine', tone: 'bad',
        title: 'Knowledge, tested on paper',
        points: [
          'Recite the doctrine and the leading judgment',
          'Analyse a problem question in three hours',
          'Cite from memory in an examination hall',
          'Graduate having never drafted a real filing',
        ],
      },
      {
        head: 'What a chamber asks for', tone: 'good',
        title: 'Work product, on the first morning',
        points: [
          'Draft this bail application by the afternoon',
          'Read this order and tell me our grounds of appeal',
          'Find me the authority, with the citation',
          'Format it so it can actually be filed',
        ],
      },
      { h: 2.55 })
    callout(s, null, 'The complaint we are answering.',
      'Seniors do not say your students do not know law. They say your students cannot yet produce work. That is a practice gap, and practice is the one thing a syllabus cannot manufacture.')
  }

  // ── What it is ──────────────────────────────────────────────────
  {
    const s = slide('What it is', 'One website, nothing to install',
      'Deal with the IT question immediately — it is the first objection in every meeting. There is no installation, no lab, no server, and no update to push.')
    s.addShape(D.pptx.ShapeType.roundRect, {
      x: M, y: TOP, w: CW, h: 1.05, rectRadius: 0.08,
      fill: { color: PANEL }, line: { color: GOLD, width: 1.25 },
    })
    s.addText(F.site, {
      x: M, y: TOP, w: CW, h: 1.05, isTextBox: true, margin: 0,
      fontFace: DISPLAY, fontSize: 32, color: GOLDLT, bold: true, align: 'center', valign: 'middle',
    })
    s.__y = TOP + 1.05 + GAP
    list(s, null, [
      ['No installation and no computer lab.', 'It runs in any browser, on the phone a student already owns.'],
      ['No work for your IT staff.', 'No server, no licence keys to distribute, and no update anyone has to install.'],
      ['Students are enrolled automatically.', 'Anyone signing up on your college email domain is linked without an administrator touching anything — and where your students use personal email, we import them from a spreadsheet you send us.'],
      ['Available in English and हिन्दी,', `and it drafts in ${F.languages} languages with the court vocabulary each one actually uses.`],
    ], { size: 14, lineSpacing: 23 })
  }

  // ── The twelve, part one ────────────────────────────────────────
  {
    const s = slide('For your students', 'Twelve ways it is used — one to six',
      'This is the heart of the meeting. Go slowly and let them count. Six on this slide, six on the next, and the number itself is the argument: ' +
      'this is not one feature dressed up, it is twelve distinct things a law student needs.')
    cards(s, null, [
      { num: '01', title: 'Draft real legal documents',
        body: `${F.docTypes} types — legal notice, petition, writ, bail application, PIL, affidavit, vakalatnama, sale deed, RTI, consumer complaint and more, in court-ready format.` },
      { num: '02', title: 'Ask any question of Indian law',
        body: 'A citation-backed answer with the statutory provision, the leading judgments and the point an examiner is looking for.' },
      { num: '03', title: 'Build a moot court memorial',
        body: 'Paste the moot problem, choose a side, and get a full memorial outline — facts, issues, arguments and prayer — to argue with and improve.' },
      { num: '04', title: 'Study landmark judgments',
        body: `${F.judgments} Supreme Court and High Court cases, each broken into facts, issue, holding, ratio and why it still matters.` },
      { num: '05', title: 'Learn the doctrines properly',
        body: 'Constitutional and common-law principles with the case they came from and how they are applied today.' },
      { num: '06', title: 'Ask the AI tutor',
        body: 'A tutor grounded in that same curated catalogue, so revision answers stay anchored to real cases rather than invention.' },
    ], { cols: 3, h: 2.0, bodySize: 11.5, bodyTop: 0.72 })
  }

  // ── The twelve, part two ────────────────────────────────────────
  {
    const s = slide('For your students', 'Twelve ways it is used — seven to twelve',
      'Numbers eleven and twelve are the ones a final-year student and their internship supervisor care about most. Linger there.')
    cards(s, null, [
      { num: '07', title: 'Revise with quizzes and flashcards',
        body: 'Generated on any topic, and printable as a handout with the questions first and the answers at the end.' },
      { num: '08', title: 'Plan a career honestly',
        body: 'Litigation, corporate, judiciary, an LLM abroad, civil services or academia — set out year by year rather than guessed at.' },
      { num: '09', title: 'Search the Bare Acts',
        body: 'Search across Indian statutes and read the full text of the section, rather than a paraphrase of it.' },
      { num: '10', title: 'Find case law that exists',
        body: 'Real reported judgments with links back to the source, so a student learns to verify rather than to trust.' },
      { num: '11', title: 'Analyse a real court order',
        body: 'Six analysers: read an order and produce the grounds of appeal, the counter, an amendment, a fresh application or a compliance report.' },
      { num: '12', title: 'Run a matter like a chamber does',
        body: 'Clients, court dates and version-controlled drafts — the administrative habits nobody teaches and every senior expects.' },
    ], { cols: 3, h: 2.0, bodySize: 11.5, bodyTop: 0.72 })
  }

  // ── Semester ────────────────────────────────────────────────────
  {
    const s = slide('In practice', 'One student, one semester',
      'Make it concrete with a single imagined student. This is the slide that turns a feature list into something a Principal can picture happening in their own building.')
    // Deliberately list() and not stepList(): the numbered gold discs
    // would run 1-6 beside text reading "Week 1, Week 3, Week 6", and
    // the two sequences disagreeing on the same line reads as an error.
    list(s, null, [
      ['Week 1 —', 'signs in with the college email. No form to fill, no fee, no approval to wait for.'],
      ['Week 3 —', 'drafts a legal notice for a clinical-legal-education file and sees what a real one looks like for the first time.'],
      ['Week 6 —', 'builds a moot memorial, argues it, and rewrites the weak issue after the bench takes it apart.'],
      ['Week 10 —', 'revises for internals against the landmark-judgment deck and the quiz generator.'],
      ['Week 14 —', 'reads a real order in an internship and produces the grounds of appeal the same evening.'],
      ['End of term —', 'has an archive of their own work, and a habit their supervisor noticed.'],
    ], { size: 14, lineSpacing: 26 })
  }

  // ── For the college ─────────────────────────────────────────────
  {
    const s = slide('For the college', 'What the institution gets from it',
      'Shift from the student to the institution. A Principal is judged on placements, moot results and accreditation — speak to those three, not to features.')
    cards(s, null, [
      { title: 'Students who arrive able to work', body: 'An intern who produces a usable draft in the first week is the intern who gets called back — and that is what a placement record is made of.' },
      { title: 'Stronger moot performance', body: 'Teams spend their preparation arguing and refining rather than staring at a blank first page.' },
      { title: 'Visible teaching evidence', body: 'A faculty co-ordinator can see that a cohort is active and engaged — useful when the institution has to demonstrate what it provides.' },
      { title: 'No burden on the college', body: 'No installation, no lab, no server and no administration. Enrolment happens on the email domain.' },
      { title: 'Equal access across the batch', body: 'Every enrolled student gets the same tools regardless of what they can personally afford — which is the argument for the college funding it.' },
      { title: 'A named person to call', body: 'Support is a person and an email address, not a ticket queue in another timezone.' },
    ], { cols: 3, h: 1.68, bodySize: 11.5, bodyTop: 0.62 })
  }

  // ── Data protection ─────────────────────────────────────────────
  {
    const s = slide('Student data', 'The college owns it. We only process it.',
      'For many Principals this is the deciding slide, so do not hurry it. The formal undertaking behind every line here is a document on letterhead that we will hand over before the pilot begins — ' +
      'they do not have to take any of it on trust.')
    stepList(s, null, [
      ['The college is the Data Fiduciary', 'and LexForge is only its processor. That is the DPDP Act position, and it is in writing.'],
      ['A co-ordinator cannot read a student’s document', 'faculty see that a student is active. They do not see what that student wrote.'],
      ['Breach notice within 72 hours', 'to the college, in writing, whether or not it is convenient for us.'],
      ['Deletion within 30 days', 'of the college asking. The whole cohort, on request, without negotiation.'],
      ['Sub-processors are named', 'in the undertaking and on the public privacy policy — including that processing happens on infrastructure in the United States.'],
    ], { gap: 0.62 })
    callout(s, null, 'You will get this on letterhead.',
      'A signed data-protection undertaking, a GST declaration and a rate card — the three papers your accounts department will ask for — before a single student signs in.', 'good')
  }

  // ── Cost ────────────────────────────────────────────────────────
  {
    const s = slide('What it costs', 'A college pays less per student than a student does',
      'The structural point: buying for the batch is cheaper per head than students buying individually, and that is deliberate — it is the reason for the college to fund it. ' +
      'Be ready to discuss the number; it is a list price, not a decree.')
    refTable(s, null, ['Who pays', 'Per month', 'Billed yearly', 'Per student per year'], [
      ['A student buying it themselves', F.directMonthly, `${F.directYearlyPerMonth} / month`, '₹24,000'],
      ['The college, per enrolled student', F.seatMonthly, `${F.seatYearlyPerMonth} / month`, F.seatYearlyTotal],
    ], [38, 18, 22, 22], { rowH: 0.48, size: 13 })
    list(s, null, [
      ['You are billed per enrolled student,', 'not a flat institutional licence. Forty students cost forty seats, not four hundred.'],
      ['Nothing renews by itself.', 'There is no auto-debit and no mandate on your account. A term is paid for, and it ends.'],
      ['The pilot is free.', 'Everything above applies only if you decide to continue after seeing a full semester.'],
    ], { size: 13.5, lineSpacing: 21 })
  }

  // ── Pilot ───────────────────────────────────────────────────────
  {
    const s = slide('The proposal', 'One semester, one cohort, no cost',
      'This is the ask. Keep it small enough to approve without a committee — that is the entire design of it. ' +
      'A Principal who can say yes in the room is worth more than a larger pilot that needs three meetings.')
    stepList(s, null, [
      ['One cohort', 'a single year or section — forty to sixty students is ideal, and one faculty co-ordinator.'],
      ['One semester', 'full access for every student in that cohort, at no cost and with no commitment to continue.'],
      ['We do the setup', 'you send a spreadsheet of names and emails; enrolment, briefing and support are ours.'],
      ['We report back at the end', 'what was used, how often, and by how many — so the decision to continue is made on evidence.'],
      ['Then you decide', 'continue at the seat rate, or stop and keep the drafts your students made. No penalty either way.'],
    ], { gap: 0.6 })
    callout(s, null, 'What we would call success.',
      'Not a usage number we chose for ourselves — a straight answer from your faculty co-ordinator to one question: did the students who used it produce better work than the students who did not?', 'good')
  }

  // ── Next steps ──────────────────────────────────────────────────
  {
    const s = slide('Next steps', 'Three things, and the first takes an hour',
      'Do not leave without agreeing step one and a date. A demonstration to the faculty is a low-risk yes, and it is the step that makes the rest happen.')
    stats(s, null, [
      { value: '1', label: 'A demonstration for your faculty — one hour, in your building or online' },
      { value: '2', label: 'Name a co-ordinator and a cohort — one member of staff, one section' },
      { value: '3', label: 'Send the list, and we start — students are enrolled within a week' },
    ], { cols: 3, h: 1.9, valueSize: 46 })
    callout(s, null, 'The papers come first.',
      'The data-protection undertaking is signed and handed over before any student is enrolled — not afterwards.', 'info')
  }

  // ── Close ───────────────────────────────────────────────────────
  bookend({
    name: 'closing',
    eyebrow: 'Thank you',
    title: 'Questions',
    subtitle: 'And a demonstration whenever it suits you',
    blurb: 'Happy to show it live to you, to your faculty, or to a room of students — and to answer anything on data protection ' +
           'in front of whoever in the institution needs to hear the answer.',
    foot: footRuns(),
    notes: 'Close by offering the student demonstration specifically. Students asking their own questions in front of the Principal ' +
           'does more to close a pilot than any slide in this deck.',
  })

  return D.finish('college')
}

// ─── Write ────────────────────────────────────────────────────────
const outDir = join(ROOT, 'docs')
mkdirSync(outDir, { recursive: true })

const overflows = []
for (const [build, file] of [
  [buildInvestorDeck, 'LexForge-AI-Investor-Deck.pptx'],
  [buildCollegeDeck,  'LexForge-AI-College-Deck.pptx'],
]) {
  const { pptx, overflows: o } = build()
  const out = join(outDir, file)
  await pptx.writeFile({ fileName: out })
  console.log(`wrote ${out}  (${pptx.slides.length} slides)`)
  overflows.push(...o)
}

if (overflows.length) {
  console.error(`\n${overflows.length} slide(s) overflow the bottom edge:`)
  for (const o of overflows) console.error('  ' + o)
  process.exitCode = 1
} else {
  console.log('every slide fits inside the safe area')
}
