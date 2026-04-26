'use client'
import { useState } from 'react'

const SECTION_CONFIG = [
  { key: 'positiveArguments',      label: '⚖️ Positive Legal Arguments',      color: '#4CAF50' },
  { key: 'factualStrengths',       label: '💪 Factual Strengths',              color: '#2196F3' },
  { key: 'proceduralAdvantages',   label: '📋 Procedural Advantages',          color: '#9C27B0' },
  { key: 'relevantPrecedents',     label: '📚 Relevant Precedents & Case Laws', color: '#FF9800' },
  { key: 'suggestedAdditions',     label: '✍️ Suggested Additions to Document', color: '#D4A017' },
  { key: 'riskAssessment',         label: '⚠️ Risk Assessment & Mitigation',    color: '#F44336' },
]

function parseAnalysis(raw) {
  if (!raw) return null
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch {}
    // Try to parse as structured text
    return { raw }
  }
  return null
}

function SectionBlock({ label, color, items }) {
  const [open, setOpen] = useState(true)
  if (!items) return null
  const list = Array.isArray(items) ? items : typeof items === 'string' ? [items] : Object.entries(items).map(([k,v]) => `${k}: ${v}`)
  if (!list.length) return null

  return (
    <div style={{ marginBottom: 14, border: `1px solid ${color}22`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: `${color}11`, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
        <span style={{ color, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '12px 14px', background: '#0D0D0D' }}>
          {list.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < list.length - 1 ? 9 : 0 }}>
              <span style={{ color, flexShrink: 0, marginTop: 2, fontSize: 12 }}>•</span>
              <span style={{ fontSize: 13, color: '#B0B0B0', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PositivePointsPanel({ draftId, caseDetails, documentType, court, savedAnalysis }) {
  const [analysis,  setAnalysis]  = useState(() => parseAnalysis(savedAnalysis))
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [saved,     setSaved]     = useState(!!savedAnalysis)

  const parsed = analysis

  async function runAnalysis() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/analyze/positive', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ draftId, caseDetails, documentType, court }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      const parsed = parseAnalysis(data.analysis)
      setAnalysis(parsed)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Case Strength Analysis</div>
          <div style={{ fontSize: 13, color: '#5A5A5A' }}>AI-powered positive points & strategic suggestions</div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{ background: loading ? '#1C1C1C' : 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: 10, padding: '10px 18px', color: loading ? '#5A5A5A' : '#0D0D0D', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', minWidth: 130 }}>
          {loading ? '⏳ Analyzing...' : parsed ? '🔄 Re-Analyze' : '⚡ Analyze Case'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#EF4444' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ padding: '30px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontSize: 14, color: '#5A5A5A', marginBottom: 6 }}>Analyzing case details...</div>
          <div style={{ fontSize: 12, color: '#3A3A3A' }}>Reviewing arguments, precedents, and strategic angles</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !parsed && (
        <div style={{ padding: '30px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#5A5A5A', marginBottom: 6 }}>No analysis yet</div>
          <div style={{ fontSize: 12, color: '#3A3A3A' }}>Click "Analyze Case" to identify positive arguments, precedents, and strategic suggestions for this document</div>
        </div>
      )}

      {/* Analysis results */}
      {!loading && parsed && (
        <div>
          {saved && (
            <div style={{ fontSize: 11, color: '#4CAF50', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span><span>Analysis saved to document</span>
            </div>
          )}

          {/* Raw text fallback */}
          {parsed.raw ? (
            <div style={{ background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 10, padding: 16, fontSize: 13, color: '#B0B0B0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {parsed.raw}
            </div>
          ) : (
            <>
              {/* Summary bar */}
              {(parsed.overallStrength || parsed.summary) && (
                <div style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                  {parsed.overallStrength && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: parsed.summary ? 8 : 0 }}>
                      <span style={{ fontSize: 13, color: '#8A8A8A' }}>Overall Case Strength</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#D4A017' }}>{parsed.overallStrength}</span>
                    </div>
                  )}
                  {parsed.summary && <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.6, margin: 0 }}>{parsed.summary}</p>}
                </div>
              )}

              {SECTION_CONFIG.map(({ key, label, color }) =>
                parsed[key] ? (
                  <SectionBlock key={key} label={label} color={color} items={parsed[key]} />
                ) : null
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
