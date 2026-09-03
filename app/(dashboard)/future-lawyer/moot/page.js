'use client'
import DownloadButtons from '@/components/DownloadButtons'
//
// /future-lawyer/moot — Moot Court Memorial Builder.
// Paste a moot problem, pick a side, AI drafts a memorial outline.
//
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import MootAuthorities from '@/components/MootAuthorities'

const SIDES = [
  { value: 'petitioner',  label: 'Petitioner / Applicant', accent: '#22C55E', icon: '⚖️' },
  { value: 'respondent',  label: 'Respondent / Defence',   accent: '#F97316', icon: '🛡️' },
  { value: 'prosecution', label: 'Prosecution',            accent: '#EF4444', icon: '⚔️' },
]

export default function MootBuilderPage() {
  const [problem,  setProblem]  = useState('')
  const [side,     setSide]     = useState('petitioner')
  const [moot,     setMoot]     = useState('')
  const [memorial, setMemorial] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const searchParams = useSearchParams()

  // ?prefill={"problem":"…","side":"…"} — sent by the Case Assistant.
  //
  // Fills the form but does NOT press Build. A memorial takes minutes,
  // and the problem text is long enough that it deserves a look before
  // it is spent — unlike the search pages, where re-running costs
  // nothing and the query is one line the user can see at a glance.
  useEffect(() => {
    const prefill = searchParams.get('prefill')
    if (!prefill) return
    try {
      const data = JSON.parse(prefill)
      if (typeof data?.problem === 'string') setProblem(data.problem)
      if (SIDES.some(x => x.value === data?.side)) setSide(data.side)
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    if (problem.trim().length < 60) {
      setError('Paste the full moot problem — at least a few sentences (60 characters minimum).')
      return
    }
    setError(''); setLoading(true); setMemorial('')
    try {
      const res = await fetch('/api/future-lawyer/moot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, side, moot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setMemorial(data.memorial || '')
    } catch (e) {
      setError(e?.message || 'Failed to build the memorial.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 6, fontSize: 12 }}>
        <Link href="/future-lawyer" style={{ color: '#7A7A7A', textDecoration: 'none' }}>← Future Lawyer</Link>
      </div>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', margin: 0, letterSpacing: '-0.5px' }}>
          ⚖️ Moot Court Memorial Builder
        </h1>
        <p style={{ color: '#7A7A7A', marginTop: 6, fontSize: 13.5, lineHeight: 1.6, maxWidth: 720 }}>
          Paste the moot problem, choose your side, and the AI drafts a full memorial outline —
          jurisdiction, facts, issues, arguments with statutes &amp; cases, and prayer. Use it as a
          scaffold; verify every citation before submission.
        </p>
      </header>

      {!memorial && (
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
          <label style={{ fontSize: 11, color: '#7A7A7A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Moot competition (optional)
          </label>
          <input
            type="text"
            value={moot}
            onChange={e => setMoot(e.target.value)}
            placeholder="e.g. NLSIR Trilegal IP Moot, 2026"
            style={{
              width: '100%', marginTop: 6, marginBottom: 16,
              background: '#0D0D0D', border: '1px solid #2A2A2A',
              borderRadius: 8, padding: '9px 12px',
              color: '#F0F0F0', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ fontSize: 11, color: '#7A7A7A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Side you are arguing for
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6, marginBottom: 16 }}>
            {SIDES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSide(s.value)}
                style={{
                  padding: '12px 10px',
                  background: side === s.value ? `${s.accent}15` : '#0D0D0D',
                  border: `1px solid ${side === s.value ? s.accent : '#2A2A2A'}`,
                  color: side === s.value ? s.accent : '#C0C0C0',
                  borderRadius: 10, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 11, color: '#7A7A7A', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Moot problem statement <span style={{ color: '#FF6B6B' }}>*</span>
          </label>
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="Paste the full moot proposition / fact pattern here…"
            rows={12}
            style={{
              width: '100%', marginTop: 6,
              background: '#0D0D0D', border: '1px solid #2A2A2A',
              borderRadius: 10, padding: '12px 14px',
              color: '#F0F0F0', fontSize: 13.5, lineHeight: 1.6,
              outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
          <div style={{ marginTop: 4, fontSize: 11, color: '#5A5A5A', textAlign: 'right' }}>
            {problem.length.toLocaleString()} chars
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
              color: '#EF4444', borderRadius: 10, fontSize: 12,
            }}>❌ {error}</div>
          )}

          <button
            onClick={generate}
            disabled={loading || problem.trim().length < 60}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '13px',
              background: loading || problem.trim().length < 60
                ? '#1C1C1C'
                : 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: loading || problem.trim().length < 60 ? '#5A5A5A' : '#0D0D0D',
              border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700,
              cursor: loading || problem.trim().length < 60 ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⚙ Drafting memorial — this may take ~30 seconds…' : '✨ Build Memorial Outline'}
          </button>
        </div>
      )}

      {memorial && (
        <div>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 10, color: '#22C55E',
            fontSize: 12, marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ✅ Memorial outline generated for the <strong>{SIDES.find(s => s.value === side)?.label}</strong>
            {moot && <span style={{ color: '#7A7A7A', marginLeft: 6 }}>· {moot}</span>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <DownloadButtons
              title={moot ? `Memorial — ${moot}` : 'Moot memorial outline'}
              content={memorial}
            />
          </div>

          <div style={{
            background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12,
            padding: '24px 26px', maxHeight: 620, overflowY: 'auto',
            whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.85,
            color: '#E0E0E0', fontFamily: 'Georgia, serif',
          }}>
            {memorial}
          </div>

          <MootAuthorities memorial={memorial} />

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button onClick={() => navigator.clipboard.writeText(memorial)}
              style={{ padding: '10px 16px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, color: '#C0C0C0', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              📋 Copy
            </button>
            <button onClick={() => { setMemorial(''); setProblem(''); setError('') }}
              style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, color: '#9A9A9A', fontSize: 12, cursor: 'pointer' }}>
              ↩ Draft another
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: 22,
        padding: '12px 16px',
        background: '#0F0F0F',
        border: '1px solid #1C1C1C',
        borderRadius: 10,
        fontSize: 12, color: '#7A7A7A', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#22C55E' }}>Heads-up:</strong> AI memorials are scaffolds, not
        submission-ready briefs. Always verify every section number and case citation against the
        bare act and the official SCC/AIR reporter before submission.
      </div>
    </div>
  )
}
