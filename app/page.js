import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import LandingSidePanel from '@/components/LandingSidePanel'
import ExplodedLawBook from '@/components/ExplodedLawBook'
import { COMPANY, hasAddress, hasEmail } from '@/lib/company'
import { PLANS, rupees } from '@/lib/billing'

const FEATURES = [
  { icon: '🤖', title: 'AI Document Generation', desc: 'Complete, court-ready documents in seconds, drafted for Indian law and Indian formats.' },
  { icon: '🔍', title: 'Case Law Research', desc: 'Search real Supreme Court and High Court judgments and quote them as reported — never a citation invented to fill a gap.' },
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
  { title: 'Product', links: [['Features', '#features'], ['Document Types', '#documents'], ['Pricing', '/pricing'], ['For law colleges', '/for-colleges']] },
  { title: 'Account', links: [['Sign In', '/login'], ['Register', '/register']] },
  // These pointed at '#' — dead links on the one page a payment gateway
  // reviews before it will activate an account.
  { title: 'Legal', links: [['Terms', '/terms'], ['Privacy', '/privacy'], ['Refunds', '/refund'], ['Contact', '/contact']] },
]

export const metadata = {
  title: 'LexForge AI — AI legal drafting for Indian law',
  description:
    'Draft Indian legal documents in under a minute — legal notices, writ petitions, bail applications and more. Search real Supreme Court and High Court judgments, read bare Acts, and build moot memorials. Free to start.',
  keywords: [
    'AI legal drafting India', 'legal notice format India', 'draft legal notice online',
    'writ petition format', 'bail application draft', 'moot memorial builder',
    'Indian bare acts search', 'case law search India', 'LexForge', 'LexForge AI',
  ],
  alternates: { canonical: COMPANY.site },
  openGraph: {
    type: 'website',
    siteName: 'LexForge AI',
    title: 'LexForge AI — AI legal drafting for Indian law',
    description: 'Indian legal documents drafted in under a minute, with judgments quoted as reported and never invented.',
    url: COMPANY.site,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LexForge AI — AI legal drafting for Indian law',
    description: 'Indian legal documents drafted in under a minute. Real citations, never invented.',
  },
}

export default async function LandingPage() {
  // If the visitor is already signed in, send them straight into the app.
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const shownTypes = DOCUMENT_TYPES.slice(0, 8)

  // Structured data. This is how a search engine learns that the page is
  // a software product with a price and a publisher, rather than a wall
  // of text it has to guess at — and it is what lets a result show the
  // price and the rating instead of just a blue link.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'LexForge AI',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Legal drafting and research',
        operatingSystem: 'Web browser, Android, iOS',
        url: COMPANY.site,
        description:
          'AI legal drafting for Indian law. Draft legal notices, writ petitions and bail applications, search real Supreme Court and High Court judgments, read bare Acts, and build moot court memorials.',
        inLanguage: ['en-IN', 'hi-IN'],
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Free' },
          ...Object.values(PLANS).map(p => ({
            '@type': 'Offer',
            price: String(rupees(p.amountPaise)),
            priceCurrency: 'INR',
            name: p.label,
          })),
        ],
        featureList: [
          'Draft 19 Indian legal document types',
          'Search real Supreme Court and High Court judgments',
          'Search every Central Act and Rule',
          'Moot court memorial builder',
          'Live case status by CNR number',
          'Drafting in Hindi, Urdu, Tamil, Telugu and Kannada',
        ],
        publisher: { '@id': `${COMPANY.site}/#org` },
      },
      {
        '@type': 'Organization',
        '@id': `${COMPANY.site}/#org`,
        name: 'LexForge AI',
        legalName: COMPANY.legalName,
        url: COMPANY.site,
        ...(hasEmail() ? { email: COMPANY.email } : {}),
        ...(COMPANY.phone ? { telephone: COMPANY.phone } : {}),
        address: {
          '@type': 'PostalAddress',
          addressLocality: COMPANY.city,
          addressRegion: COMPANY.state,
          addressCountry: 'IN',
          ...(hasAddress() ? { streetAddress: COMPANY.address.split('\n')[0] } : {}),
        },
        areaServed: { '@type': 'Country', name: 'India' },
      },
      {
        // The questions people type into Google, answered on the page
        // they land on. This is what wins a long-tail search.
        '@type': 'FAQPage',
        mainEntity: [
          ['Can AI draft legal documents in India?',
           'Yes. LexForge drafts Indian legal formats — legal notices, writ petitions, bail applications, affidavits and more — from the facts you enter. The output is a draft for a qualified person to check, not legal advice.'],
          ['Does LexForge invent case citations?',
           'No. Judgments are retrieved from Indian Kanoon and India Code and quoted as reported. Where no authority is found, the draft says so rather than inventing one.'],
          ['Is there a free plan?',
           'Yes. Every account includes free documents each month with no card required.'],
          ['Can it draft in Hindi or Kannada?',
           'Yes. Documents can be drafted in Hindi, Urdu, Tamil, Telugu and Kannada, using the vocabulary those courts actually use, or bilingually with an English body and Hindi cause title and prayer.'],
          ['Can a law college use it for all its students?',
           'Yes. A college sends its class list and every student on it gets an account. A pilot is free for a full term.'],
        ].map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
              <span className="text-[13px] text-gold font-medium">Powered by Groq</span>
            </div>
            <h1 className="font-display font-semibold leading-[1.1] tracking-tight text-4xl sm:text-6xl lg:text-7xl mb-6">
              AI legal drafting
              <span className="gradient-text block">for Indian law.</span>
            </h1>
            <p className="text-lg sm:text-xl text-ink-muted leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              Draft legal notices, writ petitions, bail applications and sixteen
              more Indian formats in under a minute. Search real Supreme Court and
              High Court judgments, read the bare Acts, and build a moot memorial —
              with citations quoted as reported, never invented.
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

          {/* The product's claim, drawn: a statute taken apart, and the
              document that comes out of it. */}
          <div className="flex justify-center lg:justify-end">
            <ExplodedLawBook />
          </div>
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

      {/* CTA — the direct way in, said plainly */}
      <section className="mx-4 sm:mx-6 mb-12 bg-gradient-to-br from-[#1A1200] to-surface border border-gold/20 rounded-3xl px-4 sm:px-6 py-14 sm:py-16 text-center">
        <h2 className="font-display font-semibold text-3xl sm:text-4xl mb-4">Open the app</h2>
        <p className="text-ink-muted text-lg mb-9 max-w-xl mx-auto">
          Free to start, no card. Sign in if you already have an account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">Start free →</Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">Sign in</Button>
          </Link>
        </div>
      </section>

      {/* Contact — a real address and a real person, because a legal
          product with neither is one nobody trusts with a case. */}
      <section id="contact" className="mx-4 sm:mx-6 mb-16 sm:mb-20">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="text-[11px] text-gold font-bold tracking-[2px] uppercase mb-3">Talk to us</div>
            {hasEmail() && (
              <a href={`mailto:${COMPANY.email}`} className="text-ink no-underline text-sm block mb-1.5 break-all">{COMPANY.email}</a>
            )}
            {COMPANY.phone && <div className="text-ink-muted text-sm">{COMPANY.phone}</div>}
            <div className="text-ink-faint text-xs mt-3 leading-relaxed">
              One person reads every email. Replies within two working days.
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="text-[11px] text-gold font-bold tracking-[2px] uppercase mb-3">Where we are</div>
            <div className="text-ink text-sm font-medium">{COMPANY.legalName}</div>
            {hasAddress()
              ? <div className="text-ink-muted text-sm whitespace-pre-line mt-1 leading-relaxed">{COMPANY.address}</div>
              : <div className="text-ink-muted text-sm mt-1">{COMPANY.city}, {COMPANY.state}, India</div>}
          </div>

          <div className="bg-surface border border-gold/25 rounded-2xl p-6">
            <div className="text-[11px] text-gold font-bold tracking-[2px] uppercase mb-3">For law colleges</div>
            <div className="text-ink-muted text-sm leading-relaxed mb-4">
              A pilot is free for a full term. Send us your class list and every
              student has an account waiting.
            </div>
            <Link href="/for-colleges" className="text-gold no-underline text-sm font-semibold">
              See how a college is set up →
            </Link>
          </div>
        </div>
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
