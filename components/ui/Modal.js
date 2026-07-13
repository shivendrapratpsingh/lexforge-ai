'use client'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

// Bottom sheet on mobile (<640px), centered dialog on sm:+. Same
// component, two layouts — see LexForge redesign spec §2.6.
//
// Mobile-app behavior: body scroll is locked while open, the backdrop
// fades in, and the sheet can be swiped down to dismiss (finger-tracked,
// only when its content is scrolled to the top).
export function Modal({ open, onClose, title, children, footer, className }) {
  const sheetRef = useRef(null)
  const drag = useRef({ active: false, startY: 0, dy: 0 })

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  // ── Swipe-down-to-dismiss (mobile bottom-sheet gesture) ──
  function onTouchStart(e) {
    const el = sheetRef.current
    // Only start a dismiss-drag when the sheet content is at the top,
    // so normal scrolling inside the sheet keeps working.
    if (!el || el.scrollTop > 0 || e.touches.length !== 1) return
    drag.current = { active: true, startY: e.touches[0].clientY, dy: 0 }
  }
  function onTouchMove(e) {
    const d = drag.current
    if (!d.active) return
    d.dy = Math.max(0, e.touches[0].clientY - d.startY)
    const el = sheetRef.current
    if (el && d.dy > 0) {
      el.style.transitionDuration = '0ms'
      el.style.transform = `translateY(${d.dy}px)`
    }
  }
  function onTouchEnd() {
    const d = drag.current
    const el = sheetRef.current
    drag.current = { active: false, startY: 0, dy: 0 }
    if (!el) return
    el.style.transitionDuration = ''
    el.style.transform = ''
    if (d.dy > 90) onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[lfFadeIn_200ms_ease-out]"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lf-modal-title"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn(
          'relative w-full sm:max-w-lg bg-surface-2 border border-border sm:rounded-modal rounded-t-2xl shadow-modal',
          'max-h-[90dvh] overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          'transition-transform duration-200 ease-out will-change-transform',
          'animate-[slideUp_320ms_ease-out] sm:animate-[fadeScale_200ms_ease-out]',
          className
        )}
      >
        <div className="sm:hidden mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        {title && <h2 id="lf-modal-title" className="text-xl font-semibold text-ink mb-4">{title}</h2>}
        {children}
        {footer && <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}
