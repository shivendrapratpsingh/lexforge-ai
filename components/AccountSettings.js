'use client'

import { useCallback, useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { SECURITY_QUESTIONS, MIN_ANSWER_LENGTH } from '@/lib/security-question'
import LanguageSwitcher from './LanguageSwitcher'

// ─────────────────────────────────────────────────────────────────
//  Personal account settings.
//
//  Ordered by how often people actually come here: profile, then the
//  password, then recovery, then the plan, then data. The destructive
//  action is last, visually separated, and asks twice.
//
//  Both credential changes ask for the current password. A signed-in
//  session is not proof of identity — laptops get left unlocked and
//  tokens get stolen — and the recovery answer in particular must not
//  be replaceable by anyone who merely has a live session.
// ─────────────────────────────────────────────────────────────────

const S = {
  card: {
    background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16,
    padding: 22, marginBottom: 16,
  },
  h2: { fontSize: 16, fontWeight: 800, color: '#F0F0F0', margin: 0 },
  sub: { fontSize: 12.5, color: '#6E6E68', lineHeight: 1.6, margin: '4px 0 16px' },
  label: {
    display: 'block', fontSize: 11.5, fontWeight: 700, color: '#8A8A8A',
    marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  input: {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '11px 14px', color: '#F0F0F0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  row: { marginBottom: 14 },
  kicker: {
    fontSize: 10, fontWeight: 800, letterSpacing: '1.6px',
    color: '#D4A017', textTransform: 'uppercase', marginBottom: 8,
  },
  readonly: {
    background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10,
    padding: '11px 14px', color: '#8A8A8A', fontSize: 14,
  },
}

function Btn({ children, onClick, busy, danger, ghost, type = 'button', disabled }) {
  return (
    <button
      type={type} onClick={onClick} disabled={busy || disabled}
      style={{
        padding: '10px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
        cursor: (busy || disabled) ? 'not-allowed' : 'pointer',
        opacity: (busy || disabled) ? 0.55 : 1,
        border: ghost || danger ? `1px solid ${danger ? 'rgba(225,88,75,.45)' : '#2E2718'}` : 'none',
        background: danger ? 'rgba(225,88,75,.10)'
          : ghost ? 'transparent'
          : 'linear-gradient(135deg,#D4A017,#B8860B)',
        color: danger ? '#E1584B' : ghost ? '#9A8C6E' : '#0D0D0D',
      }}
    >
      {children}
    </button>
  )
}

function Note({ tone = 'ok', children }) {
  if (!children) return null
  const c = tone === 'err'
    ? { bg: 'rgba(225,88,75,.08)', bd: 'rgba(225,88,75,.28)', fg: '#FF8A80' }
    : { bg: 'rgba(63,166,107,.08)', bd: 'rgba(63,166,107,.28)', fg: '#5FCC8D' }
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.bd}`, color: c.fg,
      padding: '10px 14px', borderRadius: 10, fontSize: 12.5,
      lineHeight: 1.55, marginTop: 12,
    }}>
      {children}
    </div>
  )
}

export default function AccountSettings() {
  const [data, setData]   = useState(null)
  const [load, setLoad]   = useState(true)
  const [fatal, setFatal] = useState('')

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/account')
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Could not load your account.')
      setData(j)
    } catch (e) { setFatal(e.message) } finally { setLoad(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  if (load)  return <div style={{ color: '#5A5A5A', fontSize: 13 }}>Loading your account…</div>
  if (fatal) return <div style={{ color: '#FF8A80', fontSize: 13 }}>{fatal}</div>

  const { account, usage } = data

  return (
    <div style={{ maxWidth: 720 }}>
      <Profile account={account} onSaved={refresh} />
      <Password account={account} />
      <Recovery account={account} onSaved={refresh} />
      <Plan account={account} usage={usage} />
      <AppPreferences />
      <DataSection />
      <DangerZone account={account} />
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────
function Profile({ account, onSaved }) {
  const [name, setName] = useState(account.name || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState(null)

  async function save() {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ tone: 'ok', text: 'Saved. It will appear everywhere after your next sign-in.' })
      onSaved()
    } catch (e) { setMsg({ tone: 'err', text: e.message }) } finally { setBusy(false) }
  }

  return (
    <div style={S.card}>
      <div style={S.kicker}>Profile</div>
      <h2 style={S.h2}>Your details</h2>
      <p style={S.sub}>The name that appears on your dashboard and in your drafts.</p>

      <div style={S.row}>
        <label style={S.label}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={S.input}
          onFocus={e => e.target.style.borderColor = '#D4A017'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
      </div>

      <div style={S.row}>
        <label style={S.label}>Email</label>
        <div style={S.readonly}>{account.email}</div>
        <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 7, lineHeight: 1.55 }}>
          Your email is your sign-in and cannot be changed here yet — changing it
          safely needs a confirmation sent to the new address. Contact support if
          you need it moved.
        </p>
      </div>

      <div style={S.row}>
        <label style={S.label}>Member since</label>
        <div style={S.readonly}>
          {new Date(account.memberSince).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <Btn onClick={save} busy={busy} disabled={name.trim() === (account.name || '')}>
        {busy ? 'Saving…' : 'Save changes'}
      </Btn>
      {msg && <Note tone={msg.tone}>{msg.text}</Note>}
    </div>
  )
}

// ── Password ──────────────────────────────────────────────────────
function Password({ account }) {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState(null)

  async function save(e) {
    e.preventDefault()
    if (next !== confirm) return setMsg({ tone: 'err', text: 'The two new passwords do not match.' })
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ tone: 'ok', text: 'Password changed. Use the new one next time you sign in.' })
      setCurrent(''); setNext(''); setConfirm('')
    } catch (e) { setMsg({ tone: 'err', text: e.message }) } finally { setBusy(false) }
  }

  return (
    <form style={S.card} onSubmit={save}>
      <div style={S.kicker}>Security</div>
      <h2 style={S.h2}>Change password</h2>
      <p style={S.sub}>
        {account.passwordChangedAt
          ? `Last changed ${new Date(account.passwordChangedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
          : 'Choose something you do not use anywhere else.'}
      </p>

      <div style={S.row}>
        <label style={S.label}>Current password</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
          autoComplete="current-password" required style={S.input}
          onFocus={e => e.target.style.borderColor = '#D4A017'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
      </div>
      <div style={S.row}>
        <label style={S.label}>New password</label>
        <input type="password" value={next} onChange={e => setNext(e.target.value)}
          placeholder="At least 8 characters" autoComplete="new-password" required style={S.input}
          onFocus={e => e.target.style.borderColor = '#D4A017'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
      </div>
      <div style={S.row}>
        <label style={S.label}>Confirm new password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password" required style={S.input}
          onFocus={e => e.target.style.borderColor = '#D4A017'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
      </div>

      <Btn type="submit" busy={busy}>{busy ? 'Changing…' : 'Change password'}</Btn>
      {msg && <Note tone={msg.tone}>{msg.text}</Note>}

      <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 14, lineHeight: 1.6, marginBottom: 0 }}>
        Devices already signed in stay signed in until their session expires.
        If you think someone else has access, change the password and then sign
        out of this browser too.
      </p>
    </form>
  )
}

// ── Recovery ──────────────────────────────────────────────────────
function Recovery({ account, onSaved }) {
  const [question, setQuestion] = useState(account.securityQuestion || SECURITY_QUESTIONS[0])
  const [answer, setAnswer]     = useState('')
  const [current, setCurrent]   = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg]   = useState(null)

  const isNew = !account.hasSecurityAnswer

  async function save(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/account/security-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, question, answer }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setMsg({ tone: 'ok', text: 'Saved. This is what you will be asked if you forget your password.' })
      setAnswer(''); setCurrent('')
      onSaved()
    } catch (e) { setMsg({ tone: 'err', text: e.message }) } finally { setBusy(false) }
  }

  return (
    <form style={{
      ...S.card,
      ...(isNew ? { borderColor: 'rgba(212,160,23,0.4)' } : null),
    }} onSubmit={save}>
      <div style={S.kicker}>Security</div>
      <h2 style={S.h2}>Account recovery</h2>
      <p style={S.sub}>
        {isNew
          ? 'You do not have a security question set. Until you do, the only way back into your account if you forget your password is to contact support. Set one now — it takes a moment.'
          : 'This is the question you will be asked if you forget your password. There is no reset email, so keep the answer somewhere you will not lose it.'}
      </p>

      <div style={S.row}>
        <label style={S.label}>Question</label>
        <select value={question} onChange={e => setQuestion(e.target.value)} style={S.input}>
          {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      <div style={S.row}>
        <label style={S.label}>{isNew ? 'Your answer' : 'New answer'}</label>
        <input value={answer} onChange={e => setAnswer(e.target.value)}
          placeholder={`At least ${MIN_ANSWER_LENGTH} characters — capitals and spacing do not matter`}
          autoComplete="off" required style={S.input}
          onFocus={e => e.target.style.borderColor = '#D4A017'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
      </div>
      <div style={S.row}>
        <label style={S.label}>Confirm with your password</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
          autoComplete="current-password" required style={S.input}
          onFocus={e => e.target.style.borderColor = '#D4A017'}
          onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
      </div>

      <Btn type="submit" busy={busy}>
        {busy ? 'Saving…' : isNew ? 'Set security question' : 'Update answer'}
      </Btn>
      {msg && <Note tone={msg.tone}>{msg.text}</Note>}

      <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 14, lineHeight: 1.6, marginBottom: 0 }}>
        Pick something that is not on your social media. Anyone who knows the
        answer can reset your password, so treat it like a second password.
        Five wrong guesses locks recovery for 30 minutes.
      </p>
    </form>
  )
}

// ── Plan ──────────────────────────────────────────────────────────
function Plan({ account, usage }) {
  const left = usage.freeLimit == null ? null : Math.max(0, usage.freeLimit - usage.draftsThisMonth)
  const stat = (label, value) => (
    <div style={{ background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6E6E68', marginTop: 5 }}>{label}</div>
    </div>
  )

  return (
    <div style={S.card}>
      <div style={S.kicker}>Plan &amp; usage</div>
      <h2 style={S.h2}>
        {account.isPro ? 'Pro' : 'Free'}
        {account.isPro && <span style={{ marginLeft: 9, fontSize: 10, fontWeight: 800, color: '#D4A017', border: '1px solid #3A3010', borderRadius: 5, padding: '3px 7px', verticalAlign: 'middle' }}>PRO</span>}
      </h2>
      <p style={S.sub}>
        {account.isPro
          ? 'Unlimited drafts, the elevated register, and every Act available for citation.'
          : left === null
            ? 'Your monthly draft allowance resets on the 1st.'
            : `${left} of ${usage.freeLimit} free drafts left this month. Resets on the 1st.`}
      </p>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', marginBottom: 16 }}>
        {stat('Documents', usage.drafts)}
        {stat('This month', usage.draftsThisMonth)}
        {stat('Clients', usage.clients)}
        {stat('Court dates', usage.courtDates)}
      </div>

      {!account.isPro && (
        <Link href="/upgrade" style={{ textDecoration: 'none' }}>
          <span style={{
            display: 'inline-block', padding: '10px 18px', borderRadius: 9,
            fontSize: 13.5, fontWeight: 700, color: '#0D0D0D',
            background: 'linear-gradient(135deg,#D4A017,#B8860B)',
          }}>Upgrade to Pro</span>
        </Link>
      )}
    </div>
  )
}

// ── Preferences ───────────────────────────────────────────────────
function AppPreferences() {
  return (
    <div style={S.card}>
      <div style={S.kicker}>Preferences</div>
      <h2 style={S.h2}>Language &amp; notifications</h2>
      <p style={S.sub}>How the app talks to you.</p>

      <div style={S.row}>
        <label style={S.label}>App language</label>
        <LanguageSwitcher />
      </div>

      <div style={{ borderTop: '1px solid #1F1F1F', paddingTop: 14, marginTop: 16 }}>
        <div style={{ fontSize: 13.5, color: '#C0C0C0', marginBottom: 6, fontWeight: 600 }}>Daily brief</div>
        <p style={{ fontSize: 12.5, color: '#6E6E68', lineHeight: 1.6, margin: '0 0 10px' }}>
          One notification each morning covering your hearings, drafts and the
          day&apos;s line. Turn it on from the card on your dashboard, where you can
          also preview exactly what it will say.
        </p>
        <Link href="/dashboard" style={{ fontSize: 12.5, color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>
          Go to the dashboard →
        </Link>
      </div>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────
function DataSection() {
  return (
    <div style={S.card}>
      <div style={S.kicker}>Your data</div>
      <h2 style={S.h2}>Download everything</h2>
      <p style={S.sub}>
        A single JSON file with every draft, client and court date on this
        account. Your password and security answer are deliberately left out.
      </p>
      <a href="/api/account/export" download style={{ textDecoration: 'none' }}>
        <span style={{
          display: 'inline-block', padding: '10px 18px', borderRadius: 9,
          fontSize: 13.5, fontWeight: 700, color: '#9A8C6E',
          border: '1px solid #2E2718',
        }}>⤓ Export my data</span>
      </a>
    </div>
  )
}

// ── Danger zone ───────────────────────────────────────────────────
function DangerZone({ account }) {
  const [open, setOpen]       = useState(false)
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [busy, setBusy]       = useState(false)
  const [msg, setMsg]         = useState(null)

  async function destroy(e) {
    e.preventDefault()
    if (!confirm('This permanently deletes your account and every draft, client and court date on it. This cannot be undone. Continue?')) return
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmEmail: email }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      await signOut({ callbackUrl: '/' })
    } catch (e) { setMsg({ tone: 'err', text: e.message }); setBusy(false) }
  }

  return (
    <div style={{ ...S.card, border: '1px solid rgba(225,88,75,.28)', background: 'rgba(225,88,75,.03)' }}>
      <div style={{ ...S.kicker, color: '#E1584B' }}>Danger zone</div>
      <h2 style={S.h2}>Delete this account</h2>
      <p style={S.sub}>
        Permanently removes your account and every draft, client and court date
        on it. There is no undo and no backup. Export your data first if you
        might want it.
      </p>

      {!open ? (
        <Btn danger onClick={() => setOpen(true)}>Delete my account</Btn>
      ) : (
        <form onSubmit={destroy}>
          <div style={S.row}>
            <label style={S.label}>Type your email to confirm</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder={account.email} autoComplete="off" required style={S.input} />
          </div>
          <div style={S.row}>
            <label style={S.label}>Your password</label>
            <input type="password" value={password} onChange={e => setPass(e.target.value)}
              autoComplete="current-password" required style={S.input} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn type="submit" danger busy={busy}>
              {busy ? 'Deleting…' : 'Permanently delete'}
            </Btn>
            <Btn ghost onClick={() => { setOpen(false); setMsg(null) }}>Cancel</Btn>
          </div>
          {msg && <Note tone={msg.tone}>{msg.text}</Note>}
        </form>
      )}
    </div>
  )
}
