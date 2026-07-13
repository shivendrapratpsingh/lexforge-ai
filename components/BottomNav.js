'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { NavItem } from '@/components/ui/NavItem'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { SignOutButton } from '@/components/SignOutButton'

// Fixed bottom tab bar for mobile (<768px). 5 slots: Dashboard, Drafts,
// New Draft (center, elevated FAB-style), Court Dates, More (opens a
// bottom sheet with everything else — Clients, Tools, Research, Admin,
// language, sign out). See redesign spec §3.1.
export default function BottomNav({ moreLinks, upgradeHref }) {
  const pathname = usePathname() || ''
  const [moreOpen, setMoreOpen] = useState(false)

  function isActive(href) {
    if (!href) return false
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-base/95 backdrop-blur border-t border-border flex items-stretch pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <NavItem vertical href="/dashboard" icon="◈" label="Dashboard" active={isActive('/dashboard')} />
        <NavItem vertical href="/drafts" icon="◉" label="Drafts" active={isActive('/drafts')} />

        {/* Center elevated New Draft action */}
        <div className="flex-1 flex items-start justify-center">
          <Link
            href="/new-draft"
            aria-label="New Draft"
            className="-translate-y-4 size-14 rounded-full bg-gradient-to-b from-gold-light to-gold text-base shadow-gold-md flex items-center justify-center text-2xl font-bold active:translate-y-[-14px] active:brightness-95 transition-transform"
          >
            ✦
          </Link>
        </div>

        <NavItem vertical href="/court-dates" icon="📅" label="Court Dates" active={isActive('/court-dates')} />
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] leading-tight font-medium text-ink-muted"
        >
          <span className="text-xl leading-none">⋯</span>
          <span>More</span>
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1">
          {moreLinks.map((link, idx) => (
            link.type === 'header' ? (
              <div key={`m-hdr-${idx}`} className="text-[10px] text-ink-faint tracking-[2px] uppercase font-bold px-1 pt-3 first:pt-0 pb-1">
                {link.label}
              </div>
            ) : (
              <NavItem
                key={`${link.href}-${idx}`}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={isActive(link.href)}
                badge={link.locked ? (link.proLockText || 'PRO') : undefined}
                onClick={() => setMoreOpen(false)}
              />
            )
          ))}
          {upgradeHref && (
            <Link
              href={upgradeHref}
              onClick={() => setMoreOpen(false)}
              className="mt-2 text-center h-12 flex items-center justify-center rounded-btn bg-gold/10 border border-gold/30 text-gold-light font-semibold text-sm"
            >
              Upgrade to Pro
            </Link>
          )}

          {/* Account controls — language + sign out, so phone users have
              everything without needing the side drawer. */}
          <div className="mt-3 pt-3 border-t border-border">
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </Modal>
    </>
  )
}
