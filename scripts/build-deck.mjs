// ─────────────────────────────────────────────────────────────────
//  The faculty manual as a presentation.
//
//  Same content as scripts/build-manual.mjs, but a deck is not a
//  manual: the Word file is for a teacher sitting alone with a
//  question, this is for a teacher standing in front of a room. So
//  the prose is cut to what carries from the back row, and everything
//  that would have been a paragraph is in the speaker notes instead.
//
//    node scripts/build-deck.mjs
//
//  Output: docs/LexForge-AI-Faculty-Deck.pptx
//
//  LAYOUT NOTE: every block is positioned by FLOW, not by a hardcoded
//  y. Blocks return where they ended and the next one starts there.
//  The first draft of this file hardcoded the offsets and three slides
//  quietly ran their last callout off the bottom edge — which you
//  cannot see from the console, only from a render. The overflow guard
//  at the end of this file exists so that failure is loud next time.
// ─────────────────────────────────────────────────────────────────
import PptxGenJS from 'pptxgenjs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ─── Palette ──────────────────────────────────────────────────────
// The app's own colours. A deck gets projected in a half-dark room,
// which is the one place a dark theme is unambiguously right — and it
// means the slides look like the thing they are describing.
const BG     = '0D0D0D'
const PANEL  = '161616'
const PANEL2 = '1C1C1C'
const LINE   = '2A2A2A'
const GOLD   = 'D4A017'
const GOLDLT = 'F0C550'
const GOLDXD = '3A2E12'          // gold at ghost strength, for the big numerals
const PAPER  = 'E8E2D2'
const INK    = 'F2F0EA'
const MUTED  = '9A958C'
const FAINT  = '6A6560'
const GREEN  = '5FCC8D'
const RED    = 'FF8A80'
const BLUE   = '7FB2F0'

const DISPLAY = 'Georgia'
const BODY    = 'Calibri'

// ─── Geometry ─────────────────────────────────────────────────────
// LAYOUT_WIDE is 13.333 x 7.5in. NOT LAYOUT_16x9 — that one is
// 10 x 5.625, and everything past 10in silently falls off the slide.
const W = 13.333, H = 7.5
const M = 0.72                 // page margin
const CW = W - M * 2           // content width
const TOP = 1.82               // first block sits under the title rule
const BOTTOM = 6.72            // nothing may cross this; footer lives below
const GAP = 0.26               // default space between blocks

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'LexForge AI'
pptx.company = 'LexForge AI'
pptx.title = 'LexForge AI — Faculty Deck'
pptx.subject = 'Every service in the app, and how to reach it'

let n = 0
const overflows = []

// ─── Flow ─────────────────────────────────────────────────────────
// Pass y = null to a block and it starts wherever the previous block
// ended. Pass a number to place it explicitly (two-column slides).
const begin = (s, y) => (y == null ? (s.__y ?? TOP) : y)
function end(s, y, { flow = true } = {}) {
  if (flow) s.__y = y + GAP
  s.__max = Math.max(s.__max ?? 0, y)
  return y
}

// ─── Building blocks ──────────────────────────────────────────────

/** The exploded-law-book motif from the website hero, in shapes. */
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

  // What comes out of the stack: a finished, sealed draft. Drawn as
  // paper with a gold header and ruled lines, because a plain grey
  // rectangle up there reads as a rendering mistake, not a document.
  const dw = 0.74 * scale, dh = 0.96 * scale
  const dx = x - dw / 2, dy = y - 2.20 * scale
  s.addShape(pptx.ShapeType.roundRect, {
    x: dx, y: dy, w: dw, h: dh, rectRadius: 0.05,
    fill: { color: PAPER, transparency: 60 }, line: { color: GOLD, width: 1, transparency: 30 },
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

/** Every slide gets the same frame: hairline, brand mark, number. */
function frame(s, { number = true } = {}) {
  s.background = { color: BG }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.055, fill: { color: GOLD } })
  s.addText('LEXFORGE AI', {
    x: M, y: BOTTOM + 0.34, w: 3, h: 0.28,
    fontFace: BODY, fontSize: 9, color: FAINT, bold: true, charSpacing: 2.2,
  })
  if (number) {
    s.addText(String(n), {
      x: W - M - 1, y: BOTTOM + 0.34, w: 1, h: 0.28,
      fontFace: BODY, fontSize: 9.5, color: FAINT, align: 'right',
    })
  }
}

/** A standard content slide: kicker, title, gold rule. */
function slide(kicker, title, notes) {
  n++
  const s = pptx.addSlide()
  s.__name = `${n}. ${title}`
  s.__y = TOP
  frame(s)
  s.addText(kicker.toUpperCase(), {
    x: M, y: 0.46, w: CW, h: 0.26,
    fontFace: BODY, fontSize: 10.5, color: GOLD, bold: true, charSpacing: 3,
  })
  s.addText(title, {
    x: M, y: 0.72, w: CW, h: 0.72,
    fontFace: DISPLAY, fontSize: 30, color: INK, bold: true, valign: 'top',
  })
  s.addShape(pptx.ShapeType.rect, { x: M, y: 1.55, w: 1.5, h: 0.028, fill: { color: GOLD } })
  s.addShape(pptx.ShapeType.rect, { x: M + 1.5, y: 1.55, w: CW - 1.5, h: 0.028, fill: { color: LINE } })
  if (notes) s.addNotes(notes)
  return s
}

/** A chapter divider — the numeral set large and dim behind the title. */
function divider(num, title, blurb) {
  n++
  const s = pptx.addSlide()
  s.__name = `${n}. ${title} (divider)`
  frame(s, { number: false })
  // A solid dim colour rather than run transparency, which is
  // unreliable across renderers. And no book motif here — the numeral
  // is graphic enough on its own, and the two collided.
  s.addText(num, {
    x: W - 5.4, y: 0.9, w: 4.7, h: 5.6,
    fontFace: DISPLAY, fontSize: 200, color: GOLDXD, bold: true,
    align: 'right', valign: 'middle',
  })
  s.addText('CHAPTER', {
    x: M, y: 2.62, w: 7, h: 0.3,
    fontFace: BODY, fontSize: 11, color: GOLD, bold: true, charSpacing: 4,
  })
  s.addText(title, {
    x: M, y: 2.95, w: 7.4, h: 1.1,
    fontFace: DISPLAY, fontSize: 44, color: INK, bold: true, valign: 'top',
  })
  s.addShape(pptx.ShapeType.rect, { x: M, y: 4.18, w: 1.9, h: 0.035, fill: { color: GOLD } })
  if (blurb) {
    s.addText(blurb, {
      x: M, y: 4.45, w: 6.4, h: 1, fontFace: BODY, fontSize: 14.5,
      color: MUTED, lineSpacing: 22, valign: 'top',
    })
  }
  return s
}

/**
 * The click path. This is the reason the deck exists — nobody forgets
 * what Act Search does, they forget where it is — so it gets a fixed,
 * unmistakable slot rather than a line of body text.
 */
function pathBox(s, y, routes, opts = {}) {
  const y0 = begin(s, y)
  const w = opts.w ?? CW
  const x = opts.x ?? M
  const h = 0.5 + routes.length * 0.3
  s.addShape(pptx.ShapeType.roundRect, {
    x, y: y0, w, h, rectRadius: 0.06,
    fill: { color: PANEL }, line: { color: GOLD, width: 1 },
  })
  s.addShape(pptx.ShapeType.rect, { x, y: y0 + 0.06, w: 0.055, h: h - 0.12, fill: { color: GOLD } })
  s.addText('HOW TO GET THERE', {
    x: x + 0.26, y: y0 + 0.11, w: w - 0.5, h: 0.24,
    fontFace: BODY, fontSize: 9, color: GOLD, bold: true, charSpacing: 2.6,
  })
  s.addText(routes.map((r, i) => ({
    text: r,
    options: { fontSize: i === 0 ? 15 : 13, color: i === 0 ? INK : MUTED, bold: i === 0, breakLine: true },
  })), {
    x: x + 0.26, y: y0 + 0.36, w: w - 0.5, h: h - 0.46,
    fontFace: BODY, lineSpacing: 19, valign: 'top',
  })
  return end(s, y0 + h, opts)
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
    // The bullet must ride on the run that OPENS each paragraph — set
    // once at the top level it lands only on the first item.
    parts[0].options.bullet = { characterCode: '2013', indent: 16 }
    parts[parts.length - 1].options.breakLine = true
    runs.push(...parts)
  }
  // Estimate: one line per ~92 characters at this width, plus wrap.
  const lines = items.reduce((acc, it) => {
    const len = (Array.isArray(it) ? it.filter(Boolean).join(' ') : it).length
    return acc + Math.max(1, Math.ceil(len / (w * 8.6)))
  }, 0)
  const h = opts.h ?? lines * (size / 52) + items.length * 0.12 + 0.1
  s.addText(runs, {
    x, y: y0, w, h,
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
      x, y: yy + 0.02, w: 0.34, h: 0.34,
      fontFace: BODY, fontSize: 12, color: GOLDLT, bold: true, align: 'center', valign: 'middle',
    })
    const [lead, rest] = Array.isArray(it) ? it : [null, it]
    const runs = []
    // Some steps already open with their own dash or arrow; adding the
    // separator on top of one gives "in — — name".
    const sep = rest ? (/^\s*[—–→-]/.test(rest) ? ' ' : ' — ') : ''
    if (lead) runs.push({ text: lead + sep, options: { bold: true, color: INK } })
    if (rest) runs.push({ text: rest, options: { color: MUTED } })
    s.addText(runs, {
      x: x + 0.5, y: yy, w: w - 0.5, h: gap,
      fontFace: BODY, fontSize: opts.size ?? 14.5, lineSpacing: 21, valign: 'top',
    })
  })
  return end(s, y0 + items.length * gap, opts)
}

/** A grid of cards. Used wherever the app itself shows a grid. */
function cards(s, y, items, opts = {}) {
  const y0 = begin(s, y)
  const cols = opts.cols ?? 3
  const gap  = opts.gap ?? 0.24
  const rows = Math.ceil(items.length / cols)
  const cw = (CW - gap * (cols - 1)) / cols
  const ch = opts.h ?? 1.4
  items.forEach((it, i) => {
    const cx = M + (i % cols) * (cw + gap)
    const cy = y0 + Math.floor(i / cols) * (ch + gap)
    const accent = it.accent || GOLD
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: ch, rectRadius: 0.05,
      fill: { color: PANEL2 }, line: { color: LINE, width: 1 },
    })
    s.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: cw, h: 0.045, fill: { color: accent }, line: { type: 'none' } })
    s.addText(it.title, {
      x: cx + 0.22, y: cy + 0.16, w: cw - 0.4, h: 0.36,
      fontFace: BODY, fontSize: opts.titleSize ?? 14, color: INK, bold: true, valign: 'top',
    })
    if (it.body) {
      s.addText(it.body, {
        x: cx + 0.22, y: cy + 0.55, w: cw - 0.4, h: ch - 0.68,
        fontFace: BODY, fontSize: opts.bodySize ?? 11.5, color: MUTED, lineSpacing: 15, valign: 'top',
      })
    }
  })
  return end(s, y0 + rows * ch + (rows - 1) * gap, opts)
}

/** Small pills — for lists of names that need no explanation. */
function chips(s, y, items, opts = {}) {
  const y0 = begin(s, y)
  const cols = opts.cols ?? 5
  const gap = 0.16
  const cw = (CW - gap * (cols - 1)) / cols
  const ch = opts.h ?? 0.46
  items.forEach((t, i) => {
    const cx = M + (i % cols) * (cw + gap)
    const cy = y0 + Math.floor(i / cols) * (ch + gap)
    s.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cy, w: cw, h: ch, rectRadius: 0.2,
      fill: { color: PANEL2 }, line: { color: LINE, width: 1 },
    })
    s.addText(t, {
      x: cx + 0.06, y: cy, w: cw - 0.12, h: ch,
      fontFace: BODY, fontSize: opts.size ?? 11, color: MUTED, align: 'center', valign: 'middle',
    })
  })
  const rows = Math.ceil(items.length / cols)
  return end(s, y0 + rows * ch + (rows - 1) * gap, opts)
}

/** The warnings. These are the slides that prevent support emails. */
function callout(s, y, label, body, tone = 'gold', opts = {}) {
  const y0 = begin(s, y)
  const c = tone === 'danger' ? RED : tone === 'good' ? GREEN : GOLD
  const x = opts.x ?? M
  const w = opts.w ?? CW
  const size = opts.size ?? 14
  // Grow to fit: a one-line note and a five-line teaching note should
  // not get the same box. Calibri runs ~0.46 x its point size per
  // character, which is close enough to count lines from.
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
    x: x + 0.3, y: y0 + 0.08, w: w - 0.6, h: h - 0.16,
    fontFace: BODY, fontSize: size, lineSpacing: 20, valign: 'middle',
  })
  return end(s, y0 + h, opts)
}

/** Reference table. */
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

// ══════════════════════════════════════════════════════════════════
//  SLIDES
// ══════════════════════════════════════════════════════════════════

// ── Cover ─────────────────────────────────────────────────────────
{
  const s = pptx.addSlide()
  s.__name = 'cover'
  s.background = { color: BG }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.055, fill: { color: GOLD } })
  bookMotif(s, { x: 10.35, y: 5.05, scale: 1.45 })
  s.addText('LEXFORGE AI', {
    x: M, y: 2.28, w: 8, h: 0.9,
    fontFace: DISPLAY, fontSize: 54, color: INK, bold: true, charSpacing: 5, valign: 'top',
  })
  s.addShape(pptx.ShapeType.rect, { x: M, y: 3.28, w: 2.4, h: 0.04, fill: { color: GOLD } })
  s.addText('User Manual for Faculty', {
    x: M, y: 3.55, w: 8, h: 0.6,
    fontFace: DISPLAY, fontSize: 27, color: GOLDLT, italic: true, valign: 'top',
  })
  s.addText('Every service in the app, and how to reach it', {
    x: M, y: 4.22, w: 8, h: 0.4,
    fontFace: BODY, fontSize: 15, color: MUTED,
  })
  s.addText([
    { text: 'lexforge-ai.vercel.app', options: { color: GOLD, bold: true } },
    { text: '     ·     ', options: { color: FAINT } },
    { text: 'support.lexforge@gmail.com', options: { color: MUTED } },
  ], { x: M, y: 6.4, w: 10, h: 0.35, fontFace: BODY, fontSize: 12.5 })
  s.addNotes('Open with what the app is for: a working Indian legal practice in one place — drafting, research, clients, dates — and a set of services built for teaching on top of it. This deck walks every one of them and, for each, exactly where to click.')
}

// ── Contents ──────────────────────────────────────────────────────
{
  const s = slide('Start here', 'What this covers',
    'Nobody needs to read a deck in order. Point at the two or three chapters that matter to this audience and say the rest is reference.')
  cards(s, null, [
    { title: '1  Before you start', body: 'Signing in, the compulsory first-time setup, moving around, free and Pro', accent: GOLD },
    { title: '2  Dashboard', body: 'The home screen, and what it answers', accent: GOLD },
    { title: '3  Drafting', body: 'New Document, the four ways in, My Documents', accent: GOLDLT },
    { title: '4  Research', body: 'Act Search, Case Law & Status, Legal Research, Case Assistant', accent: BLUE },
    { title: '5  Practice tools', body: 'The six analysers, Clients, Court Dates', accent: BLUE },
    { title: '6  Teaching services', body: 'Study & Learn, and the Future Lawyer hub', accent: GREEN },
    { title: '7  My College', body: 'For faculty co-ordinators — students, batches, usage', accent: GREEN },
    { title: '8  Your account', body: 'Name, password, recovery, plan, your data', accent: MUTED },
    { title: 'Appendices', body: 'All 20 document types, all 7 languages, and what to do when something breaks', accent: MUTED },
  ], { cols: 3, h: 1.1 })
  callout(s, null, 'On every service slide', 'you will see a gold box. That is the click path — the thing you will actually be looking for.')
}

// ══ CHAPTER 1 ═════════════════════════════════════════════════════
divider('1', 'Before you start', 'Signing in, the setup you cannot skip, and how to find anything.')

{
  const s = slide('Chapter 1.1', 'Where the app lives',
    'Worth saying out loud that there is nothing to install and no app-store download — this is the first question every college asks.')
  s.addShape(pptx.ShapeType.roundRect, {
    x: M, y: TOP, w: CW, h: 1.15, rectRadius: 0.08,
    fill: { color: PANEL }, line: { color: GOLD, width: 1.25 },
  })
  s.addText('lexforge-ai.vercel.app', {
    x: M, y: TOP, w: CW, h: 1.15,
    fontFace: DISPLAY, fontSize: 34, color: GOLDLT, bold: true, align: 'center', valign: 'middle',
  })
  s.__y = TOP + 1.15 + GAP
  list(s, null, [
    ['Nothing to install.', 'It runs in any browser.'],
    ['Laptop, tablet and phone.', 'The phone layout is a real app layout, not a shrunken website.'],
    ['Add it to your home screen.', 'Open it in Chrome or Safari, use the browser menu, choose Add to Home Screen. It then opens like any other app.'],
  ], { size: 15.5, lineSpacing: 26 })
  callout(s, null, 'No download, no app store.', 'That also means no update to install — everyone is always on the current version.')
}

{
  const s = slide('Chapter 1.2', 'Your first sign-in',
    'If the college added them from the spreadsheet, the account already exists. Stress step 6 — it is the one that causes lockouts.')
  stepList(s, null, [
    ['Open the site', 'and choose Sign in.'],
    ['Enter your email', 'and the password the college gave you.'],
    ['A setup screen appears', 'and you cannot skip it. Nothing else opens until it is done.'],
    ['Enter your full name', '— this appears on your dashboard and on every document you generate.'],
    ['Choose your own password', '— the college does not keep it and cannot see it.'],
    ['Choose a security question', 'and type an answer.'],
  ], { gap: 0.6 })
  callout(s, null, 'Do not rush step 6.', 'It is the only way back into your account. There is no reset link sent to your email.', 'danger')
}

{
  const s = slide('Chapter 1.2', 'The security question is the whole recovery system',
    'This is the single most important slide in the deck for reducing support load. Say it plainly and move on.')
  s.addShape(pptx.ShapeType.roundRect, {
    x: M, y: TOP, w: CW, h: 1.95, rectRadius: 0.08,
    fill: { color: RED, transparency: 93 }, line: { color: RED, width: 1.25 },
  })
  s.addText('There is no “reset link” email.', {
    x: M + 0.4, y: TOP + 0.28, w: CW - 0.8, h: 0.55,
    fontFace: DISPLAY, fontSize: 27, color: RED, bold: true, valign: 'top',
  })
  s.addText('If you forget your password, the app asks your security question and nothing else. If no question is set on the account, there is no self-service way back in.', {
    x: M + 0.4, y: TOP + 0.92, w: CW - 0.8, h: 0.9,
    fontFace: BODY, fontSize: 15.5, color: INK, lineSpacing: 24, valign: 'top',
  })
  s.__y = TOP + 1.95 + 0.34
  s.addText('SO:', {
    x: M, y: s.__y, w: CW, h: 0.28,
    fontFace: BODY, fontSize: 11, color: GOLD, bold: true, charSpacing: 3,
  })
  s.__y += 0.36
  list(s, null, [
    ['Pick a question whose answer will not change', 'and that you will not spell two different ways.'],
    ['Check yours is set now', '— ☰ → You → Account → Account recovery. It takes twenty seconds.'],
    ['If it is not set and you are locked out,', 'email support. That is the only route.'],
  ], { size: 15, lineSpacing: 26 })
}

{
  const s = slide('Chapter 1.3', 'One device at a time',
    'Frame this as a feature, not a bug. A college pays per seat; without it, one login becomes a whole batch.')
  s.addText('Signing in on a second device signs you out of the first.', {
    x: M, y: TOP, w: CW, h: 0.6,
    fontFace: DISPLAY, fontSize: 26, color: INK, bold: true, valign: 'top',
  })
  s.__y = TOP + 0.85
  cards(s, null, [
    { title: 'Why', body: 'A college pays for one seat per person. A shared login would quietly become one login used by a whole batch.', accent: GOLD },
    { title: 'What it means in practice', body: 'Sign in on the classroom desktop and your phone signs out. Sign in again on the phone when you need it.', accent: GOLD },
    { title: 'What you do not lose', body: 'Nothing. Your documents live on the server, not on the device you happened to be using.', accent: GREEN },
  ], { cols: 3, h: 1.75 })
  callout(s, null, 'If you get signed out unexpectedly,', 'that is what happened — usually you, on your own phone. Just sign in again.')
}

{
  const s = slide('Chapter 1.4', 'Finding your way around',
    'Show the physical menu on screen while this slide is up. The grouping is the mental model: practice on top, teaching below.')
  s.addText([
    { text: '☰', options: { color: GOLD, bold: true } },
    { text: '   The menu button, top left. Everything in the app is behind it, in four groups:', options: { color: MUTED } },
  ], { x: M, y: TOP, w: CW, h: 0.35, fontFace: BODY, fontSize: 15 })
  s.__y = TOP + 0.5
  cards(s, null, [
    { title: 'Lawyer', body: 'Dashboard · New Document · My Documents · Clients · Court Dates · Legal Tools · Legal Research · Case Law & Status · Act Search · Study & Learn', accent: GOLD },
    { title: 'Future Lawyer', body: 'Services — the student hub: Q&A, moot memorials, career roadmap', accent: GREEN },
    { title: 'Faculty', body: 'My college. This group only appears if you have been made your college’s co-ordinator.', accent: BLUE },
    { title: 'You', body: 'Account — your name, password, recovery, plan and data', accent: MUTED },
  ], { cols: 4, h: 1.95, bodySize: 11 })
  list(s, null, [
    ['On a phone', 'a fixed bottom bar: Dashboard, Drafts, the gold ✦ button (New Document), Court Dates, and ⋯ More.'],
    ['Everywhere', 'a floating 💬 button, bottom right. That is the Case Assistant.'],
  ], { size: 14.5 })
}

{
  const s = slide('Chapter 1.5', 'Free and Pro',
    'The key point: free is limited by quantity, not by capability. Every document type and every language is open to everyone.')
  cards(s, null, [
    { title: 'Free', body: 'All 20 document types.\nAll 7 languages.\nAct Search, Study & Learn and Future Lawyer, fully open.\n\nLimited to 2 generated documents per calendar month.', accent: MUTED },
    { title: 'Pro', body: 'Unlimited documents and longer drafts.\n\nPlus the services marked PRO: Clients, Court Dates, Legal Tools, Legal Research, Case Law & Status, and the Case Assistant.', accent: GOLD },
  ], { cols: 2, h: 2.15, titleSize: 18, bodySize: 13 })
  callout(s, null, 'If your college has an active plan,', 'you are Pro automatically for as long as it runs. No payment, no card details. Confirm it at ☰ → You → Account → Plan & usage.', 'good')
  callout(s, null, 'If a service you expect is locked,', 'check Account → College. If it does not name your college, your account is not linked yet — email support.')
}

// ══ CHAPTER 2 ═════════════════════════════════════════════════════
divider('2', 'Dashboard', 'The home screen. It answers one question and gets out of the way.')

{
  const s = slide('Chapter 2', 'Dashboard',
    'Teaching note worth saying aloud: this screen shows a practice as a working system — matters, dates, documents — rather than a series of one-off drafts. That framing is the thing students most often have not seen.')
  pathBox(s, null, ['☰ → Lawyer → Dashboard', 'Phone: bottom bar → Dashboard'])
  cards(s, null, [
    { title: 'Three counters', body: 'Total documents, how many are finalised, and how many clients. The clients counter is a link.', accent: GOLD },
    { title: 'Next hearing', body: 'The soonest entry from Court Dates, pulled to the top.', accent: BLUE },
    { title: 'Deadlines', body: 'Anything falling in the next seven days, in red, with the document it belongs to.', accent: RED },
    { title: 'Recent documents', body: 'Click one to reopen it and keep editing where you left off.', accent: GOLD },
    { title: 'Quick links', body: 'Straight into Case Law & Status, Legal Research and the Moot Court Memorial Builder.', accent: GREEN },
  ], { cols: 3, h: 1.1 })
  callout(s, null, 'Teaching note.', 'This is the screen to put on the projector first. It shows a practice, not a document generator.')
}

// ══ CHAPTER 3 ═════════════════════════════════════════════════════
divider('3', 'Drafting', 'The heart of the app. Everything else supports it.')

{
  const s = slide('Chapter 3.1', 'New Document',
    'Twenty types, every Indian court, seven languages. Do not read the list — say the shape of it and move to the four ways in, which is the slide that matters.')
  pathBox(s, null, ['☰ → Lawyer → New Document', 'Phone: the gold ✦ button in the middle of the bottom bar'])
  s.addText('A complete, court-ready Indian legal document from facts you supply.', {
    x: M, y: s.__y, w: CW, h: 0.45,
    fontFace: DISPLAY, fontSize: 22, color: INK, italic: true, valign: 'top',
  })
  s.__y += 0.62
  cards(s, null, [
    { title: 'Step 1', body: 'Pick the document type — 20 of them', accent: GOLD },
    { title: 'Step 2', body: 'Choose how you will give it the facts — four ways', accent: GOLDLT },
    { title: 'Step 3', body: 'Fill in the details for that document type', accent: GOLD },
    { title: 'Step 4', body: 'Choose the court and the language, then Generate', accent: GOLDLT },
  ], { cols: 4, h: 1.25, bodySize: 12.5 })
  callout(s, null, 'Thirty to ninety seconds.', 'What comes back is a full document, not an outline — and it is editable on the spot.')
}

{
  const s = slide('Chapter 3.1 — Step 1', 'Twenty document types',
    'All twenty are on the free plan. The free limit is on how many you generate in a month, not on which kinds — that distinction matters to a college deciding whether to pay.')
  chips(s, null, [
    'Legal Notice', 'Case Brief', 'Contract', 'Petition', 'Memorandum',
    'Writ Petition', 'Vakalatnama', 'Bail Application', 'Stay Application', 'Affidavit',
    'PIL', 'RTI Application', 'Consumer Complaint', 'Divorce Petition', 'Rent Agreement',
    'Sale Deed', 'Cheque Bounce Notice', 'Legal Opinion', 'FIR Complaint', 'Email Draft',
  ], { cols: 5, h: 0.62, size: 12.5 })
  callout(s, null, 'All twenty are available on the free plan.', 'The free limit is on how many documents you generate in a month, not on which kinds you may use.', 'good')
  s.addText('Full descriptions in Appendix A.', {
    x: M, y: s.__y, w: CW, h: 0.3, fontFace: BODY, fontSize: 12, color: FAINT, italic: true,
  })
}

{
  const s = slide('Chapter 3.1 — Step 2', 'Four ways to give it the facts',
    'The most important slide in the drafting chapter. The choice matters more than it looks — and Smart Q&A is the one to demonstrate in class.')
  cards(s, null, [
    { title: '📋  Fill Form', body: 'You have the facts in front of you. Structured fields, fastest route.\n\nThis is the default.', accent: GOLD },
    { title: '💬  Smart Q&A', body: 'The AI asks one question at a time and waits. Slower — but you cannot leave anything out.', accent: GOLDLT },
    { title: '📤  Paste Document', body: 'You already have a similar document as text. Paste it and the AI pulls the details into the form.', accent: BLUE },
    { title: '📁  Upload Folder / File', body: 'A case folder, a Word file, or a scanned PDF. The AI reads all of it and fills the form.', accent: GREEN },
  ], { cols: 4, h: 2.2, titleSize: 15, bodySize: 12.5 })
  callout(s, null, 'Teaching note.', 'Smart Q&A is the mode to use in front of a class. Students watch the app ask, in order, for exactly the facts a bail application needs — the FIR number, the sections, the date of custody, the grounds — before a single line of the document appears. That sequence is the lesson.')
}

{
  const s = slide('Chapter 3.1 — Steps 3 & 4', 'Details, court, language',
    'The court list is genuinely all-India, which is the thing that surprises people who assume it is a UP-only tool.')
  stepList(s, null, [
    ['Fill in the details', 'The fields change with the document type. A Bail Application asks for the FIR number, the sections and the date of custody; a Rent Agreement asks about the premises and the rent.'],
    ['Required fields carry a red asterisk', 'and the form tells you what is missing rather than generating something incomplete.'],
    ['Pick a client and it fills itself in', '— name, father’s name, age and address land in the right fields.'],
    ['Choose the court', 'Supreme Court · all 25 High Courts and their benches · national tribunals · state forums · district courts across India.'],
    ['Choose the language', 'English · Hindi · Bilingual · Urdu · Tamil · Telugu · Kannada.'],
  ], { gap: 0.74 })
  callout(s, null, 'If you used Paste or Upload,', 'review what the AI filled in before you generate. It is a starting point, not a finished intake.')
}

{
  const s = slide('Chapter 3.1', 'What you get back',
    'The export formatting is the detail practitioners notice: it comes out looking like a filing, not like a chat transcript.')
  cards(s, null, [
    { title: 'Edit in place', body: 'Paragraph by paragraph, right where it was generated.', accent: GOLD },
    { title: 'Copy', body: 'The whole document to the clipboard, in one click.', accent: GOLD },
    { title: 'Save', body: 'It then appears under My Documents, with its history.', accent: GREEN },
    { title: 'Export', body: 'PDF · Word (.docx) · plain text', accent: BLUE },
  ], { cols: 4, h: 1.35 })
  callout(s, null, 'The export is formatted for filing.', 'The cause title and court name are centred, section headings are set apart, and numbered paragraphs stay left-aligned with their numbering intact. It is not a raw text dump.', 'good')
  s.addText('“A draft you have to reformat before filing is a draft you did half of yourself.”', {
    x: M, y: s.__y + 0.15, w: CW, h: 0.5,
    fontFace: DISPLAY, fontSize: 19, color: FAINT, italic: true, align: 'center',
  })
}

{
  const s = slide('Chapter 3.2', 'Case Brief from a folder',
    'This is the demo that lands with practising lawyers. Hand it a folder you have just been given and it tells you what is in it.')
  stepList(s, null, [
    ['New Document', 'choose Case Brief as the type.'],
    ['Choose Upload Folder / File', 'as the intake method.'],
    ['Upload the whole case folder', '— pleadings, orders, correspondence, scanned PDFs, all at once.'],
  ], { gap: 0.62 })
  s.addText('WHAT COMES BACK', {
    x: M, y: s.__y, w: CW, h: 0.28,
    fontFace: BODY, fontSize: 11, color: GOLD, bold: true, charSpacing: 3,
  })
  s.__y += 0.36
  chips(s, null, ['Parties', 'Chronology', 'Issues', 'Strengths', 'Weaknesses', 'Next steps'], { cols: 6, h: 0.55, size: 12.5 })
  callout(s, null, 'On a large folder', 'it runs in chunks and shows progress as it goes. It is the fastest way to get on top of a file you have just been handed.')
}

{
  const s = slide('Chapter 3.3', 'My Documents',
    'Clone plus version history is the assignment-setting combination — mention it here and it pays off in chapter 6.')
  pathBox(s, null, ['☰ → Lawyer → My Documents', 'Phone: bottom bar → Drafts'])
  cards(s, null, [
    { title: 'Open and edit', body: 'Change any paragraph and save.', accent: GOLD },
    { title: 'Version history', body: 'Every save is kept. Restore any earlier version. Nothing is ever lost by overwriting.', accent: GREEN },
    { title: 'Clone', body: 'Duplicate a document as the starting point for another one.', accent: BLUE },
    { title: 'Export', body: 'PDF, Word or plain text, from the buttons at the top.', accent: GOLD },
  ], { cols: 4, h: 1.45 })
  callout(s, null, 'Teaching note.', 'Clone is the assignment-setting tool. Build one model draft with a deliberate flaw, clone it for the batch, and set the exercise as “find what is wrong here and fix it”. Version history then shows you what each student actually changed.')
}

// ══ CHAPTER 4 ═════════════════════════════════════════════════════
divider('4', 'Research', 'Four services — and the difference between them matters.')

{
  const s = slide('Chapter 4.1', 'Act Search',
    'The plain-words search is the point. Students do not know the name of the Act — that is exactly why they are stuck.')
  pathBox(s, null, ['☰ → Lawyer → Act Search'])
  s.addText('Find the Act that governs a problem, read its key sections, and see which document you would actually file.', {
    x: M, y: s.__y, w: CW, h: 0.45,
    fontFace: DISPLAY, fontSize: 19, color: INK, italic: true, valign: 'top',
  })
  s.__y += 0.6
  cards(s, null, [
    { title: 'Describe the problem in ordinary words', body: '“my tenant will not vacate after the lease ended”\n“a cheque I received has bounced”\n\nYou do not need to know the name of the Act. That is the point.', accent: GOLD },
    { title: 'Or name the Act', body: 'If you already know it, search it directly and go straight to the sections.', accent: MUTED },
  ], { cols: 2, h: 1.55, titleSize: 15 })
  list(s, null, [
    ['What comes back:', 'the Act, its key sections in plain summary, a link to the official text on India Code, and — the part students find most useful — which document this would become if you were filing.'],
    ['On the free plan:', 'searching, the key sections and the official link are all open. Two buttons inside a result — “See a sample” and “Judgments” — are Pro.'],
  ], { size: 13.5, lineSpacing: 21 })
}

{
  const s = slide('Chapter 4.2', 'Case Law and Case Status',
    'Live court data. The CNR number is on any cause list or order sheet — worth showing one so nobody has to ask.')
  pathBox(s, null, ['☰ → Lawyer → Case Law & Status', 'Marked PRO'])
  cards(s, null, [
    { title: 'Judgments', body: 'Supreme Court, High Courts and tribunals. Full-text, so “section 45 PMLA twin conditions bail” works as a query. Optional filter by court.', accent: GOLD },
    { title: 'Case status', body: 'Enter a CNR number and get the live status of a pending case — stage, next date, the bench.', accent: BLUE },
    { title: 'Acts', body: 'New and amended Acts, checked every morning. It shows what has actually changed recently.', accent: GREEN },
  ], { cols: 3, h: 1.75 })
  callout(s, null, 'Where to find a CNR:', 'the sixteen-character number printed on any cause list or order sheet.')
}

{
  const s = slide('Chapter 4.3', 'Legal Research',
    'Two panels. Then the next slide, which is the one to slow down on.')
  pathBox(s, null, ['☰ → Lawyer → Legal Research', 'Marked PRO'])
  cards(s, null, [
    { title: 'Case Law Database', body: 'Type to filter as you go. When you want more than the shelf, “Search full index” runs a live search across the real corpus.', accent: GOLD },
    { title: 'AI Legal Analysis', body: 'Describe an issue in a paragraph, in ordinary English, and get a structured analysis of the position.', accent: BLUE },
  ], { cols: 2, h: 1.75, titleSize: 16 })
  callout(s, null, 'Every judgment relied on', 'is listed underneath the analysis, with a link to the original. Click through — that is what the links are for.')
}

{
  const s = slide('Chapter 4.3', 'Why the citations here can be trusted',
    'Spend a minute here. For a law faculty this is the slide that decides whether they take the product seriously, and it is the honest answer to the objection they are already forming.')
  s.addShape(pptx.ShapeType.roundRect, {
    x: M, y: TOP, w: CW, h: 1.4, rectRadius: 0.08,
    fill: { color: GREEN, transparency: 92 }, line: { color: GREEN, width: 1.25 },
  })
  s.addText('The AI is not allowed to write a citation.', {
    x: M + 0.4, y: TOP + 0.2, w: CW - 0.8, h: 0.5,
    fontFace: DISPLAY, fontSize: 25, color: GREEN, bold: true, valign: 'top',
  })
  s.addText('Judgments are retrieved from a real case-law index. If the index returns nothing verified, the app says so in plain words rather than producing something that sounds right.', {
    x: M + 0.4, y: TOP + 0.74, w: CW - 0.8, h: 0.6,
    fontFace: BODY, fontSize: 14.5, color: INK, lineSpacing: 21, valign: 'top',
  })
  s.__y = TOP + 1.4 + GAP
  cards(s, null, [
    { title: 'Retrieved, then shown', body: 'Every judgment used appears under the analysis with a link to the original text.', accent: GREEN },
    { title: 'Silence over invention', body: 'No verified authority means the app tells you so. It does not fill the gap.', accent: GREEN },
    { title: 'The assistant stays out of it', body: 'The chat assistant gives no citations at all — deliberately. Authority comes only from here and from Case Law & Status.', accent: GOLD },
  ], { cols: 3, h: 1.5 })
  callout(s, null, 'Teaching note.', 'If you are teaching students to check authority, show them this screen and the reason it is built this way. The scepticism generalises to every other tool they will use.')
}

{
  const s = slide('Chapter 4.4', 'Case Assistant',
    'The floating button. Handy, but the limitation is the interesting part — say it, do not hide it.')
  pathBox(s, null, ['The floating 💬 button, bottom right of any screen', 'Marked PRO'])
  stepList(s, null, [
    ['Click 💬', 'A chat panel opens over whatever you were doing.'],
    ['Ask in ordinary English', 'about a document or an issue.'],
    ['It offers to start the draft', '— one click and you are in New Document with the type already chosen.'],
  ], { gap: 0.62 })
  callout(s, null, 'It will not give you a case citation.', 'That is on purpose. Keeping the conversational assistant out of the citation business is what stops it producing a case name that reads perfectly and does not exist.', 'danger')
}

// ══ CHAPTER 5 ═════════════════════════════════════════════════════
divider('5', 'Practice tools', 'Three services for running matters rather than drafting them. All marked PRO.')

{
  const s = slide('Chapter 5.1', 'Legal Tools — the six analysers',
    'Each takes a document you paste in and gives back something usable. The Order Analyzer is the best classroom demonstration in the app.')
  pathBox(s, null, ['☰ → Lawyer → Legal Tools'], { w: 5.5 })
  cards(s, null, [
    { title: '⚖️  Order Analyzer', body: 'A court order → the directions in it, compliance dates, immediate actions, documents needed, and the favourable and adverse points.', accent: GOLD },
    { title: '✏️  Document Amendment', body: 'An existing document plus what you want changed → the updated version.', accent: GOLDLT },
    { title: '🔄  Fresh Application', body: 'A rejection order plus what has changed → a fresh bail application or petition on the new grounds.', accent: BLUE },
    { title: '📢  Appeal Generator', body: 'The impugned judgment → an appeal petition with grounds. High Court, SLP, Sessions or Revision.', accent: BLUE },
    { title: '↩️  Counter / Reply', body: 'The other side’s document plus your client’s position → a counter affidavit or reply.', accent: GREEN },
    { title: '📋  Compliance Report', body: 'The order you have complied with plus what you did → a compliance affidavit or report.', accent: GREEN },
  ], { cols: 3, h: 1.18, titleSize: 13.5, bodySize: 11 })
  callout(s, null, 'Teaching note.', 'The Order Analyzer separates what the court directed from what follows for the lawyer — and that gap is precisely what students do not yet see when they read a judgment.')
}

{
  const s = slide('Chapter 5.2 & 5.3', 'Clients and Court Dates',
    'The payoff for Clients is in the drafting form. The payoff for Court Dates is on the Dashboard. Say both.')
  // Two equal columns with a real gutter. The first version derived rx
  // from the right margin and the columns overlapped by a third of an inch.
  const GUTTER = 0.42
  const colW = (CW - GUTTER) / 2
  const rx = M + colW + GUTTER

  s.addText('Clients', { x: M, y: TOP, w: colW, h: 0.4, fontFace: DISPLAY, fontSize: 21, color: GOLDLT, bold: true })
  s.addText('Court Dates', { x: rx, y: TOP, w: colW, h: 0.4, fontFace: DISPLAY, fontSize: 21, color: GOLDLT, bold: true })

  pathBox(s, TOP + 0.48, ['☰ → Lawyer → Clients'], { x: M, w: colW, flow: false })
  pathBox(s, TOP + 0.48, ['☰ → Lawyer → Court Dates'], { x: rx, w: colW, flow: false })

  list(s, TOP + 1.4, [
    ['+ Add Client', 'name, father’s name, Aadhaar, phone, district, photograph.'],
    ['CSV Template', 'download it, fill it, upload it back to add many at once.'],
    ['Find people', 'search by name, Aadhaar or phone; filter by district.'],
    ['Open a client', 'their documents, attachments and payments in one place.'],
  ], { x: M, w: colW, size: 13, lineSpacing: 20, h: 2.3, flow: false })

  list(s, TOP + 1.4, [
    ['Title or case name', 'plus the case number.'],
    ['Type', 'Hearing · Compliance · Filing · Order · Deadline — colour-coded.'],
    ['Link a document', 'if the date belongs to something you have drafted.'],
    ['Notes', 'and save.'],
  ], { x: rx, w: colW, size: 13, lineSpacing: 20, h: 2.3, flow: false })

  callout(s, TOP + 3.15, 'The payoff:', 'pick the client in New Document and their details fill themselves into the right fields.',
    'gold', { x: M, w: colW, h: 1.02, size: 13, flow: false })
  callout(s, TOP + 3.15, 'The payoff:', 'anything due within seven days shows on the Dashboard in red, and the soonest hearing leads it.',
    'good', { x: rx, w: colW, h: 1.02, size: 13 })
}

// ══ CHAPTER 6 ═════════════════════════════════════════════════════
divider('6', 'Teaching services', 'Two hubs built for students rather than for practice — and both are open on the free plan.')

{
  const s = slide('Chapter 6.1', 'Study & Learn',
    'Free plan. That means you can set work for a whole batch whether or not every student is on the college plan yet — worth saying to a college still deciding.')
  pathBox(s, null, ['☰ → Lawyer → Study & Learn', 'Also from Future Lawyer → Landmark Judgments & Doctrines'])
  cards(s, null, [
    { title: '⚖️  Landmark Judgments', body: 'Curated Supreme Court and High Court judgments. Search by case name, area of law, doctrine, or the fact pattern.', accent: GOLD },
    { title: '📜  Legal Principles', body: 'The core doctrines, searchable by doctrine, area or keyword.', accent: GOLDLT },
    { title: '🎓  AI Tutor', body: 'Ask a topic and get it explained at length — “Explain the basic structure doctrine and the cases that built it.”', accent: BLUE },
    { title: '🃏  Quiz & Flashcards', body: 'Type a topic — “Article 21”, “bail under CrPC” — and the app generates questions on it.', accent: GREEN },
  ], { cols: 4, h: 1.75, titleSize: 14, bodySize: 11.5 })
  callout(s, null, 'Teaching note.', 'The quiz tab generates fresh questions each time from a topic you type — so it works as a five-minute revision opener with no preparation, and two students sitting together do not get the same paper.')
}

{
  const s = slide('Chapter 6.2', 'Future Lawyer',
    'The student hub. Four live services, two marked coming soon — do not build a class around those two yet.')
  pathBox(s, null, ['☰ → Future Lawyer → Services'], { w: 5.5 })
  cards(s, null, [
    { title: '💬  AI Legal Q&A', body: 'Any Indian law question → an answer backed by the provision, the leading judgments, and how the point tends to be examined.', accent: GOLD },
    { title: '⚖️  Moot Memorial Builder', body: 'Paste the proposition, pick a side → a memorial outline plus suggested authorities.', accent: GREEN },
    { title: '🗺️  Career Roadmap', body: 'Six tracks, year by year, through the degree and beyond.', accent: BLUE },
    { title: '📚  Judgments & Doctrines', body: 'The Study & Learn deck, reached from the student hub.', accent: GOLDLT },
    { title: '🎯  Internships & Placements', body: 'Coming soon — not live yet.', accent: FAINT },
    { title: '📝  CLAT / Judicial Exam Prep', body: 'Coming soon — not live yet.', accent: FAINT },
  ], { cols: 3, h: 1.24, titleSize: 13.5, bodySize: 11.5 })
  callout(s, null, 'Two cards are marked coming soon.', 'They are visible so you know they are planned. Do not build a class around them yet.')
}

{
  const s = slide('Chapter 6.2', 'Moot Court Memorial Builder',
    'The teaching note on this slide is the most valuable idea in the deck. Correcting a competent-looking draft is harder — and more useful — than starting from a blank page.')
  stepList(s, null, [
    ['Open Future Lawyer', '→ Moot Court Memorial Builder.'],
    ['Name the competition', 'if you want it on the memorial. Optional.'],
    ['Choose the side', 'Petitioner / Applicant · Respondent / Defence · Prosecution.'],
    ['Paste the full moot proposition', 'into the box.'],
    ['Generate', '→ statement of facts, issues, arguments and prayer, plus suggested authorities.'],
  ], { gap: 0.58 })
  callout(s, null, 'Teaching note.', 'Set it as the first draft, never the final one. Have students mark up what the AI got wrong — a weak issue framing, an argument that does not follow, a prayer asking for relief the court cannot grant. Correcting a competent-looking draft is a harder and more useful exercise than starting from a blank page, and it teaches the scepticism they will need anyway.')
}

{
  const s = slide('Chapter 6.2', 'Career Roadmap',
    'Project this during a careers session. It answers the question first-years actually ask, which is not “what is the law” but “what happens to me after this”.')
  s.addText('Six tracks, laid out year by year through the degree — with what to do in each year, and where each one leads.', {
    x: M, y: TOP, w: CW, h: 0.4, fontFace: BODY, fontSize: 15, color: MUTED,
  })
  s.__y = TOP + 0.6
  cards(s, null, [
    { title: 'Litigation Practice', accent: GOLD },
    { title: 'Corporate / Law-Firm', accent: GOLDLT },
    { title: 'Judicial Services', accent: BLUE },
    { title: 'LLM Abroad / Academia', accent: GREEN },
    { title: 'Civil Services', accent: BLUE },
    { title: 'In-House Counsel', accent: GOLD },
  ], { cols: 3, h: 0.95, titleSize: 16 })
  callout(s, null, 'Teaching note.', 'This is the page to put on the projector during a careers session. It answers the question first-year students actually ask — not “what is the law”, but “what happens to me after this”.')
}

// ══ CHAPTER 7 ═════════════════════════════════════════════════════
divider('7', 'My College', 'For faculty co-ordinators. Students, batches and usage in one screen.')

{
  const s = slide('Chapter 7', 'My College',
    'This chapter applies to one person per college. If the Faculty group is missing from their menu, their account has not been marked yet — that is a same-day fix.')
  pathBox(s, null, ['☰ → Faculty → My college'])
  cards(s, null, [
    { title: 'The plan', body: 'Your college’s name, whether the plan is active, and the date it runs until. If it is not active it says so in red, and students cannot join.', accent: GOLD },
    { title: 'Signed up', body: 'How many students on your list have actually logged in. The number worth watching in the first fortnight.', accent: GREEN },
    { title: 'Active this month', body: 'How many used the app in the last thirty days.', accent: GREEN },
    { title: 'Documents made', body: 'Total generated by your students.', accent: GOLDLT },
    { title: 'By batch', body: 'The same numbers broken down — so you can see BA LLB 2027 is using it and 2028 is not.', accent: BLUE },
    { title: 'The student list', body: 'Every student, with a dot showing who has been active this month, and a marker on staff accounts.', accent: BLUE },
  ], { cols: 3, h: 1.18, titleSize: 13.5, bodySize: 11 })
  callout(s, null, 'Cannot see it?', 'The Faculty group only appears once your account is marked as your college’s co-ordinator. Email support — it is done the same day.')
}

{
  const s = slide('Chapter 7', 'Adding students',
    'There is no one-at-a-time route, and that is deliberate: sixty students added by hand is sixty chances to mistype an email address.')
  stepList(s, null, [
    ['Prepare an Excel file', 'one row per student, with these columns: email, password, name, batch.'],
    ['Send it in', 'or upload it yourself if you have console access.'],
    ['Every student gets an account', 'immediately.'],
    ['They set their own credentials', 'name, password and security question, at first sign-in. The spreadsheet password is only for that first login.'],
  ], { gap: 0.56 })
  callout(s, null, 'Send the whole list every time.', 'When you add fifteen students in March, send the full current list — the originals and the fifteen new ones — not just the fifteen. The import reads the file as the state of the batch, so a partial list is read as a shrunken batch.', 'danger')
  callout(s, null, 'When a trial ends,', 'Pro access stops but nothing is deleted. Accounts stay, documents stay — and the moment the college converts, every student has Pro again with no second sign-up.', 'good')
}

// ══ CHAPTER 8 ═════════════════════════════════════════════════════
divider('8', 'Your account', 'Name, password, recovery, plan and data — seven sections, top to bottom.')

{
  const s = slide('Chapter 8', 'Your account',
    'Point at Account recovery again. It is the second time in the deck and that is intentional.')
  pathBox(s, null, ['☰ → You → Account'], { w: 5.5 })
  refTable(s, null, ['Section', 'What it is for'], [
    ['Your details', 'Your full name — the one on your dashboard and your drafts. Email is shown but cannot be changed; it is your login.'],
    ['Change password', 'Current password, new password, confirm.'],
    ['Account recovery', 'Choose a security question and set an answer. Do this if you have not already.'],
    ['Plan & usage', 'Free or Pro, and how many documents you have generated this month.'],
    ['College', 'Which college you are linked to — or where you join one.'],
    ['Language & notifications', 'Interface language, and whether you get email and push notifications.'],
    ['Download everything', 'Export all your data — every document, client and court date — in one file.'],
    ['Delete this account', 'Permanent. It does what it says.'],
  ], [24, 76], { rowH: 0.42 })
}

// ══ APPENDICES ════════════════════════════════════════════════════
divider('A–C', 'Appendices', 'The twenty document types, the seven languages, and what to do when something breaks.')

{
  const s = slide('Appendix A', 'The twenty document types',
    'Reference slide. Do not read it out — leave it up while you take questions.')
  refTable(s, null, ['Type', 'What it produces'], [
    ['Legal Notice', 'Formal notice demanding action or remedy under Indian law'],
    ['Case Brief', 'Structured IRAC summary of legal arguments and precedents'],
    ['Contract', 'Legally binding agreement — property, service, business'],
    ['Petition', 'Civil or criminal petition to district or subordinate courts'],
    ['Memorandum', 'Legal analysis, opinion and actionable recommendations'],
    ['Writ Petition', 'High Court writ under Article 226 — Certiorari, Mandamus, Habeas Corpus'],
    ['Vakalatnama', 'Authority letter appointing an advocate to appear in court'],
    ['Bail Application', 'Regular or anticipatory bail under CrPC — district court or High Court'],
    ['Stay Application', 'Urgent stay or injunction against an order or proceeding'],
    ['Affidavit', 'Sworn statement of facts for court or official use'],
  ], [26, 74], { rowH: 0.4 })
  s.addText('Continued →', { x: M, y: 6.3, w: CW, h: 0.3, fontFace: BODY, fontSize: 11, color: FAINT, italic: true, align: 'right' })
}

{
  const s = slide('Appendix A', 'The twenty document types  (continued)',
    'All twenty are on the free plan.')
  refTable(s, null, ['Type', 'What it produces'], [
    ['PIL', 'Public Interest Litigation — High Court under Article 226'],
    ['RTI Application', 'Application under the Right to Information Act, 2005'],
    ['Consumer Complaint', 'Complaint to a Consumer Forum under the Consumer Protection Act, 2019'],
    ['Divorce Petition', 'Under the Hindu Marriage Act or the Special Marriage Act'],
    ['Rent Agreement', 'Residential or commercial rental or lease agreement'],
    ['Sale Deed', 'Property sale or conveyance deed under the Transfer of Property Act'],
    ['Cheque Bounce Notice', 'Notice under Section 138 of the Negotiable Instruments Act'],
    ['Legal Opinion', 'Formal legal opinion or advice memorandum on a legal question'],
    ['FIR Complaint', 'Written complaint to a police station under Section 154 CrPC'],
    ['Email Draft', 'Professional or legal email, ready to paste into Gmail or Outlook'],
  ], [26, 74], { rowH: 0.4 })
}

{
  const s = slide('Appendix B', 'The seven drafting languages',
    'The vocabulary point is the one that matters. It is not translation — each language carries the court vocabulary that language actually uses.')
  refTable(s, null, ['Language', 'Where it is the right choice'], [
    ['English', 'High Courts and formal proceedings'],
    ['हिन्दी  (Hindi)', 'Lower courts and revenue matters'],
    ['Bilingual (EN + HI)', 'English body, Hindi headings and prayer'],
    ['اردو  (Urdu)', 'Jammu & Kashmir, and courts keeping records in Urdu'],
    ['தமிழ்  (Tamil)', 'Tamil Nadu district courts and local matters'],
    ['తెలుగు  (Telugu)', 'Andhra Pradesh and Telangana courts'],
    ['ಕನ್ನಡ  (Kannada)', 'Karnataka district and taluk courts'],
  ], [28, 72], { rowH: 0.42 })
  callout(s, null, 'Not a translation layer.', 'Each language carries the court vocabulary that language actually uses — a Kannada petition says ಅರ್ಜಿದಾರ, not a literal rendering of “petitioner”.', 'good')
}

{
  const s = slide('Appendix C', 'When something goes wrong',
    'Leave this up at the end. Most of what a college will email about is on this slide.')
  refTable(s, null, ['What you see', 'What it means and what to do'], [
    ['Signed out on your own', 'Someone signed in with your account elsewhere — usually you, on your phone. One device at a time. Sign in again.'],
    ['“Upgrade to Pro” appears', 'You are on the free plan. Check Account → College. If it does not name your college, you are not linked yet — email support.'],
    ['“You have used your documents”', 'The free plan allows two per calendar month. It resets on the first. Pro removes the limit.'],
    ['Generation slow or failed', 'A busy period. Wait a minute and press Generate again — the form keeps everything you typed.'],
    ['Forgot your password', 'Sign-in screen → Forgot password → answer your security question. There is no emailed reset link.'],
    ['Never set a security question', 'Email support before you need it. Once locked out there is no self-service route back.'],
    ['Cannot see “My college”', 'That group is only for faculty co-ordinators. Ask us to mark your account.'],
    ['A citation looks wrong', 'Check it. Citations under Legal Research and Case Law & Status link to the original — click through. The Case Assistant gives none, by design.'],
  ], [27, 73], { rowH: 0.44 })
}

// ── Closing ───────────────────────────────────────────────────────
{
  n++
  const s = pptx.addSlide()
  s.__name = 'closing'
  s.background = { color: BG }
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.055, fill: { color: GOLD } })
  bookMotif(s, { x: 10.6, y: 5.15, scale: 1.2 })
  s.addText('Questions', {
    x: M, y: 2.5, w: 8, h: 0.9,
    fontFace: DISPLAY, fontSize: 46, color: INK, bold: true, valign: 'top',
  })
  s.addShape(pptx.ShapeType.rect, { x: M, y: 3.5, w: 2.2, h: 0.04, fill: { color: GOLD } })
  s.addText('Include your email address, your college, and what you were doing when it went wrong. A screenshot answers most questions on the first reply.', {
    x: M, y: 3.8, w: 7.2, h: 1,
    fontFace: BODY, fontSize: 15, color: MUTED, lineSpacing: 24, valign: 'top',
  })
  s.addText('support.lexforge@gmail.com', {
    x: M, y: 5.1, w: 8, h: 0.5,
    fontFace: DISPLAY, fontSize: 24, color: GOLDLT, bold: true,
  })
  s.addText('lexforge-ai.vercel.app', {
    x: M, y: 5.65, w: 8, h: 0.4,
    fontFace: BODY, fontSize: 14, color: FAINT,
  })
  s.addNotes('Close by handing over the Word manual as the reference companion to this deck — same content, but organised for someone sitting alone with a question rather than standing in front of a room.')
}

// ─── Overflow guard ───────────────────────────────────────────────
// The failure this catches is invisible from the console: content runs
// past the bottom edge and you only find out from a render, or from
// someone presenting it.
for (const s of pptx.slides) {
  if (s.__max && s.__max > BOTTOM) {
    overflows.push(`${s.__name}: content ends at ${s.__max.toFixed(2)}in, limit ${BOTTOM}in`)
  }
}

// ─── Write ────────────────────────────────────────────────────────
const out = join(ROOT, 'docs', 'LexForge-AI-Faculty-Deck.pptx')
mkdirSync(dirname(out), { recursive: true })
await pptx.writeFile({ fileName: out })
console.log(`wrote ${out}  (${pptx.slides.length} slides)`)

if (overflows.length) {
  console.error(`\n${overflows.length} slide(s) overflow the bottom edge:`)
  for (const o of overflows) console.error('  ' + o)
  process.exitCode = 1
} else {
  console.log('every slide fits inside the safe area')
}
