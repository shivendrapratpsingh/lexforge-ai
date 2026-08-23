// ─────────────────────────────────────────────────────────────────
//  An exploded law book.
//
//  The product's whole claim is that it takes a statute apart — the
//  cover, the sections, the judgments that interpret them, the draft
//  that comes out — so the hero image is a law book with its layers
//  pulled apart and floating.
//
//  Inline SVG rather than an image file: it is a few kilobytes, stays
//  sharp on any screen, needs no network request on the one page where
//  load time decides whether a stranger stays, and its colours come from
//  the same palette as the rest of the site.
//
//  The float is CSS on a group, so `prefers-reduced-motion` can stop it
//  without touching the drawing.
// ─────────────────────────────────────────────────────────────────

const GOLD = '#D4A017'
const GOLD_DIM = '#8A6A12'
const PAPER = '#F3EEE2'
const PAPER_EDGE = '#D8CFB8'
const INK = '#1A1713'

export default function ExplodedLawBook({ className = '' }) {
  // Each layer: vertical offset, how far it drifts, and how long it takes.
  // Staggered so the stack breathes rather than pulsing as one object.
  const layers = [
    { id: 'cover',  y: 0,   dur: '7s',   delay: '0s'   },
    { id: 'pages1', y: -34, dur: '8s',   delay: '.6s'  },
    { id: 'pages2', y: -66, dur: '7.5s', delay: '1.2s' },
    { id: 'pages3', y: -98, dur: '9s',   delay: '1.8s' },
  ]

  return (
    <svg
      className={className}
      viewBox="0 0 420 380"
      role="img"
      aria-label="A law book with its cover, pages and sections separated into floating layers"
      style={{ width: '100%', height: 'auto', maxWidth: 460, display: 'block' }}
    >
      <style>{`
        @keyframes lf-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
        .lf-layer { animation: lf-float var(--d) ease-in-out infinite; animation-delay: var(--delay); }
        @media (prefers-reduced-motion: reduce) { .lf-layer { animation: none } }
      `}</style>

      <defs>
        <linearGradient id="lf-leather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A2E14" />
          <stop offset="55%" stopColor="#241C0C" />
          <stop offset="100%" stopColor="#15100A" />
        </linearGradient>
        <linearGradient id="lf-paper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={PAPER} />
          <stop offset="100%" stopColor="#E6DFCC" />
        </linearGradient>
        <linearGradient id="lf-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.30" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The light the stack sits in */}
      <ellipse cx="210" cy="300" rx="150" ry="26" fill="url(#lf-glow)" />

      {/* ── The cover, at the bottom ──────────────────────────── */}
      <g className="lf-layer" style={{ '--d': layers[0].dur, '--delay': layers[0].delay }}>
        <path d="M60 250 L210 290 L360 250 L210 212 Z" fill="url(#lf-leather)" stroke={GOLD_DIM} strokeWidth="1.4" />
        <path d="M60 250 L210 290 L210 300 L60 260 Z" fill="#0F0B06" />
        <path d="M360 250 L210 290 L210 300 L360 260 Z" fill="#1C1509" />
        {/* Scales of justice, embossed */}
        <g stroke={GOLD} strokeWidth="1.6" fill="none" opacity="0.85" transform="translate(210 249) scale(0.9)">
          <line x1="0" y1="-13" x2="0" y2="9" />
          <line x1="-16" y1="-7" x2="16" y2="-7" />
          <path d="M-16 -7 L-22 4 L-10 4 Z" />
          <path d="M16 -7 L10 4 L22 4 Z" />
          <line x1="-8" y1="9" x2="8" y2="9" />
        </g>
      </g>

      {/* ── Three page blocks, drifting ───────────────────────── */}
      {layers.slice(1).map((l, i) => (
        <g key={l.id} className="lf-layer" style={{ '--d': l.dur, '--delay': l.delay }}>
          <path
            d={`M72 ${250 + l.y} L210 ${286 + l.y} L348 ${250 + l.y} L210 ${214 + l.y} Z`}
            fill="url(#lf-paper)" stroke={PAPER_EDGE} strokeWidth="1"
          />
          {/* Lines of statute — shorter as they recede, so it reads as text */}
          {[0, 1, 2, 3].map(n => (
            <line
              key={n}
              x1={150 - n * 4} y1={244 + l.y + n * 7}
              x2={268 - n * 14} y2={252 + l.y + n * 7}
              stroke={INK} strokeOpacity={0.30 - n * 0.05} strokeWidth="2.4" strokeLinecap="round"
            />
          ))}
          {/* A section marker on the leading edge */}
          <circle cx={118 + i * 4} cy={252 + l.y} r="3.4" fill={GOLD} opacity={0.75} />
        </g>
      ))}

      {/* ── What comes out: a finished draft ──────────────────── */}
      <g className="lf-layer" style={{ '--d': '6.5s', '--delay': '2.4s' }}>
        <rect x="168" y="60" width="84" height="106" rx="4"
              fill={PAPER} stroke={GOLD} strokeWidth="1.5" />
        <rect x="168" y="60" width="84" height="13" rx="4" fill={GOLD} opacity="0.9" />
        {[0, 1, 2, 3, 4, 5].map(n => (
          <line key={n} x1="178" y1={88 + n * 12} x2={n % 3 === 2 ? 218 : 242} y2={88 + n * 12}
                stroke={INK} strokeOpacity="0.34" strokeWidth="2.2" strokeLinecap="round" />
        ))}
        {/* The seal on a filed document */}
        <circle cx="236" cy="152" r="9" fill="none" stroke={GOLD} strokeWidth="1.6" opacity="0.9" />
        <circle cx="236" cy="152" r="4" fill={GOLD} opacity="0.55" />
      </g>

      {/* Threads tying the statute to the draft it produced */}
      <g stroke={GOLD} strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 5" fill="none">
        <path d="M210 166 C 210 182, 206 190, 210 206" />
        <path d="M186 170 C 176 190, 172 196, 168 214" />
        <path d="M234 170 C 244 190, 248 196, 252 214" />
      </g>
    </svg>
  )
}
