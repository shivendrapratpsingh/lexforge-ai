'use client'

import { useCallback, useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────
//  What it costs to run — and the one number pricing depends on.
//
//  Every AI call, every Kanoon search, every eCourts lookup is logged
//  with an estimated cost. This screen adds them up. The headline is
//  cost per active user per month: any subscription priced below it
//  loses money on every single subscriber, and no amount of growth
//  fixes that.
//
//  Also holds the grandfather control — the early users signed up when
//  everything was free and unlimited, and the day Pro enforcement is
//  switched on they would all be cut off at once unless marked first.
// ─────────────────────────────────────────────────────────────────

const CARD = { background: '#141414', border: '1px solid #1C1C1C', borderRadius: 12, padding: 18 }
const LABEL = { fontSize: 11, color: '#6A6A6A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }
const VALUE = { fontSize: 26, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }
const H2 = { fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PROVIDER_LABEL = {
  groq: 'AI (Groq)',
  kanoon: 'Indian Kanoon',
  ecourts: 'eCourts',
  indiacode: 'India Code (free)',
}

export default function AdminCosts() {
  const [days, setDays] = useState(30)
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch(`/api/admin/usage?days=${days}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setD(j)
    } catch (e) { setErr(e.message) }
  }, [days])

  useEffect(() => { load() }, [load])

  const perUser = d?.perActiveUserRupees || 0
  // A month is the billing unit people think in, so a 7-day window is
  // scaled up rather than shown as-is — otherwise the number looks
  // reassuringly small for the wrong reason.
  const perUserMonthly = days === 30 ? perUser : perUser * (30 / days)

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 style={{ ...H2, marginBottom: 0 }}>What it costs to run</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map(n => (
            <button key={n} type="button" onClick={() => setDays(n)} style={{
              padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${days === n ? 'rgba(212,160,23,.5)' : '#2A2A2A'}`,
              background: days === n ? 'rgba(212,160,23,.12)' : 'transparent',
              color: days === n ? '#D4A017' : '#8A8A8A',
            }}>{n}d</button>
          ))}
        </div>
      </div>

      {err && (
        <div style={{ background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)', color: '#FF8A80', padding: '10px 13px', borderRadius: 9, fontSize: 12.5 }}>{err}</div>
      )}

      {d && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ ...CARD, border: '1px solid rgba(212,160,23,.28)' }}>
              <div style={LABEL}>Per active user / month</div>
              <div style={{ ...VALUE, color: '#D4A017' }}>{money(perUserMonthly)}</div>
              <div style={{ fontSize: 11, color: '#6A6A6A', marginTop: 6, lineHeight: 1.55 }}>
                Price above this or every subscriber loses money.
              </div>
            </div>
            <div style={CARD}><div style={LABEL}>Total, {d.days}d</div><div style={VALUE}>{money(d.totalRupees)}</div></div>
            <div style={CARD}><div style={LABEL}>Active users</div><div style={VALUE}>{d.activeUsers}</div></div>
            <div style={CARD}><div style={LABEL}>Billed calls</div><div style={VALUE}>{d.calls.toLocaleString('en-IN')}</div></div>
            <div style={CARD}><div style={LABEL}>AI tokens</div><div style={VALUE}>{d.tokens.toLocaleString('en-IN')}</div></div>
          </div>

          {d.calls === 0 && (
            <div style={{ ...CARD, marginTop: 12, fontSize: 13, color: '#8A8A8A', lineHeight: 1.65 }}>
              Nothing logged in this window yet. Costs are recorded from the
              moment a user runs a search, a draft or an analysis — the numbers
              fill in on their own, and pricing should wait for a few weeks of
              them rather than a guess.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
            <div style={CARD}>
              <div style={{ ...LABEL, marginBottom: 10 }}>Where the money goes</div>
              {d.byProvider.length === 0 && <div style={{ fontSize: 13, color: '#6A6A6A' }}>No spend yet.</div>}
              {d.byProvider.map(p => {
                const pct = d.totalRupees > 0 ? (p.rupees / d.totalRupees) * 100 : 0
                return (
                  <div key={p.provider} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#C0C0C0', marginBottom: 4 }}>
                      <span>{PROVIDER_LABEL[p.provider] || p.provider}</span>
                      <span style={{ color: '#8A8A8A' }}>{money(p.rupees)} · {p.calls} calls</span>
                    </div>
                    <div style={{ height: 5, background: '#0D0D0D', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(pct, p.rupees > 0 ? 2 : 0)}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#B8860B)' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 12, lineHeight: 1.6 }}>
                Estimates, from the rates in RATES — Groq {money(d.rates.groqPerKToken)}/1k
                tokens, Kanoon {money(d.rates.kanoonSearch)}/search. Override
                them with RATE_* environment variables when the real invoices
                land.
              </div>
            </div>

            <div style={CARD}>
              <div style={{ ...LABEL, marginBottom: 10 }}>Heaviest users</div>
              {(!d.topSpenders || d.topSpenders.length === 0) && <div style={{ fontSize: 13, color: '#6A6A6A' }}>Nobody yet.</div>}
              {d.topSpenders?.map(u => (
                <div key={u.userId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid #1A1A1A', fontSize: 12.5 }}>
                  <span style={{ color: '#C0C0C0', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}{u.institution ? ` · ${u.institution}` : ''}
                  </span>
                  <span style={{ color: '#8A8A8A', flex: 'none' }}>{money(u.rupees)}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 12, lineHeight: 1.6 }}>
                One user far above the rest is usually a script, not a lawyer.
                Worth a look before it eats a month of free tier.
              </div>
            </div>
          </div>

          <Grandfather />
        </>
      )}
    </section>
  )
}

function Grandfather() {
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [oneEmail, setOneEmail] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/grandfather')
      const j = await r.json()
      if (r.ok) setInfo(j)
    } catch { /* the panel simply does not render */ }
  }, [])

  useEffect(() => { load() }, [load])
  if (!info) return null

  // One person at a time, in either direction. A bulk grant that cannot be
  // undone for a single user is one nobody should be willing to press.
  async function one(value) {
    if (!oneEmail.trim()) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/admin/grandfather', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: oneEmail.trim(), value }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `${j.email} ${j.grandfathered ? 'now keeps Pro permanently' : 'no longer keeps Pro permanently'}. ${j.totalGrandfathered} marked in total.` })
      setOneEmail('')
      load()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  async function run() {
    if (!confirm(`Keep all ${info.eligible} existing users on Pro permanently, free, for good? This cannot be undone in bulk.`)) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/admin/grandfather', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true, text: `${j.grandfathered} user(s) grandfathered. ${j.totalGrandfathered} in total now keep Pro permanently.` })
      load()
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  return (
    <div style={{ ...CARD, marginTop: 12 }}>
      <div style={{ ...LABEL, marginBottom: 8 }}>The early users</div>
      <p style={{ fontSize: 13, color: '#9A9A9A', lineHeight: 1.7, margin: '0 0 12px', maxWidth: '70ch' }}>
        {info.totalUsers} people signed up while everything was free and
        unlimited. The day Pro enforcement is switched on, the {info.eligible} of
        them not yet marked would be cut off at once — the people who took a
        chance on an unknown product first, and whose word of mouth matters
        most. Marking them keeps their Pro permanently, whatever is charged
        later. {info.alreadyGrandfathered > 0 && `${info.alreadyGrandfathered} already marked.`}
      </p>
      <button type="button" onClick={run} disabled={busy || info.eligible === 0} style={{
        padding: '9px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
        background: info.eligible === 0 ? '#1C1C1C' : 'linear-gradient(135deg,#D4A017,#B8860B)',
        color: info.eligible === 0 ? '#6A6A6A' : '#0D0D0D',
        cursor: info.eligible === 0 ? 'default' : busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
      }}>
        {info.eligible === 0 ? 'Everyone is already marked' : busy ? 'Marking…' : `Keep all ${info.eligible} on Pro permanently`}
      </button>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1F1F1F' }}>
        <div style={{ ...LABEL, marginBottom: 8 }}>Or one person</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={oneEmail}
            onChange={e => setOneEmail(e.target.value)}
            placeholder="someone@example.com"
            style={{
              flex: '1 1 220px', minWidth: 0, background: '#0D0D0D', border: '1px solid #1C1C1C',
              borderRadius: 8, padding: '8px 11px', color: '#F0F0F0', fontSize: 13, outline: 'none',
            }}
          />
          <button type="button" onClick={() => one(true)} disabled={busy || !oneEmail.trim()} style={{
            padding: '8px 13px', borderRadius: 8, border: '1px solid #D4A017', background: 'rgba(212,160,23,0.08)',
            color: '#D4A017', fontSize: 12, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: oneEmail.trim() ? 1 : .45,
          }}>Grant</button>
          <button type="button" onClick={() => one(false)} disabled={busy || !oneEmail.trim()} style={{
            padding: '8px 13px', borderRadius: 8, border: '1px solid #802020', background: 'rgba(150,30,30,0.12)',
            color: '#F48080', fontSize: 12, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: oneEmail.trim() ? 1 : .45,
          }}>Withdraw</button>
        </div>
      </div>

      {msg && (
        <div style={{
          marginTop: 10, padding: '10px 13px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.6,
          background: msg.ok ? 'rgba(63,166,107,.08)' : 'rgba(225,88,75,.08)',
          border: `1px solid ${msg.ok ? 'rgba(63,166,107,.28)' : 'rgba(225,88,75,.28)'}`,
          color: msg.ok ? '#5FCC8D' : '#FF8A80',
        }}>{msg.text}</div>
      )}
    </div>
  )
}
