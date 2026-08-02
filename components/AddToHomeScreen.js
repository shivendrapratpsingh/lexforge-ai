'use client'

import { useCallback, useEffect, useState } from 'react'
import AuroraWidget, { AuroraWords } from './AuroraWidget'

// ─────────────────────────────────────────────────────────────────
//  "Put this on your home screen" — shown to people who have not
//  installed LexForge yet, with today's actual line previewed so they
//  can see what they are agreeing to.
//
//  One honest note carried in the copy below: neither Android nor iOS
//  lets a web app publish a widget to the OS home screen. That is a
//  platform restriction, not a gap here — only a native app can do it.
//  What a phone can have is the app icon, its long-press shortcuts,
//  and the 8 AM notification carrying the same line the widget shows.
//  On Windows and macOS the wall simply lives inside the app, so there
//  is nothing to prompt for and this renders nothing.
//
//  Snoozed rather than dismissed forever: someone who taps "not now"
//  on a laptop may well want it a fortnight later on their phone.
// ─────────────────────────────────────────────────────────────────

const SNOOZE_KEY = 'lf-a2hs-snoozed-until'
const SNOOZE_DAYS = 14

export default function AddToHomeScreen({ line }) {
  const [mode, setMode] = useState('hidden')   // hidden | android | ios | installed
  const [prompt, setPrompt] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (standalone) return                       // already on a home screen

    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0)
    if (Date.now() < snoozedUntil) return

    const ua = navigator.userAgent
    const isIOS = /iP(hone|ad|od)/.test(ua) ||
      // iPadOS 13+ reports as a Mac; the touch points give it away.
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)

    // iOS gives no install event at all — Safari only offers the Share
    // sheet — so the instructions are the whole flow there.
    if (isIOS) { setMode('ios'); return }

    // Everywhere else, wait for Chromium to tell us it is installable.
    // A desktop that never fires this simply never shows the card, which
    // is what we want: on Windows and macOS the wall is already in the app.
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); setMode('android') }
    const onInstalled = () => { setPrompt(null); setMode('installed') }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!prompt) return
    setBusy(true)
    try {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setMode('installed')
      else snooze()
    } finally {
      setPrompt(null)
      setBusy(false)
    }
  }, [prompt])

  const snooze = useCallback(() => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86400000))
    setMode('hidden')
  }, [])

  if (mode === 'hidden') return null

  const btn = (primary) => ({
    padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
    cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
    border: primary ? 'none' : '1px solid #2E2718',
    background: primary ? 'linear-gradient(135deg,#D4A017,#B8860B)' : 'transparent',
    color: primary ? '#0D0D0D' : '#9A8C6E',
  })

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <AuroraWidget kicker="Keep it with you" accent="ember" minHeight={0}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* What they are actually adding */}
          <div style={{
            flex: 'none', width: 176, borderRadius: 12, padding: '12px 13px',
            border: '1px solid #2E2718', background: 'rgba(10,9,6,.55)',
          }}>
            <div style={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.16em',
              textTransform: 'uppercase', color: '#8A7748', marginBottom: 6,
            }}>
              The day’s line
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, lineHeight: 1.36, color: '#FBF0D6' }}>
              <AuroraWords text={line?.text || ''} start={60} step={40} />
            </div>
          </div>

          <div style={{ flex: '1 1 240px', minWidth: 220 }}>
            {mode === 'installed' ? (
              <>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#F3ECDB', marginBottom: 5 }}>
                  Added. Open LexForge from your home screen.
                </div>
                <p style={{ fontSize: 12.5, color: '#B0A488', lineHeight: 1.55, margin: 0 }}>
                  Your widgets are on the dashboard, and the day’s line arrives at 8 AM
                  as a notification — turn that on below if you have not already.
                </p>
              </>
            ) : mode === 'ios' ? (
              <>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#F3ECDB', marginBottom: 5 }}>
                  Put LexForge on your Home Screen
                </div>
                <p style={{ fontSize: 12.5, color: '#B0A488', lineHeight: 1.6, margin: '0 0 10px' }}>
                  In Safari, tap <b style={{ color: '#E0B84A' }}>Share</b>, then{' '}
                  <b style={{ color: '#E0B84A' }}>Add to Home Screen</b>. Open it from
                  there and your widgets, and the 8 AM line, come with it.
                </p>
                <p style={{ fontSize: 11.5, color: '#7E7259', lineHeight: 1.55, margin: '0 0 12px' }}>
                  iPhone does not let any web app place a widget on the Home Screen
                  itself — only Apple’s own native widgets can go there. The icon,
                  the shortcuts and the daily notification are what a web app gets.
                </p>
                <button type="button" style={btn(false)} onClick={snooze}>Not now</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#F3ECDB', marginBottom: 5 }}>
                  Add LexForge to your home screen
                </div>
                <p style={{ fontSize: 12.5, color: '#B0A488', lineHeight: 1.6, margin: '0 0 10px' }}>
                  One tap and it installs like an app: your widget wall, offline access
                  to your drafts, and the day’s line at 8 AM. Long-press the icon
                  afterwards for a new draft, study, or your court dates.
                </p>
                <p style={{ fontSize: 11.5, color: '#7E7259', lineHeight: 1.55, margin: '0 0 12px' }}>
                  Android does not allow a web app to place its own widget on the home
                  screen — that needs a native app. You get the icon, its shortcuts,
                  and the daily notification.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={btn(true)} disabled={busy} onClick={install}>
                    {busy ? 'Adding…' : 'Add to home screen'}
                  </button>
                  <button type="button" style={btn(false)} onClick={snooze}>Not now</button>
                </div>
              </>
            )}
          </div>
        </div>
      </AuroraWidget>
    </div>
  )
}
