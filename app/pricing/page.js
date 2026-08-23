import Link from 'next/link'
import { PLANS, configured as billingConfigured, rupees } from '@/lib/billing'
import { getFreeDocsLimit } from '@/lib/admin'
import { PRO_GLOBAL_FEATURES } from '@/lib/pro-features'

// Prices, visible without an account.
//
// This exists because /upgrade sits behind the login wall, and a person
// deciding whether to sign up cannot see what it costs — which loses
// customers and, more immediately, fails a payment gateway's review.
// Razorpay's team opens the site as a stranger and looks for a price.

export const metadata = {
  title: 'Pricing — LexForge AI',
  description: 'What LexForge AI costs. A free tier with no card required, and paid plans that never auto-renew.',
}

export const dynamic = 'force-dynamic'

const GOLD = '#D4A017'

export default async function Pricing() {
  const freeLimit = await getFreeDocsLimit().catch(() => 2)
  const canPay = billingConfigured()

  const paid = Object.values(PLANS).map(p => ({
    ...p,
    rupees: rupees(p.amountPaise),
    perMonth: p.days >= 300 ? Math.round(rupees(p.amountPaise) / 12) : null,
  }))

  const card = (highlight) => ({
    background: highlight ? 'linear-gradient(160deg, rgba(212,160,23,0.10), rgba(212,160,23,0.02))' : '#141414',
    border: `1px solid ${highlight ? 'rgba(212,160,23,0.42)' : '#1F1F1F'}`,
    borderRadius: 14,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  })

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F0F0F0' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '40px 20px 80px' }}>

        <Link href="/" style={{ color: '#6A6A6A', fontSize: 13, textDecoration: 'none' }}>← LexForge AI</Link>

        <header style={{ textAlign: 'center', margin: '36px 0 34px' }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '2.5px', fontWeight: 800, textTransform: 'uppercase' }}>
            Pricing
          </div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, margin: '12px 0 0', letterSpacing: '-0.02em' }}>
            Start free. Pay only if it earns it.
          </h1>
          <p style={{ fontSize: 15.5, color: '#9A9A9A', lineHeight: 1.75, margin: '14px auto 0', maxWidth: '58ch' }}>
            {freeLimit} documents every month at no cost and no card. Paid plans
            are bought once for a fixed period — nothing auto-renews, and we do
            not store your card.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}>

          {/* Free */}
          <div style={card(false)}>
            <div style={{ fontSize: 11, color: '#6A6A6A', letterSpacing: '1.6px', fontWeight: 800, textTransform: 'uppercase' }}>Free</div>
            <div style={{ fontSize: 34, fontWeight: 800, margin: '10px 0 2px' }}>&#8377;0</div>
            <div style={{ fontSize: 12.5, color: '#6A6A6A' }}>forever, no card</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#B8B8B8', lineHeight: 1.5, flex: 1 }}>
              <li>&#10003; <strong style={{ color: '#F0F0F0' }}>{freeLimit} documents a month</strong></li>
              <li>&#10003; Every document type</li>
              <li>&#10003; Act search across 269 Central Acts</li>
              <li>&#10003; PDF, Word and text export</li>
              <li>&#10003; Draft history and versions</li>
              <li style={{ color: '#6A6A6A' }}>&#10007; No judgment search</li>
              <li style={{ color: '#6A6A6A' }}>&#10007; No case assistant</li>
            </ul>
            <Link href="/register" style={{ textDecoration: 'none', marginTop: 20 }}>
              <span style={{
                display: 'block', textAlign: 'center', padding: '12px 18px', borderRadius: 10,
                border: '1px solid #2E2718', color: '#C9BA92', fontWeight: 700, fontSize: 14,
              }}>Create a free account</span>
            </Link>
          </div>

          {/* Paid */}
          {paid.map(p => (
            <div key={p.id} style={card(p.id === 'yearly')}>
              {p.id === 'yearly' && (
                <div style={{
                  position: 'absolute', top: -10, right: 18,
                  background: `linear-gradient(135deg, ${GOLD}, #B8860B)`, color: '#0D0D0D',
                  fontSize: 10, fontWeight: 800, letterSpacing: '1px',
                  padding: '4px 10px', borderRadius: 100,
                }}>BEST VALUE</div>
              )}
              <div style={{ fontSize: 11, color: p.id === 'yearly' ? GOLD : '#6A6A6A', letterSpacing: '1.6px', fontWeight: 800, textTransform: 'uppercase' }}>
                {p.label}
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, margin: '10px 0 2px' }}>
                &#8377;{p.rupees.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 12.5, color: '#6A6A6A' }}>
                {p.days} days{p.perMonth ? ` · about ₹${p.perMonth.toLocaleString('en-IN')} a month` : ''}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, color: '#D8D8D8', lineHeight: 1.5, flex: 1 }}>
                <li>&#10003; <strong style={{ color: '#F0F0F0' }}>Unlimited documents</strong></li>
                {PRO_GLOBAL_FEATURES.slice(0, 5).map(f => <li key={f}>&#10003; {f}</li>)}
                <li>&#10003; Judgment search with real citations</li>
                <li>&#10003; Clients, hearings, tools and research</li>
              </ul>

              <div style={{ fontSize: 12, color: '#6A6A6A', marginTop: 16, lineHeight: 1.6 }}>
                {p.blurb}
              </div>

              <Link href={canPay ? '/upgrade' : '/register'} style={{ textDecoration: 'none', marginTop: 14 }}>
                <span style={{
                  display: 'block', textAlign: 'center', padding: '12px 18px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${GOLD}, #B8860B)`, color: '#0D0D0D',
                  fontWeight: 800, fontSize: 14,
                }}>
                  {`Get ${p.label}`}
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* There is no separate student price any more. A student at a
            participating college pays nothing; everyone else pays the
            same. This block exists to say so plainly, and to send an
            unserved college to the pilot form. */}
        <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 14, padding: 22, marginTop: 20 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '1.6px', fontWeight: 800, textTransform: 'uppercase' }}>
            Law students
          </div>
          <p style={{ fontSize: 14.5, color: '#A8A8A8', lineHeight: 1.8, margin: '10px 0 0', maxWidth: '66ch' }}>
            If your college has a plan with us, you pay nothing at all — your
            college sends us the class list and your account is already waiting —
            sign in with the email and password they give you. Otherwise students
            pay the same as everyone else; there is no separate student rate to
            argue about. If your college does not have one yet,{' '}
            <Link href="/for-colleges" style={{ color: GOLD }}>send them here</Link> —
            a pilot is free for a full term.
          </p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 14, padding: 22, marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#6A6A6A', letterSpacing: '1.6px', fontWeight: 800, textTransform: 'uppercase' }}>
            Worth knowing before you pay
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14, color: '#A8A8A8', lineHeight: 1.7 }}>
            <li><strong style={{ color: '#E8E8E8' }}>Nothing renews on its own.</strong> Plans are bought once for a fixed period. No card is stored and nothing can be debited without you starting it.</li>
            <li><strong style={{ color: '#E8E8E8' }}>Paying early adds days.</strong> Renew before your term ends and the new period is added to what is left, never replacing it.</li>
            <li><strong style={{ color: '#E8E8E8' }}>Cards, UPI, net banking and wallets</strong> are all handled by Razorpay. LexForge never sees your card details.</li>
            <li><strong style={{ color: '#E8E8E8' }}>Prices are in Indian Rupees.</strong> See the <Link href="/refund" style={{ color: GOLD }}>refund policy</Link> before you buy.</li>
            <li><strong style={{ color: '#E8E8E8' }}>It drafts, it does not advise.</strong> LexForge is not a law firm. Verify every citation before you file.</li>
          </ul>
        </div>

        <footer style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid #1F1F1F', display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Refunds', '/refund'], ['Contact', '/contact'], ['For colleges', '/for-colleges']].map(([l, h]) => (
            <Link key={h} href={h} style={{ color: '#7A7A7A', fontSize: 13, textDecoration: 'none' }}>{l}</Link>
          ))}
        </footer>
      </div>
    </div>
  )
}
