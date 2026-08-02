'use client'

import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────
//  Ambient sparks — the forge never goes cold.
//
//  The same sparks that are struck into the app icon keep falling
//  behind the whole app: they drift in from the edges, brighten,
//  cool and fade, continuously. Slow on purpose — this is atmosphere,
//  not motion the eye should follow.
//
//  Drawn on one canvas rather than as DOM nodes: twenty-odd animated
//  elements would each cost layout and paint, while a single canvas
//  costs one composited layer.
//
//  The layer sits at z-index 25 — over the page and its cards (behind
//  them the sparks are simply invisible on a phone, where cards span the
//  full width), but under the sticky header at 30 and every drawer,
//  sheet and modal above that. It composites with `screen`, so a spark
//  only ever ADDS light: it glows on the dark ground and all but
//  disappears where it crosses pale text, which keeps type legible.
//  Pointer events are off, so it never eats a tap.
// ─────────────────────────────────────────────────────────────────

const GOLD = [
  [255, 243, 201],   // pale strike
  [255, 210, 122],   // ember
  [240, 197, 96],    // cooling brass
]

export default function AmbientSparks() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0, dpr = 1
    let sparks = []
    let raf = 0
    let last = performance.now()

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Density by area, so a phone doesn't get a desktop's worth of sparks.
      const target = Math.max(9, Math.min(26, Math.round((w * h) / 62000)))
      if (sparks.length > target) sparks.length = target
      while (sparks.length < target) sparks.push(spawn(true))
    }

    // Sparks enter from the left and right edges and fall. `seeded` scatters
    // the first batch across the screen so the app doesn't open to an empty
    // sky that slowly fills.
    const spawn = (seeded = false) => {
      const fromLeft = Math.random() < 0.5
      // Cubed, so they cluster hard against the edges and leave the middle
      // column — where the reading happens — largely clear.
      const edgeBias = Math.pow(Math.random(), 3)
      const x = fromLeft ? edgeBias * w * 0.5 : w - edgeBias * w * 0.5
      const life = 5200 + Math.random() * 6800
      return {
        x,
        y: seeded ? Math.random() * h : -14 - Math.random() * 60,
        r: 0.9 + Math.random() * 2.1,
        vy: 7 + Math.random() * 13,                       // px per second — slow
        vx: (fromLeft ? 1 : -1) * (1 + Math.random() * 5),
        life,
        age: seeded ? Math.random() * life : 0,
        peak: 0.3 + Math.random() * 0.4,
        // Each spark has its own twinkle so they never pulse in unison.
        twRate: 0.7 + Math.random() * 1.7,
        twPhase: Math.random() * Math.PI * 2,
        tint: GOLD[(Math.random() * GOLD.length) | 0],
        flare: Math.random() < 0.3,
      }
    }

    const draw = (s) => {
      // Fade in over the first fifth of life, fade out over the last third.
      const p = s.age / s.life
      const envelope = p < 0.2 ? p / 0.2 : p > 0.67 ? (1 - p) / 0.33 : 1
      const twinkle = 0.62 + 0.38 * Math.sin(s.twPhase + (s.age / 1000) * s.twRate * Math.PI)
      const a = Math.max(0, s.peak * envelope * twinkle)
      if (a <= 0.01) return

      const [r, g, b] = s.tint
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
      glow.addColorStop(0, `rgba(${r},${g},${b},${a})`)
      glow.addColorStop(0.35, `rgba(${r},${g},${b},${a * 0.34})`)
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, a * 1.5)})`
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()

      // The brightest few get the icon's four-point flare.
      if (s.flare && a > 0.3) {
        const len = s.r * 7
        ctx.strokeStyle = `rgba(${r},${g},${b},${a * 0.5})`
        ctx.lineWidth = 0.7
        ctx.beginPath()
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y)
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len)
        ctx.stroke()
      }
    }

    const frame = (now) => {
      // Clamp: a backgrounded tab resumes with a huge delta that would
      // teleport every spark off-screen at once.
      const dt = Math.min(now - last, 50)
      last = now
      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i]
        s.age += dt
        s.y += (s.vy * dt) / 1000
        s.x += (s.vx * dt) / 1000
        if (s.age >= s.life || s.y > h + 20) sparks[i] = spawn()
        else draw(s)
      }
      raf = requestAnimationFrame(frame)
    }

    resize()

    if (reduced) {
      // Still lit, just not moving.
      ctx.clearRect(0, 0, w, h)
      sparks.forEach(s => { s.twPhase = 0; draw(s) })
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame) }
    }

    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 25,
        pointerEvents: 'none', display: 'block',
        mixBlendMode: 'screen',
      }}
    />
  )
}
