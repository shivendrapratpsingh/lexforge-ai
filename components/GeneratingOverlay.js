'use client'

import { useEffect, useMemo, useState } from 'react'
import { findApplicableLaws } from '@/lib/indian-laws'
import { LEGAL_PRINCIPLES, LANDMARK_JUDGMENTS } from '@/lib/study-content'

// ─────────────────────────────────────────────────────────────────
//  Pro-tier generation overlay.
//
//  Free users keep the plain inline "⚙ Generating with AI…" button
//  state (deliberately unchanged). Pro users get a law-themed
//  animation that also does real work for them: it shows which Indian
//  statutes actually apply to the facts they typed (computed locally
//  from the same catalog that grounds the AI prompt) and rotates a
//  landmark judgment / doctrine so the waiting time teaches something.
//
//  All animation is CSS-only (no dependencies) and is disabled under
//  prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'facts',      label: 'Reading your case facts',        icon: '📑' },
  { key: 'statutes',   label: 'Identifying applicable statutes', icon: '⚖️' },
  { key: 'precedent',  label: 'Applying binding precedent',      icon: '🏛️' },
  { key: 'drafting',   label: 'Drafting in court format',        icon: '✒️' },
  { key: 'verifying',  label: 'Verifying prayer & verification',  icon: '🔍' },
]

export default function GeneratingOverlay({ open, isPro, documentType, details = '', courtLabel = '' }) {
  const [stage, setStage] = useState(0)
  const [tick, setTick] = useState(0)

  // Real statutes for the facts the user actually entered — same catalog
  // that grounds the AI prompt, so what they see is what the draft cites.
  const laws = useMemo(() => {
    if (!open) return []
    try { return findApplicableLaws(`${documentType || ''} ${details || ''}`, 4) } catch { return [] }
  }, [open, documentType, details])

  // A landmark judgment + a doctrine, rotated while waiting.
  const knowledge = useMemo(() => {
    const j = LANDMARK_JUDGMENTS[Math.floor(Math.random() * LANDMARK_JUDGMENTS.length)]
    const p = LEGAL_PRINCIPLES[Math.floor(Math.random() * LEGAL_PRINCIPLES.length)]
    return [
      j && { kind: 'Landmark judgment', title: `${j.name} (${j.year})`, body: j.ratio || j.holding },
      p && { kind: 'Doctrine',          title: p.name,                  body: p.definition },
    ].filter(Boolean)
  }, [tick])

  useEffect(() => {
    if (!open) { setStage(0); return }
    const s = setInterval(() => setStage(x => (x < STAGES.length - 1 ? x + 1 : x)), 4200)
    const k = setInterval(() => setTick(x => x + 1), 9000)
    return () => { clearInterval(s); clearInterval(k) }
  }, [open])

  if (!open || !isPro) return null

  const card = knowledge[tick % Math.max(1, knowledge.length)]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Generating your document"
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(6,6,6,0.86)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <style>{`
        @keyframes lfScale   { 0%,100%{transform:rotate(-9deg)} 50%{transform:rotate(9deg)} }
        @keyframes lfRise    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lfSweep   { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        @keyframes lfPulseLF { 0%,100%{opacity:.35} 50%{opacity:1} }
        @media (prefers-reduced-motion: reduce) {
          .lf-anim, .lf-anim * { animation: none !important; }
        }
      `}</style>

      <div className="lf-anim" style={{
        width: '100%', maxWidth: 520, background: '#111', border: '1px solid #2A2A2A',
        borderRadius: 18, padding: '28px 24px', boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
      }}>
        {/* Scales of justice */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true">
            <g stroke="#D4A017" strokeWidth="2.2" fill="none" strokeLinecap="round">
              <line x1="32" y1="10" x2="32" y2="50" />
              <line x1="20" y1="52" x2="44" y2="52" />
              <g style={{ animation: 'lfScale 2.6s ease-in-out infinite', transformOrigin: '32px 16px' }}>
                <line x1="12" y1="16" x2="52" y2="16" />
                <path d="M12 16 L5 29 h14 Z" />
                <path d="M52 16 L45 29 h14 Z" />
              </g>
              <circle cx="32" cy="10" r="2.6" fill="#D4A017" />
            </g>
          </svg>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0', letterSpacing: 0.2 }}>
            Drafting your {String(documentType || 'document').replace(/_/g, ' ').toLowerCase()}
          </div>
          <div style={{ fontSize: 12, color: '#6A6A6A', marginTop: 3 }}>
            {courtLabel ? `${courtLabel} · ` : ''}Senior-Advocate register · Pro
          </div>
        </div>

        {/* Indeterminate progress sweep */}
        <div style={{ height: 3, background: '#1C1C1C', borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{
            height: '100%', width: '33%', borderRadius: 4,
            background: 'linear-gradient(90deg, transparent, #D4A017, transparent)',
            animation: 'lfSweep 1.6s linear infinite',
          }} />
        </div>

        {/* Stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {STAGES.map((s, i) => {
            const done = i < stage
            const active = i === stage
            return (
              <div key={s.key} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: done ? '#4CAF50' : active ? '#D4A017' : '#4A4A4A',
                fontWeight: active ? 700 : 500,
                animation: active ? 'lfPulseLF 1.8s ease-in-out infinite' : 'none',
              }}>
                <span style={{ width: 18, textAlign: 'center' }}>{done ? '✓' : s.icon}</span>
                <span>{s.label}</span>
              </div>
            )
          })}
        </div>

        {/* Statutes actually being applied */}
        {laws.length > 0 && (
          <div style={{
            background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.22)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#D4A017', letterSpacing: 1.1, marginBottom: 7 }}>
              STATUTES BEING APPLIED
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {laws.map((l, i) => (
                <div key={l.id} style={{ fontSize: 11.5, color: '#C8C8C8', animation: `lfRise .4s ease-out ${i * 0.12}s both` }}>
                  • {l.fullName.replace(/\s*\(.*?\)\s*$/, '')}
                  {l.keySections?.[0] ? <span style={{ color: '#7A7A7A' }}> — {l.keySections[0].n}</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rotating knowledge card */}
        {card && (
          <div key={tick} style={{
            background: '#0D0D0D', border: '1px solid #232323', borderRadius: 12,
            padding: '12px 14px', animation: 'lfRise .45s ease-out both',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#5A5A5A', letterSpacing: 1.1, marginBottom: 5 }}>
              {card.kind.toUpperCase()} · WHILE YOU WAIT
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#D4A017', marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 11.5, color: '#9A9A9A', lineHeight: 1.6 }}>
              {String(card.body || '').slice(0, 230)}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 10.5, color: '#4A4A4A', marginTop: 14 }}>
          Typically 15–30 seconds. Please keep this tab open.
        </div>
      </div>
    </div>
  )
}
