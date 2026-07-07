import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import LandingSidePanel from '@/components/LandingSidePanel'

const FEATURES = [
  { icon: '🤖', title: 'AI Document Generation', desc: "Llama 3.3 70B generates complete, legally sound documents in seconds — tailored for Indian law." },
  { icon: '🔍', title: 'Case Law Research', desc: 'Search landmark Supreme Court and High Court cases instantly. Automatic citations included in your documents.' },
  { icon: '📤', title: 'Export PDF, DOCX, TXT', desc: 'Download your documents in any format, ready to file or share with your client immediately.' },
  { icon: '⚡', title: 'Groq Ultra-Fast Inference', desc: "Complete legal documents in under 30 seconds using Groq's world-fastest AI inference API." },
  { icon: '🔒', title: 'Secure & Private', desc: 'JWT authentication, bcrypt passwords, and isolated user accounts. Your data is yours.' },
  { icon: '💾', title: 'Draft Management', desc: 'Save, organize, finalize and export all your legal drafts. Status tracking built in.' },
]

const STEPS = [
  { n: '01', t: 'Select Type', d: 'Pick from 19 Indian legal document types' },
  { n: '02', t: 'Enter Details', d: 'Fill in the key facts and parties' },
  { n: '03', t: 'Download', d: 'Get your document as PDF or Word' },
]

const FOOTER_COLUMNS = [
  { title: 'Product', links: [['Features', '#features'], ['Document Types', '#documents'], ['Pricing', '/upgrade']] },
  { title: 'Account', links: [['Sign In', '/login'], ['Register', '/register']] },
  { title: 'Legal', links: [['Privacy', '#'], ['Terms', '#']] },
]

export default async function LandingPage() {
  // If the visitor is already signed in, send them straight into the app.
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const shownTypes = DOCUMENT_TYPES.slice(0, 8)

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-base/80 backdrop-blur border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center">
              <span className="text-base font-black text-sm">LF</span>
            </div>
            <span className="text-xl font-bold text-ink tracking-tight">LexForge AI</span>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            <a href="#features" className="text-ink-muted hover:text-ink no-underline text-sm font-medium px-4 py-2">Features</a>
            <a href="#documents" className="text-ink-muted hover:text-ink no-underline text-sm font-medium px-4 py-2">Document Types</a>
            <Link href="/login" className="text-ink-muted hover:text-ink no-underline text-sm font-medium px-4 py-2">Sign In</Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile: primary CTA + toggle drawer for Features/Document Types/Sign In,
              which the collapsed row below can't fit (see LandingSidePanel). */}
          <div className="lg:hidden flex items-center gap-2">
            <Link href="/register">
              <Button variant="primary" size="sm">Start Drafting</Button>
            </Link>
            <LandingSidePanel />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg px-4 sm:px-6 py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-gold/[0.08] border border-gold/20 px-4 py-1.5 rounded-full mb-7">
              <span className="size-1.5 rounded-full bg-gold inline-block" />
              <span className="text-[13px] text-gold font-medium">Powered by Llama 3.3 70B via Groq</span>
            </div>
            <h1 className="font-display font-semibold leading-[1.1] tracking-tight text-4xl sm:text-6xl lg:text-7xl mb-6">
              Legal Documents.
              <span className="gradient-text block">Drafted by AI.</span>
            </h1>
            <p className="text-lg sm:text-xl text-ink-muted leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              LexForge AI generates professional-grade Indian legal documents in under 30 seconds. Legal notices, contracts, petitions, and 16 more — all powered by cutting-edge AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">Start for Free →</Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">Sign In</Button>
              </Link>
            </div>
            <p className="mt-4 text-[13px] text-ink-faint">No credit card required · Free to use · Deploy-ready</p>
          </div>

          {/* Preview Card */}
          <Card className="p-0 overflow-hidden max-w-md mx-auto w-full lg:max-w-none">
            <div className="bg-surface-2 px-4 py-3 flex items-center gap-2 border-b border-border">
              <div className="size-3 rounded-full bg-border" />
              <div className="size-3 rounded-full bg-border" />
              <div className="size-3 rounded-full bg-border" />
              <span className="ml-2 text-xs text-ink-faint">lexforge.ai/dashboard</span>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[['12', 'Documents'], ['8', 'Finalized'], ['3', 'Exports'], ['19', 'Doc Types']].map(([v, l]) => (
                <div key={l} className="bg-surface-2 border border-border rounded-xl p-3 sm:p-4">
                  <div className="text-2xl sm:text-[28px] font-bold text-gold">{v}</div>
                  <div className="text-xs text-ink-faint mt-1">{l}</div>
                </div>
              ))}
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['📋', 'Legal Notice: Property Dispute', 'finalized'],
                ['📝', 'Contract: Service Agreement', 'draft'],
                ['🏛️', 'Petition: HC Writ', 'finalized'],
                ['⚖️', 'Case Brief: Mehta v. State', 'draft'],
              ].map(([icon, title, status]) => (
                <div key={title} className="bg-surface-2 border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink font-medium truncate">{title}</div>
                    <div className={`text-[11px] mt-0.5 ${status === 'finalized' ? 'text-success' : 'text-gold'}`}>{status}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Stats bar — fixed: was a hard-coded 4-col grid with no breakpoints */}
        <div className="max-w-[900px] mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 py-8 border-t border-border">
          {[['19', 'Document Types'], ['< 30s', 'AI Generation'], ['3', 'Export Formats'], ['30', 'Case Laws']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-3xl sm:text-4xl font-display font-semibold text-gold-light">{v}</div>
              <div className="text-xs sm:text-sm text-ink-muted mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 py-16 sm:py-20 max-w-[1100px] mx-auto">
        <div className="text-center mb-12 sm:mb-14">
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-3 tracking-tight">Everything a Legal Professional Needs</h2>
          <p className="text-ink-muted text-lg">One platform for drafting, researching, and exporting legal documents</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map(f => (
            <Card key={f.title} interactive>
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-ink mb-2.5">{f.title}</h3>
              <p className="text-ink-muted leading-relaxed text-sm">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Document Types — fixed: was a hard-coded 5-col grid, now reflows and
          caps what phones must render (8 shown + "view all" for the full 19) */}
      <section id="documents" className="px-4 sm:px-6 py-14 sm:py-16 bg-base border-t border-[#1C1C1C]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-3">19 Professional Document Types</h2>
            <p className="text-ink-muted">Everything from legal notices to court petitions</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {shownTypes.map(d => (
              <Card key={d.value} interactive className="text-center p-4 sm:p-5">
                <div className="text-3xl mb-2.5">{d.icon}</div>
                <div className="text-[13px] font-bold text-gold-light mb-1">{d.label}</div>
                <div className="text-xs text-ink-faint hidden sm:block">{d.description}</div>
              </Card>
            ))}
            <Link href="/register" className="col-span-2 sm:col-span-3 lg:col-span-5 text-center text-gold-light no-underline text-sm font-semibold py-3">
              View all 19 document types →
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 sm:px-6 py-16 sm:py-20 max-w-3xl mx-auto text-center">
        <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-3">From Details to Document in 3 Steps</h2>
        <p className="text-ink-muted mb-12">Simple. Fast. Professional.</p>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex lg:flex-col items-start lg:items-center gap-4 lg:gap-3 text-left lg:text-center relative">
              {i > 0 && <div className="hidden lg:block absolute -top-0 -left-1/2 w-full border-t border-border" style={{ top: 20 }} />}
              <div className="size-10 rounded-full bg-gold/10 border border-gold flex items-center justify-center text-gold-light font-bold shrink-0">{i + 1}</div>
              <div>
                <h3 className="text-lg font-bold text-gold-light mb-1">{s.t}</h3>
                <p className="text-ink-muted text-sm">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-4 sm:mx-6 mb-16 sm:mb-20 bg-gradient-to-br from-[#1A1200] to-surface border border-gold/20 rounded-3xl px-4 sm:px-6 py-14 sm:py-16 text-center">
        <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-4">Ready to Forge Your Legal Documents?</h2>
        <p className="text-ink-muted text-lg mb-9">Join legal professionals using LexForge AI to work smarter.</p>
        <Link href="/register">
          <Button variant="primary" size="lg">Get Started — It&apos;s Free</Button>
        </Link>
      </section>

      {/* Footer — accordion on mobile, columns on sm:+ */}
      <footer className="border-t border-[#1C1C1C] px-4 sm:px-6 py-10">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-8 mb-8">
          {FOOTER_COLUMNS.map(col => (
            <details key={col.title} className="sm:contents group border-b border-[#1C1C1C] sm:border-none">
              <summary className="sm:hidden py-3 text-sm font-medium text-ink cursor-pointer list-none flex items-center justify-between">
                {col.title}
                <span className="text-ink-faint group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <div className="hidden sm:block text-sm font-semibold text-ink-muted mb-3">{col.title}</div>
              <div className="flex flex-col gap-2 pb-3 sm:pb-0">
                {col.links.map(([label, href]) => (
                  <Link key={label} href={href} className="text-sm text-ink-faint hover:text-gold-light no-underline">{label}</Link>
                ))}
              </div>
            </details>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="size-6 bg-gradient-to-br from-gold to-gold-light rounded-md flex items-center justify-center">
            <span className="text-base font-black text-[10px]">LF</span>
          </div>
          <span className="font-bold text-ink-faint text-sm">LexForge AI</span>
        </div>
        <p className="text-center text-ink-faint text-[13px]">© 2026 LexForge AI · AI-Powered Legal Documents for India</p>
      </footer>
    </div>
  )
}
