'use client'
// ─────────────────────────────────────────────────────────────────
//  EmailCopyButton — one-click copy for LEGAL_EMAIL drafts
//  Renders a button that copies the entire email body (To, Subject,
//  Greeting, Body, Sign-off) into the user's clipboard so they can
//  paste it directly into Gmail / Outlook / any client.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'

export default function EmailCopyButton({ content }) {
  const [state, setState] = useState('idle')  // idle | copied | error

  async function copy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content || '')
      } else {
        // Fallback for older browsers / non-https
        const ta = document.createElement('textarea')
        ta.value = content || ''
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
      console.error('[EmailCopyButton]', err)
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  const palette = state === 'copied'
    ? { bg: 'rgba(46,125,50,0.15)',  border: '#2E7D32', fg: '#9FE1A1', label: 'Copied to clipboard' }
    : state === 'error'
    ? { bg: 'rgba(198,40,40,0.15)',  border: '#C62828', fg: '#F0A6A6', label: 'Could not copy — try manually' }
    : { bg: 'rgba(212,160,23,0.10)', border: '#D4A017', fg: '#F0D070', label: 'Copy email to clipboard' }

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
        Send by email
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
        <span>{palette.label}</span>
        <span style={{ fontSize: 16 }}>
          {state === 'copied' ? '✓' : state === 'error' ? '!' : '📋'}
        </span>
      </button>
      <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 10, lineHeight: 1.5 }}>
        Tip: paste into Gmail / Outlook. The first three lines (To / Cc / Subject)
        match the standard header fields - most clients will auto-fill if you
        paste them at the top of a new compose window.
      </div>
    </div>
  )
}
