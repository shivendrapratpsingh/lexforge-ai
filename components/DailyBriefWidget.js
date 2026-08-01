'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────
//  Daily Brief widget — the notification control, and a live preview
//  of exactly what tomorrow morning's push will say.
//
//  Honest scope note: iOS only delivers Web Push to a PWA that has been
//  added to the Home Screen, so on iPhone this widget tells the user to
//  install first rather than silently failing when they tap Enable.
// ─────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: 'dates',  label: 'Court dates',  hint: 'Hearings and deadlines in the next 7 days' },
  { id: 'drafts', label: 'Draft quota',  hint: 'A nudge when your monthly free drafts run low' },
  { id: 'study',  label: 'Study prompt', hint: 'One doctrine, section or landmark each morning' },
]

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function DailyBriefWidget({ nextHearing = null, isPro = false }) {
  const [state, setState] = useState('loading')   // loading | unsupported | ios-install | off | on | blocked | unconfigured
  const [topics, setTopics] = useState(['dates', 'drafts', 'study'])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const supported = () =>
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  const standalone = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)

  const isIOS = () =>
    typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!supported()) {
        // iOS Safari in a normal tab has no PushManager until installed.
        if (!cancelled) setState(isIOS() && !standalone() ? 'ios-install' : 'unsupported')
        return
      }
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const existing = await reg.pushManager.getSubscription()
        const q = existing ? `?endpoint=${encodeURIComponent(existing.endpoint)}` : ''
        const info = await fetch(`/api/push/subscribe${q}`).then(r => r.json())
        if (cancelled) return
        if (!info.configured) { setState('unconfigured'); return }
        if (info.subscribed && Notification.permission === 'granted') {
          setTopics(String(info.topics || '').split(',').filter(Boolean))
          setState('on')
        } else {
          setState(Notification.permission === 'denied' ? 'blocked' : 'off')
        }
      } catch (e) {
        if (!cancelled) setState('unsupported')
      }
    })()
    return () => { cancelled = true }
  }, [])

  const enable = useCallback(async () => {
    setBusy(true); setMsg('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState('blocked'); return }

      const reg = await navigator.serviceWorker.ready
      const { publicKey } = await fetch('/api/push/subscribe').then(r => r.json())
      if (!publicKey) { setState('unconfigured'); return }

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), topics }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save settings')
      setState('on')
      setMsg('Your first brief arrives tomorrow at 8 AM.')
    } catch (e) {
      setMsg(e?.message || 'Could not turn notifications on.')
    } finally { setBusy(false) }
  }, [topics])

  const disable = useCallback(async () => {
    setBusy(true); setMsg('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off'); setMsg('')
    } catch (e) {
      setMsg('Could not turn notifications off.')
    } finally { setBusy(false) }
  }, [])

  const saveTopics = useCallback(async (next) => {
    setTopics(next)
    if (state !== 'on') return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), topics: next }),
      })
    } catch (_) {}
  }, [state])

  const sendTest = useCallback(async () => {
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      setMsg(res.ok ? 'Sent — check your notification tray.' : (j.error || 'Could not send.'))
    } finally { setBusy(false) }
  }, [])

  const preview = (() => {
    const bits = []
    if (topics.includes('dates')) {
      bits.push(nextHearing
        ? `${nextHearing.title} on ${new Date(nextHearing.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
        : 'No hearings in the next 7 days')
    }
    if (topics.includes('drafts') && !isPro) bits.push('Free drafts remaining this month')
    if (topics.includes('study')) bits.push('Doctrine of the day — audi alteram partem')
    return bits.length ? bits.join(' · ') : 'Choose at least one topic below.'
  })()

  const S = {
    card: { background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 18 },
    head: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
    kicker: { fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: '#D4A017', textTransform: 'uppercase' },
    title: { fontSize: 15, fontWeight: 800, color: '#F0F0F0' },
    sub: { fontSize: 12, color: '#6A6A6A', margin: '2px 0 14px' },
    prev: { background: '#0D0D0D', border: '1px solid #232323', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 11, alignItems: 'flex-start' },
    btn: (primary) => ({
      padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
      border: primary ? 'none' : '1px solid #2A2A2A',
      background: primary ? 'linear-gradient(135deg,#D4A017,#B8860B)' : 'transparent',
      color: primary ? '#0D0D0D' : '#9A9A9A', opacity: busy ? 0.6 : 1,
    }),
    chip: (on) => ({
      padding: '6px 11px', borderRadius: 100, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
      border: `1px solid ${on ? 'rgba(212,160,23,.5)' : '#2A2A2A'}`,
      background: on ? 'rgba(212,160,23,.12)' : 'transparent', color: on ? '#D4A017' : '#6A6A6A',
    }),
  }

  return (
    <div style={S.card}>
      <div style={S.head}>
        <span style={{ fontSize: 18 }}>🔔</span>
        <div>
          <div style={S.kicker}>Daily brief</div>
          <div style={S.title}>Morning notification</div>
        </div>
        {state === 'on' && (
          <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 800, color: '#4CAF50', background: 'rgba(76,175,80,.12)', padding: '3px 9px', borderRadius: 100 }}>ON · 8:00 AM</span>
        )}
      </div>
      <p style={S.sub}>One notification a day, covering every service you use.</p>

      <div style={S.prev}>
        <span style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', flex: 'none', background: '#0B0A07' }}>
          <img src="/icon-96.png" alt="" width={30} height={30} style={{ display: 'block' }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#E8E8E8' }}>Today in your practice</div>
          <div style={{ fontSize: 11.5, color: '#8A8A8A', lineHeight: 1.5 }}>{preview}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {TOPICS.map(t => {
          const on = topics.includes(t.id)
          return (
            <button key={t.id} type="button" title={t.hint} style={S.chip(on)}
              onClick={() => saveTopics(on ? topics.filter(x => x !== t.id) : [...topics, t.id])}>
              {on ? '✓ ' : ''}{t.label}
            </button>
          )
        })}
      </div>

      {state === 'loading' && <div style={{ fontSize: 12, color: '#5A5A5A' }}>Checking this device…</div>}

      {state === 'off' && (
        <button type="button" style={S.btn(true)} disabled={busy} onClick={enable}>
          {busy ? 'Turning on…' : 'Turn on daily brief'}
        </button>
      )}

      {state === 'on' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={S.btn(false)} disabled={busy} onClick={sendTest}>Send a test</button>
          <button type="button" style={S.btn(false)} disabled={busy} onClick={disable}>Turn off</button>
        </div>
      )}

      {state === 'ios-install' && (
        <div style={{ fontSize: 12, color: '#9A9A9A', lineHeight: 1.6 }}>
          On iPhone, notifications only work once LexForge is on your Home Screen.
          Tap <b style={{ color: '#D4A017' }}>Share → Add to Home Screen</b>, open it from there, and this switch will appear.
        </div>
      )}
      {state === 'blocked' && (
        <div style={{ fontSize: 12, color: '#FF9A9A', lineHeight: 1.6 }}>
          Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then reload.
        </div>
      )}
      {state === 'unconfigured' && (
        <div style={{ fontSize: 12, color: '#9A9A9A' }}>
          Push keys are not set on this deployment yet.
        </div>
      )}
      {state === 'unsupported' && (
        <div style={{ fontSize: 12, color: '#9A9A9A' }}>
          This browser doesn&apos;t support push notifications. Try Chrome on Android or install the app.
        </div>
      )}

      {msg && <div style={{ marginTop: 10, fontSize: 12, color: '#D4A017' }}>{msg}</div>}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1F1F1F', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link href="/study" style={{ fontSize: 11.5, color: '#6A6A6A', textDecoration: 'none' }}>Study &amp; Learn →</Link>
        <Link href="/court-dates" style={{ fontSize: 11.5, color: '#6A6A6A', textDecoration: 'none' }}>Court dates →</Link>
        <Link href="/new-draft" style={{ fontSize: 11.5, color: '#6A6A6A', textDecoration: 'none' }}>New draft →</Link>
      </div>
    </div>
  )
}
