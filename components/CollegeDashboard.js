'use client'

import { useCallback, useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────
//  What a faculty co-ordinator sees about their own college.
//
//  Built around the two questions they are actually asked: "is anybody
//  using it" and "is the third year using it". Everything else is noise
//  to someone who has a department to run.
//
//  It shows that a student is active and how many documents they have
//  made — never what is in one. A register is fine; reading a student's
//  draft is surveillance, and honest students would stop using it.
// ─────────────────────────────────────────────────────────────────

const CARD = { background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 18 }
const LABEL = { fontSize: 11, color: '#6A6A6A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }
const VALUE = { fontSize: 26, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }

export default function CollegeDashboard() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  const [picked, setPicked] = useState(new Set())
  const [batch, setBatch] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/college')
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setD(j)
    } catch (e) { setErr(e.message) }
  }, [])
  useEffect(() => { load() }, [load])

  if (err) return <div style={{ ...CARD, color: '#FF8A80', fontSize: 13.5, lineHeight: 1.7, maxWidth: 640 }}>{err}</div>
  if (!d) return <div style={{ color: '#5A5A5A', fontSize: 13 }}>Loading your college…</div>

  const toggle = (id) => {
    const next = new Set(picked)
    next.has(id) ? next.delete(id) : next.add(id)
    setPicked(next)
  }

  async function setBatchOn() {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/college/batch', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [...picked], batch }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg(`${j.updated} student${j.updated === 1 ? '' : 's'} moved to ${batch || 'no batch'}.`)
      setPicked(new Set()); setBatch('')
      load()
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }

  const when = (v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const t = d.totals

  return (
    <div style={{ maxWidth: 900 }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}>
          Faculty
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', margin: '8px 0 0' }}>{d.institution.name}</h1>
        <p style={{ fontSize: 13.5, color: '#7A7A7A', margin: '6px 0 0', lineHeight: 1.7 }}>
          {d.institution.active
            ? <>Plan is active{d.institution.endsAt && <> until {when(d.institution.endsAt)}</>}.</>
            : <span style={{ color: '#FF8A80' }}>The plan is not currently active — students cannot join.</span>}
          {t.seatsLeft !== null && ` ${t.seatsLeft} of ${d.institution.seats} seats left.`}
        </p>
      </header>

      {d.institution.joinCode && (
        <div style={{ ...CARD, borderColor: 'rgba(212,160,23,.3)', marginBottom: 14 }}>
          <div style={LABEL}>Join code</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <code style={{ fontSize: 28, fontWeight: 800, color: '#D4A017', letterSpacing: '4px' }}>
              {d.institution.joinCode}
            </code>
            <button type="button" onClick={() => navigator.clipboard?.writeText(d.institution.joinCode)}
              style={{ padding: '7px 13px', borderRadius: 8, border: '1px solid #2E2718', background: 'transparent', color: '#9A8C6E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Copy
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: '#7A7A7A', margin: '10px 0 0', lineHeight: 1.7, maxWidth: '64ch' }}>
            Read this out, or put it on a slide. Students sign up with any email
            — a personal Gmail is fine — then go to Account, Plan, and type it.
            That is the whole of it.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
        <div style={CARD}><div style={LABEL}>Signed up</div><div style={VALUE}>{t.signedUp}</div></div>
        <div style={CARD}><div style={LABEL}>Active this month</div><div style={{ ...VALUE, color: '#5FCC8D' }}>{t.activeLast30Days}</div></div>
        <div style={CARD}><div style={LABEL}>Documents made</div><div style={{ ...VALUE, color: '#D4A017' }}>{t.drafts}</div></div>
      </div>

      {d.batches.length > 0 && (
        <div style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ ...LABEL, marginBottom: 10 }}>By batch</div>
          {d.batches.map(b => (
            <div key={b.batch} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1A1A1A', fontSize: 13 }}>
              <span style={{ color: '#C0C0C0' }}>{b.batch}</span>
              <span style={{ color: '#7A7A7A' }}>
                {b.active} of {b.members} active · {b.drafts} document{b.drafts === 1 ? '' : 's'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={LABEL}>Students ({d.members.length})</div>
          {picked.size > 0 && (
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={batch} onChange={e => setBatch(e.target.value)} placeholder="BA LLB 2027"
                style={{ background: '#0D0D0D', border: '1px solid #232323', borderRadius: 8, padding: '7px 11px', color: '#F0F0F0', fontSize: 12.5, outline: 'none', width: 150 }} />
              <button type="button" onClick={setBatchOn} disabled={busy}
                style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D', fontSize: 12.5, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
                Set batch on {picked.size}
              </button>
            </div>
          )}
        </div>

        {msg && <div style={{ fontSize: 12.5, color: '#5FCC8D', marginBottom: 10 }}>{msg}</div>}

        <div style={{ maxHeight: 460, overflowY: 'auto' }}>
          {d.members.map(m => (
            <label key={m.id} style={{
              display: 'flex', gap: 10, alignItems: 'center', padding: '9px 0',
              borderBottom: '1px solid #1A1A1A', fontSize: 13, cursor: 'pointer',
            }}>
              <input type="checkbox" checked={picked.has(m.id)} onChange={() => toggle(m.id)}
                style={{ accentColor: '#D4A017', flex: 'none' }} />
              <span style={{
                width: 7, height: 7, borderRadius: '50%', flex: 'none',
                background: m.activeRecently ? '#5FCC8D' : '#333',
              }} title={m.activeRecently ? 'Active this month' : 'Not active this month'} />
              <span style={{ color: '#C0C0C0', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name || m.email}
                {m.batch && <span style={{ color: '#6A6A6A' }}> · {m.batch}</span>}
                {m.role === 'faculty' && <span style={{ color: '#D4A017' }}> · faculty</span>}
              </span>
              <span style={{ color: '#6A6A6A', flex: 'none', fontSize: 12 }}>
                {m.drafts} doc{m.drafts === 1 ? '' : 's'}
              </span>
            </label>
          ))}
        </div>

        <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 12, lineHeight: 1.65 }}>
          You can see that a student is working and how much — never what they
          wrote. Their drafts are theirs, and stay private to them.
        </p>
      </div>
    </div>
  )
}
