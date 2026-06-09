'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') || ''
  const email        = searchParams.get('email') || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  const inp = {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '13px 16px', color: '#F0F0F0',
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, email, password }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Reset failed')
      setDone(true)
      setTimeout(() => router.push('/login?reset=1'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div style={{ textAlign: 'center', color: '#FF6B6B', padding: 32 }}>
        Invalid reset link.{' '}
        <Link href="/forgot-password" style={{ color: '#D4A017' }}>Request a new one</Link>
      </div>
    )
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Set new password</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>For {email}</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {done ? (
            <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', color: '#4CAF50', padding: '14px 16px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, textAlign: 'center' }}>
              ✅ Password updated! Redirecting you to sign in…
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FF6B6B', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
                  ⚠️ {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min. 8 characters" required style={inp}
                    onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm Password</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="repeat password" required style={inp}
                    onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%',
                  background: loading ? '#2A2A2A' : 'linear-gradient(135deg, #D4A017, #B8860B)',
                  color: loading ? '#5A5A5A' : '#0D0D0D',
                  padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(212,160,23,0.35)',
                }}>
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D0D0D' }} />}>
      <ResetForm />
    </Suspense>
  )
}
