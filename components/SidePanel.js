'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SidebarNav from '@/components/SidebarNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { SignOutButton } from '@/components/SignOutButton'
import { cn } from '@/lib/cn'

const AUTO_HIDE_MS = 2000

// Global overlay side panel, same on phone and desktop.
//
// It never reserves layout space — <main> in the dashboard layout is
// always full width/height. This just floats a fixed-position drawer
// on top of the content (z-40) when open; the page underneath stays
// scrollable and clickable since there's no full-screen backdrop.
//
// Behavior:
//   - A ☰ toggle (top-left) opens it. Once open, that button is
//     replaced by a clearly-labeled "✕ Close" button INSIDE the panel's
//     own header — not a second button floating in the same corner,
//     which just looked like it overlapped the logo and was easy to miss.
//   - On mice/trackpads (devices that actually support :hover), resting
//     the cursor on the panel cancels the 2s auto-hide countdown, and
//     moving off restarts it. On touch devices we skip that entirely:
//     iOS/Android simulate a "hover" on the first tap but never send a
//     matching hover-leave, which was leaving the panel stuck open until
//     you happened to find the (overlapping, easy-to-miss) toggle. Touch
//     users get the plain 2s auto-hide + the explicit Close button + tapping
//     a link, all of which work regardless of that quirk.
//   - Clicking a nav link inside closes the panel immediately.
export default function SidePanel({ navLinks, session, tier, tierLbl, pro, labels }) {
  const [open, setOpen] = useState(false)
  const [canHover, setCanHover] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    setCanHover(mq.matches)
  }, [])

  const cancelClose = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

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

  const initial = (session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()

  return (
    <>
      {/* Open toggle — only rendered while closed, so it never sits on
          top of the panel's own header once open. */}
      {!open && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Open menu"
          className="fixed top-4 left-4 z-50 size-11 rounded-full bg-[#090909] border border-border shadow-lg flex items-center justify-center text-ink"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      )}

      {/* Overlay panel */}
      <aside
        onMouseEnter={canHover ? cancelClose : undefined}
        onMouseLeave={canHover ? scheduleClose : undefined}
        onClickCapture={(e) => { if (e.target.closest('a')) closeNow() }}
        aria-hidden={!open}
        className={cn(
          'fixed top-0 left-0 h-screen w-64 max-w-[70vw] bg-[#090909] border-r border-border flex flex-col z-40 shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        {/* Logo + explicit Close button (big, obvious, always in the same spot) */}
        <div className="p-3 border-b border-border shrink-0 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="no-underline flex items-center gap-2 min-w-0">
            <div className="size-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-black text-[13px]">LF</span>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold text-ink leading-tight truncate">LexForge</div>
              <div className="text-[10px] text-gold font-bold tracking-[1.5px]">AI LEGAL</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={closeNow}
            aria-label="Close menu"
            className="shrink-0 h-8 px-2.5 rounded-btn bg-surface border border-border-gold text-ink-muted text-xs font-bold flex items-center gap-1"
          >
            <span>✕</span> Close
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 min-h-0">
          <SidebarNav links={navLinks} />
        </div>

        {/* Generate Document CTA */}
        <div className="px-2.5 pb-3 shrink-0">
          <Link
            href="/new-draft"
            title={labels.generateDocument}
            className="flex items-center justify-start gap-2 h-11 px-3 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-btn no-underline text-gold text-[13px] font-bold"
          >
            <span>✦</span> <span>{labels.generateDocument}</span>
          </Link>
        </div>

        {/* Language switcher + user info + sign out */}
        <div className="px-2.5 pt-3 pb-4 border-t border-border shrink-0 bg-[#090909]">
          <LanguageSwitcher />

          <div className="flex items-center gap-2.5 p-2.5 rounded-btn bg-surface mb-1.5">
            <div className="size-8 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
              <span className="text-base font-extrabold text-[13px]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink-muted flex items-center gap-1.5">
                <span className="truncate">{session.user?.name || labels.user}</span>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wide shrink-0',
                  tier === 'free' ? 'bg-surface-2 text-ink-faint' : 'bg-gold/15 text-gold'
                )}>{tierLbl}</span>
              </div>
              <div className="text-[11px] text-ink-faint truncate">{session.user?.email}</div>
            </div>
          </div>
          {!pro && (
            <Link
              href="/upgrade"
              className="block text-center py-2 px-3 mb-1.5 bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 rounded-btn no-underline text-gold text-xs font-bold"
            >
              {labels.upgradeToPro}
            </Link>
          )}
          <SignOutButton />
        </div>
      </aside>
    </>
  )
}
