import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SignOutButton } from '@/components/SignOutButton'
import { isAdmin, hasProAccessForSession } from '@/lib/admin'
import AssistantWidget from '@/components/AssistantWidget'
import SidebarNav from '@/components/SidebarNav'
import BottomNav from '@/components/BottomNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { cn } from '@/lib/cn'

export default async function DashboardLayout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')

  const t        = await getTranslations()
  const initial  = (session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()
  const admin    = isAdmin(session)
  const pro      = await hasProAccessForSession(session)
  const tier     = admin ? 'admin' : (pro ? 'pro' : 'free')
  const tierLbl  = t(`tier.${tier}`)

  // Build localized nav links. Pro-locked links redirect to /upgrade for
  // free users so they can see what they're missing without errors.
  const baseNavLinks = [
    { href: '/dashboard',   labelKey: 'nav.dashboard',     icon: '◈', proOnly: false },
    { href: '/new-draft',   labelKey: 'nav.newDocument',   icon: '✦', proOnly: false },
    { href: '/drafts',      labelKey: 'nav.myDocuments',   icon: '◉', proOnly: false },
    { href: '/clients',     labelKey: 'nav.clients',       icon: '👤', proOnly: true  },
    { href: '/court-dates', labelKey: 'nav.courtDates',    icon: '📅', proOnly: true  },
    { href: '/tools',       labelKey: 'nav.legalTools',    icon: '⚒️', proOnly: true  },
    { href: '/research',    labelKey: 'nav.legalResearch', icon: '◎', proOnly: true  },
    { href: '/study',       label:    'Study & Learn',     icon: '📚', proOnly: false },
  ]

  // Sidebar layout the user asked for:
  //   ┌── LAWYER ─────────────┐
  //   │ Dashboard / New Draft │
  //   │ Drafts / Clients      │
  //   │ Court Dates / Tools   │
  //   │ Research / Study      │
  //   ├── FUTURE LAWYER ──────┤
  //   │ Coming-soon services  │
  //   └───────────────────────┘
  // Admin gets an extra Admin Console link at the bottom.
  const lawyerLinks = baseNavLinks.map(l => ({
    href:   !pro && l.proOnly ? '/upgrade' : l.href,
    // Most links resolve their label from i18n via `labelKey`; the
    // /study link uses a hardcoded `label` so we don't have to touch
    // every translation file. Fall back gracefully.
    label:  l.label ?? t(l.labelKey),
    icon:   l.icon,
    locked: !pro && l.proOnly,
    proLockText: t('tier.proLock'),
  }))

  const futureLawyerLinks = [
    {
      href: '/future-lawyer',
      label: 'Services',
      icon: '🎓',
      locked: false,
    },
  ]

  const navLinks = [
    { type: 'header', label: 'Lawyer' },
    ...lawyerLinks,
    { type: 'header', label: 'Future Lawyer' },
    ...futureLawyerLinks,
    ...(admin ? [
      { type: 'header', label: 'Admin' },
      {
        href: '/admin',
        label: t('nav.adminConsole'),
        icon: '◆',
        locked: false,
        admin: true,
      },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-base flex">
      {/* ── Sidebar (lg:+ full, md: icon rail, hidden below md) ── */}
      <aside className="hidden md:flex md:w-18 lg:w-64 bg-[#090909] border-r border-border flex-col fixed top-0 left-0 h-screen overflow-hidden z-40 shrink-0 transition-[width] duration-200">
        {/* Logo */}
        <div className="p-3 lg:px-5 lg:py-[22px] border-b border-border shrink-0 flex justify-center lg:justify-start">
          <Link href="/dashboard" className="no-underline flex items-center gap-2.5">
            <div className="size-8 lg:size-[34px] bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center shrink-0">
              <span className="text-base font-black text-[13px]">LF</span>
            </div>
            <div className="hidden lg:block">
              <div className="text-[15px] font-extrabold text-ink leading-tight">LexForge</div>
              <div className="text-[10px] text-gold font-bold tracking-[1.5px]">AI LEGAL</div>
            </div>
          </Link>
        </div>

        {/* Nav (active-state highlight + click handling lives in SidebarNav). */}
        <div className="hidden lg:block flex-1 min-h-0">
          <SidebarNav links={navLinks} />
        </div>
        <div className="lg:hidden flex-1 min-h-0">
          <SidebarNav links={navLinks} railOnly />
        </div>

        {/* Generate Document CTA */}
        <div className="px-2.5 pb-3 shrink-0">
          <Link
            href="/new-draft"
            title={t('nav.generateDocument')}
            className="flex items-center justify-center lg:justify-start gap-2 h-11 px-3 bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 rounded-btn no-underline text-gold text-[13px] font-bold"
          >
            <span>✦</span> <span className="hidden lg:inline">{t('nav.generateDocument')}</span>
          </Link>
        </div>

        {/* Language switcher + User info + Sign Out */}
        <div className="hidden lg:block px-2.5 pt-3 pb-4 border-t border-border shrink-0 bg-[#090909]">
          <LanguageSwitcher />

          <div className="flex items-center gap-2.5 p-2.5 rounded-btn bg-surface mb-1.5">
            <div className="size-8 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
              <span className="text-base font-extrabold text-[13px]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-ink-muted flex items-center gap-1.5">
                <span className="truncate">{session.user?.name || t('common.user')}</span>
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wide shrink-0',
                  tier === 'free' ? 'bg-surface-2 text-ink-faint' : 'bg-gold/15 text-gold'
                )}>{tierLbl}</span>
              </div>
              <div className="text-[11px] text-ink-faint truncate">{session.user?.email}</div>
            </div>
          </div>
          {!pro && (
            <Link
              href="/upgrade"
              className="block text-center py-2 px-3 mb-1.5 bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 rounded-btn no-underline text-gold text-xs font-bold"
            >
              {t('nav.upgradeToPro')}
            </Link>
          )}
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 min-h-screen p-4 pb-24 sm:p-6 md:ml-18 lg:ml-64 md:pb-6">
        {children}
      </main>

      {/* ── Mobile bottom tab bar (hidden md:+) ── */}
      <BottomNav
        moreLinks={navLinks}
        upgradeHref={!pro ? '/upgrade' : null}
      />

      {/* ── Floating Pro Case Assistant (visible on every dashboard page) ── */}
      <AssistantWidget
        isPro={pro || admin}
        userName={session.user?.name || (session.user?.email?.split('@')[0]) || 'friend'}
      />
    </div>
  )
}
