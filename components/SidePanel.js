'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SidebarNav from '@/components/SidebarNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { SignOutButton } from '@/components/SignOutButton'
import { cn } from '@/lib/cn'

// Global overlay side drawer — behaves like a native app drawer.
//
// Behavior:
//   - On phones (< md) it opens from a fixed top app bar (☰ + brand),
//     so the toggle never floats over page content. On md:+ the old
//     floating ☰ circle is kept.
//   - The drawer STAYS OPEN until the user dismisses it — there is no
//     auto-hide timer (the old 2s auto-hide relied on hover to cancel,
//     which touch devices don't have, so on phones the panel closed
//     itself before anything could be tapped).
//   - Dismissal: tap the dimmed backdrop, the ✕ button, a nav link,
//     press Escape, or swipe the panel left (finger-tracked 1:1).
//   - Page scroll is locked while open; safe-area insets respected.
export default function SidePanel({ navLinks, session, tier, tierLbl, pro, labels }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  // Swipe-to-close drag state — kept in a ref and applied imperatively so
  // the panel tracks the finger without re-rendering on every touchmove.
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0, horizontal: null })

  const closeNow = useCallback(() => setOpen(false), [])

  // Lock page scroll while the drawer is open so the content underneath
  // doesn't scroll on touch devices.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Escape closes (hardware keyboards / desktop).
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // ── Swipe-left-to-close ────────────────────────────────────────
  function onTouchStart(e) {
    if (e.touches.length !== 1) return
    drag.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, dx: 0, horizontal: null }
  }
  function onTouchMove(e) {
    const d = drag.current
    if (!d.active) return
    const dx = e.touches[0].clientX - d.startX
    const dy = e.touches[0].clientY - d.startY
    // Decide once whether this gesture is horizontal (drag panel) or
    // vertical (let the nav list scroll normally).
    if (d.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      d.horizontal = Math.abs(dx) > Math.abs(dy)
    }
    if (!d.horizontal) return
    d.dx = Math.min(0, dx) // only allow dragging left (towards closed)
    const el = panelRef.current
    if (el) {
      el.style.transitionDuration = '0ms'
      el.style.transform = `translateX(${d.dx}px)`
    }
  }
  function onTouchEnd() {
    const d = drag.current
    const el = panelRef.current
    drag.current = { active: false, startX: 0, startY: 0, dx: 0, horizontal: null }
    if (!el) return
    el.style.transitionDuration = ''
    el.style.transform = ''
    if (d.horizontal && d.dx < -64) setOpen(false)
  }

  const initial = (session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()

  return (
    <>
      {/* ── Mobile top app bar (< md) — fixed, safe-area aware ── */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 bg-base/90 backdrop-blur border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-14 flex items-center gap-2.5 px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="size-10 -ml-1 rounded-btn flex items-center justify-center text-ink active:bg-surface-2 transition-colors"
          >
            <span className="text-xl leading-none">☰</span>
          </button>
          <Link href="/dashboard" className="no-underline flex items-center gap-2 min-w-0">
            <div className="size-7 bg-gradient-to-br from-gold to-gold-light rounded-md flex items-center justify-center shrink-0">
              <span className="text-base font-black text-[11px]">LF</span>
            </div>
            <span className="text-[15px] font-extrabold text-ink leading-none">LexForge</span>
          </Link>
          <span className={cn(
            'ml-auto text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wide shrink-0',
            tier === 'free' ? 'bg-surface-2 text-ink-faint' : 'bg-gold/15 text-gold'
          )}>{tierLbl}</span>
        </div>
      </header>

      {/* ── Desktop floating open toggle (only while closed) ── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="hidden md:flex fixed top-4 left-4 z-50 size-11 rounded-full bg-[#090909] border border-border shadow-lg items-center justify-center text-ink"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      )}

      {/* ── Dimmed backdrop — tap anywhere outside to close ── */}
      <div
        onClick={closeNow}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* ── Drawer ── */}
      <aside
        ref={panelRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={(e) => { if (e.target.closest('a')) closeNow() }}
        aria-hidden={!open}
        className={cn(
          'fixed top-0 left-0 h-[100dvh] w-72 max-w-[85vw] bg-[#090909] border-r border-border flex flex-col z-[80] shadow-2xl',
          'transition-transform duration-300 ease-out will-change-transform',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Logo + explicit Close button */}
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
            className="shrink-0 h-9 px-3 rounded-btn bg-surface border border-border-gold text-ink-muted text-xs font-bold flex items-center gap-1 active:bg-surface-2"
          >
            <span>✕</span> Close
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 min-h-0 overscroll-contain">
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
