'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DOCUMENT_TYPES } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────
//  "Find cases like mine" — the first thing on the dashboard.
//
//  A lawyer types what the matter is about; the AI restates it as a
//  legal query, and the judgments come back ordered by the hierarchy
//  that actually matters to them: what binds them first, what is
//  merely persuasive last.
//
//  Two billed searches per run, so it never fires on its own — no
//  search-as-you-type, no prefetch. One deliberate press of a button.
// ─────────────────────────────────────────────────────────────────

const TIER_COLOR = {
  supreme:  '#D4A017',
  high:     '#60A5FA',
  tribunal: '#8B5CF6',
  other:    '#6E6E68',
}

const S = {
  input: {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10,
    padding: '11px 14px', color: '#F0F0F0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  label: {
    display: 'block', fontSize: 11.5, fontWeight: 700, color: '#8A8A8A',
    marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px',
  },
}

export default function RelevantCaseFinder({ isPro }) {
  const [open, setOpen] = useState(false)
  const [facts, setFacts] = useState('')
  const [relief, setRelief] = useState('')
  const [docType, setDocType] = useState('')
  const [acts, setActs] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState(null)

  async function go(e) {
    e.preventDefault()
    setBusy(true); setErr(null); setRes(null)
    try {
      const r = await fetch('/api/legal/relevant-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facts, reliefSought: relief, documentType: docType, actsInvolved: acts }),
      })
      const j = await r.json()
      if (!r.ok) throw Object.assign(new Error(j.error), { upgrade: j.upgrade })
      setRes(j)
    } catch (e) { setErr(e) } finally { setBusy(false) }
  }

  return (
    <div style={{
      background: 'linear-gradient(158deg,#161209 0%,#0F0D08 64%)',
      border: '1px solid rgba(212,160,23,0.28)', borderRadius: 16,
      padding: 20, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flex: 'none',
          background: 'rgba(212,160,23,0.10)', border: '1px solid rgba(212,160,23,0.25)',
          display: 'grid', placeItems: 'center', fontSize: 21,
        }}>🔍</div>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.6px', color: '#D4A017', textTransform: 'uppercase' }}>
            Find cases like mine
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#F0F0F0', margin: '3px 0 5px' }}>
            Describe your case, get the authorities
          </h2>
          <p style={{ fontSize: 13, color: '#A3A39C', lineHeight: 1.6, margin: 0 }}>
            Tell it what the matter is about in your own words. It works out the
            legal issue and finds the judgments that bear on it — Supreme Court
            first, then High Courts, then tribunals.
          </p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)}
            style={{
              padding: '11px 20px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
              border: 'none', cursor: 'pointer', flex: 'none',
              background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
            }}>
            {isPro ? 'Start' : 'Start (Pro)'}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={go} style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #241F14' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>What is the matter about?</label>
            <textarea
              value={facts} onChange={e => setFacts(e.target.value)} required rows={4}
              style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="e.g. My client issued a cheque for ₹4,00,000 which was dishonoured for insufficient funds. We sent notice within 30 days. The other side now claims the signature was forged and that there was no legally enforceable debt."
            />
            <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 7, lineHeight: 1.55 }}>
              Plain language is fine. Party names, dates and amounts are stripped
              out before searching — they narrow a case-law search to nothing.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', marginBottom: 16 }}>
            <div>
              <label style={S.label}>Relief sought (optional)</label>
              <input value={relief} onChange={e => setRelief(e.target.value)} style={S.input}
                placeholder="e.g. quashing of the complaint" />
            </div>
            <div>
              <label style={S.label}>Matter type (optional)</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={S.input}>
                <option value="">Not specified</option>
                {DOCUMENT_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Acts you have in mind (optional)</label>
              <input value={acts} onChange={e => setActs(e.target.value)} style={S.input}
                placeholder="e.g. Section 138 NI Act" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="submit" disabled={busy}
              style={{
                padding: '11px 22px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
                border: 'none', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
                background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
              }}>
              {busy ? 'Searching case law…' : 'Find relevant cases'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setRes(null); setErr(null) }}
              style={{
                padding: '11px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
                border: '1px solid #2E2718', background: 'transparent', color: '#9A8C6E', cursor: 'pointer',
              }}>
              Close
            </button>
          </div>

          {err && (
            <div style={{
              background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)',
              color: '#FF8A80', padding: '12px 15px', borderRadius: 10,
              fontSize: 13, lineHeight: 1.6, marginTop: 14,
            }}>
              {err.message}
              {err.upgrade && <> <Link href={err.upgrade} style={{ color: '#D4A017' }}>Upgrade to Pro →</Link></>}
            </div>
          )}

          {res && <Results res={res} />}
        </form>
      )}
    </div>
  )
}

function Results({ res }) {
  return (
    <div style={{ marginTop: 20 }}>
      {/* What it actually searched for. Shown because a lawyer must be
          able to judge whether the machine understood the matter before
          trusting anything below it. */}
      <div style={{
        background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10,
        padding: '11px 14px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.4px', color: '#6E6E68', textTransform: 'uppercase', marginBottom: 5 }}>
          Searched for
        </div>
        <div style={{ fontSize: 13, color: '#E0D6BC', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
          {res.query}
        </div>
      </div>

      {res.acts?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.4px', color: '#D4A017', textTransform: 'uppercase', marginBottom: 9 }}>
            Statutes that apply
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {res.acts.map(a => (
              <div key={a.shortName} style={{ background: '#121212', border: '1px solid #232323', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#EBD9A8' }}>
                  {a.fullName}
                </div>
                {a.sections?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
                    {a.sections.map(s => (
                      <span key={s.n} title={s.desc} style={{
                        fontSize: 11, color: '#A3A39C', background: '#1C1C1C',
                        border: '1px solid #2A2A2A', borderRadius: 5, padding: '3px 7px',
                      }}>{s.n}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {res.total === 0 && (
        <div style={{ fontSize: 13.5, color: '#8A8A8A', lineHeight: 1.6 }}>
          Nothing matched. Try describing the legal issue more directly — the
          doctrine or the section, rather than the sequence of events.
        </div>
      )}

      {res.tiers.map(tier => (
        <div key={tier.id} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 12.5, fontWeight: 800, color: TIER_COLOR[tier.id] || '#8A8A8A',
              letterSpacing: '.02em',
            }}>{tier.label}</span>
            <span style={{ fontSize: 11, color: '#5A5A5A' }}>
              {tier.cases.length} judgment{tier.cases.length === 1 ? '' : 's'} · {tier.note}
            </span>
          </div>
          <div style={{ borderLeft: `2px solid ${TIER_COLOR[tier.id] || '#2A2A2A'}33`, paddingLeft: 13 }}>
            {tier.cases.map(c => (
              <a key={c.docId} href={c.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '11px 0', borderBottom: '1px solid #1A1A1A', textDecoration: 'none' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#F0E4C0', lineHeight: 1.4 }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 11, color: '#8A7748', marginTop: 3 }}>
                  {[c.court, c.date, c.citation].filter(Boolean).join(' · ')}
                </div>
                {c.snippet && (
                  <div style={{ fontSize: 12.5, color: '#8A8A8A', marginTop: 5, lineHeight: 1.55 }}>
                    {c.snippet}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
