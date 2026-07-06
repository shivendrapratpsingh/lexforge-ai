'use client'
import { cn } from '@/lib/cn'

const fieldBase =
  'w-full h-12 rounded-input bg-surface-3 border border-border px-4 text-base text-ink placeholder:text-ink-faint transition-colors duration-150 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/40'

export function Input({ className, ...props }) {
  return <input className={cn(fieldBase, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(fieldBase, 'appearance-none pr-10 bg-no-repeat bg-[right_1rem_center]', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, rows = 5, ...props }) {
  return <textarea rows={rows} className={cn(fieldBase, 'h-auto min-h-32 py-3 leading-relaxed', className)} {...props} />
}

// Field wrapper with label + error/hint text, used for every form field
// across the intake wizard.
export function FormField({ label, error, hint, required, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-ink">
          {label}{required && <span className="text-gold-light ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
