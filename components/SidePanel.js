'use client'

import { useCallback, useRef, useState } from 'react'
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
//   - A toggle button (top-left, always visible) opens/closes it.
//   - Once opened, it auto-hides after 2s UNLESS the cursor is resting
//     on the panel/one of its options — entering the panel cancels the
//     countdown, leaving it restarts the 2s countdown.
//   - Clicking a nav link inside closes the panel (so it never lingers
//     on top of the page you navigated to).
export default function SidePanel({ navLinks, session, tier, tierLbl, pro, labels }) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef(null)

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
      {/* Toggle — fixed on every breakpoint, floats above content */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="fixed top-4 left-4 z-50 size-11 rounded-full bg-[#090909] border border-border shadow-lg flex items-center justify-center text-ink"
      >
        <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
      </button>

      {/* Overlay panel */}
      <aside
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onClickCapture={(e) => { if (e.target.closest('a')) closeNow() }}
        aria-hidden={!open}
        className={cn(
          'fixed top-0 left-0 h-screen w-72 max-w-[85vw] bg-[#090909] border-r border-border flex flex-col z-40 shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        {/* Logo */}
        <div className="p-4 lg:px-5 lg:py-[22px] border-b border-border shrink-0 flex items-center">
          <Link href="/dashboard" className="no-underline flex items-center gap-2.5">
            <div className="size-8 lg:size-[34px] bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-black text-[13px]">LF</span>
            </div>
            <div>
              <div className="text-[15px] font-extrabold text-ink leading-tight">LexForge</div>
              <div className="text-[10px] text-gold font-bold tracking-[1.5px]">AI LEGAL</div>
            </div>
          </Link>
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
