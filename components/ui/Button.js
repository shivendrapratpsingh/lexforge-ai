'use client'
import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const button = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 ease-[cubic-bezier(.16,1,.3,1)] rounded-btn disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-base active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-b from-gold-light to-gold text-base shadow-gold-sm hover:shadow-gold-md hover:brightness-105',
        secondary: 'bg-surface-2 border border-border-gold text-ink hover:border-gold',
        ghost: 'bg-transparent text-gold-light hover:bg-surface-2',
        destructive: 'bg-danger-bg border border-danger text-danger hover:bg-danger hover:text-base',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-12 px-5 text-base',
        lg: 'h-14 px-7 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export const Button = forwardRef(function Button({ className, variant, size, ...props }, ref) {
  return <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
})
