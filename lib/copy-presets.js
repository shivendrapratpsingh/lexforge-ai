// ─────────────────────────────────────────────────────────────────
//  LexForge AI — copy-presets.js
//  SINGLE SOURCE OF TRUTH for the "Copy to clipboard" behaviour that
//  the DocumentCopyButton renders for every one of the 20 document
//  services.
//
//  Pure data + pure functions only (no React) so it can be:
//    • imported by components/DocumentCopyButton.js (the UI), and
//    • imported by a plain Node verification script.
//
//  Two things vary by service:
//    1. FRAMING  — COPY_PRESETS gives each type its own card heading,
//       button noun and a practically-useful guidance tip.
//    2. FORMAT   — buildText() turns the raw draft into one of three
//       clipboard-ready shapes: the document as-is, a tidied "clean"
//       version, or a version with a titled cover block.
// ─────────────────────────────────────────────────────────────────

// ─── Per-service copy framing ─────────────────────────────────────
// docLabel → human label, also used in the "With header" cover block
// noun     → goes into the button label ("Copy bail application")
// header   → uppercase card heading
// tip      → service-specific, practically-useful guidance
export const COPY_PRESETS = {
  LEGAL_NOTICE: {
    docLabel: 'Legal Notice', noun: 'legal notice', header: 'Copy Legal Notice',
    tip: 'Paste onto your firm letterhead in Word, sign it, and dispatch by Registered Post A/D (and email). Keep the postal receipt — it proves service.',
  },
  CASE_BRIEF: {
    docLabel: 'Case Brief', noun: 'case brief', header: 'Copy Case Brief',
    tip: 'Paste into your case file, brief sheet or an email to a senior/junior. The IRAC structure stays intact when you use "Clean / plain".',
  },
  CONTRACT: {
    docLabel: 'Contract', noun: 'contract', header: 'Copy Contract',
    tip: 'Paste into Word for execution — print on stamp paper of the correct value, then both parties sign each page before two witnesses.',
  },
  PETITION: {
    docLabel: 'Petition', noun: 'petition', header: 'Copy Petition',
    tip: 'Paste into your court template, check the cause-title and court name, attach the affidavit and annexures, then file.',
  },
  MEMORANDUM: {
    docLabel: 'Legal Memorandum', noun: 'memorandum', header: 'Copy Memorandum',
    tip: 'Paste into an internal note or email to the addressee. "With header" adds the To / From / Subject cover block.',
  },
  WRIT_PETITION: {
    docLabel: 'Writ Petition', noun: 'writ petition', header: 'Copy Writ Petition',
    tip: 'Paste into your HC writ template — verify the Article 226 cause-title, array of respondents and the prayer before filing.',
  },
  VAKALATNAMA: {
    docLabel: 'Vakalatnama', noun: 'vakalatnama', header: 'Copy Vakalatnama',
    tip: 'Paste into Word, print, and have the client sign. Affix the requisite welfare-stamp and the advocate accepts below.',
  },
  BAIL_APPLICATION: {
    docLabel: 'Bail Application', noun: 'bail application', header: 'Copy Bail Application',
    tip: 'Paste into your court e-filing template. Re-check the FIR number, sections and the police-station/district before submission.',
  },
  STAY_APPLICATION: {
    docLabel: 'Stay Application', noun: 'stay application', header: 'Copy Stay Application',
    tip: 'Paste alongside the main matter — confirm the impugned order date and that it is supported by an affidavit.',
  },
  AFFIDAVIT: {
    docLabel: 'Affidavit', noun: 'affidavit', header: 'Copy Affidavit',
    tip: 'Paste into Word above the verification clause. The deponent signs each page; get it sworn/attested before the Oath Commissioner or Notary.',
  },
  PIL: {
    docLabel: 'Public Interest Litigation', noun: 'PIL', header: 'Copy PIL',
    tip: 'Paste into your HC template — make sure locus standi, the public-interest question and the supporting documents are in order.',
  },
  RTI_APPLICATION: {
    docLabel: 'RTI Application', noun: 'RTI application', header: 'Copy RTI Application',
    tip: 'Paste into the prescribed form or a plain sheet, attach the ₹10 fee (IPO / court-fee stamp / DD) and address it to the CPIO / SPIO.',
  },
  CONSUMER_COMPLAINT: {
    docLabel: 'Consumer Complaint', noun: 'consumer complaint', header: 'Copy Consumer Complaint',
    tip: 'Paste into Word — file before the District / State / National Commission with the supporting bills, the affidavit and the prescribed fee.',
  },
  DIVORCE_PETITION: {
    docLabel: 'Divorce Petition', noun: 'divorce petition', header: 'Copy Divorce Petition',
    tip: 'Paste into your Family Court template — verify the marriage particulars, the ground and section cited, and attach the supporting affidavit.',
  },
  RENT_AGREEMENT: {
    docLabel: 'Rent Agreement', noun: 'rent agreement', header: 'Copy Rent Agreement',
    tip: 'Paste into Word — print on stamp paper of the value applicable in your State; landlord, tenant and two witnesses sign each page.',
  },
  SALE_DEED: {
    docLabel: 'Sale Deed', noun: 'sale deed', header: 'Copy Sale Deed',
    tip: 'Paste into Word — execute on stamp paper of the correct value and register it at the Sub-Registrar within four months of execution.',
  },
  CHEQUE_BOUNCE: {
    docLabel: 'Cheque Bounce Notice', noun: 'cheque-bounce notice', header: 'Copy Cheque Bounce Notice',
    tip: 'Send within 30 days of the bank return memo. Paste onto your letterhead and dispatch by Registered Post A/D — preserve the receipt.',
  },
  LEGAL_OPINION: {
    docLabel: 'Legal Opinion', noun: 'legal opinion', header: 'Copy Legal Opinion',
    tip: 'Paste into Word on your letterhead, or into an email to the client. "With header" adds the addressee / subject cover block.',
  },
  FIR_COMPLAINT: {
    docLabel: 'FIR Complaint', noun: 'complaint', header: 'Copy FIR Complaint',
    tip: 'Paste into Word, sign it, and submit at the police station — keep an acknowledged copy. If refused, escalate under Section 154(3) CrPC / BNSS.',
  },
  LEGAL_EMAIL: {
    docLabel: 'Email Draft', noun: 'email', header: 'Send by Email',
    tip: 'Paste into Gmail / Outlook. The first lines (To / Cc / Subject) match the standard header fields — most clients auto-fill them if pasted at the top of a new compose window.',
  },
}

export const DEFAULT_PRESET = {
  docLabel: 'Document', noun: 'document', header: 'Copy Document',
  tip: 'Copies the draft to your clipboard so you can paste it into Word, an email, or your court e-filing template.',
}

// Look up the framing for a document type, falling back gracefully.
export function getCopyPreset(documentType) {
  return COPY_PRESETS[documentType] || DEFAULT_PRESET
}

// ─── The three clipboard formats the user can choose ──────────────
export const FORMATS = [
  { id: 'full',   label: 'Document text', hint: 'Exactly as generated' },
  { id: 'clean',  label: 'Clean / plain', hint: 'Tidy — Gmail, Word, e-filing' },
  { id: 'header', label: 'With header',   hint: 'Adds a titled cover block' },
]

// ─── Text transforms ──────────────────────────────────────────────
// "Clean / plain": strip the markdown-ish artefacts the AI sometimes
// emits (**bold**, # headings, `code`, > quotes), tidy whitespace, and
// collapse runaway blank lines. Paragraph breaks are preserved.
export function cleanText(raw) {
  return String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/^﻿/, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')        // # / ## headings → plain
    .replace(/^\s{0,3}>\s?/gm, '')             // > blockquote markers
    .replace(/\*\*(.+?)\*\*/g, '$1')           // **bold**
    .replace(/__(.+?)__/g, '$1')               // __bold__
    .replace(/`{1,3}([^`]+?)`{1,3}/g, '$1')    // `code`
    .replace(/[ \t]+$/gm, '')                  // trailing whitespace
    .replace(/\n{3,}/g, '\n\n')                // collapse blank lines
    .trim()
}

// "With header": a short cover block prepended to the clean text.
export function withHeader(raw, preset, meta = {}) {
  const { title, courtLabel, dateLabel } = meta
  const p = preset || DEFAULT_PRESET
  const lines = []
  lines.push((p.docLabel || 'Document').toUpperCase())
  if (title) lines.push(title)
  if (courtLabel) lines.push(`Court: ${courtLabel}`)
  if (dateLabel) lines.push(`Date: ${dateLabel}`)
  lines.push('─'.repeat(48))
  lines.push('')
  return lines.join('\n') + cleanText(raw)
}

// Turn the raw draft into the clipboard text for the chosen format.
export function buildText(format, raw, preset, meta = {}) {
  if (format === 'clean')  return cleanText(raw)
  if (format === 'header') return withHeader(raw, preset, meta)
  return String(raw || '').replace(/\r\n/g, '\n').trim()   // 'full'
}
