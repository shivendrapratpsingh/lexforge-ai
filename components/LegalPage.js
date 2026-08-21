import Link from 'next/link'
import { COMPANY, POLICY_UPDATED, hasAddress } from '@/lib/company'

// The shell every policy page sits in. One file, so Terms and Privacy
// cannot drift into looking like they came from different companies —
// which is exactly what a payment gateway's reviewer notices.

const GOLD = '#D4A017'

export function P({ children }) {
  return <p style={{ fontSize: 14.5, color: '#A8A8A8', lineHeight: 1.8, margin: '0 0 14px' }}>{children}</p>
}

export function H({ children }) {
  return (
    <h2 style={{
      fontSize: 17, fontWeight: 800, color: '#F0F0F0',
      margin: '32px 0 12px', letterSpacing: '-0.01em',
    }}>{children}</h2>
  )
}

export function UL({ children }) {
  return (
    <ul style={{
      margin: '0 0 14px', paddingLeft: 20, display: 'flex',
      flexDirection: 'column', gap: 9,
      fontSize: 14.5, color: '#A8A8A8', lineHeight: 1.75,
    }}>{children}</ul>
  )
}

export function Callout({ children, tone = 'gold' }) {
  const c = tone === 'warn'
    ? { bg: 'rgba(225,88,75,.07)', bd: 'rgba(225,88,75,.3)', fg: '#FF9B90' }
    : { bg: 'rgba(212,160,23,.07)', bd: 'rgba(212,160,23,.3)', fg: '#E8C25A' }
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.bd}`, color: c.fg,
      borderRadius: 12, padding: '16px 18px', margin: '0 0 20px',
      fontSize: 14, lineHeight: 1.75,
    }}>{children}</div>
  )
}

// Contact details, rendered identically wherever they appear. When the
// registered address is not configured it says so — a policy page with
// an invented address is worse than one with an honest gap.
export function ContactBlock() {
  return (
    <div style={{ fontSize: 14.5, color: '#A8A8A8', lineHeight: 1.9 }}>
      <div style={{ color: '#F0F0F0', fontWeight: 700 }}>{COMPANY.legalName}</div>
      {hasAddress()
        ? <div style={{ whiteSpace: 'pre-line' }}>{COMPANY.address}</div>
        : <div style={{ color: '#7A7A7A' }}>{COMPANY.city}, {COMPANY.state}, India</div>}
      <div>Email: <a href={`mailto:${COMPANY.email}`} style={{ color: GOLD }}>{COMPANY.email}</a></div>
      {COMPANY.phone && <div>Phone: {COMPANY.phone}</div>}
      {COMPANY.gstin && <div>GSTIN: {COMPANY.gstin}</div>}
    </div>
  )
}

export default function LegalPage({ title, intro, children }) {
  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F0F0F0' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

        <Link href="/" style={{ color: '#6A6A6A', fontSize: 13, textDecoration: 'none' }}>
          ← LexForge AI
        </Link>

        <header style={{ margin: '28px 0 26px', paddingBottom: 22, borderBottom: '1px solid #1F1F1F' }}>
          <h1 style={{ fontSize: 'clamp(26px,4vw,34px)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <div style={{ fontSize: 12.5, color: '#6A6A6A', marginTop: 10 }}>
            Last updated {POLICY_UPDATED} · {COMPANY.legalName}
          </div>
          {intro && (
            <p style={{ fontSize: 15, color: '#9A9A9A', lineHeight: 1.8, margin: '16px 0 0' }}>{intro}</p>
          )}
        </header>

        {children}

        <footer style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid #1F1F1F', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {[
            ['Terms', '/terms'],
            ['Privacy', '/privacy'],
            ['Refunds', '/refund'],
            ['Contact', '/contact'],
            ['Pricing', '/pricing'],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: '#7A7A7A', fontSize: 13, textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </footer>
      </div>
    </div>
  )
}
