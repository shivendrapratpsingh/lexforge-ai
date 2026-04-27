'use client'

// ─────────────────────────────────────────────────────────────────
//  AssistantWidget — floating Pro Case Assistant chatbot.
//  • Bottom-right chat button on every dashboard page.
//  • Pro/admin: live chat via /api/assistant (suggests favorable
//    IPC sections, real precedents, drafting hints).
//  • Free: locked card with an upgrade prompt.
// ─────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const COLORS = {
  bg:       '#0D0D0D',
  card:     '#141414',
  border:   '#1C1C1C',
  text:     '#F0F0F0',
  muted:    '#6A6A6A',
  accent:   '#D4A017',
  userBub:  'rgba(212,160,23,0.12)',
  asstBub:  '#1A1A1A',
}

function FAB({ onClick, open }) {
  return (
    <button
      aria-label={open ? 'Close case assistant' : 'Open case assistant'}
      onClick={onClick}
      style={{
        position: 'fixed',
        right: 22,
        bottom: 22,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: '1px solid rgba(212,160,23,0.4)',
        background: open
          ? 'linear-gradient(135deg, #1C1C1C, #0D0D0D)'
          : 'linear-gradient(135deg, #D4A017, #B8860B)',
        color: open ? COLORS.accent : '#0D0D0D',
        fontSize: 24,
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 2px 6px rgba(212,160,23,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {open ? '×' : '✦'}
    </button>
  )
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? COLORS.userBub : COLORS.asstBub,
        border: `1px solid ${isUser ? 'rgba(212,160,23,0.3)' : COLORS.border}`,
        borderRadius: 12,
        padding: '10px 13px',
        fontSize: 13,
        lineHeight: 1.55,
        color: isUser ? '#F0E0B0' : '#D8D8D8',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  )
}

function LockedCard() {
  return (
    <div style={{
      padding: '22px 18px',
      textAlign: 'center',
      color: COLORS.text,
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.accent, marginBottom: 6 }}>
        Pro Case Assistant
      </div>
      <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.55, marginBottom: 16 }}>
        A private chatbot trained on Indian law that suggests
        <b style={{ color: '#C0C0C0' }}> favorable IPC, CrPC and Constitutional sections</b> for your case,
        cites real precedents, and drafts paragraphs on request.
      </div>
      <ul style={{ textAlign: 'left', fontSize: 12, color: '#A8A8A8', lineHeight: 1.7, padding: 0, listStyle: 'none', marginBottom: 16 }}>
        <li>• Sections that argue <i>your</i> side</li>
        <li>• Real Supreme Court &amp; High Court precedents</li>
        <li>• Phrasing for grounds, prayer &amp; verification</li>
        <li>• Risk &amp; counter-argument warnings</li>
      </ul>
      <Link href="/upgrade" style={{
        display: 'inline-block',
        padding: '10px 18px',
        background: 'linear-gradient(135deg, #D4A017, #B8860B)',
        color: '#0D0D0D',
        fontWeight: 800,
        fontSize: 13,
        borderRadius: 10,
        textDecoration: 'none',
        letterSpacing: '0.5px',
      }}>
        ★ Upgrade to Pro
      </Link>
    </div>
  )
}

export default function AssistantWidget({ isPro = false }) {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState(null)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! I am your Case Assistant. Tell me what you are working on — the facts, the side you represent, the relief sought — and I will suggest IPC / CrPC / Constitution / NI Act sections that argue in your favour, plus relevant precedents.',
    },
  ])

  const listRef = useRef(null)

  // Auto-scroll on new message.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError(null)
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        throw new Error(j.error || `Request failed (${r.status})`)
      }
      setMessages(m => [...m, { role: 'assistant', content: j.reply || '(no reply)' }])
    } catch (e) {
      setError(e.message)
      // Strip the failed user turn so they can retry.
      setMessages(m => m.slice(0, -1))
      setInput(text)
    } finally {
      setBusy(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <FAB open={open} onClick={() => setOpen(o => !o)} />

      {open && (
        <div
          role="dialog"
          aria-label="Case Assistant"
          style={{
            position: 'fixed',
            right: 22,
            bottom: 90,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            height: 560,
            maxHeight: 'calc(100vh - 120px)',
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(180deg, #141414, #0D0D0D)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #D4A017, #B8860B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0D0D0D', fontWeight: 900,
            }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.text }}>Case Assistant</div>
              <div style={{ fontSize: 10, color: COLORS.accent, fontWeight: 700, letterSpacing: '1px' }}>
                {isPro ? 'PRO • LIVE' : 'PRO • LOCKED'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.muted,
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >×</button>
          </div>

          {/* Body */}
          {!isPro ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <LockedCard />
            </div>
          ) : (
            <>
              <div ref={listRef} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 14px 4px',
                background: COLORS.bg,
              }}>
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {busy && (
                  <div style={{ fontSize: 12, color: COLORS.muted, fontStyle: 'italic', padding: '4px 8px' }}>
                    Thinking…
                  </div>
                )}
                {error && (
                  <div style={{
                    fontSize: 12,
                    color: '#F48080',
                    background: 'rgba(150,30,30,0.1)',
                    border: '1px solid rgba(150,30,30,0.4)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    margin: '6px 0',
                  }}>{error}</div>
                )}
              </div>

              {/* Input */}
              <div style={{
                padding: 12,
                borderTop: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
              }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Describe your case… (Enter to send)"
                  rows={2}
                  disabled={busy}
                  style={{
                    flex: 1,
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    color: COLORS.text,
                    fontSize: 13,
                    padding: '8px 10px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                  }}
                />
                <button
                  onClick={send}
                  disabled={busy || !input.trim()}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(212,160,23,0.5)',
                    background: busy || !input.trim()
                      ? 'rgba(212,160,23,0.06)'
                      : 'linear-gradient(135deg, rgba(212,160,23,0.25), rgba(212,160,23,0.12))',
                    color: COLORS.accent,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                    opacity: busy || !input.trim() ? 0.6 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
