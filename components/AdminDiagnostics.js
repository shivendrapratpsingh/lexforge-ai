'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────
//  "Is everything actually connected?" — one button.
//
//  The keys live in the deployment environment, so nothing running on a
//  laptop can test them, and every feature that uses them sits behind a
//  login. eCourts spent seventeen days with a key set and not one call
//  ever made: not working, not broken, just unknown.
//
//  This runs the calls for real, from where the keys are, and prints
//  each provider's own words back. It costs a little money, so it is a
//  button rather than something that polls.
// ─────────────────────────────────────────────────────────────────

const TONE = {
  up: { fg: '#5FCC8D', bd: 'rgba(63,166,107,.3)', bg: 'rgba(63,166,107,.07)', label: 'WORKING' },
  down: { fg: '#FF8A80', bd: 'rgba(225,88,75,.3)', bg: 'rgba(225,88,75,.07)', label: 'FAILING' },
  'not configured': { fg: '#8A8A8A', bd: '#2A2A2A', bg: 'transparent', label: 'NOT SET UP' },
}

export default function AdminDiagnostics() {
  const [d, setD] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function run() {
    setBusy(true); setErr(''); setD(null)
    try {
      const r = await fetch('/api/admin/diagnostics')
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setD(j)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 style={{ fontSize: 13, color: '#D4A017', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
          Is everything connected?
        </h2>
        <button type="button" onClick={run} disabled={busy} style={{
          padding: '9px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
          background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
          cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
        }}>
          {busy ? 'Testing…' : 'Test every connection'}
        </button>
      </div>

      <div style={{ background: '#141414', border: '1px solid #1C1C1C', borderRadius: 12, padding: 18 }}>
        {!d && !err && !busy && (
          <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.7, margin: 0, maxWidth: '68ch' }}>
            Calls the AI, judgment search, Act repository, case lookup, email and
            payments for real and shows what each one said. This is the only way
            to test a key that exists here and nowhere else. It costs a rupee or
            so per run, so it is a button rather than something that polls.
          </p>
        )}

        {busy && <p style={{ fontSize: 13, color: '#8A8A8A', margin: 0 }}>Calling each provider…</p>}
        {err && <p style={{ fontSize: 13, color: '#FF8A80', margin: 0 }}>{err}</p>}

        {d && (
          <>
            <div style={{ fontSize: 12.5, color: '#8A8A8A', marginBottom: 14 }}>
              {d.summary.up} working · {d.summary.down} failing · {d.summary.unconfigured} not set up
            </div>

            {d.results.map(r => {
              const t = TONE[r.state] || TONE['not configured']
              return (
                <div key={r.name} style={{
                  background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 10,
                  padding: '12px 14px', marginBottom: 9,
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#F0F0F0' }}>{r.name}</span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em',
                      padding: '3px 7px', borderRadius: 5, border: `1px solid ${t.bd}`, color: t.fg,
                    }}>{t.label}</span>
                    {r.ms != null && <span style={{ fontSize: 11, color: '#6A6A6A' }}>{r.ms} ms</span>}
                  </div>
                  {/* The provider's own words, unedited — that is the diagnosis. */}
                  <div style={{ fontSize: 12.5, color: r.state === 'down' ? t.fg : '#9A9A9A', marginTop: 6, lineHeight: 1.65, wordBreak: 'break-word' }}>
                    {r.detail}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </section>
  )
}
