'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────
//  Case law and case status, in one screen with two tabs.
//
//  Both hit billed APIs, so the UI never fires a request the user did
//  not ask for: no search-as-you-type, no speculative prefetch. Every
//  call is a deliberate press of a button.
//
//  Provider state is read first and shown honestly. A search that
//  returns nothing because no API key is set looks identical to one
//  that found nothing, and those need very different responses.
// ─────────────────────────────────────────────────────────────────

const S = {
  card: { background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20, marginBottom: 16 },
  input: {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10,
    padding: '12px 14px', color: '#F0F0F0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  label: { display: 'block', fontSize: 11.5, fontWeight: 700, color: '#8A8A8A', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' },
  btn: (busy) => ({
    padding: '11px 20px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
    border: 'none', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
    background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
  }),
  tab: (on) => ({
    padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${on ? 'rgba(212,160,23,.5)' : '#2A2A2A'}`,
    background: on ? 'rgba(212,160,23,.12)' : 'transparent',
    color: on ? '#D4A017' : '#8A8A8A',
  }),
  err: { background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)', color: '#FF8A80', padding: '12px 15px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, marginTop: 14 },
}

function Offline({ p }) {
  return (
    <div style={{ ...S.card, borderColor: 'rgba(212,160,23,.3)', background: 'rgba(212,160,23,.04)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#D4A017', marginBottom: 6 }}>
        {p.name} is not connected yet
      </div>
      <p style={{ fontSize: 13, color: '#A3A39C', lineHeight: 1.6, margin: 0 }}>
        {p.what} will appear here once the administrator adds the API credentials.
      </p>
    </div>
  )
}

export default function CaseLawSearch() {
  const [tab, setTab] = useState('judgments')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch('/api/legal/status').then(r => r.json()).then(setStatus).catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <button type="button" style={S.tab(tab === 'judgments')} onClick={() => setTab('judgments')}>
          ⚖️ Judgments
        </button>
        <button type="button" style={S.tab(tab === 'case')} onClick={() => setTab('case')}>
          🔎 Case by CNR
        </button>
        <button type="button" style={S.tab(tab === 'acts')} onClick={() => setTab('acts')}>
          📜 New Acts
        </button>
      </div>

      {tab === 'judgments' && <Judgments status={status} />}
      {tab === 'case' && <CaseLookup status={status} />}
      {tab === 'acts' && <Acts status={status} />}
    </div>
  )
}

function Judgments({ status }) {
  const [q, setQ] = useState('')
  const [court, setCourt] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState(null)

  const provider = status?.providers?.judgments
  if (provider && !provider.configured) return <Offline p={provider} />

  const go = async (e) => {
    e.preventDefault()
    setBusy(true); setErr(null); setRes(null)
    try {
      const u = new URL('/api/legal/search', window.location.origin)
      u.searchParams.set('q', q)
      if (court) u.searchParams.set('court', court)
      const r = await fetch(u)
      const j = await r.json()
      if (!r.ok) throw Object.assign(new Error(j.error), { upgrade: j.upgrade })
      setRes(j)
    } catch (e) { setErr(e) } finally { setBusy(false) }
  }

  return (
    <>
      <form style={S.card} onSubmit={go}>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Search judgments</label>
          <input value={q} onChange={e => setQ(e.target.value)} required style={S.input}
            placeholder="e.g. section 45 PMLA twin conditions bail" />
          <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 7, lineHeight: 1.55 }}>
            Three or four distinctive words work best — every word you type has
            to appear in the judgment. Searching a whole sentence usually finds
            nothing. Not sure of the legal terms? Use{' '}
            <b style={{ color: '#9A8C6E' }}>Find cases like mine</b> on the
            dashboard instead and describe it plainly.
          </p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Court (optional)</label>
          <select value={court} onChange={e => setCourt(e.target.value)} style={S.input}>
            <option value="">All courts</option>
            {(res?.courts || []).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <button type="submit" style={S.btn(busy)} disabled={busy}>
          {busy ? 'Searching…' : 'Search case law'}
        </button>
        {err && (
          <div style={S.err}>
            {err.message}
            {err.upgrade && <> <Link href={err.upgrade} style={{ color: '#D4A017' }}>Upgrade to Pro →</Link></>}
          </div>
        )}
      </form>

      {res && (
        <div style={S.card}>
          <div style={{ fontSize: 12, color: '#6E6E68', marginBottom: res.relaxed ? 8 : 14 }}>
            {res.total.toLocaleString('en-IN')} result{res.total === 1 ? '' : 's'}
          </div>

          {/* The index requires every word to appear, so an over-specified
              query finds nothing. When that happens the search is retried
              with the distinctive words only — said plainly here, because a
              silent change of query is a search the reader cannot trust. */}
          {res.relaxed && (
            <div style={{
              background: 'rgba(212,160,23,.07)', border: '1px solid rgba(212,160,23,.28)',
              borderRadius: 9, padding: '10px 13px', marginBottom: 14, fontSize: 12.5,
              color: '#B9A97C', lineHeight: 1.6,
            }}>
              Your full search found nothing — every word has to appear in a
              judgment, and that was too many. These results are for{' '}
              <b style={{ color: '#E0D6BC' }}>{res.searchedFor}</b>.
            </div>
          )}

          {res.results.length === 0 && (
            <div style={{ fontSize: 13.5, color: '#8A8A8A', lineHeight: 1.65 }}>
              Nothing matched, even after shortening the search. Every word you
              type has to appear in the judgment — try three or four of the most
              distinctive ones, e.g. <b style={{ color: '#C9BFA4' }}>section 138 rebuttal presumption</b>.
            </div>
          )}
          {res.results.map(d => (
            <a key={d.docId} href={d.sourceUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '13px 0', borderBottom: '1px solid #1F1F1F', textDecoration: 'none' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 14.5, color: '#F0E4C0', lineHeight: 1.4 }}>{d.title}</div>
              <div style={{ fontSize: 11.5, color: '#8A7748', marginTop: 4 }}>
                {[d.court, d.date, d.citation].filter(Boolean).join(' · ')}
              </div>
              {d.snippet && <div style={{ fontSize: 12.5, color: '#8A8A8A', marginTop: 6, lineHeight: 1.55 }}>{d.snippet}</div>}
            </a>
          ))}
        </div>
      )}
    </>
  )
}

function CaseLookup({ status }) {
  const [cnr, setCnr] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState(null)

  const provider = status?.providers?.cases
  if (provider && !provider.configured) return <Offline p={provider} />

  const go = async (e) => {
    e.preventDefault()
    setBusy(true); setErr(null); setRes(null)
    try {
      const r = await fetch(`/api/legal/case/${encodeURIComponent(cnr.replace(/[\s-]/g, ''))}`)
      const j = await r.json()
      if (!r.ok) throw Object.assign(new Error(j.error), { upgrade: j.upgrade })
      setRes(j.case)
    } catch (e) { setErr(e) } finally { setBusy(false) }
  }

  const row = (k, v) => v ? (
    <div style={{ display: 'flex', gap: 14, padding: '9px 0', borderBottom: '1px solid #1F1F1F' }}>
      <div style={{ width: 130, flex: 'none', fontSize: 11.5, color: '#6E6E68', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>{k}</div>
      <div style={{ fontSize: 13.5, color: '#E0E0E0', lineHeight: 1.5 }}>{v}</div>
    </div>
  ) : null

  return (
    <>
      <form style={S.card} onSubmit={go}>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>CNR number</label>
          <input value={cnr} onChange={e => setCnr(e.target.value)} required style={S.input}
            placeholder="e.g. DLHC010001232024" autoComplete="off" />
          <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 7, lineHeight: 1.55 }}>
            The 16-character national case identifier. It is printed on every
            order and cause list, and shown on the eCourts portal.
          </p>
        </div>
        <button type="submit" style={S.btn(busy)} disabled={busy}>
          {busy ? 'Looking up…' : 'Look up case'}
        </button>
        {err && (
          <div style={S.err}>
            {err.message}
            {err.upgrade && <> <Link href={err.upgrade} style={{ color: '#D4A017' }}>Upgrade to Pro →</Link></>}
          </div>
        )}
      </form>

      {res && (
        <div style={S.card}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#F0E4C0', marginBottom: 4 }}>
            {res.title || res.caseNumber || res.cnr}
          </div>
          <div style={{ fontSize: 12, color: '#8A7748', marginBottom: 14 }}>
            Now tracked — the 8 AM job will keep this up to date.
          </div>
          {row('CNR', res.cnr)}
          {row('Case number', res.caseNumber)}
          {row('Court', res.court)}
          {row('Stage', res.stage)}
          {row('Status', res.status)}
          {row('Filed', res.filingDate)}
          {row('Next hearing', res.nextHearing)}
          {row('Judge', res.judge)}
          {row('Petitioners', res.petitioners)}
          {row('Respondents', res.respondents)}
        </div>
      )}
    </>
  )
}

function Acts({ status }) {
  const c = status?.counts
  const run = status?.lastRun
  return (
    <div style={S.card}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>New Acts</div>
      <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.65, marginTop: 0 }}>
        Every morning at 8, LexForge checks India Code — the Government&apos;s own
        repository of every Central and State enactment — for Acts that have come
        into force, and records them. They feed the chatbot and your document
        citations.
      </p>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', marginTop: 16 }}>
        <div style={{ background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#D4A017', lineHeight: 1 }}>
            {c?.acts ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: '#6E6E68', marginTop: 5 }}>Acts recorded</div>
        </div>
        <div style={{ background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', lineHeight: 1 }}>
            {c?.myTrackedCases ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: '#6E6E68', marginTop: 5 }}>Cases you track</div>
        </div>
      </div>
      {run && (
        <div style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 14, lineHeight: 1.6 }}>
          Last checked {new Date(run.startedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          {run.ok ? ` — ${run.added} new, ${run.updated} updated.` : ` — failed: ${run.error}`}
        </div>
      )}
    </div>
  )
}
