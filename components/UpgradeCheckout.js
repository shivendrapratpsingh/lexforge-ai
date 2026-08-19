'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────
//  Pay for Pro.
//
//  Renders nothing at all until /api/billing/checkout says payments are
//  configured — so before Razorpay KYC is done the upgrade page keeps
//  its existing invite-only wording, rather than offering a button that
//  fails on click.
//
//  Money is never trusted from this file. It opens Razorpay's own
//  window, hands the result to /api/billing/verify, and the server
//  decides. Everything here is presentation.
// ─────────────────────────────────────────────────────────────────

const CHECKOUT_JS = 'https://checkout.razorpay.com/v1/checkout.js'

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.Razorpay) return resolve(window.Razorpay)
    const existing = document.querySelector(`script[src="${CHECKOUT_JS}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay))
      existing.addEventListener('error', () => reject(new Error('Could not load the payment window.')))
      return
    }
    const s = document.createElement('script')
    s.src = CHECKOUT_JS
    s.async = true
    s.onload = () => resolve(window.Razorpay)
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'))
    document.body.appendChild(s)
  })
}

export default function UpgradeCheckout({ isPro }) {
  const router = useRouter()
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetch('/api/billing/checkout')
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setInfo({ configured: false, plans: [] }))
  }, [])

  const pay = useCallback(async (planId) => {
    setBusy(planId); setMsg(null)
    try {
      const Razorpay = await loadCheckout()

      const r = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const order = await r.json()
      if (!r.ok) throw new Error(order.error)

      const rzp = new Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'LexForge AI',
        description: `${order.plan.label} — ${order.plan.days} days of Pro`,
        prefill: order.prefill,
        theme: { color: '#D4A017' },
        // Closing the window is not a failure — it is a decision.
        modal: { ondismiss: () => setBusy('') },
        handler: async (res) => {
          setBusy('verifying')
          try {
            const v = await fetch('/api/billing/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(res),
            })
            const j = await v.json()
            if (!v.ok) throw new Error(j.error)
            setMsg({ ok: true, text: 'Payment received. Pro is active on your account.' })
            // The tier lives in the session JWT, so a refresh alone is
            // not enough — the whole route tree has to re-render.
            router.refresh()
            setTimeout(() => window.location.reload(), 1400)
          } catch (e) {
            setMsg({ ok: false, text: e.message })
          } finally { setBusy('') }
        },
      })

      rzp.on('payment.failed', (e) => {
        setMsg({ ok: false, text: e?.error?.description || 'The payment did not go through. Nothing was charged.' })
        setBusy('')
      })
      rzp.open()
    } catch (e) {
      setMsg({ ok: false, text: e.message })
      setBusy('')
    }
  }, [router])

  // Nothing configured, or nothing to sell — the page's own invite-only
  // block stays as the call to action.
  if (!info?.configured || !info.plans?.length || isPro) return null

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 12, color: '#D4A017', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
        Choose a plan
      </div>

      {!info.live && (
        <div style={{
          background: 'rgba(212,160,23,.08)', border: '1px solid rgba(212,160,23,.3)',
          color: '#D4A017', padding: '9px 13px', borderRadius: 9, fontSize: 12, marginBottom: 12,
        }}>
          Test mode — no real money moves. Use Razorpay&rsquo;s test card 4111 1111 1111 1111.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {info.plans.map(p => (
          <div key={p.id} style={{
            background: '#141414',
            border: `1px solid ${p.id === 'yearly' ? 'rgba(212,160,23,.4)' : '#1C1C1C'}`,
            borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ fontSize: 11, color: '#6A6A6A', letterSpacing: '1.5px', fontWeight: 700, textTransform: 'uppercase' }}>
              {p.label}
            </div>
            <div style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800 }}>
              ₹{p.rupees.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: '#8A8A8A', lineHeight: 1.55, flex: 1 }}>
              {p.days} days of full access. {p.blurb}
            </div>
            <button
              type="button"
              onClick={() => pay(p.id)}
              disabled={Boolean(busy)}
              style={{
                marginTop: 8, padding: '11px 18px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
                fontWeight: 800, fontSize: 14, letterSpacing: '.3px',
                cursor: busy ? 'wait' : 'pointer', opacity: busy && busy !== p.id ? .5 : 1,
              }}
            >
              {busy === p.id ? 'Opening…' : busy === 'verifying' ? 'Confirming…' : `Pay ₹${p.rupees.toLocaleString('en-IN')}`}
            </button>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          marginTop: 12, padding: '11px 14px', borderRadius: 9, fontSize: 13, lineHeight: 1.6,
          background: msg.ok ? 'rgba(63,166,107,.08)' : 'rgba(225,88,75,.08)',
          border: `1px solid ${msg.ok ? 'rgba(63,166,107,.28)' : 'rgba(225,88,75,.28)'}`,
          color: msg.ok ? '#5FCC8D' : '#FF8A80',
        }}>{msg.text}</div>
      )}

      <p style={{ fontSize: 11.5, color: '#5A5A5A', marginTop: 12, lineHeight: 1.65 }}>
        Paid once — nothing renews on its own and no card is stored. Pay again
        when the term ends, and paying early adds to the days you already have
        rather than replacing them. Cards, UPI, net banking and wallets are all
        handled by Razorpay; LexForge never sees your card details.
      </p>
    </div>
  )
}
