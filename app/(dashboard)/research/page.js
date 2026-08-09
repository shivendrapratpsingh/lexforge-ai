'use client'
import { useState } from 'react'
import { searchCaseLaws } from '@/lib/utils'

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(searchCaseLaws(''))
  const [issue, setIssue] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [cases, setCases] = useState([])
  const [caseLawStatus, setCaseLawStatus] = useState(null)
  const [err, setErr] = useState('')

  const handleSearch = v => { setQuery(v); setResults(searchCaseLaws(v)) }

  const handleAnalyze = async () => {
    if (!issue.trim()) return
    setAnalyzing(true); setAnalysis(''); setCases([]); setCaseLawStatus(null); setErr('')
    try {
      const res = await fetch(`/api/legal/analyze?issue=${encodeURIComponent(issue)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
      setCases(data.cases || [])
      setCaseLawStatus(data.caseLawStatus || null)
    } catch (e) { setErr(e.message || 'Analysis failed.') }
    finally { setAnalyzing(false) }
  }

  // Every authority the analysis may mention, with a link to its original
  // text. Nothing cited should be unverifiable by the person reading it.
  const SourceList = () => {
    if (!analysis) return null
    if (caseLawStatus !== 'ok' || cases.length === 0) {
      const why = {
        'unavailable': 'Case law search is not switched on for this deployment, so no judgments were retrieved.',
        'none-found': 'No judgments matched this issue in the case-law index.',
        'retrieval-failed': 'The case-law index could not be reached just now.',
      }[caseLawStatus] || 'No judgments were retrieved for this issue.'
      return (
        <div style={{
          marginTop: 16, padding: '13px 15px', borderRadius: 10,
          background: 'rgba(225,88,75,.07)', border: '1px solid rgba(225,88,75,.3)',
          fontSize: 12.5, color: '#FF9A8F', lineHeight: 1.6,
        }}>
          <b>No verified case law.</b> {why} The analysis above therefore cites
          no judgments &mdash; search case law directly before relying on any
          precedent.
        </div>
      )
    }
    return (
      <div style={{ marginTop: 18 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '1.4px',
          color: '#D4A017', textTransform: 'uppercase', marginBottom: 4,
        }}>
          Verified sources &mdash; {cases.length} judgment{cases.length === 1 ? '' : 's'}
        </div>
        <p style={{ fontSize: 11.5, color: '#6E6E68', lineHeight: 1.55, margin: '0 0 10px' }}>
          These were retrieved from the case-law index, not written by the AI.
          The analysis may discuss only these. Open any of them to read the
          original judgment.
        </p>
        {cases.map((c, i) => (
          <a key={i} href={c.sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #1F1F1F', textDecoration: 'none' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 13.5, color: '#F0E4C0', lineHeight: 1.4 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 11, color: '#8A7748', marginTop: 3 }}>
              {[c.court, c.date, c.citation].filter(Boolean).join(' · ')}
            </div>
          </a>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Legal Research</h1>
        <p style={{ color: '#5A5A5A', fontSize: 15 }}>Search landmark Indian case laws and analyze legal issues with AI</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Case Law Search */}
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>Case Law Database</h2>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#5A5A5A', fontSize: 16 }}>🔍</span>
            <input value={query} onChange={e => handleSearch(e.target.value)} placeholder="Search by name, principle, keywords..." style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 12px 12px 40px', color: '#F0F0F0', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#D4A017'}
              onBlur={e => e.target.style.borderColor = '#2A2A2A'}
            />
          </div>
          <p style={{ fontSize: 12, color: '#3A3A3A', marginBottom: 14 }}>{results.length} case{results.length !== 1 ? 's' : ''} found</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {results.map(cl => (
              <div key={cl.id} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#D0D0D0', lineHeight: 1.4 }}>{cl.name}</h3>
                  <span style={{ fontSize: 11, color: '#5A5A5A', flexShrink: 0 }}>{cl.year}</span>
                </div>
                <div style={{ fontSize: 11, color: '#D4A017', fontWeight: 600, marginBottom: 6 }}>{cl.citation}</div>
                <div style={{ fontSize: 12, color: '#6A6A6A', fontWeight: 600, marginBottom: 6 }}>{cl.principle}</div>
                <div style={{ fontSize: 12, color: '#5A5A5A', lineHeight: 1.6 }}>{cl.summary}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                  {cl.keywords.map(kw => (
                    <span key={kw} style={{ fontSize: 10, background: '#141414', border: '1px solid #2A2A2A', color: '#4A4A4A', padding: '2px 8px', borderRadius: 100 }}>{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>AI Legal Analysis</h2>
          <p style={{ fontSize: 13, color: '#5A5A5A', marginBottom: 16 }}>Describe a legal issue and get AI-powered analysis with laws and case citations</p>
          <textarea value={issue} onChange={e => setIssue(e.target.value)} placeholder="e.g., A tenant is refusing to vacate after lease expiry. What remedies are available under Indian law?" rows={6}
            style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '13px 16px', color: '#F0F0F0', fontSize: 14, outline: 'none', resize: 'vertical', marginBottom: 12 }}
            onFocus={e => e.target.style.borderColor = '#D4A017'}
            onBlur={e => e.target.style.borderColor = '#2A2A2A'}
          />
          <button onClick={handleAnalyze} disabled={analyzing || !issue.trim()}
            style={{ width: '100%', padding: '13px', background: analyzing || !issue.trim() ? '#1C1C1C' : 'linear-gradient(135deg, #D4A017, #B8860B)', color: analyzing || !issue.trim() ? '#4A4A4A' : '#0D0D0D', borderRadius: 10, fontSize: 15, fontWeight: 700, border: 'none', cursor: analyzing || !issue.trim() ? 'not-allowed' : 'pointer', marginBottom: 16, boxShadow: analyzing || !issue.trim() ? 'none' : '0 0 20px rgba(212,160,23,0.25)' }}
          >
            {analyzing ? '⚙ Analyzing...' : '🤖 Analyze with AI'}
          </button>

          {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{err}</div>}

          {analysis && (
            <div style={{ background: '#0D0D0D', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 12, padding: 20, maxHeight: 620, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>⚖ Analysis Result</div>
              <div style={{ fontSize: 13, color: '#C0C0C0', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{analysis}</div>
              <SourceList />
              <p style={{ fontSize: 11, color: '#5A5A5A', lineHeight: 1.6, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1F1F1F' }}>
                Always read the original judgment before relying on it. This is
                research assistance, not legal advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
