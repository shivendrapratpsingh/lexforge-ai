'use client'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'

// Bottom sheet on mobile (<640px), centered dialog on sm:+. Same
// component, two layouts — see LexForge redesign spec §2.6.
export function Modal({ open, onClose, title, children, footer, className }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lf-modal-title"
        className={cn(
          'relative w-full sm:max-w-lg bg-surface-2 border border-border sm:rounded-modal rounded-t-2xl shadow-modal',
          'max-h-[90dvh] overflow-y-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
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
