'use client'

// ─────────────────────────────────────────────────────────────────
//  AssistantWidget — floating Case Assistant chatbot.
//  Three layers of UX:
//    1. Friendly greeting on open ("Hi! What can I do for you today?")
//    2. Client-side intent detection: when a user mentions any of the
//       20 service keywords (writ petition, bail, contract, RTI, ...)
//       we surface a one-click "Generate this document →" CTA that
//       routes them to /new-draft with the type pre-selected and the
//       message preloaded as the initial facts.
//    3. Pro users additionally get a live LLM chatbot via /api/assistant
//       (suggests favorable IPC sections, real precedents). Free users
//       see a soft Pro upsell only after they've already used the
//       intent detection — never as a hard wall on first open.
//
//  Cancel UX: prominent × in header, plus a 'Cancel / Close' button
//  at the bottom of the chat. Visible at all times.
// ─────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

// ─── Intent detection ────────────────────────────────────────────
// Each entry maps a friendly label + the canonical document type
// value (matches lib/utils.DOCUMENT_TYPES) to a list of trigger
// keywords. Detection is case-insensitive and order-aware: the
// FIRST entry whose keyword set matches the user input wins.
const INTENTS = [
  { type: 'WRIT_PETITION',      label: 'Writ Petition',      keywords: ['writ petition','writ-c','writ-b','writ-a','article 226','mandamus','certiorari','habeas corpus','quo warranto'] },
  { type: 'PIL',                label: 'PIL',                keywords: ['pil','public interest','public interest litigation'] },
  { type: 'BAIL_APPLICATION',   label: 'Bail Application',   keywords: ['bail','anticipatory bail','regular bail','crpc 437','crpc 438','crpc 439','jail','remand'] },
  { type: 'DIVORCE_PETITION',   label: 'Divorce Petition',   keywords: ['divorce','dissolution of marriage','hindu marriage act','section 13','irretrievable breakdown','matrimonial'] },
  { type: 'CHEQUE_BOUNCE',      label: 'Cheque Bounce Notice', keywords: ['cheque bounce','cheque dishonour','138 ni act','section 138','dishonoured cheque','negotiable instruments'] },
  { type: 'FIR_COMPLAINT',      label: 'FIR Complaint',      keywords: ['fir','first information report','crpc 154','crpc 156','police complaint','file an fir'] },
  { type: 'CONSUMER_COMPLAINT', label: 'Consumer Complaint', keywords: ['consumer complaint','consumer forum','consumer protection','deficiency of service','unfair trade'] },
  { type: 'RTI_APPLICATION',    label: 'RTI Application',    keywords: ['rti','right to information','public information officer','cpio'] },
  { type: 'STAY_APPLICATION',   label: 'Stay Application',   keywords: ['stay','injunction','interim relief','order xxxix','status quo'] },
  { type: 'PETITION',           label: 'Petition',           keywords: ['civil petition','plaint','suit','revision petition'] },
  { type: 'CONTRACT',           label: 'Contract',           keywords: ['contract','agreement','mou','memorandum of understanding','service agreement','joint venture'] },
  { type: 'RENT_AGREEMENT',     label: 'Rent Agreement',     keywords: ['rent agreement','lease deed','leave and licence','tenant','landlord','rental'] },
  { type: 'SALE_DEED',          label: 'Sale Deed',          keywords: ['sale deed','conveyance deed','property sale','registration deed'] },
  { type: 'AFFIDAVIT',          label: 'Affidavit',          keywords: ['affidavit','solemn affirmation','sworn statement','deponent'] },
  { type: 'VAKALATNAMA',        label: 'Vakalatnama',        keywords: ['vakalatnama','authority to plead','engage advocate','appoint counsel'] },
  { type: 'CASE_BRIEF',         label: 'Case Brief',         keywords: ['case brief','irac','case summary','legal brief'] },
  { type: 'MEMORANDUM',         label: 'Memorandum',         keywords: ['memorandum','memo','legal memo','privileged memo'] },
  { type: 'LEGAL_OPINION',      label: 'Legal Opinion',      keywords: ['legal opinion','legal advice','opinion','advisory'] },
  { type: 'LEGAL_NOTICE',       label: 'Legal Notice',       keywords: ['legal notice','demand notice','notice','tort notice'] },
  { type: 'LEGAL_EMAIL',        label: 'Email Draft',        keywords: ['email','mail','correspondence','letter to','draft an email','client update','follow up'] },
]

function detectIntent(text) {
  if (!text) return null
  const t = text.toLowerCase()
  for (const intent of INTENTS) {
    if (intent.keywords.some(k => t.includes(k))) return intent
  }
  return null
}

// ─── Floating action button ─────────────────────────────────────
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

function MessageBubble({ role, content, children }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{
        maxWidth: '85%',
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
        {children}
      </div>
    </div>
  )
}

// ─── Per-message intent CTA bubble ──────────────────────────────
function IntentCTA({ intent, message, onGenerate }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}` }}>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>
        Looks like you want a <b style={{ color: COLORS.accent }}>{intent.label}</b>. I can take you straight to the form and pre-fill what you've described:
      </div>
      <button onClick={() => onGenerate(intent, message)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          border: '1px solid rgba(212,160,23,0.5)',
          background: 'linear-gradient(135deg, rgba(212,160,23,0.25), rgba(212,160,23,0.12))',
          color: COLORS.accent,
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          letterSpacing: '0.4px',
        }}>
        Generate {intent.label} →
      </button>
    </div>
  )
}

// ─── Quick-pick grid of all 20 document types ────────────────────
// Rendered inside the greeting bubble so the user can jump straight
// into any tool with one click instead of typing.
const QUICK_ICONS = {
  WRIT_PETITION: '🔏', PIL: '⚡', BAIL_APPLICATION: '🔓',
  DIVORCE_PETITION: '⚖️', CHEQUE_BOUNCE: '💳', FIR_COMPLAINT: '🚔',
  CONSUMER_COMPLAINT: '🛒', RTI_APPLICATION: '🔍', STAY_APPLICATION: '⏸️',
  PETITION: '🏛️', CONTRACT: '📝', RENT_AGREEMENT: '🏠',
  SALE_DEED: '🏗️', AFFIDAVIT: '🖊️', VAKALATNAMA: '✍️',
  CASE_BRIEF: '📚', MEMORANDUM: '📄', LEGAL_OPINION: '💡',
  LEGAL_NOTICE: '📋', LEGAL_EMAIL: '✉️',
}

function QuickPicks({ onPick }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${COLORS.border}` }}>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
        Quick picks
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 6 }}>
        {INTENTS.map(intent => (
          <button key={intent.type} onClick={() => onPick(intent)}
            title={`Generate ${intent.label}`}
            style={{
              padding: '7px 9px',
              borderRadius: 8,
              border: '1px solid rgba(212,160,23,0.25)',
              background: 'rgba(212,160,23,0.05)',
              color: '#D8D8D8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,160,23,0.18)'
              e.currentTarget.style.borderColor = 'rgba(212,160,23,0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212,160,23,0.05)'
              e.currentTarget.style.borderColor = 'rgba(212,160,23,0.25)'
            }}>
            <span style={{ fontSize: 14 }}>{QUICK_ICONS[intent.type] || '📑'}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {intent.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Pretty-format a name: trim, take first word only, capitalise first letter.
function prettyName(raw) {
  const s = String(raw || 'friend').trim()
  if (!s) return 'friend'
  const first = s.split(/\s+/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

export default function AssistantWidget({ isPro = false, userName = 'friend' }) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState(null)
  const [messages, setMessages] = useState([])
  const listRef = useRef(null)

  const greetName = prettyName(userName)

  // Reset to greeting whenever the panel is freshly opened.
  useEffect(() => {
    if (!open) return
    setMessages([{
      role: 'assistant',
      content:
        `Hi ${greetName}, how may I assist you bro?\n\n` +
        "Pick any document below to start, or just type your request — " +
        "I'll detect what you need (writ petition, bail, contract, RTI, " +
        "cheque bounce, etc.) and take you to the right form.",
      showQuickPicks: true,   // ← marks this bubble to render the doc-type chips
    }])
    setError(null)
    setInput('')
  }, [open, greetName])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  // Esc key dismisses the panel.
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleGenerate(intent, message) {
    setOpen(false)
    const params = new URLSearchParams({
      type: intent.type,
      seed: (message || '').slice(0, 1500),
    })
    router.push(`/new-draft?${params.toString()}`)
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setError(null)

    // 1. Detect intent client-side first (works for everyone, free or Pro).
    const intent = detectIntent(text)

    // 2. Add user message to thread.
    const userMsg = { role: 'user', content: text }
    let next = [...messages, userMsg]
    setMessages(next)
    setInput('')

    // 3. If we matched an intent, surface a CTA bubble in the same turn.
    if (intent) {
      next = [...next, {
        role: 'assistant',
        content: `Got it — that sounds like a ${intent.label}.`,
        intent,
        seedMessage: text,
      }]
      setMessages(next)
      // Free user journey ends here with the CTA.
      if (!isPro) return
    }

    // 4. No intent? Free users get a soft upsell; Pro users go to LLM.
    if (!isPro) {
      setMessages(m => [...m, {
        role: 'assistant',
        content:
          "I couldn't auto-match that to one of our 20 document types. " +
          "Try mentioning the kind of document you want (writ, bail, contract, " +
          "RTI, cheque bounce, rent agreement, divorce, FIR, etc.) — or upgrade " +
          "to Pro to chat with the full Case Assistant for free-form legal advice.",
        upsell: true,
      }])
      return
    }

    setBusy(true)
    try {
      const r = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter(m => !m.upsell)
                       .map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`)
      setMessages(m => [...m, { role: 'assistant', content: j.reply || '(no reply)' }])
    } catch (e) {
      setError(e.message)
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
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            height: 600,
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
                {isPro ? 'PRO • LIVE CHAT' : 'INTAKE • FREE'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              title="Close (Esc)"
              style={{
                background: 'transparent',
                border: '1px solid ' + COLORS.border,
                color: COLORS.muted,
                fontSize: 18,
                cursor: 'pointer',
                lineHeight: 1,
                width: 30, height: 30, borderRadius: 8,
              }}
            >×</button>
          </div>

          {/* Body */}
          <div ref={listRef} style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 4px',
            background: COLORS.bg,
          }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content}>
                {m.showQuickPicks && (
                  <QuickPicks onPick={(intent) => handleGenerate(intent, '')} />
                )}
                {m.intent && (
                  <IntentCTA intent={m.intent} message={m.seedMessage || ''} onGenerate={handleGenerate} />
                )}
                {m.upsell && (
                  <div style={{ marginTop: 10 }}>
                    <Link href="/upgrade" style={{
                      display: 'inline-block',
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #D4A017, #B8860B)',
                      color: '#0D0D0D',
                      fontWeight: 800,
                      fontSize: 12,
                      borderRadius: 8,
                      textDecoration: 'none',
                      letterSpacing: '0.5px',
                    }}>★ Upgrade to Pro</Link>
                  </div>
                )}
              </MessageBubble>
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
              placeholder="Type your request… (Enter to send)"
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

          {/* Cancel / dismiss bar - always visible at the bottom */}
          <div style={{
            padding: '8px 12px',
            background: COLORS.bg,
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: COLORS.muted,
          }}>
            <span>Press Esc or click below to dismiss the assistant.</span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                color: '#F48080',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                letterSpacing: '0.4px',
              }}>
              Cancel / Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
