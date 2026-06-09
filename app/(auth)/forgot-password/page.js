'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')
  const [devLink, setDevLink] = useState('')

  const inp = {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '13px 16px', color: '#F0F0F0',
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Request failed')
      setDone(true)
      if (j.resetLink) setDevLink(j.resetLink)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Reset your password</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>Enter your email and we'll send a reset link</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {done ? (
            <div>
              <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', color: '#4CAF50', padding: '14px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
                ✅ If that email is registered, a reset link has been issued. Check your inbox (and spam folder).
              </div>
              {devLink && (
                <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#D4A017', fontWeight: 700, letterSpacing: '1px', marginBottom: 6 }}>DEV ONLY — reset link (hidden in production)</div>
                  <a href={devLink} style={{ color: '#D4A017', fontSize: 12, wordBreak: 'break-all' }}>{devLink}</a>
                </div>
              )}
              <Link href="/login" style={{ display: 'block', textAlign: 'center', color: '#D4A017', fontSize: 14, fontWeight: 600, textDecoration: 'none', marginTop: 8 }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FF6B6B', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#D4A017'}
                    onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%',
                    background: loading ? '#2A2A2A' : 'linear-gradient(135deg, #D4A017, #B8860B)',
                    color: loading ? '#5A5A5A' : '#0D0D0D',
                    padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(212,160,23,0.35)',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A5A' }}>
                Remembered it?{' '}
                <Link href="/login" style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
