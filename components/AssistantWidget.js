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

// The mark. Scales of justice drawn as one continuous line, because a
// speech bubble said "chat widget" and this is the only thing in the
// product that will answer a question about the law.
//
// Stroked rather than filled, and built from four shapes, so it stays
// legible at the 24px it actually renders at — a detailed emblem turns
// to mud at that size. Takes currentColor so one mark serves the gold
// button and the dark panel header without a second copy.
function Mark({ size = 24, strokeWidth = 1.7 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {/* the upright and the beam */}
      <path d="M12 3.6v15.2" />
      <path d="M4.6 7.1h14.8" />
      {/* the knot where the pans hang */}
      <circle cx="12" cy="7.1" r="1.05" fill="currentColor" stroke="none" />
      {/* the two pans, as shallow bowls on their cords */}
      <path d="M6.9 7.4 4.3 12.4h5.2L6.9 7.4Z" />
      <path d="M17.1 7.4l-2.6 5h5.2l-2.6-5Z" />
      {/* the base */}
      <path d="M8.4 20.4h7.2" />
    </svg>
  )
}

function FAB({ onClick, hasUnread, pulse }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Case Assistant"
      className="lf-assistant-fab"
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
        color: COLORS.bg,
      }}
    >
      {/* One ring, once, only for somebody who has never opened it.
          Anything that keeps pulsing becomes something to ignore. */}
      {pulse && (
        <span aria-hidden="true" className="lf-assistant-ring" style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: `2px solid ${COLORS.gold}`, opacity: 0,
        }} />
      )}
      <Mark size={25} />
      {hasUnread && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          width: 12, height: 12, borderRadius: '50%',
          background: '#E53E3E', border: `2px solid ${COLORS.bg}`,
        }} />
      )}
      <style>{`
        @keyframes lf-assistant-ring {
          0%   { opacity: .85; transform: scale(1); }
          70%  { opacity: 0;   transform: scale(1.5); }
          100% { opacity: 0;   transform: scale(1.5); }
        }
        .lf-assistant-ring { animation: lf-assistant-ring 2.2s ease-out 3; }
        @media (prefers-reduced-motion: reduce) {
          .lf-assistant-ring { animation: none; }
        }
      `}</style>
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

// The button the AI's answer earns.
//
// IntentCTA above is the free tier's keyword guess: it knows a document
// type and nothing else, so the user still lands on an empty form. This
// one carries the particulars the assistant just heard back from the
// user's own message, so the form opens already filled.
//
// It is an offer, never a jump. The assistant is sometimes wrong, and a
// panel that navigates on its own would throw away whatever the user was
// in the middle of doing to act on a guess.
function ActionCTA({ action, onGo }) {
  return (
    <div style={{
      marginTop: 8,
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      background: 'rgba(212,160,23,0.08)',
      border: '1px solid rgba(212,160,23,0.25)',
    }}>
      <div style={{ fontSize: 12.5, color: COLORS.inkMuted, marginBottom: 8 }}>
        {action.detail}
      </div>
      <button
        type="button"
        onClick={() => onGo(action.href)}
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
        {action.label} →
      </button>
      <div style={{ fontSize: 10.5, color: COLORS.inkFaint, marginTop: 7 }}>
        Opens with what you told me already filled in. Check every field
        before you file.
      </div>
    </div>
  )
}

// What the assistant opens with, and what it offers to do first.
//
// A student is not asked what notice they want to send, and an advocate
// is not offered a quiz. One assistant, three first sentences — because
// the opening line is the only part most people read before deciding
// whether this thing is for them.
// What the FREE tier is offered instead.
//
// The picks below are written for the model, and the free tier does not
// reach the model — it matches keywords and jumps to the right form. So
// a free user clicking "A cheque for Rs 4,50,000 was returned for
// insufficient funds" would be told it is a Pro feature. Seven of the
// eight behaved that way: the panel opens itself on somebody's first
// login, offers four things, and every one is locked.
//
// These are phrased to hit the matcher, so a click actually opens the
// right draft. Free is a real tier and its first minute should work.
const FREE_PICKS = [
  ['Legal notice', 'I need to send a legal notice'],
  ['Cheque bounce', 'A cheque bounced and I need a notice under Section 138'],
  ['Rent agreement', 'I need a rent agreement'],
  ['Bail application', 'I need a bail application'],
]

const OPENING = {
  student: {
    line: (n) => `Hi ${n} — what are you working on?`,
    body: 'Tell me in your own words. A document for your drafting file, a moot problem, a judgment you have to comment on, or a topic you are revising — I will answer, then open the right page with your details already filled in.',
    picks: [
      ['Draft for my file', 'I need to draft a legal notice for my DPC file'],
      ['Moot problem', 'I have a moot problem on the right to privacy and I am for the petitioner'],
      ['Explain a doctrine', 'Explain the doctrine of basic structure'],
      ['Quiz me', 'Quiz me on the Bharatiya Nyaya Sanhita 2023'],
    ],
  },
  faculty: {
    line: (n) => `Hi ${n} — what can I set up for you?`,
    body: 'A model answer for an exercise you are setting, a quiz on any topic, a judgment read and commented on, or a check on how a case has been treated since. Ask in plain words.',
    picks: [
      ['Model answer', 'Draft a model demand notice under Section 138 NI Act for a cheque of Rs 4,50,000'],
      ['Set a quiz', 'Quiz on the doctrine of basic structure, 10 questions'],
      ['Explain for class', 'Explain when Section 138 NI Act applies to a friendly loan'],
      ['Check a judgment', 'Find judgments on Section 45 PMLA twin conditions'],
    ],
  },
  advocate: {
    line: (n) => `Hi ${n} — what has happened?`,
    body: 'Describe the matter in your own words. I will tell you which Act and sections apply, and then open the right document with the particulars you have just given me already filled in.',
    picks: [
      ['A cheque bounced', 'A cheque for Rs 4,50,000 was returned for insufficient funds last week'],
      ['I received an order', 'I received a court order yesterday and need to know what it requires'],
      ['Which Act applies', 'My tenant will not vacate after the lease ended — which Act applies?'],
      ['Find a judgment', 'Find judgments on anticipatory bail under BNSS Section 482'],
    ],
  },
}

// Shown once per browser. The assistant is the fastest way into every
// other part of the app and most people never notice a button in the
// corner — so it introduces itself, once, and then never again.
const GREETED_KEY = 'lf.assistant.greeted.v1'

// The four openings offered before anybody types. Each sends a full
// sentence rather than a keyword, because the assistant routes on what
// happened — "a cheque bounced last week for Rs 4,50,000" carries the
// facts it needs to prefill; "cheque bounce" carries none of them.
function StarterPicks({ picks, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
      {picks.map(([label, prompt]) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(prompt)}
          title={prompt}
          style={{
            padding: '6px 11px',
            borderRadius: 20,
            border: '1px solid rgba(212,160,23,0.3)',
            background: 'rgba(212,160,23,0.06)',
            color: COLORS.gold,
            fontSize: 12,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function AssistantWidget({ isPro = false, userName = 'friend', audience = 'advocate' }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const router = useRouter()

  const first = prettyName(userName)

  const opening = OPENING[audience] || OPENING.advocate

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: opening.line(first) + '\n\n' + opening.body +
          (isPro ? '' : '\n\nOn the free plan I match keywords and take you to the right form. Open-ended legal questions are a Pro feature.'),
      }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Open itself the first time somebody uses the app, and only then.
  //
  // The assistant is the fastest route into every other part of the
  // product — it answers, then hands over to the right page with the
  // particulars already carried across — and a button in the corner is
  // the single most ignored element on any page. So it introduces
  // itself once.
  //
  // ONCE. An assistant that reopens on every visit is one people learn
  // to close without reading, which is worse than never opening at all.
  // The flag is per browser: someone on a new device is new to it again,
  // which is the right side of that trade.
  //
  // The delay lets the page paint first. Arriving on top of a
  // half-rendered dashboard reads as a popup, not as a greeting.
  const [neverGreeted, setNeverGreeted] = useState(false)
  useEffect(() => {
    let seen = true
    try { seen = Boolean(window.localStorage.getItem(GREETED_KEY)) } catch { seen = true }
    if (seen) return

    setNeverGreeted(true)
    const t = setTimeout(() => {
      setOpen(true)
      try { window.localStorage.setItem(GREETED_KEY, String(Date.now())) } catch { /* private window */ }
      setNeverGreeted(false)
    }, 1100)
    return () => clearTimeout(t)
  }, [])

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

  // hrefs come from lib/assistant-actions.js, which refuses anything that
  // is not a same-site path. Re-checked here anyway: this is the one
  // place a model-influenced string becomes navigation.
  function goToAction(href) {
    if (typeof href !== 'string' || !href.startsWith('/')) return
    setOpen(false)
    router.push(href)
  }

  function pushMessage(msg) {
    setMessages(prev => [...prev, msg])
  }

  async function send(overrideText) {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    pushMessage({ role: 'user', text })
    setInput('')

    // Keyword matching is the FREE tier's answer: instant, costs nothing,
    // and lands the user on the right empty form.
    //
    // Pro deliberately skips it. Paying for reasoning and then being
    // intercepted by a substring match is the worst of both — "rent
    // agreement" would open a blank form when the same sentence, sent to
    // the model, comes back with the applicable Act, the notice period
    // that governs, and the form already filled from the facts given.
    if (!isPro) {
      const intent = detectIntent(text)
      if (intent) {
        pushMessage({ role: 'assistant', text: '', intent })
        if (!open) setHasUnread(true)
        return
      }
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
          // Keyword-CTA turns carry no prose (`text` is ''); sending them
          // as empty messages is rejected by some providers.
          messages: [...messages, { role: 'user', text }]
            .filter(m => m.text)
            .map(m => ({ role: m.role, content: m.text })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Assistant request failed')
      pushMessage({
        role: 'assistant',
        text: data.reply || "I couldn't come up with a response for that — try rephrasing?",
        action: data.action || null,
      })
    } catch (err) {
      pushMessage({ role: 'assistant', text: `Something went wrong reaching the assistant: ${err.message}` })
    } finally {
      setLoading(false)
      if (!open) setHasUnread(true)
    }
  }

  return (
    <>
      {!open && <FAB onClick={() => setOpen(true)} hasUnread={hasUnread} pulse={neverGreeted} />}

      {open && (
        <div
          role="dialog"
          aria-label="Case Assistant"
          className="lf-assistant-panel"
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
              <span style={{ color: COLORS.gold, display: 'flex' }}><Mark size={20} /></span>
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
            {messages.length <= 1 && <StarterPicks picks={isPro ? opening.picks : FREE_PICKS} onPick={send} />}

            {messages.map((m, i) => (
              <div key={i}>
                {m.text && <MessageBubble role={m.role}>{m.text}</MessageBubble>}
                {m.intent && <IntentCTA intent={m.intent} onNavigate={navigateToIntent} />}
                {m.action && <ActionCTA action={m.action} onGo={goToAction} />}
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
