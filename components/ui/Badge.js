import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badge = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'bg-surface-2 border-border text-ink-muted',
      success: 'bg-success-bg border-success/30 text-success',
      warning: 'bg-warning-bg border-warning/30 text-warning',
      danger: 'bg-danger-bg border-danger/30 text-danger',
      info: 'bg-info-bg border-info/30 text-info',
      pro: 'bg-gold/10 border-gold/40 text-gold-light',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export function Badge({ tone, className, children }) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>
}
