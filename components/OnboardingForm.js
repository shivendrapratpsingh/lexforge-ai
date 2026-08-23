'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { SECURITY_QUESTIONS, MIN_ANSWER_LENGTH } from '@/lib/security-question'

// ─────────────────────────────────────────────────────────────────
//  First login, for a student whose college created the account.
//
//  They arrive with a password their college typed into a spreadsheet
//  and no security question. Both are fixed here, before anything else,
//  because leaving either alone has a cost: the spreadsheet password is
//  readable by whoever has the file, and an account with no security
//  question cannot be recovered at all in this app.
//
//  Three fields. Anything longer and people start guessing at what to
//  type to get past it.
// ─────────────────────────────────────────────────────────────────

const S = {
  input: {
    width: '100%', background: '#0D0D0D', border: '1px solid #232323', borderRadius: 9,
    padding: '12px 14px', color: '#F0F0F0', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  label: { display: 'block', fontSize: 11.5, fontWeight: 700, color: '#8A8A8A', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.6px' },
  hint: { fontSize: 12, color: '#6A6A6A', marginTop: 6, lineHeight: 1.6 },
}

export default function OnboardingForm({ email, institutionName }) {
  const [f, setF] = useState({
    name: '', password: '', confirm: '',
    securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (f.password !== f.confirm) return setErr('The two passwords do not match.')

    setBusy(true)
    try {
      const r = await fetch('/api/account/onboarding', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name, password: f.password,
          securityQuestion: f.securityQuestion, securityAnswer: f.securityAnswer,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)

      // Changing the password ends every session, including this one.
      // That is deliberate — if the college's list leaked and somebody
      // else signed in first, this is what removes them. So the student
      // signs in again, with the password they just chose.
      setDone(true)
      setTimeout(() => signOut({ callbackUrl: '/login?changed=1' }), 2200)
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(63,166,107,.08)', border: '1px solid rgba(63,166,107,.3)',
        borderRadius: 12, padding: 24, color: '#5FCC8D', fontSize: 15, lineHeight: 1.75,
      }}>
        <strong style={{ display: 'block', fontSize: 17, marginBottom: 8 }}>All set, {f.name.split(' ')[0]}.</strong>
        Signing you out so you can come back in with your own password.
        Everything unlocks after that.
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 20 }}>
        <label style={S.label} htmlFor="ob-name">Your name</label>
        <input id="ob-name" value={f.name} onChange={set('name')} required autoFocus
          style={S.input} placeholder="Ravi Kumar" autoComplete="name" />
        <div style={S.hint}>This appears on the documents you draft, so use the name you sign with.</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={S.label} htmlFor="ob-pass">Choose your own password</label>
        <input id="ob-pass" type="password" value={f.password} onChange={set('password')} required
          minLength={8} style={S.input} autoComplete="new-password" />
        <div style={S.hint}>
          At least 8 characters, and <strong style={{ color: '#C9BA92' }}>not the one your college gave you</strong> —
          that one is written in a spreadsheet other people can open.
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={S.label} htmlFor="ob-confirm">Type it again</label>
        <input id="ob-confirm" type="password" value={f.confirm} onChange={set('confirm')} required
          style={S.input} autoComplete="new-password" />
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={S.label} htmlFor="ob-q">If you forget it, we will ask you this</label>
        <select id="ob-q" value={f.securityQuestion} onChange={set('securityQuestion')} style={S.input}>
          {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 22 }}>
        <input value={f.securityAnswer} onChange={set('securityAnswer')} required
          minLength={MIN_ANSWER_LENGTH} style={{ ...S.input, marginTop: 10 }}
          placeholder="Your answer" autoComplete="off" />
        <div style={S.hint}>
          There is no reset link in LexForge — no long-lived token sits in our
          database waiting to be stolen. This answer is the only way back into
          your account, so pick something you will still know in a year.
        </div>
      </div>

      {err && (
        <div style={{
          background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)',
          color: '#FF8A80', padding: '11px 14px', borderRadius: 9, fontSize: 13.5,
          lineHeight: 1.6, marginBottom: 16,
        }}>{err}</div>
      )}

      <button type="submit" disabled={busy} style={{
        width: '100%', padding: '14px 20px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
        fontWeight: 800, fontSize: 15.5, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
      }}>
        {busy ? 'Saving…' : 'Finish and open LexForge'}
      </button>

      <p style={{ fontSize: 12, color: '#5A5A5A', marginTop: 16, lineHeight: 1.7, textAlign: 'center' }}>
        Signed in as {email}
        {institutionName ? <> · your access is paid for by {institutionName}</> : null}
      </p>
    </form>
  )
}
