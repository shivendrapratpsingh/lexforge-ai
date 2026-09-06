'use client'

// ─────────────────────────────────────────────────────────────────
//  Look at the Case Assistant without a session. DEVELOPMENT ONLY.
//
//  The widget lives in the dashboard layout, behind a login. That is
//  right for it and awkward when the question is "does the greeting
//  read well, does the mark sit properly on the button" — questions
//  that need eyes, not an account.
//
//  Hard-disabled outside `next dev`, exactly like /dev/papers: in
//  production this route 404s unconditionally.
//
//    /dev/assistant                 an advocate, Pro
//    /dev/assistant?a=student       a law student
//    /dev/assistant?a=faculty       a college co-ordinator
//    /dev/assistant?pro=0           the free tier
//
//  It renders the REAL component with the props the layout passes, so
//  what is on screen is what a user gets. Sending a message will fail
//  without a session — this is for the opening, not the conversation.
// ─────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { notFound } from 'next/navigation'
import AssistantWidget from '@/components/AssistantWidget'

const AUDIENCES = [
  ['advocate', 'Advocate'],
  ['student', 'Law student'],
  ['faculty', 'Faculty co-ordinator'],
]

const NAMES = {
  advocate: 'Rakesh Menon',
  student: 'Priya Sharma',
  faculty: 'Dr. Anjali Deshpande',
}

export default function AssistantPreview() {
  if (process.env.NODE_ENV === 'production') notFound()

  const [audience, setAudience] = useState('advocate')
  const [isPro, setIsPro] = useState(true)
  // Remounting is the only way to see the opening again: the greeting
  // is written once per mount and the auto-open flag is sticky.
  const [nonce, setNonce] = useState(0)

  const reset = (next) => {
    try { window.localStorage.removeItem('lf.assistant.greeted.v1') } catch { /* private window */ }
    next?.()
    setNonce(n => n + 1)
  }

  const btn = (active) => ({
    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${active ? '#D4A017' : '#2A2A2A'}`,
    background: active ? 'rgba(212,160,23,0.14)' : 'transparent',
    color: active ? '#D4A017' : '#8A8A8A',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  })

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D', color: '#F0F0F0',
      padding: '40px 28px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 11, letterSpacing: '2px', color: '#D4A017', fontWeight: 700 }}>
        DEVELOPMENT PREVIEW
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 6px' }}>Case Assistant</h1>
      <p style={{ color: '#7A7A7A', fontSize: 14, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>
        The real widget, with the props the dashboard layout passes it. It
        opens on its own about a second after the page loads, the way it does
        on somebody&rsquo;s first login.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 26, flexWrap: 'wrap' }}>
        {AUDIENCES.map(([key, label]) => (
          <button key={key} type="button" style={btn(audience === key)}
            onClick={() => reset(() => setAudience(key))}>
            {label}
          </button>
        ))}
        <span style={{ width: 18 }} />
        <button type="button" style={btn(isPro)} onClick={() => reset(() => setIsPro(true))}>Pro</button>
        <button type="button" style={btn(!isPro)} onClick={() => reset(() => setIsPro(false))}>Free</button>
        <span style={{ width: 18 }} />
        <button type="button" style={btn(false)} onClick={() => reset()}>Replay the opening</button>
      </div>

      <div style={{ marginTop: 22, fontSize: 12.5, color: '#5A5A5A', fontFamily: 'ui-monospace, monospace' }}>
        audience={audience} &nbsp;·&nbsp; isPro={String(isPro)} &nbsp;·&nbsp; userName=&quot;{NAMES[audience]}&quot;
      </div>

      <AssistantWidget
        key={`${audience}-${isPro}-${nonce}`}
        audience={audience}
        isPro={isPro}
        userName={NAMES[audience]}
      />
    </div>
  )
}
