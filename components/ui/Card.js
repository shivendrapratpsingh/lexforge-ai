import { cn } from '@/lib/cn'

export function Card({ className, interactive, selected, as: As = 'div', ...props }) {
  return (
    <As
      className={cn(
        'rounded-card bg-surface border border-border p-4 sm:p-6 shadow-card transition-all duration-200',
        interactive && 'cursor-pointer hover:border-border-gold hover:bg-surface-2',
        selected && 'border-gold shadow-gold-sm bg-surface-2',
        className
      )}
      {...props}
    />
  )
}
