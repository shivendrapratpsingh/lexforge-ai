'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { DEFAULT_SECURITY_QUESTION as SECURITY_QUESTION } from '@/lib/security-question'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', securityAnswer: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.securityAnswer.trim().length < 2)
      return setError('Please answer the security question — it is how you get back in if you forget your password.')
    setLoading(true)

    try {
      // Step 1: Register
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          securityAnswer: form.securityAnswer,
        }),
      })

      let data = {}
      try { data = await res.json() } catch {}

      if (!res.ok) {
        setError(data.error || `Server error (${res.status}). Check that your .env.local is configured.`)
        setLoading(false)
        return
      }

      // Step 2: Auto sign-in
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        // Account created but sign-in failed — send to login
        router.push('/login?registered=1')
        return
      }

      router.refresh()
      router.push('/dashboard')
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
  const lbl = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#8A8A8A',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #D4A017, #F0C040)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0D0D0D', fontWeight: 900, fontSize: 14 }}>LF</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0' }}>LexForge AI</span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>Start generating legal documents today</p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FF6B6B', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { key: 'name', label: 'Full Name', type: 'text', ph: 'e.g. Shivendra Pratap Singh' },
              { key: 'email', label: 'Email Address', type: 'email', ph: 'you@example.com' },
              { key: 'password', label: 'Password', type: 'password', ph: 'Minimum 8 characters' },
              { key: 'confirm', label: 'Confirm Password', type: 'password', ph: 'Repeat your password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={lbl}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  required={f.key !== 'name'}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#D4A017'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
              </div>
            ))}

            {/* Recovery. Set here because it is the only way back into the
                account — there is no emailed reset link to fall back on. */}
            <div style={{
              marginTop: 4, marginBottom: 16, padding: 16,
              background: 'rgba(212,160,23,0.05)',
              border: '1px solid rgba(212,160,23,0.22)', borderRadius: 12,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '1.4px', color: '#D4A017', marginBottom: 8 }}>
                SECURITY QUESTION
              </div>
              <label style={{ ...lbl, textTransform: 'none', letterSpacing: 0, fontSize: 13.5, color: '#D8D8D8' }}>
                {SECURITY_QUESTION}
              </label>
              <input
                type="text"
                value={form.securityAnswer}
                onChange={e => setForm({ ...form, securityAnswer: e.target.value })}
                placeholder="e.g. Bunty"
                required
                autoComplete="off"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#D4A017'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
              <p style={{ fontSize: 11.5, color: '#6E6E68', lineHeight: 1.6, marginTop: 9, marginBottom: 0 }}>
                This is how you get back in if you forget your password — there is
                no reset email. Capitals and spacing do not matter. Pick something
                you will still remember in two years, and that is not on your
                social media.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: 8,
                background: loading ? '#2A2A2A' : 'linear-gradient(135deg, #D4A017, #B8860B)',
                color: loading ? '#5A5A5A' : '#0D0D0D',
                padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(212,160,23,0.35)',
              }}
            >
              {loading ? '⚙ Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A5A' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
