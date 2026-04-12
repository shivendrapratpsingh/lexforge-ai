import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/new-draft', label: 'New Document', icon: '✦' },
  { href: '/drafts', label: 'My Drafts', icon: '◉' },
  { href: '/research', label: 'Legal Research', icon: '◎' },
]

export default async function DashboardLayout({ children }) {
  const session = await auth()
  if (!session) redirect('/login')

  const initial = (session.user?.name?.[0] || session.user?.email?.[0] || 'U').toUpperCase()

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
        height: '100vh',
        zIndex: 40,
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #1C1C1C' }}>
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

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                color: '#6A6A6A',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ color: '#D4A017', fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* New Document CTA */}
        <div style={{ padding: '0 10px 12px' }}>
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
            <span>✦</span> Generate Document
          </Link>
        </div>

        {/* User info + Sign Out */}
        <div style={{ padding: '12px 10px 16px', borderTop: '1px solid #1C1C1C' }}>
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
              <div style={{ fontSize: 13, fontWeight: 600, color: '#C0C0C0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: '#4A4A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user?.email}
              </div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ marginLeft: 240, flex: 1, padding: '32px 36px', minHeight: '100vh', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
