'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Renders the sidebar nav with an active-state highlight based on the
// current pathname. Lives in its own client component so the surrounding
// dashboard layout can stay a server component (and keep doing the auth
// check + Pro/admin gating server-side).
export default function SidebarNav({ links }) {
  const pathname = usePathname() || ''

  function isActive(href) {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '14px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      {links.map((link, idx) => {
        const active = isActive(link.href)
        const baseColor = link.admin ? '#D4A017' : (active ? '#F0F0F0' : '#6A6A6A')
        const baseBg    = active ? '#1C1C1C' : 'transparent'
        const baseBorder = link.admin
          ? '1px solid rgba(212,160,23,0.3)'
          : (active ? '1px solid #2A2A2A' : '1px solid transparent')

        return (
          <Link
            key={`${link.href}-${idx}`}
            href={link.href}
            className="nav-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              textDecoration: 'none',
              color: baseColor,
              fontSize: 14,
              fontWeight: link.admin ? 700 : (active ? 700 : 500),
              transition: 'all 0.15s',
              border: baseBorder,
              background: baseBg,
            }}
          >
            <span style={{ color: '#D4A017', fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>
              {link.icon}
            </span>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.locked && <span style={{ fontSize: 10, color: '#D4A017', opacity: 0.7 }}>🔒 PRO</span>}
          </Link>
        )
      })}
    </nav>
  )
}
