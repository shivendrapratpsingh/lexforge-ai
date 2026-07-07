'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const COLORS = {
  gold: '#D4A017',
  goldDim: '#B8860B',
  bg: '#0D0D0D',
  surface: '#141414',
  surface2: '#1C1C1C',
  border: '#262626',
  ink: '#F0F0F0',
  inkMuted: '#A0A0A0',
  inkFaint: '#6A6A6A',
}

// Lightweight client-side intent detection — before we ever call the paid
// LLM endpoint, try to match the user's message against known document
// types and keywords so free users still get a useful, instant response
// (a link straight to the right draft flow) without spending a Groq call.
const INTENTS = [
  { type: 'legal-notice', label: 'Legal Notice', keywords: ['legal notice', 'notice to', 'send a notice', 'demand notice'] },
  { type: 'affidavit', label: 'Affidavit', keywords: ['affidavit', 'sworn statement', 'notarize'] },
  { type: 'rti', label: 'RTI Application', keywords: ['rti', 'right to information', 'information request'] },
  { type: 'memorandum', label: 'Memorandum', keywords: ['memorandum', 'memo of'] },
  { type: 'vakalatnama', label: 'Vakalatnama', keywords: ['vakalatnama', 'power of attorney for advocate', 'appoint advocate'] },
  { type: 'cheque-bounce', label: 'Cheque Bounce Notice', keywords: ['cheque bounce', 'cheque bounced', 'dishonour', '138 ni act', 'section 138'] },
  { type: 'consumer', label: 'Consumer Complaint', keywords: ['consumer complaint', 'consumer forum', 'defective product', 'deficiency in service'] },
  { type: 'fir', label: 'FIR Draft', keywords: ['fir', 'first information report', 'police complaint'] },
  { type: 'rent', label: 'Rent Agreement', keywords: ['rent agreement', 'lease deed', 'tenancy', 'rental agreement'] },
  { type: 'stay', label: 'Stay Application', keywords: ['stay application', 'stay order', 'interim stay'] },
  { type: 'legal-opinion', label: 'Legal Opinion', keywords: ['legal opinion', 'opinion on', 'advise me on'] },
  { type: 'case-brief', label: 'Case Brief', keywords: ['case brief', 'brief my case', 'summarize my case'] },
  { type: 'writ', label: 'Writ Petition', keywords: ['writ petition', 'article 226', 'article 32', 'mandamus', 'certiorari'] },
  { type: 'pil', label: 'PIL', keywords: ['pil', 'public interest litigation'] },
  { type: 'bail', label: 'Bail Application', keywords: ['bail application', 'anticipatory bail', 'regular bail'] },
  { type: 'divorce', label: 'Divorce Petition', keywords: ['divorce petition', 'divorce application', 'mutual divorce'] },
  { type: 'contract', label: 'Contract', keywords: ['contract', 'agreement draft', 'nda', 'non-disclosure'] },
  { type: 'sale-deed', label: 'Sale Deed', keywords: ['sale deed', 'property sale', 'conveyance deed'] },
  { type: 'appeal', label: 'Appeal', keywords: ['appeal', 'appellate', 'file an appeal'] },
  { type: 'counter', label: 'Counter / Reply', keywords: ['counter affidavit', 'reply to notice', 'written statement'] },
]

function detectIntent(text) {
  const lower = text.toLowerCase()
  for (const intent of INTENTS) {
    if (intent.keywords.some(k => lower.includes(k))) return intent
  }
  return null
}

function prettyName(name) {
  if (!name) return 'friend'
  return name.split(' ')[0]
}

const QUICK_ICONS = {
  'legal-notice': '📩',
  affidavit: '📜',
  rti: '📄',
  'cheque-bounce': '💸',
  bail: '⚖️',
  writ: '🏛️',
}

function FAB({ onClick, hasUnread }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Case Assistant"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 60,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDim})`,
        border: 'none',
        boxShadow: '0 8px 24px rgba(212,160,23,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 24 }}>💬</span>
      {hasUnread && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          width: 12, height: 12, borderRadius: '50%',
          background: '#E53E3E', border: `2px solid ${COLORS.bg}`,
        }} />
      )}
    </button>
  )
}

function MessageBubble({ role, children }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{
        maxWidth: '82%',
        padding: '10px 13px',
        borderRadius: 14,
        borderBottomRightRadius: isUser ? 4 : 14,
        borderBottomLeftRadius: isUser ? 14 : 4,
        background: isUser ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDim})` : COLORS.surface2,
        color: isUser ? COLORS.bg : COLORS.ink,
        fontSize: 13.5,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
      }}>
        {children}
      </div>
    </div>
  )
}

function IntentCTA({ intent, onNavigate }) {
  return (
    <div style={{
      marginTop: 8,
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      background: 'rgba(212,160,23,0.08)',
      border: `1px solid rgba(212,160,23,0.25)`,
    }}>
      <div style={{ fontSize: 12.5, color: COLORS.inkMuted, marginBottom: 8 }}>
        Looks like you need a <strong style={{ color: COLORS.gold }}>{intent.label}</strong>. Want me to start that draft?
      </div>
      <button
        type="button"
        onClick={() => onNavigate(intent.type)}
        style={{
          padding: '8px 14px',
          borderRadius: 9,
          border: 'none',
          background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDim})`,
          color: COLORS.bg,
          fontWeight: 800,
          fontSize: 12.5,
          cursor: 'pointer',
        }}
      >
        Start {intent.label} →
      </button>
    </div>
  )
}

function QuickPicks({ onPick }) {
  const picks = ['legal-notice', 'affidavit', 'rti', 'cheque-bounce', 'bail', 'writ']
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {picks.map(type => {
        const intent = INTENTS.find(i => i.type === type)
        if (!intent) return null
        return (
          <button
            key={type}
            type="button"
            onClick={() => onPick(intent)}
            style={{
              padding: '6px 10px',
              borderRadius: 20,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface2,
              color: COLORS.inkMuted,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>{QUICK_ICONS[type] || '📄'}</span> {intent.label}
          </button>
        )
      })}
    </div>
  )
}

export default function AssistantWidget({ isPro = false, userName = 'friend' }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const router = useRouter()

  const first = prettyName(userName)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text: `Hi ${first} — I'm your Case Assistant. Tell me what you're trying to draft or ask about, and I'll point you the right way.`,
        },
      ])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setHasUnread(false)
  }, [open])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function navigateToIntent(type) {
    setOpen(false)
    router.push(`/new-draft?type=${type}`)
  }

  function pushMessage(msg) {
    setMessages(prev => [...prev, msg])
  }

  async function send(overrideText) {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    pushMessage({ role: 'user', text })
    setInput('')

    // Try client-side intent detection first — instant, free, no API call.
    const intent = detectIntent(text)
    if (intent) {
      pushMessage({ role: 'assistant', text: '', intent })
      if (!open) setHasUnread(true)
      return
    }

    if (!isPro) {
      pushMessage({
        role: 'assistant',
        text: `I can point you to the right document type from keywords like "legal notice", "affidavit", "RTI", "bail application", etc. For open-ended legal questions and case-specific reasoning, that's a Pro Case Assistant feature — you can upgrade any time from the sidebar.`,
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', text }].map(m => ({ role: m.role, content: m.text })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Assistant request failed')
      pushMessage({ role: 'assistant', text: data.reply || "I couldn't come up with a response for that — try rephrasing?" })
    } catch (err) {
      pushMessage({ role: 'assistant', text: `Something went wrong reaching the assistant: ${err.message}` })
    } finally {
      setLoading(false)
      if (!open) setHasUnread(true)
    }
  }

  return (
    <>
      {!open && <FAB onClick={() => setOpen(true)} hasUnread={hasUnread} />}

      {open && (
        <div
          role="dialog"
          aria-label="Case Assistant"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 60,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            height: 520,
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: COLORS.ink }}>Case Assistant</div>
                <div style={{ fontSize: 10.5, color: isPro ? COLORS.gold : COLORS.inkFaint, fontWeight: 700 }}>
                  {isPro ? 'PRO · AI-powered' : 'Free · keyword matching'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Case Assistant"
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface2,
                color: COLORS.inkMuted,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '14px 14px 6px',
            }}
          >
            {messages.length <= 1 && <QuickPicks onPick={(intent) => send(intent.keywords[0])} />}

            {messages.map((m, i) => (
              <div key={i}>
                {m.text && <MessageBubble role={m.role}>{m.text}</MessageBubble>}
                {m.intent && <IntentCTA intent={m.intent} onNavigate={navigateToIntent} />}
              </div>
            ))}

            {loading && (
              <MessageBubble role="assistant">
                <span style={{ opacity: 0.6 }}>Thinking…</span>
              </MessageBubble>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: 12,
            borderTop: `1px solid ${COLORS.border}`,
            background: COLORS.surface,
            flexShrink: 0,
            display: 'flex',
            gap: 8,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder="Ask about a document or issue…"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 12px',
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface2,
                color: COLORS.ink,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                padding: '0 16px',
                borderRadius: 10,
                border: 'none',
                background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDim})`,
                color: COLORS.bg,
                fontWeight: 800,
                fontSize: 13,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>

          {/* Cancel / dismiss bar */}
          <div style={{
            padding: '6px 14px 10px',
            background: COLORS.surface,
            flexShrink: 0,
            textAlign: 'center',
          }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.inkFaint,
                fontSize: 11.5,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Close assistant
            </button>
          </div>
        </div>
      )}
    </>
  )
}
