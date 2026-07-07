'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

const AUTO_HIDE_MS = 2000

// Mobile-only nav drawer for the public landing page. The desktop nav
// already shows Features / Document Types / Sign In inline, but on
// phones that row collapses to a single "Start Drafting" button —
// Features, Document Types, and Sign In become unreachable. This gives
// phone visitors a toggle to reach them.
//
// Same fix as the dashboard SidePanel: the ☰ toggle only renders while
// closed (once open, the panel has its own obvious ✕ close button, so
// there's never a moment where two buttons overlap in the same corner),
// and the hover-based auto-hide cancel only wires up on devices that
// actually support :hover — on touch, the browser's first-tap "hover"
// simulation has no matching hover-leave, which was leaving the panel
// stuck open until you happened to find the toggle again.
export default function LandingSidePanel() {
  const [open, setOpen] = useState(false)
  const [canHover, setCanHover] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    setCanHover(mq.matches)
  }, [])

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
      {!open && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Open menu"
          className="size-10 rounded-full bg-surface-2 border border-border flex items-center justify-center text-ink"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      )}

      {/* Overlay panel — floats above the page content, which stays scrollable */}
      <div
        onMouseEnter={canHover ? cancelClose : undefined}
        onMouseLeave={canHover ? scheduleClose : undefined}
        onClickCapture={(e) => { if (e.target.closest('a')) closeNow() }}
        aria-hidden={!open}
        className={cn(
          'fixed top-0 right-0 h-screen w-64 max-w-[70vw] bg-[#0D0D0D] border-l border-border z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-ink text-sm">Menu</span>
          <button
            type="button"
            onClick={closeNow}
            aria-label="Close menu"
            className="h-8 px-2.5 rounded-btn bg-surface-2 border border-border text-ink-muted text-xs font-bold flex items-center gap-1"
          >
            <span>✕</span> Close
          </button>
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
