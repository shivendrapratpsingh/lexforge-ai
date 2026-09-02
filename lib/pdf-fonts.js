// ─────────────────────────────────────────────────────────────────
//  Unicode fonts for the PDF export.
//
//  WHY THIS EXISTS
//
//  buildPdf() used jsPDF's built-in `times`, which is one of the
//  standard-14 fonts. Those are SINGLE-BYTE, WinAnsi-encoded. Any
//  character outside cp1252 is written as its raw code-point bytes,
//  which the viewer then renders as garbage. Measured, on the real
//  export path:
//
//    'Rent: ₹20,000'  ->  "\0R\0e\0n\0t\0:\0  ¹\02\00\0,\0..."
//    'Owner — Tenant' ->  "Owner  Tenant"        (em dash deleted)
//    '─────'          ->  "%\0%\0%\0%\0%\0"      (U+2500 high byte
//                                                 is 0x25, i.e. '%')
//    'हिन्दी'           ->  "\t-\t>\t7\t>..."      (total garbage)
//
//  The '%%' a user reported in the middle of a document was the third
//  of those. The first is worse: every rupee amount in every contract
//  was corrupting its own line, in a product that drafts rent
//  agreements and sale deeds.
//
//  THE FIX, AND ITS LIMIT
//
//  Embedding a real Unicode TTF fixes the ENCODING completely: bytes
//  now map to the glyphs they should. It does NOT give jsPDF a text
//  SHAPING engine, and that matters for Indic scripts — Devanagari
//  reorders matras and forms conjuncts, which needs HarfBuzz. So:
//
//    Latin, ₹, dashes, quotes  — fully correct.
//    Devanagari/Tamil/Telugu/Kannada — glyphs are right and legible,
//      but conjunct and matra placement can be imperfect. Far better
//      than the garbage above; DOCX remains the better format for a
//      document that will be filed in one of those languages.
//    Arabic/Urdu — deliberately NOT embedded. That script requires
//      contextual joining; without shaping the letters do not connect
//      and the result is unreadable. Shipping 400 KB to produce that
//      would be worse than being honest. Urdu users get DOCX.
//
//  Fonts are read from node_modules at request time and cached in
//  module scope. next.config.ts force-includes the .ttf files in the
//  serverless bundle — without that, tracing drops them and every
//  load here fails. It fails SOFT: buildPdf falls back to `times`
//  plus the sanitiser below, which is still an improvement on today
//  because ₹ becomes "Rs." instead of corrupting the line.
// ─────────────────────────────────────────────────────────────────
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Order matters only for reporting; detection is independent.
const SCRIPTS = [
  {
    id: 'latin',
    // Latin is the default and is not detected — it is always loaded.
    test: null,
    family: 'NotoSerif',
    pkg: '@expo-google-fonts/noto-serif',
    faces: { normal: '400Regular/NotoSerif_400Regular.ttf', bold: '700Bold/NotoSerif_700Bold.ttf' },
  },
  {
    id: 'devanagari',
    test: /[ऀ-ॿ]/,
    family: 'NotoSerifDevanagari',
    pkg: '@expo-google-fonts/noto-serif-devanagari',
    faces: { normal: '400Regular/NotoSerifDevanagari_400Regular.ttf', bold: '700Bold/NotoSerifDevanagari_700Bold.ttf' },
  },
  {
    id: 'tamil',
    test: /[஀-௿]/,
    family: 'NotoSerifTamil',
    pkg: '@expo-google-fonts/noto-serif-tamil',
    faces: { normal: '400Regular/NotoSerifTamil_400Regular.ttf', bold: '700Bold/NotoSerifTamil_700Bold.ttf' },
  },
  {
    id: 'telugu',
    test: /[ఀ-౿]/,
    family: 'NotoSerifTelugu',
    pkg: '@expo-google-fonts/noto-serif-telugu',
    faces: { normal: '400Regular/NotoSerifTelugu_400Regular.ttf', bold: '700Bold/NotoSerifTelugu_700Bold.ttf' },
  },
  {
    id: 'kannada',
    test: /[ಀ-೿]/,
    family: 'NotoSerifKannada',
    pkg: '@expo-google-fonts/noto-serif-kannada',
    faces: { normal: '400Regular/NotoSerifKannada_400Regular.ttf', bold: '700Bold/NotoSerifKannada_700Bold.ttf' },
  },
]

const byId = Object.fromEntries(SCRIPTS.map(s => [s.id, s]))

/** Scripts actually present in this document, Latin always included. */
export function scriptsIn(text) {
  const s = String(text || '')
  const found = ['latin']
  for (const sc of SCRIPTS) {
    if (sc.test && sc.test.test(s)) found.push(sc.id)
  }
  return found
}

/** Which font family should render this one line. */
export function familyForLine(line, loaded) {
  for (const sc of SCRIPTS) {
    if (sc.test && sc.test.test(line) && loaded[sc.id]) return loaded[sc.id]
  }
  return loaded.latin || null
}

// base64 of each face, keyed `${id}:${weight}`. Populated once per
// process; a warm lambda pays the read cost only on its first PDF.
const cache = new Map()

async function faceBase64(script, weight) {
  const key = `${script.id}:${weight}`
  if (cache.has(key)) return cache.get(key)
  // require.resolve gives the real on-disk location of the package,
  // which is what makes this work under pnpm/npm layouts alike.
  const pkgJson = require.resolve(`${script.pkg}/package.json`)
  const dir = pkgJson.slice(0, pkgJson.lastIndexOf('package.json'))
  const buf = await readFile(dir + script.faces[weight])
  const b64 = buf.toString('base64')
  cache.set(key, b64)
  return b64
}

/**
 * Register every font this document needs on a jsPDF instance.
 * Returns { latin: 'NotoSerif', devanagari: 'NotoSerifDevanagari', ... }
 * for the faces that loaded. A script missing from the result simply
 * was not loadable and the caller should fall back.
 */
export async function registerFonts(doc, text) {
  const loaded = {}
  for (const id of scriptsIn(text)) {
    const script = byId[id]
    if (!script) continue
    try {
      for (const weight of ['normal', 'bold']) {
        const b64 = await faceBase64(script, weight)
        const vfsName = `${script.family}-${weight}.ttf`
        doc.addFileToVFS(vfsName, b64)
        doc.addFont(vfsName, script.family, weight)
      }
      loaded[id] = script.family
    } catch (e) {
      // Soft failure by design — see the header note.
      console.error(`[pdf-fonts] could not load ${script.pkg}:`, e?.message || e)
    }
  }
  return loaded
}

/**
 * Runs on EVERY document, whichever font loaded.
 *
 * Box-drawing characters are in no text font — they belong to terminal
 * fonts. Embedding the Unicode face stopped them printing as '%', but
 * they then vanished silently instead, which removed the rules that
 * separate sections of a draft. They are decoration, so they become em
 * dashes: every font has one, and it looks like the rule intended.
 */
export function normaliseForPdf(text) {
  return String(text || '')
    // A run of rule characters becomes em dashes — but capped, because
    // an em dash is far wider than a box-drawing glyph and the 50-char
    // rules in the fallback template wrapped onto a second line. 30 fills
    // the 150 mm text column at 14 pt without wrapping.
    .replace(/[─━┄-┉╌╍═]+/g, m => '—'.repeat(Math.min(m.length, 30)))
    .replace(/[│┃┆┇┊┋╎╏║]/g, '|')
    .replace(/[┌-╋╒-╿]/g, '')
    .replace(/[   ]/g, ' ')
}

/**
 * Last resort, used only when NO Unicode font could be loaded.
 * Turns the characters that corrupt a WinAnsi PDF into ones that do
 * not. Lossy on purpose: "Rs." is readable, a mangled two-byte
 * sequence is not.
 */
export function sanitiseForWinAnsi(text) {
  return normaliseForPdf(text)
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
}

/** True when the text needs a script jsPDF cannot shape (Arabic/Urdu). */
export function hasUnshapableScript(text) {
  return /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(String(text || ''))
}
