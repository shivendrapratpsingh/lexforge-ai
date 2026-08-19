'use client'

import { useMemo, useState } from 'react'
import { extractPropositions } from '@/lib/moot-placeholders'

// ─────────────────────────────────────────────────────────────────
//  Filling the holes the memorial leaves on purpose.
//
//  The builder writes [FIND AUTHORITY — proposition] rather than
//  inventing a case, because a fabricated citation is the one mistake a
//  moot bench always catches. Honest, but it left the student with a
//  list of holes and no help.
//
//  This pulls each proposition out of the memorial text and searches the
//  real judgment databases for it. Everything shown here was reported by
//  a court; nothing on this panel is generated.
// ─────────────────────────────────────────────────────────────────

const COURTS = [
  { value: '', label: 'Every court' },
  { value: 'supremecourt', label: 'Supreme Court only' },
  { value: 'highcourts', label: 'High Courts only' },
]

export default function MootAuthorities({ memorial }) {
  const propositions = useMemo(() => extractPropositions(memorial), [memorial])
  const [court, setCourt] = useState('')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (!propositions.length) return null

  async function find() {
    setBusy(true); setErr(''); setData(null)
    try {
      const r = await fetch('/api/future-lawyer/moot/authorities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propositions, court: court || undefined }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setData(j)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{
      marginTop: 18, background: '#111', border: '1px solid #2A2A2A',
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '1.6px', fontWeight: 800, textTransform: 'uppercase' }}>
        Authorities to find
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0', margin: '7px 0 0' }}>
        {propositions.length} proposition{propositions.length === 1 ? '' : 's'} needs a case
      </h3>
      <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.7, margin: '6px 0 14px', maxWidth: '68ch' }}>
        The memorial marked these rather than inventing a citation for them.
        Search the real databases and pick the authority yourself — which is
        the part of mooting that is actually being marked.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <select value={court} onChange={e => setCourt(e.target.value)} style={{
          background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 9,
          padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none',
        }}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button type="button" onClick={find} disabled={busy} style={{
          padding: '10px 18px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
          fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
        }}>
          {busy ? 'Searching…' : 'Find real authorities'}
        </button>
      </div>

      {err && (
        <div style={{
          background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)',
          color: '#FF8A80', padding: '11px 14px', borderRadius: 9, fontSize: 13, lineHeight: 1.6,
        }}>{err}</div>
      )}

      {!data && !err && (
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {propositions.map((p, i) => (
            <li key={i} style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.6 }}>{p}</li>
          ))}
        </ol>
      )}

      {data && (
        <>
          <div style={{
            background: 'rgba(212,160,23,.07)', border: '1px solid rgba(212,160,23,.25)',
            color: '#D4A017', padding: '11px 14px', borderRadius: 9, fontSize: 12.5,
            lineHeight: 1.65, marginBottom: 14,
          }}>{data.note}</div>

          {data.authorities.map((a, i) => (
            <div key={i} style={{ borderTop: '1px solid #1F1F1F', paddingTop: 14, marginTop: 14 }}>
              <div style={{ fontSize: 13.5, color: '#F0E4C0', fontWeight: 700, lineHeight: 1.55 }}>{a.proposition}</div>

              {a.relaxed && (
                <div style={{ fontSize: 11.5, color: '#6A6A6A', marginTop: 4 }}>
                  Nothing matched the whole proposition, so this searched for “{a.searchedFor}”.
                </div>
              )}

              {a.results.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#8A8A8A', marginTop: 7, lineHeight: 1.65 }}>
                  {a.error || 'Nothing found. Narrow the proposition to the legal point — a search wants the doctrine, not the sentence.'}
                </div>
              ) : (
                a.results.map((r, j) => (
                  <div key={j} style={{ marginTop: 10, paddingLeft: 12, borderLeft: '2px solid #2A2415' }}>
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#D4A017', fontWeight: 700, textDecoration: 'none', lineHeight: 1.5 }}>
                      {r.title}
                    </a>
                    <div style={{ fontSize: 11.5, color: '#7A7A7A', marginTop: 3 }}>
                      {[r.court, r.date, r.citation].filter(Boolean).join(' · ')}
                    </div>
                    {r.snippet && (
                      <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 5, lineHeight: 1.6 }}>{r.snippet}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
