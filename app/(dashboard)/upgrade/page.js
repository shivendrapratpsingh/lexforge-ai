import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_EMAIL, hasProAccessForSession, getFreeDocsLimit } from '@/lib/admin'
import { PRO_GLOBAL_FEATURES } from '@/lib/pro-features'

export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const session = await auth()
  if (!session) redirect('/login')

  // Promo-aware Pro check (admin, paid Pro, active global promo, or per-email
  // grant all count as Pro here).
  const isPro = await hasProAccessForSession(session)
  const tier  = isPro ? 'pro' : (session.user?.tier || 'free')
  const freeDocsLimit = await getFreeDocsLimit()

  return (
    <div style={{ maxWidth: 920, margin: '20px auto 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>MEMBERSHIP</div>
        <h1 style={{ fontSize: 32, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }}>
          {isPro ? 'You\u2019re on Pro' : 'Upgrade to LexForge Pro'}
        </h1>
        <div style={{ fontSize: 14, color: '#6A6A6A', marginTop: 8, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          {isPro
            ? 'You have full access to every LexForge feature \u2014 unlimited drafts, premium document types, the AI Case Assistant, and the entire research suite.'
            : 'Unlock the full LexForge toolkit \u2014 longer court-ready drafts, a stronger AI model, the Case Assistant, premium document types, and the Clients / Court Dates / Tools / Research suite.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Free */}
        <div style={{ background: '#141414', border: '1px solid #1C1C1C', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, color: '#6A6A6A', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
            Free {!isPro && tier === 'free' && <span style={{ color: '#D4A017' }}>(current)</span>}
          </div>
          <div style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }}>&#8377;0</div>
          <div style={{ fontSize: 12, color: '#6A6A6A', marginTop: 2 }}>per month, forever</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#C0C0C0' }}>
            <li>&#10003; {freeDocsLimit} documents per month</li>
            <li>&#10003; Llama 3.1 8B (standard model)</li>
            <li>&#10003; Core types: Legal Notice, Affidavit, RTI, Memorandum, Vakalatnama, Cheque-bounce, Consumer, FIR, Rent, Stay, Legal Opinion, Case Brief</li>
            <li>&#10003; PDF / DOCX / TXT export</li>
            <li>&#10003; Draft history + version control</li>
            <li style={{ color: '#6A6A6A' }}>&#10007; No Clients / Court Dates / Legal Tools / Research</li>
            <li style={{ color: '#6A6A6A' }}>&#10007; No premium document types</li>
            <li style={{ color: '#6A6A6A' }}>&#10007; No AI Case Assistant chatbot</li>
          </ul>
        </div>

        {/* Pro */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.12), rgba(212,160,23,0.03))',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 12,
          padding: 24,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -10, right: 16,
            background: 'linear-gradient(135deg, #D4A017, #B8860B)',
            color: '#0D0D0D',
            fontSize: 10, fontWeight: 800, letterSpacing: '1px',
            padding: '4px 10px', borderRadius: 100,
          }}>RECOMMENDED</div>
          <div style={{ fontSize: 12, color: '#D4A017', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
            Pro {isPro && <span>(current)</span>}
          </div>
          <div style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 6 }}>By invite</div>
          <div style={{ fontSize: 12, color: '#D4A017', marginTop: 2 }}>contact admin for access</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#F0F0F0' }}>
            {PRO_GLOBAL_FEATURES.map(f => (
              <li key={f}>&#10003; {f}</li>
            ))}
            <li>&#10003; Premium types: Writ, PIL, Bail, Divorce, Contract, Sale Deed</li>
            <li>&#10003; Clients / Court Dates / Legal Tools / Research suite</li>
            <li>&#10003; Priority support from the platform admin</li>
          </ul>
        </div>
      </div>

      {/* Pro feature deep-dive grid */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 12, color: '#D4A017', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
          What Pro adds, in detail
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { t: '2\u20133\u00d7 longer drafts',   d: 'Court-ready length with Index of Documents, Annexure list, and detailed verification clause.' },
            { t: 'Stronger AI model',              d: 'Llama 3.3 70B vs. the standard 8B used on Free \u2014 sharper reasoning, better citations.' },
            { t: 'Real case-law citations',        d: 'Five or more landmark Supreme Court / High Court precedents woven into each document.' },
            { t: 'AI Case Assistant',              d: 'Floating Pro chatbot that suggests favourable IPC/CrPC sections and counters opposing arguments.' },
            { t: 'Premium document types',         d: 'Writ Petition, PIL, Bail Application, Divorce Petition, Sale Deed, and full Contracts unlock.' },
            { t: 'Client + Court Dates suite',     d: 'Track clients, link drafts to clients, schedule hearings and deadlines with a daily reminder feed.' },
            { t: 'Legal Tools',                    d: 'Stamp-duty calculators, limitation-period checks, and other practitioner utilities.' },
            { t: 'Research workspace',             d: 'Search landmark cases by issue, save excerpts, and pull citations directly into drafts.' },
            { t: 'Unlimited drafts',               d: 'No monthly cap. Generate as many drafts as your practice needs.' },
          ].map(c => (
            <div key={c.t} style={{ background: '#141414', border: '1px solid #1C1C1C', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, color: '#D4A017', fontWeight: 700, marginBottom: 6 }}>{c.t}</div>
              <div style={{ fontSize: 12, color: '#A0A0A0', lineHeight: 1.55 }}>{c.d}</div>
            </div>
          ))}
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
