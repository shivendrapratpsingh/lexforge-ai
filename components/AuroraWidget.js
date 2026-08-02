'use client'

import { Fragment } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────
//  Aurora widget — the chassis every tile on the dashboard wall uses.
//
//  A slow forge-glow drifts behind the tile; the words rise out of
//  depth one at a time when it appears, then hold and shimmer. The
//  entry stagger is what carries the depth, so it runs once and stops —
//  live data has to stay readable all day, and text that keeps fading
//  out is text nobody trusts.
//
//  Motion lives in globals.css (.lf-aurora*) so every tile shares one
//  set of keyframes rather than each shipping its own.
// ─────────────────────────────────────────────────────────────────

// Each accent is a pair: the two lights that make up the drifting veil.
// Kept small and named so tiles are recognisable by colour at a glance.
const ACCENTS = {
  gold:   ['rgba(212,160,23,.72)', 'rgba(255,233,176,.42)', '#D4A017'],
  ember:  ['rgba(226,118,27,.72)', 'rgba(255,190,110,.40)', '#E2761B'],
  violet: ['rgba(139,92,246,.60)', 'rgba(190,150,255,.34)', '#A98BF6'],
  azure:  ['rgba(76,141,217,.60)', 'rgba(150,200,255,.34)', '#6BA6E8'],
  jade:   ['rgba(63,166,107,.58)', 'rgba(150,230,185,.32)', '#4FB87C'],
}

function Veil({ accent = 'gold' }) {
  const [a, b] = ACCENTS[accent] || ACCENTS.gold
  return (
    <div
      className="lf-aurora__veil"
      aria-hidden="true"
      style={{
        background: `
          radial-gradient(30% 36% at 22% 32%, ${a}, transparent 62%),
          radial-gradient(32% 32% at 76% 66%, ${b}, transparent 62%),
          radial-gradient(24% 26% at 54% 14%, rgba(255,233,176,.3), transparent 62%)`,
      }}
    />
  )
}

/**
 * Splits a string into per-word spans with a staggered rise.
 * `start` offsets the stagger so a tile's heading and body can rise in
 * sequence rather than on top of each other.
 */
export function AuroraWords({ text, start = 0, step = 55, style }) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  // A real space between the spans, not a margin: a margin looks the same
  // but leaves no whitespace in the DOM, so the line copies and is read
  // aloud as one run-together word.
  return words.map((word, i) => (
    <Fragment key={`${word}-${i}`}>
      <span
        className="lf-aurora__w"
        style={{
          animationDelay: `${start + i * step}ms, ${(start + i * step) % 2400}ms`,
          ...style,
        }}
      >
        {word}
      </span>
      {i < words.length - 1 ? ' ' : null}
    </Fragment>
  ))
}

export default function AuroraWidget({
  kicker,
  accent = 'gold',
  href,
  children,
  className = '',
  minHeight = 132,
  footer,
}) {
  const tone = ACCENTS[accent] || ACCENTS.gold

  const inner = (
    <div
      className={`lf-aurora ${className}`}
      style={{
        minHeight,
        height: '100%',
        borderRadius: 16,
        border: '1px solid #262114',
        background: 'linear-gradient(158deg,#161209 0%,#0C0A07 64%)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        color: '#F3ECDB',
        textDecoration: 'none',
      }}
    >
      <Veil accent={accent} />
      <div className="lf-aurora__body" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
        {kicker && (
          <div style={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase',
            color: tone[2], display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {kicker}
          </div>
        )}
        {children}
        {footer && (
          <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 11, color: '#8A7C5A' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  // A tile that goes somewhere is a link; one that doesn't isn't, so
  // nothing shows a pointer cursor it can't honour. The link has to carry
  // height:100% or it collapses to its content and the row stops
  // stretching its tiles to a common height.
  return href ? (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</Link>
  ) : inner
}
