import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function LandingPage() {
  // If the visitor is already signed in, send them straight into the app.
  // This makes "Dashboard" feel reachable from the very first page —
  // hitting `/` after login takes you to the working dashboard, not back
  // to the marketing splash.
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', color: '#F0F0F0' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, borderBottom: '1px solid #1C1C1C', background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #D4A017, #F0C040)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0D0D0D', fontWeight: 900, fontSize: 14 }}>LF</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', letterSpacing: '-0.3px' }}>LexForge AI</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#A0A0A0', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px' }}>Sign In</Link>
            <Link href="/register" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px rgba(212,160,23,0.3)' }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg" style={{ paddingTop: 140, paddingBottom: 100, textAlign: 'center', padding: '140px 24px 100px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', padding: '6px 16px', borderRadius: 100, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A017', display: 'inline-block' }}></span>
            <span style={{ fontSize: 13, color: '#D4A017', fontWeight: 500 }}>Powered by Llama 3.3 70B via Groq</span>
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
            Legal Documents.
            <span className="gradient-text" style={{ display: 'block' }}>Drafted by AI.</span>
          </h1>
          <p style={{ fontSize: 20, color: '#808080', marginBottom: 40, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px' }}>
            LexForge AI generates professional-grade Indian legal documents in under 30 seconds. Legal notices, contracts, petitions — all powered by cutting-edge AI.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '14px 32px', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(212,160,23,0.3)', display: 'inline-block' }}>
              Start for Free →
            </Link>
            <Link href="/login" style={{ background: 'transparent', color: '#D4A017', padding: '14px 32px', borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(212,160,23,0.3)', display: 'inline-block' }}>
              Sign In
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: '#4A4A4A' }}>No credit card required · Free to use · Deploy-ready</p>
        </div>

        {/* Preview Card */}
        <div style={{ maxWidth: 900, margin: '64px auto 0', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 40px rgba(212,160,23,0.05)' }}>
          <div style={{ background: '#1C1C1C', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #2A2A2A' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3A3A3A' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3A3A3A' }}></div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3A3A3A' }}></div>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#5A5A5A' }}>lexforge.ai/dashboard</span>
          </div>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[['12', 'Documents'], ['8', 'Finalized'], ['3', 'Exports'], ['4', 'Doc Types']].map(([v, l]) => (
              <div key={l} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#D4A017' }}>{v}</div>
                <div style={{ fontSize: 12, color: '#6A6A6A', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['📋', 'Legal Notice: Property Dispute', 'finalized'],
              ['📝', 'Contract: Service Agreement', 'draft'],
              ['🏛️', 'Petition: HC Writ', 'finalized'],
              ['⚖️', 'Case Brief: Mehta v. State', 'draft'],
            ].map(([icon, title, status]) => (
              <div key={title} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#D0D0D0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                  <div style={{ fontSize: 11, color: status === 'finalized' ? '#4CAF50' : '#D4A017', marginTop: 2 }}>{status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: 'linear-gradient(90deg, #1A1400, #0D0D0D, #1A1400)', borderTop: '1px solid #2A2A2A', borderBottom: '1px solid #2A2A2A', padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
          {[['5+','Document Types'],['< 30s','AI Generation'],['3','Export Formats'],['6','Case Laws']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#D4A017' }}>{v}</div>
              <div style={{ fontSize: 13, color: '#6A6A6A', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>Everything a Legal Professional Needs</h2>
          <p style={{ color: '#6A6A6A', fontSize: 18 }}>One platform for drafting, researching, and exporting legal documents</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[
            { icon: '🤖', title: 'AI Document Generation', desc: 'Llama 3.3 70B generates complete, legally sound documents in seconds — tailored for Indian law.' },
            { icon: '🔍', title: 'Case Law Research', desc: 'Search 6 landmark Supreme Court cases instantly. Automatic citations included in your documents.' },
            { icon: '📤', title: 'Export PDF, DOCX, TXT', desc: 'Download your documents in any format, ready to file or share with your client immediately.' },
            { icon: '⚡', title: 'Groq Ultra-Fast Inference', desc: 'Complete legal documents in under 30 seconds using Groq\'s world-fastest AI inference API.' },
            { icon: '🔒', title: 'Secure & Private', desc: 'JWT authentication, bcrypt passwords, and isolated user accounts. Your data is yours.' },
            { icon: '💾', title: 'Draft Management', desc: 'Save, organize, finalize and export all your legal drafts. Status tracking built in.' },
          ].map(f => (
            <div key={f.title} className="card-hover" style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0', marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: '#6A6A6A', lineHeight: 1.7, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Document Types */}
      <section style={{ padding: '60px 24px', background: '#0A0A0A', borderTop: '1px solid #1C1C1C' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>5 Professional Document Types</h2>
            <p style={{ color: '#6A6A6A' }}>Everything from legal notices to court petitions</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
            {[
              { icon: '📋', type: 'Legal Notice', desc: 'Demand action formally' },
              { icon: '⚖️', type: 'Case Brief', desc: 'Structured arguments' },
              { icon: '📝', type: 'Contract', desc: 'Binding agreements' },
              { icon: '🏛️', type: 'Petition', desc: 'Court applications' },
              { icon: '📄', type: 'Memorandum', desc: 'Legal analysis' },
            ].map(d => (
              <div key={d.type} className="card-hover" style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{d.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A017', marginBottom: 6 }}>{d.type}</div>
                <div style={{ fontSize: 12, color: '#5A5A5A' }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>From Details to Document in 3 Steps</h2>
        <p style={{ color: '#6A6A6A', marginBottom: 48 }}>Simple. Fast. Professional.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {[
            { n: '01', t: 'Select Type', d: 'Pick from 5 legal document types' },
            { n: '02', t: 'Enter Details', d: 'Fill in the key facts and parties' },
            { n: '03', t: 'Download', d: 'Get your document as PDF or Word' },
          ].map(s => (
            <div key={s.n}>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(212,160,23,0.15)', lineHeight: 1, marginBottom: 12 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#D4A017', marginBottom: 8 }}>{s.t}</h3>
              <p style={{ color: '#6A6A6A', fontSize: 14 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ margin: '0 24px 80px', background: 'linear-gradient(135deg, #1A1200, #141414)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 24, padding: '60px 24px', textAlign: 'center', boxShadow: '0 0 60px rgba(212,160,23,0.05)' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Ready to Forge Your Legal Documents?</h2>
        <p style={{ color: '#808080', fontSize: 18, marginBottom: 36 }}>Join legal professionals using LexForge AI to work smarter.</p>
        <Link href="/register" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '16px 40px', borderRadius: 12, fontSize: 18, fontWeight: 700, textDecoration: 'none', display: 'inline-block', boxShadow: '0 0 30px rgba(212,160,23,0.4)' }}>
          Get Started — It&apos;s Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1C1C1C', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #D4A017, #F0C040)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#0D0D0D', fontWeight: 900, fontSize: 10 }}>LF</span>
          </div>
          <span style={{ fontWeight: 700, color: '#4A4A4A', fontSize: 14 }}>LexForge AI</span>
        </div>
        <p style={{ color: '#3A3A3A', fontSize: 13 }}>© 2025 LexForge AI · AI-Powered Legal Documents for India</p>
      </footer>
    </div>
  )
}
