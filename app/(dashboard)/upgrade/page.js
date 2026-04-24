import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_EMAIL, FREE_DOCS_PER_MONTH } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const tier = session.user?.tier || 'free'
  const isPro = tier === 'pro' || session.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  return (
    <div style={{ maxWidth: 720, margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>MEMBERSHIP</div>
        <h1 style={{ fontSize: 32, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }}>
          {isPro ? 'You’re on Pro' : 'Upgrade to LexForge Pro'}
        </h1>
        <div style={{ fontSize: 14, color: '#6A6A6A', marginTop: 8 }}>
          {isPro
            ? 'You have full access to all LexForge features.'
            : 'Unlock the full LexForge toolkit — more documents, better models, richer tooling.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Free */}
        <div style={{ background: '#141414', border: '1px solid #1C1C1C', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, color: '#6A6A6A', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
            Free {!isPro && tier === 'free' && <span style={{ color: '#D4A017' }}>(current)</span>}
          </div>
          <div style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }}>₹0</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#C0C0C0' }}>
            <li>✓ {FREE_DOCS_PER_MONTH} documents per month</li>
            <li>✓ Standard AI model (faster, basic)</li>
            <li>✓ Core document types (notices, affidavits, RTI, etc.)</li>
            <li style={{ color: '#6A6A6A' }}>✗ No Clients / Court Dates / Tools / Research</li>
            <li style={{ color: '#6A6A6A' }}>✗ No premium document types</li>
          </ul>
        </div>

        {/* Pro */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.12), rgba(212,160,23,0.03))',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ fontSize: 12, color: '#D4A017', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
            Pro {isPro && <span>(current)</span>}
          </div>
          <div style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }}>By invite</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#F0F0F0' }}>
            <li>✓ Unlimited documents</li>
            <li>✓ Llama 3.3 70B — top-tier reasoning</li>
            <li>✓ Premium types: Writ, PIL, Bail, Divorce, Contract, Sale Deed</li>
            <li>✓ Clients, Court Dates, Legal Tools, Research suite</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
      </div>

      {!isPro && (
        <div style={{
          marginTop: 28,
          padding: 20,
          background: '#141414',
          border: '1px solid #1C1C1C',
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: '#C0C0C0', marginBottom: 14 }}>
            LexForge Pro is currently invite-only. To upgrade your account, contact the administrator:
          </div>
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=LexForge%20Pro%20Upgrade%20Request`}
            style={{
              display: 'inline-block',
              padding: '12px 22px',
              background: 'linear-gradient(135deg, #D4A017, #B8860B)',
              color: '#0D0D0D',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.5px',
            }}
          >
            Email admin to upgrade
          </a>
          <div style={{ fontSize: 12, color: '#6A6A6A', marginTop: 10 }}>{ADMIN_EMAIL}</div>
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/dashboard" style={{ color: '#6A6A6A', fontSize: 13, textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
