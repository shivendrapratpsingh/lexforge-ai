import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { isAdmin, hasProAccessForSession } from '@/lib/admin'
import AssistantWidget from '@/components/AssistantWidget'
import SidePanel from '@/components/SidePanel'
import BottomNav from '@/components/BottomNav'

export default async function DashboardLayout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')

  const t        = await getTranslations()
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

  const labels = {
    generateDocument: t('nav.generateDocument'),
    user: t('common.user'),
    upgradeToPro: t('nav.upgradeToPro'),
  }

  return (
    <div className="min-h-screen bg-base">
      {/* ── Overlay side panel (phone + desktop) — toggled, floats above
           content, never reserves layout space. See components/SidePanel.js ── */}
      <SidePanel
        navLinks={navLinks}
        session={session}
        tier={tier}
        tierLbl={tierLbl}
        pro={pro}
        labels={labels}
      />

      {/* ── Main Content — always full width/height. On phones the top
           padding clears the fixed mobile app bar and the bottom padding
           clears the fixed tab bar (both safe-area aware). ── */}
      <main className="min-w-0 min-h-screen px-4 sm:px-6 pt-[calc(4.5rem+env(safe-area-inset-top))] md:pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6">
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
