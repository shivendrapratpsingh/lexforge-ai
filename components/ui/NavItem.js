import Link from 'next/link'
import { cn } from '@/lib/cn'

// Shared nav-row component used by the desktop sidebar, the collapsed
// icon rail, the mobile bottom tab bar, and the "More" sheet — one
// component, several layout contexts (pass `vertical=false` for the
// bottom-tab-bar's icon-over-label layout).
export function NavItem({ icon, label, active, badge, href, vertical, railOnly, ...props }) {
  if (vertical) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] leading-tight font-medium transition-colors duration-150',
          active ? 'text-gold-light' : 'text-ink-muted'
        )}
        {...props}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-center px-0.5 whitespace-normal">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      title={railOnly ? label : undefined}
      className={cn(
        'flex items-center gap-3 h-12 px-3 rounded-btn text-sm font-medium transition-colors duration-150',
        active ? 'bg-surface-2 text-gold-light' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
      )}
      {...props}
    >
      <span className="size-5 shrink-0 flex items-center justify-center text-gold-light">{icon}</span>
      {!railOnly && <span className="truncate flex-1">{label}</span>}
      {!railOnly && badge && (
        <span className="ml-auto text-[10px] font-bold bg-gold text-base rounded-full px-1.5 py-0.5 shrink-0">{badge}</span>
      )}
    </Link>
  )
}
