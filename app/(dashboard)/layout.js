import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SignOutButton } from '@/components/SignOutButton'
import { isAdmin, hasProAccessForSession } from '@/lib/admin'
import AssistantWidget from '@/components/AssistantWidget'
import SidebarNav from '@/components/SidebarNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'

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
  ]

  const navLinks = [
    ...baseNavLinks.map(l => ({
      href:   !pro && l.proOnly ? '/upgrade' : l.href,
      label:  t(l.labelKey),
      icon:   l.icon,
      locked: !pro && l.proOnly,
      proLockText: t('tier.proLock'),
    })),
    ...(admin ? [{
      href: '/admin',
      label: t('nav.adminConsole'),
      icon: '◆',
      locked: false,
      admin: true,
    }] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      <style>{`.nav-link:hover { background: #1C1C1C !important; color: #D0D0D0 !important; }`}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        background: '#090909',
        borderRight: '1px solid #1C1C1C',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 40,
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #1C1C1C', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #D4A017, #F0C040)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#0D0D0D', fontWeight: 900, fontSize: 13 }}>LF</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0', lineHeight: 1.1 }}>LexForge</div>
              <div style={{ fontSize: 10, color: '#D4A017', fontWeight: 700, letterSpacing: '1.5px' }}>AI LEGAL</div>
            </div>
          </Link>
        </div>

        {/* Nav (active-state highlight + click handling lives in SidebarNav). */}
        <SidebarNav links={navLinks} />

        {/* Generate Document CTA */}
        <div style={{ padding: '0 10px 12px', flexShrink: 0 }}>
          <Link href="/new-draft" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 14px',
            background: 'linear-gradient(135deg, rgba(212,160,23,0.12), rgba(212,160,23,0.06))',
            border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 10,
            textDecoration: 'none',
            color: '#D4A017',
            fontSize: 13,
            fontWeight: 700,
          }}>
            <span>✦</span> {t('nav.generateDocument')}
          </Link>
        </div>

        {/* Language switcher + User info + Sign Out */}
        <div style={{ padding: '12px 10px 16px', borderTop: '1px solid #1C1C1C', flexShrink: 0, background: '#090909' }}>
          <LanguageSwitcher />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: '#141414', marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #D4A017, #B8860B)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#0D0D0D', fontWeight: 800, fontSize: 13 }}>{initial}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#C0C0C0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user?.name || t('common.user')}</span>
                <span style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: tier === 'free' ? '#1C1C1C' : 'rgba(212,160,23,0.15)',
                  color: tier === 'free' ? '#6A6A6A' : '#D4A017',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}>{tierLbl}</span>
              </div>
              <div style={{ fontSize: 11, color: '#4A4A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user?.email}
              </div>
            </div>
          </div>
          {!pro && (
            <Link href="/upgrade" style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px 12px',
              marginBottom: 6,
              background: 'linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.05))',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 10,
              textDecoration: 'none',
              color: '#D4A017',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {t('nav.upgradeToPro')}
            </Link>
          )}
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 36px', minHeight: '100vh', minWidth: 0 }}>
        {children}
      </main>

      {/* ── Floating Pro Case Assistant (visible on every dashboard page) ── */}
      <AssistantWidget
        isPro={pro || admin}
        userName={session.user?.name || (session.user?.email?.split('@')[0]) || 'friend'}
      />
    </div>
  )
}
