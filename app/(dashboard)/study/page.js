'use client'
import { useSearchParams } from 'next/navigation'
import DownloadButtons from '@/components/DownloadButtons'
import FolderUploader from '@/components/FolderUploader'
//
// /study — student section of LexForge AI.
// Four tabs: Landmark Judgments • Legal Principles • AI Tutor • Quiz.
// All seed data ships with the page; the AI tabs (Tutor + Quiz) hit
// dedicated server endpoints under /api/study/*.
//
// This is intentionally a single client component so the entire study
// experience renders without a full page transition.
//
import { useEffect, useState, useMemo } from 'react'
import { LANDMARK_JUDGMENTS, LEGAL_PRINCIPLES } from '@/lib/study-content'

const TABS = [
  { key: 'judgments',  label: 'Landmark Judgments', icon: '⚖️' },
  { key: 'principles', label: 'Legal Principles',   icon: '📜' },
  { key: 'tutor',      label: 'AI Tutor',           icon: '🎓' },
  { key: 'quiz',       label: 'Quiz & Flashcards',  icon: '🃏' },
]

export default function StudyPage() {
  const searchParams = useSearchParams()

  // ?topic=&tab=tutor|quiz — sent by the Case Assistant when the user is
  // revising rather than litigating. Read once, on mount; re-reading
  // would take the tab away from them mid-session.
  const [tab, setTab] = useState('judgments')
  const [seedTopic, setSeedTopic] = useState('')

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && TABS.some(x => x.key === t)) setTab(t)
    const topic = searchParams.get('topic')
    if (topic) {
      setSeedTopic(topic)
      // A topic with no tab named is a question, not a quiz request.
      if (!t) setTab('tutor')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F0F0F0', margin: 0, letterSpacing: '-0.5px' }}>
          📚 Study & Learn
        </h1>
        <p style={{ color: '#7A7A7A', marginTop: 6, fontSize: 14 }}>
          Curated landmark judgments, legal doctrines, and AI-powered exam prep — for law students,
          aspiring lawyers, and curious citizens.
        </p>
      </header>

      <div style={{
        display: 'flex', gap: 6,
        background: '#0F0F0F',
        border: '1px solid #1C1C1C',
        borderRadius: 12,
        padding: 6,
        marginBottom: 22,
        flexWrap: 'wrap',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              minWidth: 130,
              padding: '11px 14px',
              border: '1px solid transparent',
              borderRadius: 9,
              background: tab === t.key ? 'rgba(212,160,23,0.12)' : 'transparent',
              borderColor: tab === t.key ? 'rgba(212,160,23,0.3)' : 'transparent',
              color: tab === t.key ? '#D4A017' : '#A0A0A0',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'judgments'  && <JudgmentsTab />}
      {tab === 'principles' && <PrinciplesTab />}
      {tab === 'tutor'      && <TutorTab key={seedTopic} seed={seedTopic} />}
      {tab === 'quiz'       && <QuizTab key={seedTopic} seed={seedTopic} />}
    </div>
  )
}

// ─── Common card styles ──────────────────────────────────────────
const cardStyle = {
  background: '#0F0F0F',
  border: '1px solid #1C1C1C',
  borderRadius: 12,
  padding: '18px 20px',
  marginBottom: 12,
}
const labelStyle = { fontSize: 10, color: '#D4A017', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }
const subtleText = { color: '#7A7A7A', fontSize: 13, lineHeight: 1.55 }
const bodyText   = { color: '#D0D0D0', fontSize: 14, lineHeight: 1.6 }

// ─── Comment on a judgment the student brings in ─────────────────
//
//  The 28 judgments below this are the ones everybody already has a
//  brief for. The case a student is actually set for a comment is
//  usually not one of them — it is whatever their professor handed
//  out on Monday. That case is the one they need help with, and until
//  now the app had nothing to say about it.
//
//  Upload it, and it is read and commented on in the same shape as the
//  landmark cases, with the sections a comment needs that a summary
//  does not: how the court reasoned, what was obiter, who dissented,
//  and what the judgment can fairly be criticised for.
function YourCaseComment() {
  const [text, setText] = useState('')
  const [fileNote, setFileNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)
  const [sampled, setSampled] = useState(false)
  const [open, setOpen] = useState(false)

  async function run() {
    if (!text.trim() || busy) return
    setBusy(true); setErr(''); setResult(null)
    try {
      const r = await fetch('/api/study/case-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not produce a case comment.')
      setResult(j.comment)
      setSampled(Boolean(j.sampled))
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  function reset() {
    setResult(null); setText(''); setFileNote(''); setErr('')
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div style={{ ...cardStyle, borderColor: 'rgba(212,160,23,0.28)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={labelStyle}>Your own case</div>
          <h3 style={{ color: '#F0F0F0', margin: '4px 0 6px', fontSize: 17, fontWeight: 700 }}>
            Comment on a judgment you have been set
          </h3>
          <div style={{ ...subtleText, fontSize: 12.5, maxWidth: 620 }}>
            Upload the judgment — PDF or Word — or paste its text. You get back the
            same sections as the cases below, plus the reasoning, the obiter, the
            dissent and a critique.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            padding: '8px 14px', flexShrink: 0,
            background: open ? '#D4A017' : 'transparent',
            color: open ? '#0D0D0D' : '#D4A017',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {open ? 'Close' : 'Upload a case'}
        </button>
      </div>

      {open && !result && (
        <div style={{ marginTop: 16, paddingTop: 15, borderTop: '1px solid #1C1C1C' }}>
          <FolderUploader
            hint="Choose the judgment file — a single PDF or Word file is best."
            onText={(combined, files) => {
              setText(combined || '')
              const n = Array.isArray(files) ? files.filter(f => f?.name).length : 0
              setFileNote(n ? `${n} file${n === 1 ? '' : 's'} read` : '')
              setErr('')
            }}
          />

          <div style={{ ...subtleText, fontSize: 11.5, margin: '14px 0 6px' }}>
            …or paste the judgment text here
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setFileNote('') }}
            rows={5}
            placeholder="Paste the full text of the judgment…"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '11px 13px',
              background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: 9,
              color: '#E0E0E0', fontSize: 12.5, fontFamily: 'inherit',
              resize: 'vertical', outline: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={run}
              disabled={busy || !text.trim()}
              style={{
                padding: '10px 18px', borderRadius: 9, border: 'none',
                background: busy || !text.trim() ? '#2A2A2A' : '#D4A017',
                color: busy || !text.trim() ? '#6A6A6A' : '#0D0D0D',
                fontWeight: 800, fontSize: 13,
                cursor: busy || !text.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Reading the judgment…' : 'Write the case comment'}
            </button>
            <span style={{ ...subtleText, fontSize: 11.5 }}>
              {fileNote && fileNote + ' · '}
              {words ? words.toLocaleString('en-IN') + ' words' : 'nothing loaded yet'}
            </span>
          </div>

          {busy && (
            <div style={{ ...subtleText, fontSize: 11.5, marginTop: 10, lineHeight: 1.6 }}>
              A full judgment takes a while to read properly — usually under a
              minute. Leave this open.
            </div>
          )}
          {err && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8,
              background: 'rgba(200,80,70,0.08)', border: '1px solid rgba(200,80,70,0.3)',
              color: '#E0A69E', fontSize: 12.5, lineHeight: 1.55 }}>
              {err}
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16, paddingTop: 15, borderTop: '1px solid #1C1C1C' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              {result.area && <div style={labelStyle}>{result.area}</div>}
              <h3 style={{ color: '#F0F0F0', margin: '4px 0 6px', fontSize: 17, fontWeight: 700 }}>{result.name}</h3>
              <div style={{ ...subtleText, fontSize: 12 }}>
                {[result.year, result.court].filter(Boolean).join(' • ')}
              </div>
              {result.citation && (
                <div style={{ ...subtleText, fontSize: 12, color: '#9A9A9A', marginTop: 4 }}>📑 {result.citation}</div>
              )}
            </div>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '8px 14px', flexShrink: 0, background: 'transparent',
                color: '#D4A017', border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Another case
            </button>
          </div>

          {/* Order follows how a comment is actually written: what
              happened, what was asked, what was decided, what binds,
              and only then the analysis. */}
          <Field label="Facts"            body={result.facts} />
          <Field label="Issues"           body={result.issue} />
          <Field label="Holding"          body={result.holding} />
          <Field label="Ratio Decidendi"  body={result.ratio} highlight />
          <Field label="How the court reasoned" body={result.reasoning} />
          <Field label="Obiter Dicta"     body={result.obiter} />
          <Field label="Dissent"          body={result.dissent} />
          <Field label="Authorities relied on" body={result.authorities} />
          <Field label="Critique"         body={result.critique} />
          <Field label="Why it matters"   body={result.importance} />
          <Field label="In the exam"      body={result.examFocus} />

          <div style={{ ...subtleText, fontSize: 11, marginTop: 14, paddingTop: 12,
            borderTop: '1px solid #1C1C1C', lineHeight: 1.6 }}>
            Written only from the judgment you uploaded. Where the text did not say
            something, it says so rather than filling the gap.
            {sampled && ' Free accounts read the judgment in samples rather than in full, so long judgments are covered less closely — Pro reads far more of it.'}
            {' '}Read the judgment yourself before you rely on this in a viva.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Judgments tab ───────────────────────────────────────────────
function JudgmentsTab() {
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const filtered = useMemo(() => {
    if (!q) return LANDMARK_JUDGMENTS
    const s = q.toLowerCase()
    return LANDMARK_JUDGMENTS.filter(j =>
      j.name.toLowerCase().includes(s) ||
      j.area.toLowerCase().includes(s) ||
      j.ratio.toLowerCase().includes(s) ||
      j.facts.toLowerCase().includes(s)
    )
  }, [q])

  return (
    <div>
      <YourCaseComment />
      <SearchBox value={q} onChange={setQ} placeholder="Search by case name, area, doctrine, fact pattern…" />
      <div style={{ ...subtleText, marginBottom: 12 }}>
        {filtered.length} of {LANDMARK_JUDGMENTS.length} judgments
      </div>
      {filtered.map(j => (
        <div key={j.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>{j.area}</div>
              <h3 style={{ color: '#F0F0F0', margin: '4px 0 6px', fontSize: 17, fontWeight: 700 }}>{j.name}</h3>
              <div style={{ ...subtleText, fontSize: 12 }}>{j.year} • {j.court}</div>
              <div style={{ ...subtleText, fontSize: 12, color: '#9A9A9A', marginTop: 4 }}>📑 {j.citation}</div>
            </div>
            <button
              onClick={() => setOpenId(openId === j.id ? null : j.id)}
              style={{
                padding: '8px 14px',
                background: openId === j.id ? '#D4A017' : 'transparent',
                color:       openId === j.id ? '#0D0D0D' : '#D4A017',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {openId === j.id ? 'Close' : 'Read brief'}
            </button>
          </div>
          {openId === j.id && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1C1C1C' }}>
              <Field label="Facts"      body={j.facts} />
              <Field label="Issue"      body={j.issue} />
              <Field label="Holding"    body={j.holding} />
              <Field label="Ratio Decidendi" body={j.ratio} highlight />
              <Field label="Why it matters"  body={j.importance} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Principles tab ──────────────────────────────────────────────
function PrinciplesTab() {
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const filtered = useMemo(() => {
    if (!q) return LEGAL_PRINCIPLES
    const s = q.toLowerCase()
    return LEGAL_PRINCIPLES.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.area.toLowerCase().includes(s) ||
      p.definition.toLowerCase().includes(s) ||
      (p.application || '').toLowerCase().includes(s)
    )
  }, [q])

  return (
    <div>
      <SearchBox value={q} onChange={setQ} placeholder="Search by doctrine, area, or keyword…" />
      <div style={{ ...subtleText, marginBottom: 12 }}>
        {filtered.length} of {LEGAL_PRINCIPLES.length} doctrines
      </div>
      {filtered.map(p => (
        <div key={p.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>{p.area}</div>
              <h3 style={{ color: '#F0F0F0', margin: '4px 0 4px', fontSize: 17, fontWeight: 700 }}>{p.name}</h3>
              <div style={{ ...subtleText, fontSize: 12 }}>📌 Origin: {p.originCase}</div>
            </div>
            <button
              onClick={() => setOpenId(openId === p.id ? null : p.id)}
              style={{
                padding: '8px 14px',
                background: openId === p.id ? '#D4A017' : 'transparent',
                color:       openId === p.id ? '#0D0D0D' : '#D4A017',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {openId === p.id ? 'Close' : 'Explain'}
            </button>
          </div>
          {openId === p.id && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1C1C1C' }}>
              <Field label="Definition" body={p.definition} highlight />
              {p.elements?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={labelStyle}>Elements</div>
                  <ul style={{ marginTop: 4, paddingLeft: 22 }}>
                    {p.elements.map((e, i) => <li key={i} style={bodyText}>{e}</li>)}
                  </ul>
                </div>
              )}
              {p.application && <Field label="Application" body={p.application} />}
              {p.pitfalls    && <Field label="Pitfalls / Nuances" body={p.pitfalls} />}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── AI Tutor tab ────────────────────────────────────────────────
function TutorTab({ seed = '' }) {
  const [question, setQuestion] = useState(seed)
  const [loading, setLoading]   = useState(false)
  const [history, setHistory]   = useState([])  // [{ q, a }]
  const [error, setError]       = useState('')

  async function ask() {
    if (!question.trim() || loading) return
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/study/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Tutor failed')
      setHistory(h => [{ q: question.trim(), a: data.answer }, ...h])
      setQuestion('')
    } catch (e) {
      setError(e.message || 'Failed to get answer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={cardStyle}>
        <div style={labelStyle}>Ask the AI Tutor</div>
        <div style={{ ...subtleText, margin: '4px 0 12px' }}>
          Ask anything about Indian law — case names, doctrines, "what is the ratio in…", "explain Article 21",
          "difference between BNS Section 103 and IPC 302". Answers cite real provisions and cases.
        </div>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ask() }}
          placeholder='e.g. "Explain the basic structure doctrine and the cases that built it."'
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 14px',
            background: '#0A0A0A',
            border: '1px solid #1F1F1F',
            borderRadius: 9,
            color: '#E0E0E0',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 12 }}>
          <span style={{ fontSize: 11, color: '#5A5A5A' }}>Tip: Ctrl/Cmd + Enter to send</span>
          <button
            onClick={ask} disabled={loading || !question.trim()}
            style={{
              padding: '10px 20px',
              background: loading ? '#3A3A3A' : 'linear-gradient(135deg, #D4A017, #B8860B)',
              color: '#0D0D0D',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 800,
              cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
              opacity: !question.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        {error && <div style={{ color: '#FF6B6B', marginTop: 10, fontSize: 13 }}>⚠ {error}</div>}
      </div>

      {history.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <DownloadButtons
            compact
            title="Tutor session"
            content={() => history
              .map(h => ['QUESTION', h.q, '', 'TUTOR', h.a, ''].join(String.fromCharCode(10)))
              .join(String.fromCharCode(10) + String.fromCharCode(10))}
          />
        </div>
      )}
      {history.map((h, i) => (
        <div key={i} style={cardStyle}>
          <div style={{ ...labelStyle, color: '#9A9A9A' }}>Question</div>
          <div style={{ ...bodyText, color: '#F0F0F0', fontWeight: 600, marginBottom: 10 }}>{h.q}</div>
          <div style={labelStyle}>Tutor</div>
          <pre style={{ ...bodyText, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, marginTop: 4 }}>{h.a}</pre>
        </div>
      ))}
    </div>
  )
}

// A quiz as a handout: questions first, answers at the end, so it can be
// printed and given out without giving the answers away at the same time.
function quizText(topic, mode, items) {
  const N = String.fromCharCode(10)
  if (!items?.length) return ''
  const head = [topic ? `QUIZ — ${topic}` : 'QUIZ', mode === 'mcq' ? 'Multiple choice' : 'Flashcards', '']
  if (mode !== 'mcq') {
    return [...head, ...items.flatMap((it, i) =>
      [`${i + 1}. ${it.front || it.q || ''}`, `   ${it.back || it.a || ''}`, ''])].join(N)
  }
  const qs = items.flatMap((it, i) => [
    `${i + 1}. ${it.q || it.question || ''}`,
    ...(it.options || []).map((o, n) => `   ${String.fromCharCode(65 + n)}. ${o}`),
    '',
  ])
  const answers = ['', 'ANSWERS', ...items.map((it, i) =>
    `${i + 1}. ${it.answer || ''}${it.explanation ? ` — ${it.explanation}` : ''}`)]
  return [...head, ...qs, ...answers].join(N)
}

// ─── Quiz tab ────────────────────────────────────────────────────
function QuizTab({ seed = '' }) {
  const [topic, setTopic]   = useState(seed)
  const [count, setCount]   = useState(5)
  const [mode, setMode]     = useState('mcq')          // 'mcq' | 'flashcards'
  const [items, setItems]   = useState([])
  const [reveal, setReveal] = useState({})             // { idx: bool }
  const [picked, setPicked] = useState({})             // { idx: 'A'|'B'|… }
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function generate() {
    if (loading) return
    setError(''); setLoading(true); setItems([]); setReveal({}); setPicked({})
    try {
      const res = await fetch('/api/study/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Quiz failed')
      setItems(data.items || [])
    } catch (e) {
      setError(e.message || 'Failed to generate quiz.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={cardStyle}>
        <div style={labelStyle}>Generate {mode === 'mcq' ? 'MCQ Quiz' : 'Flashcards'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 200px', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <input
            value={topic} onChange={e => setTopic(e.target.value)}
            placeholder='Topic — e.g. "Article 21", "bail under CrPC", "contract"'
            style={{ padding: '10px 12px', background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: 8, color: '#E0E0E0', fontSize: 13 }}
          />
          <input
            type="number" min={3} max={10} value={count}
            onChange={e => setCount(Math.max(3, Math.min(10, Number(e.target.value) || 5)))}
            style={{ padding: '10px 12px', background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: 8, color: '#E0E0E0', fontSize: 13, textAlign: 'center' }}
          />
          <select
            value={mode} onChange={e => setMode(e.target.value)}
            style={{ padding: '10px 12px', background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: 8, color: '#E0E0E0', fontSize: 13 }}
          >
            <option value="mcq">MCQ Quiz</option>
            <option value="flashcards">Flashcards</option>
          </select>
        </div>
        <button
          onClick={generate} disabled={loading}
          style={{
            marginTop: 12,
            padding: '10px 20px',
            background: loading ? '#3A3A3A' : 'linear-gradient(135deg, #D4A017, #B8860B)',
            color: '#0D0D0D',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating…' : `Generate ${count}`}
        </button>
        {error && <div style={{ color: '#FF6B6B', marginTop: 10, fontSize: 13 }}>⚠ {error}</div>}
      </div>

      {items.length > 0 && (
        // A quiz is worth downloading precisely because it is disposable
        // on screen — a teacher wants it as a handout, and a student
        // wants it to revise from without regenerating it.
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <DownloadButtons
            compact
            title={topic ? `Quiz — ${topic}` : 'Quiz'}
            content={() => quizText(topic, mode, items)}
          />
        </div>
      )}

      {mode === 'mcq' && items.map((it, i) => {
        const correct = picked[i] && picked[i] === (it.answer?.[0] || it.answer)
        return (
          <div key={i} style={cardStyle}>
            <div style={labelStyle}>Question {i + 1}</div>
            <div style={{ ...bodyText, color: '#F0F0F0', fontWeight: 600, marginBottom: 12 }}>{it.question}</div>
            {(it.options || []).map((opt, oi) => {
              const letter = opt.match(/^[A-D]/)?.[0] || String.fromCharCode(65 + oi)
              const chosen = picked[i] === letter
              const isAns  = letter === (it.answer?.[0] || it.answer)
              const showStatus = picked[i]
              const bg = !showStatus ? '#0A0A0A'
                : (chosen && isAns)  ? 'rgba(76, 217, 100, 0.12)'
                : (chosen && !isAns) ? 'rgba(255, 107, 107, 0.12)'
                : (isAns)            ? 'rgba(76, 217, 100, 0.06)'
                                      : '#0A0A0A'
              return (
                <button
                  key={oi}
                  disabled={!!picked[i]}
                  onClick={() => setPicked(p => ({ ...p, [i]: letter }))}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px',
                    marginBottom: 6,
                    background: bg,
                    border: '1px solid ' + (chosen ? (isAns ? 'rgba(76,217,100,0.5)' : 'rgba(255,107,107,0.5)') : '#1F1F1F'),
                    borderRadius: 8,
                    color: '#D0D0D0',
                    cursor: picked[i] ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  {opt}
                </button>
              )
            })}
            {picked[i] && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: 8 }}>
                <div style={labelStyle}>{correct ? '✓ Correct' : '✗ Incorrect'} — Explanation</div>
                <div style={{ ...bodyText, marginTop: 4 }}>{it.explanation}</div>
              </div>
            )}
          </div>
        )
      })}

      {mode === 'flashcards' && items.map((it, i) => (
        <div key={i} style={cardStyle}>
          <div style={labelStyle}>Card {i + 1}</div>
          <div style={{ ...bodyText, color: '#F0F0F0', fontWeight: 600, fontSize: 16, marginTop: 4, marginBottom: 12 }}>{it.front}</div>
          {!reveal[i] ? (
            <button
              onClick={() => setReveal(r => ({ ...r, [i]: true }))}
              style={{
                padding: '8px 14px', background: 'transparent',
                color: '#D4A017', border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >Reveal answer</button>
          ) : (
            <div style={{ padding: '10px 12px', background: '#0A0A0A', border: '1px solid #1F1F1F', borderRadius: 8 }}>
              <div style={bodyText}>{it.back}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tiny helper components ──────────────────────────────────────
function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px',
        background: '#0A0A0A',
        border: '1px solid #1F1F1F',
        borderRadius: 9,
        color: '#E0E0E0',
        fontSize: 13,
        marginBottom: 12,
      }}
    />
  )
}

function Field({ label, body, highlight }) {
  // A generated comment can legitimately omit a section — an unanimous
  // bench has no dissent. A label with nothing under it reads as the
  // page having failed, so the whole field goes.
  if (!body || !String(body).trim()) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={labelStyle}>{label}</div>
      <div style={{
        ...bodyText,
        marginTop: 4,
        // These fields now carry several paragraphs, not one line.
        whiteSpace: 'pre-wrap',
        ...(highlight ? { padding: '8px 12px', background: 'rgba(212,160,23,0.06)', borderLeft: '2px solid #D4A017', borderRadius: 4 } : {}),
      }}>{body}</div>
    </div>
  )
}
