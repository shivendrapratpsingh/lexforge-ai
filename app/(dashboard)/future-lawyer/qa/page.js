'use client'
import DownloadButtons from '@/components/DownloadButtons'
//
// /future-lawyer/qa — AI legal question-and-answer for students.
// User types a question, gets a citation-backed answer from the AI.
// Keeps a session-local history of the last 8 Q&A pairs.
//
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const EXAMPLES = [
  'What is the doctrine of basic structure?',
  'Difference between Section 302 IPC and Section 304 IPC',
  'When can a writ of habeas corpus be issued?',
  'What is the procedure for anticipatory bail under BNSS?',
  'Explain the Puttaswamy judgment in 200 words',
]

export default function LegalQAPage() {
  const [question, setQuestion] = useState('')
  const [history,  setHistory]  = useState([]) // [{ q, a, t }]
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const taRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [history, loading])

  async function ask(q) {
    const text = (q ?? question).trim()
    if (!text || text.length < 5) {
      setError('Please type at least a few words.')
      return
    }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/future-lawyer/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setHistory(h => [...h, { q: text, a: data.answer || 'No answer.', t: new Date().toLocaleTimeString() }].slice(-8))
      setQuestion('')
      if (taRef.current) taRef.current.focus()
    } catch (e) {
      setError(e?.message || 'Failed to get an answer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 6, fontSize: 12 }}>
        <Link href="/future-lawyer" style={{ color: '#7A7A7A', textDecoration: 'none' }}>← Future Lawyer</Link>
      </div>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', margin: 0, letterSpacing: '-0.5px' }}>
          💬 AI Legal Q&A
        </h1>
        <p style={{ color: '#7A7A7A', marginTop: 6, fontSize: 13.5, lineHeight: 1.6, maxWidth: 700 }}>
          Ask any question on Indian law. The AI returns a structured answer with statutory references
          and leading judgments. Always verify citations against the bare act / official reporter.
        </p>
      </header>

      {history.length === 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: '#6A6A6A', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
            TRY AN EXAMPLE
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => { setQuestion(ex); ask(ex) }}
                disabled={loading}
                style={{
                  background: '#141414', border: '1px solid #2A2A2A',
                  borderRadius: 999, padding: '6px 12px',
                  color: '#C0C0C0', fontSize: 12, cursor: 'pointer',
                  textAlign: 'left',
                }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={listRef}
        style={{
          maxHeight: 540, overflowY: 'auto',
          marginBottom: 14,
          display: history.length || loading ? 'block' : 'none',
        }}>
        {history.length > 0 && (
          // The whole session, not one answer — a student revising wants
          // the questions they asked alongside what came back.
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <DownloadButtons
              compact
              title="Legal Q and A"
              content={() => history
                .map(h => ['QUESTION', h.q, '', 'ANSWER', h.a, ''].join(String.fromCharCode(10)))
                .join(String.fromCharCode(10) + String.fromCharCode(10))}
            />
          </div>
        )}
        {history.map((item, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{
              background: 'rgba(212,160,23,0.08)',
              border: '1px solid rgba(212,160,23,0.25)',
              borderRadius: 12,
              padding: '10px 14px',
              color: '#D4A017',
              fontSize: 13.5, lineHeight: 1.55,
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: '#A98019', marginBottom: 4 }}>YOU · {item.t}</div>
              {item.q}
            </div>
            <div style={{
              background: '#0F0F0F',
              border: '1px solid #2A2A2A',
              borderRadius: 12,
              padding: '14px 16px',
              color: '#E0E0E0',
              whiteSpace: 'pre-wrap',
              fontSize: 13.5, lineHeight: 1.7,
              fontFamily: 'Georgia, serif',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: '#7A7A7A', marginBottom: 6, fontFamily: 'system-ui' }}>AI ADVOCATE</div>
              {item.a}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            background: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 12,
            padding: '14px 16px', color: '#8A8A8A', fontSize: 13,
          }}>
            <span className="lf-pulse-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#D4A017', marginRight: 8, verticalAlign: 'middle' }} />
            Drafting answer with citations…
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginBottom: 12, padding: '9px 14px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
          color: '#EF4444', borderRadius: 10, fontSize: 12,
        }}>❌ {error}</div>
      )}

      <div style={{
        background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12,
        padding: 12, display: 'flex', gap: 10,
      }}>
        <textarea
          ref={taRef}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask() }
          }}
          placeholder="Ask anything — e.g. What is the doctrine of frustration under Section 56 ICA?"
          rows={2}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#F0F0F0', fontSize: 14, resize: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          style={{
            alignSelf: 'flex-end',
            background: loading || !question.trim()
              ? '#1C1C1C'
              : 'linear-gradient(135deg, #D4A017, #B8860B)',
            color: loading || !question.trim() ? '#5A5A5A' : '#0D0D0D',
            border: 'none', borderRadius: 9,
            padding: '10px 18px', fontSize: 13, fontWeight: 700,
            cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '⏳ Thinking…' : '✨ Ask'}
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: '#5A5A5A' }}>
        Tip: Ctrl/⌘ + Enter to submit
      </div>
    </div>
  )
}
