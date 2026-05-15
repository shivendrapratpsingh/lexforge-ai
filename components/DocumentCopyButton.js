'use client'
// ─────────────────────────────────────────────────────────────────
//  DocumentCopyButton — one-click "copy to clipboard" for EVERY one
//  of LexForge's 20 document services (not just LEGAL_EMAIL).
//
//  • Smart per-service framing — the card heading, button label and
//    the guidance tip change based on `documentType`, so a Bail
//    Application reads differently from an Email or a Sale Deed.
//  • Format options — the user picks HOW the text lands on their
//    clipboard:
//        Document text  → the draft exactly as generated
//        Clean / plain  → markdown artefacts stripped, whitespace
//                         tidied — ideal for Gmail / Word / e-filing
//        With header    → a titled cover block (doc type · title ·
//                         court · date) prepended to the clean text
//
//  All of the per-service framing + the text transforms live in
//  lib/copy-presets.js (pure, testable, shared). This file is just
//  the UI. Drop-in replacement for the old EmailCopyButton.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { getCopyPreset, buildText, FORMATS } from '@/lib/copy-presets'

export default function DocumentCopyButton({
  content,
  documentType,
  title,
  courtLabel,
  dateLabel,
}) {
  const preset = getCopyPreset(documentType)
  const [format, setFormat] = useState('full')
  const [state, setState]   = useState('idle')   // idle | copied | error

  async function copy() {
    const text = buildText(format, content, preset, { title, courtLabel, dateLabel })
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text || '')
      } else {
        // Fallback for older browsers / non-https contexts
        const ta = document.createElement('textarea')
        ta.value = text || ''
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      console.error('[DocumentCopyButton]', err)
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  const palette = state === 'copied'
    ? { bg: 'rgba(46,125,50,0.15)',  border: '#2E7D32', fg: '#9FE1A1' }
    : state === 'error'
    ? { bg: 'rgba(198,40,40,0.15)',  border: '#C62828', fg: '#F0A6A6' }
    : { bg: 'rgba(212,160,23,0.10)', border: '#D4A017', fg: '#F0D070' }

  const label = state === 'copied'
    ? 'Copied to clipboard'
    : state === 'error'
    ? 'Could not copy — try again'
    : `Copy ${preset.noun}`

  return (
    <div style={{
      background: '#141414',
      border: '1px solid #2A2A2A',
      borderRadius: 14,
      padding: 18,
      marginBottom: 14,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#3A3A3A',
        letterSpacing: '1.5px', textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        {preset.header}
      </div>

      {/* Format options */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {FORMATS.map(f => {
          const active = format === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              title={f.hint}
              style={{
                flex: '1 1 30%',
                minWidth: 84,
                padding: '7px 8px',
                background: active ? 'rgba(212,160,23,0.14)' : '#0D0D0D',
                border: `1px solid ${active ? '#D4A017' : '#2A2A2A'}`,
                borderRadius: 8,
                color: active ? '#F0D070' : '#7A7A7A',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <button onClick={copy}
        style={{
          width: '100%', padding: '12px 14px',
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          borderRadius: 10,
          color: palette.fg,
          fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.15s ease',
        }}>
        <span>{label}</span>
        <span style={{ fontSize: 16 }}>
          {state === 'copied' ? '✓' : state === 'error' ? '!' : '📋'}
        </span>
      </button>

      <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 10, lineHeight: 1.55 }}>
        {preset.tip}
      </div>
    </div>
  )
}
