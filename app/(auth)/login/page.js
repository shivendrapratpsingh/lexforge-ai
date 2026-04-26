'use client'
import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  // Stable random suffix per mount — keeps the name attribute stable across renders
  // while still being unrecognised by browser password managers.
  const [nameSuffix] = useState(() => Math.random().toString(36).slice(2, 10))

  // Defensive: explicitly clear the inputs after mount in case the browser autofills
  // them before React state hydrates. Runs once on mount and after a short delay
  // because Chromium fills credentials asynchronously after the DOM is interactive.
  useEffect(() => {
    const clearAutofill = () => {
      if (emailRef.current)    emailRef.current.value = ''
      if (passwordRef.current) passwordRef.current.value = ''
      setForm({ email: '', password: '' })
    }
    clearAutofill()
    const t1 = setTimeout(clearAutofill, 50)
    const t2 = setTimeout(clearAutofill, 250)
    const t3 = setTimeout(clearAutofill, 600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  useEffect(() => {
    if (searchParams.get('registered')) setSuccess('Account created! Sign in below.')
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.error) {
        setError('Incorrect email or password. Please try again.')
        setLoading(false)
      } else if (result?.ok) {
        router.refresh()
        router.push('/dashboard')
      } else {
        setError('Sign-in failed. Check your .env.local configuration.')
        setLoading(false)
      }
    } catch (err) {
      setError(`Network error: ${err?.message || 'Could not reach server.'}`)
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A',
    borderRadius: 10, padding: '13px 16px', color: '#F0F0F0',
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>Sign in to your account</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {success && (
            <div style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', color: '#4CAF50', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
              ✅ {success}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FF6B6B', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" data-form-type="other">
            {/* Hidden honeypot inputs — soak up Chromium / Safari autofill that ignores autoComplete="off" */}
            <input type="text"     name="username"         autoComplete="username"         tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0, pointerEvents: 'none' }} />
            <input type="password" name="current-password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0, pointerEvents: 'none' }} />

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
              <input
                ref={emailRef}
                type="email"
                value={form.email}
                name={`lf_login_email_${nameSuffix}`}
                id={`lf-login-email-${nameSuffix}`}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                style={inp}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                onFocus={e => e.target.style.borderColor = '#D4A017'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input
                ref={passwordRef}
                type="password"
                value={form.password}
                name={`lf_login_password_${nameSuffix}`}
                id={`lf-login-password-${nameSuffix}`}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={inp}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
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
              {loading ? '⚙ Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A5A' }}>
            No account?{' '}
            <Link href="/register" style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D0D0D' }} />}>
      <LoginForm />
    </Suspense>
  )
}
