'use client'

import { usePathname } from 'next/navigation'
import { NavItem } from '@/components/ui/NavItem'

// Renders the sidebar / icon-rail nav list with an active-state highlight
// based on the current pathname. Lives in its own client component so the
// surrounding dashboard layout can stay a server component (and keep doing
// the auth check + Pro/admin gating server-side).
//
// `railOnly` renders icon-only rows (used at the md: collapsed-rail
// breakpoint); the full sidebar (lg:+) passes railOnly=false to show labels.
export default function SidebarNav({ links, railOnly = false }) {
  const pathname = usePathname() || ''

  function isActive(href) {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3.5 flex flex-col gap-0.5">
      {links.map((link, idx) => {
        if (link.type === 'header') {
          if (railOnly) return <div key={`hdr-${idx}`} className="h-px bg-border my-2 mx-2" />
          return (
            <div
              key={`hdr-${idx}`}
              className="text-[10px] text-ink-faint tracking-[2px] uppercase font-bold px-3.5"
              style={{ paddingTop: idx === 0 ? 0 : 14, paddingBottom: 6, marginTop: idx === 0 ? 0 : 8 }}
            >
              {link.label}
            </div>
          )
        }
        const active = isActive(link.href)
        return (
          <NavItem
            key={`${link.href}-${idx}`}
            href={link.href}
            icon={link.icon}
            label={link.label}
            active={active}
            railOnly={railOnly}
            badge={link.locked ? (link.proLockText || 'PRO') : undefined}
            className={link.admin ? 'text-gold border border-border-gold' : undefined}
          />
        )
      })}
    </nav>
  )
}
