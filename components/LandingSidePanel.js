'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

const AUTO_HIDE_MS = 2000

// Mobile-only nav drawer for the public landing page. The desktop nav
// already shows Features / Document Types / Sign In inline, but on
// phones that row collapses to a single "Start Drafting" button —
// Features, Document Types, and Sign In become unreachable. This gives
// phone visitors a toggle to reach them, using the same overlay +
// 2s-hover-auto-hide pattern as the dashboard's SidePanel.
export default function LandingSidePanel() {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

  const cancelClose = useCallback(() => clearTimeout(timerRef.current), [])
  const scheduleClose = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpen(false), AUTO_HIDE_MS)
  }, [])

  function toggle() {
    setOpen(prev => {
      const next = !prev
      if (next) scheduleClose()
      else cancelClose()
      return next
    })
  }

  function closeNow() {
    cancelClose()
    setOpen(false)
  }

  const links = [
    { href: '#features', label: 'Features' },
    { href: '#documents', label: 'Document Types' },
    { href: '/login', label: 'Sign In' },
    { href: '/register', label: 'Get Started Free' },
  ]

  return (
    <div className="lg:hidden">
      {/* Toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="size-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-ink"
      >
        <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
      </button>

      {/* Overlay panel — floats above the page content, which stays scrollable */}
      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onClickCapture={(e) => { if (e.target.closest('a')) closeNow() }}
        aria-hidden={!open}
        className={cn(
          'fixed top-0 right-0 h-screen w-64 max-w-[80vw] bg-[#0D0D0D] border-l border-border z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-ink text-sm">Menu</span>
          <button type="button" onClick={closeNow} aria-label="Close menu" className="size-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted">✕</button>
        </div>
        <nav className="flex flex-col p-3 gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-3 rounded-btn text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink no-underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
