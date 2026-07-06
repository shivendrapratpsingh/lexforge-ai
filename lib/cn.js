import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge conditional class names (clsx) then dedupe conflicting Tailwind
// utility classes (tailwind-merge) — e.g. cn('p-2', condition && 'p-4')
// correctly resolves to just 'p-4', not both.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
