'use client'

import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────
//  Launch splash — the moment after the home-screen icon is tapped.
//
//  A home-screen icon cannot animate on iOS or Android (the launcher
//  draws a static image; there is no API for anything else), so the
//  sparks are struck into the icon art itself and then actually fly
//  here, on the first frame of the app. Tapping the icon reads as one
//  continuous motion: static sparks on the springboard, the same sparks
//  bursting outward as it opens.
//
//  Shown only for the INSTALLED app (standalone display-mode), once per
//  launch — not on every client-side navigation, and never in a normal
//  browser tab where there was no icon to tap.
// ─────────────────────────────────────────────────────────────────

// Fixed, not random: a Math.random() here would differ between the server
// render and the client hydration and throw a hydration mismatch.
const SPARKS = [
  { a: -90,  d: 128, s: 9,  t: 0    }, { a: -38, d: 150, s: 7,  t: 0.05 },
  { a: 14,   d: 134, s: 8,  t: 0.02 }, { a: 58,  d: 158, s: 6,  t: 0.09 },
  { a: 104,  d: 122, s: 7,  t: 0.04 }, { a: 148, d: 146, s: 8,  t: 0.11 },
  { a: -142, d: 138, s: 6,  t: 0.07 }, { a: 178, d: 116, s: 5,  t: 0.14 },
  { a: -66,  d: 186, s: 5,  t: 0.16 }, { a: 34,  d: 192, s: 5,  t: 0.13 },
  { a: 126,  d: 176, s: 4,  t: 0.19 }, { a: -160, d: 182, s: 4, t: 0.17 },
  { a: -14,  d: 210, s: 4,  t: 0.22 }, { a: 86,  d: 206, s: 4,  t: 0.24 },
]

export default function LaunchSplash() {
  const [phase, setPhase] = useState('idle')   // idle | in | out

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    // ?splash replays it in a normal tab (so it can be previewed without
    // installing); ?splash=hold leaves it up instead of dismissing.
    const forced = new URLSearchParams(window.location.search).get('splash')
    if (!standalone && forced === null) return
    if (forced === null && sessionStorage.getItem('lf-splash')) return
    sessionStorage.setItem('lf-splash', '1')

    setPhase('in')
    if (forced === 'hold') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduced ? 260 : 1150
    const t1 = setTimeout(() => setPhase('out'), hold)
    const t2 = setTimeout(() => setPhase('done'), hold + 420)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'idle' || phase === 'done') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'grid', placeItems: 'center',
        background: 'radial-gradient(ellipse at 50% 62%, #241C0E 0%, #0B0A07 62%)',
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 400ms ease',
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes lfMarkIn { 0%{transform:scale(.82);opacity:0} 55%{transform:scale(1.04);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes lfFly    { 0%{transform:translate(0,0) scale(.3);opacity:0}
                              18%{opacity:1}
                              100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0} }
        @keyframes lfGlow   { 0%,100%{opacity:.34} 50%{opacity:.6} }
        @media (prefers-reduced-motion: reduce){
          .lf-splash *{animation:none !important}
        }
      `}</style>

      <div className="lf-splash" style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
        {/* forge glow */}
        <div style={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(226,118,27,.5) 0%, rgba(226,118,27,0) 68%)',
          animation: 'lfGlow 1.6s ease-in-out infinite',
        }} />

        {/* the sparks that were struck into the icon, now flying */}
        {SPARKS.map((sp, i) => {
          const rad = (sp.a * Math.PI) / 180
          return (
            <span key={i} style={{
              position: 'absolute', width: sp.s, height: sp.s, borderRadius: '50%',
              background: i % 3 === 0 ? '#FFF3C9' : '#FFD27A',
              boxShadow: '0 0 10px rgba(255,210,122,.9)',
              '--dx': `${Math.cos(rad) * sp.d}px`,
              '--dy': `${Math.sin(rad) * sp.d}px`,
              // Infinite: the sparks keep being thrown for as long as the
              // splash is up, rather than firing one burst and going dark.
              animation: `lfFly 1.15s cubic-bezier(.16,.7,.3,1) ${sp.t}s infinite both`,
            }} />
          )
        })}

        {/* the mark itself */}
        <img
          src="/icon-192.png" alt="" width={104} height={104}
          style={{
            position: 'relative', borderRadius: '23%', display: 'block',
            boxShadow: '0 18px 50px rgba(0,0,0,.6)',
            animation: 'lfMarkIn 620ms cubic-bezier(.2,.8,.25,1) both',
          }}
        />
      </div>

      <div style={{
        position: 'absolute', bottom: 'max(48px, env(safe-area-inset-bottom))',
        fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: '.14em',
        color: '#7A6636', textTransform: 'uppercase',
      }}>
        LexForge AI
      </div>
    </div>
  )
}
