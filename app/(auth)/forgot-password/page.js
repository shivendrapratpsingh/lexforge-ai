'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Recovery in one page, two steps: identify the account, then answer the
// security question and choose a new password. No emailed link, and no
// token stored anywhere that could be stolen and replayed.

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep]     = useState('email')   // email | answer | done
  const [email, setEmail]   = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [notice, setNotice]     = useState('')

  const inp = {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '13px 16px', color: '#F0F0F0',
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  }
  const lbl = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
  }
  const btn = (busy) => ({
    width: '100%', marginTop: 4,
    background: busy ? '#2A2A2A' : 'linear-gradient(135deg, #D4A017, #B8860B)',
    color: busy ? '#5A5A5A' : '#0D0D0D',
    padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
    border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
    boxShadow: busy ? 'none' : '0 4px 20px rgba(212,160,23,0.35)',
  })

  async function lookUp(e) {
    e.preventDefault()
    setLoading(true); setError(''); setNotice('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Request failed')
      if (j.needsAdmin) { setNotice(j.message); return }
      setQuestion(j.question)
      setStep('answer')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  async function submitAnswer(e) {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer, password }),
      })
      const j = await res.json()
      if (!res.ok) {
        throw new Error(
          j.attemptsLeft > 0
            ? `${j.error} ${j.attemptsLeft} attempt${j.attemptsLeft === 1 ? '' : 's'} left.`
            : (j.error || 'Request failed')
        )
      }
      setStep('done')
      setTimeout(() => router.push('/login'), 2200)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #D4A017, #F0C040)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0D0D0D', fontWeight: 900, fontSize: 14 }}>LF</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0' }}>LexForge AI</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Recover your account</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>
            {step === 'answer'
              ? 'Answer your security question to set a new password'
              : 'Answer the question you chose when you signed up'}
          </p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FF6B6B', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
              ⚠️ {error}
            </div>
          )}

          {notice && (
            <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.3)', color: '#D4A017', padding: '14px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.65 }}>
              {notice}
            </div>
          )}

          {step === 'done' ? (
            <div>
              <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', color: '#4CAF50', padding: '14px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
                ✅ Password updated. Taking you to sign in…
              </div>
              <Link href="/login" style={{ display: 'block', textAlign: 'center', color: '#D4A017', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Sign in now →
              </Link>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={lookUp}>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={inp}
                  onFocus={e => e.target.style.borderColor = '#D4A017'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </div>
              <button type="submit" disabled={loading} style={btn(loading)}>
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitAnswer}>
              <div style={{
                padding: 14, marginBottom: 18, borderRadius: 10,
                background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.22)',
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '1.4px', color: '#D4A017', marginBottom: 6 }}>
                  SECURITY QUESTION
                </div>
                <div style={{ fontSize: 14, color: '#E8E8E8', lineHeight: 1.5 }}>{question}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Your answer</label>
                <input
                  type="text" value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder="Capitals and spacing do not matter" required autoComplete="off" style={inp}
                  onFocus={e => e.target.style.borderColor = '#D4A017'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>New password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters" required style={inp}
                  onFocus={e => e.target.style.borderColor = '#D4A017'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Confirm new password</label>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your new password" required style={inp}
                  onFocus={e => e.target.style.borderColor = '#D4A017'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </div>

              <button type="submit" disabled={loading} style={btn(loading)}>
                {loading ? 'Checking…' : 'Set new password →'}
              </button>

              <p style={{ fontSize: 11.5, color: '#5A5A5A', lineHeight: 1.6, marginTop: 14, marginBottom: 0 }}>
                Five wrong answers locks the account for 30 minutes. If you cannot
                remember your answer, contact support and an administrator will set
                a password for you.
              </p>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A5A' }}>
            Remembered it?{' '}
            <Link href="/login" style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
