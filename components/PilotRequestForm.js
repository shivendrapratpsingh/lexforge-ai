'use client'

import { useState } from 'react'

// The form a Moot Court Society convenor or a Principal fills in. They
// have not signed up and should not have to: asking for an account
// before they can ask a question loses most of them.

const input = {
  width: '100%', background: '#0D0D0D', border: '1px solid #232323', borderRadius: 9,
  padding: '11px 13px', color: '#F0F0F0', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}
const label = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#8A8A8A',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px',
}

export default function PilotRequestForm() {
  const [f, setF] = useState({
    college: '', contactName: '', contactEmail: '', phone: '',
    role: 'society', students: '', message: '', website: '',
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function send(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/pilot-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ ok: true })
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }

  if (msg?.ok) {
    return (
      <div style={{
        background: 'rgba(63,166,107,.08)', border: '1px solid rgba(63,166,107,.28)',
        borderRadius: 12, padding: 24, color: '#5FCC8D', fontSize: 14, lineHeight: 1.7,
      }}>
        <strong style={{ display: 'block', fontSize: 16, marginBottom: 6 }}>Got it.</strong>
        We will write back to {f.contactEmail} within a day or two with a code
        your students can use and a time to walk your committee through it.
      </div>
    )
  }

  return (
    <form onSubmit={send}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>College or firm</label>
          <input value={f.college} onChange={set('college')} required style={input}
            placeholder="University Law College, Bangalore" />
        </div>
        <div>
          <label style={label}>Your name</label>
          <input value={f.contactName} onChange={set('contactName')} required style={input} />
        </div>
        <div>
          <label style={label}>Email</label>
          <input type="email" value={f.contactEmail} onChange={set('contactEmail')} required style={input} />
        </div>
        <div>
          <label style={label}>Phone (optional)</label>
          <input value={f.phone} onChange={set('phone')} style={input} />
        </div>
        <div>
          <label style={label}>You are</label>
          <select value={f.role} onChange={set('role')} style={input}>
            <option value="society">Moot Court Society</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div>
          <label style={label}>Roughly how many students</label>
          <input value={f.students} onChange={set('students')} style={input} placeholder="about 300" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={label}>Anything you want us to know (optional)</label>
          <textarea value={f.message} onChange={set('message')} rows={4}
            style={{ ...input, resize: 'vertical' }}
            placeholder="We have an intra-college moot in November and 40 teams to prepare." />
        </div>
      </div>

      {/* Hidden from people, irresistible to bots. */}
      <input value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off"
        aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />

      <button type="submit" disabled={busy} style={{
        marginTop: 18, padding: '13px 26px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
        fontWeight: 800, fontSize: 15, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
      }}>
        {busy ? 'Sending…' : 'Ask about a pilot'}
      </button>

      {msg && !msg.ok && (
        <div style={{
          marginTop: 12, background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)',
          color: '#FF8A80', padding: '11px 14px', borderRadius: 9, fontSize: 13,
        }}>{msg.text}</div>
      )}

      <p style={{ fontSize: 12, color: '#5A5A5A', marginTop: 14, lineHeight: 1.65 }}>
        No card, no commitment, and nothing to install. A pilot is a code
        your students type once.
      </p>
    </form>
  )
}
