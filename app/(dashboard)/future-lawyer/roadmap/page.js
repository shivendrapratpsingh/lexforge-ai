'use client'
//
// /future-lawyer/roadmap — Career roadmap for Indian law students.
// Static, comprehensive guide covering all major career paths.
//
import { useState } from 'react'
import Link from 'next/link'

const PATHS = [
  {
    key: 'litigation',
    title: 'Litigation Practice',
    icon: '⚖️',
    accent: '#D4A017',
    timeline: 'Year 1 of college → 5+ years post-degree',
    blurb: 'Court advocacy. Argue cases before HC / SC / district courts. Highest variance — lean financial first 3-5 years, very high upside after.',
    steps: [
      { when: 'Years 1–3 (UG)', what: 'Intern under a HC / SC senior advocate (3-4 internships of 4-6 weeks each). Attend court regularly even when not interning. Read SCC fortnightly.' },
      { when: 'Year 4 (UG)',     what: 'Pick a specialisation: criminal / civil / commercial / constitutional. Intern with a chamber in that area. Start drafting plaints, written statements, bail applications.' },
      { when: 'Year 5 (UG)',     what: 'Final internship with a chamber you intend to join. Build relationships. Apply for AOR-level exposure if SC-bound.' },
      { when: 'Year 0 (post-LLB)', what: 'Enrol with State Bar Council → take AIBE (All India Bar Examination) → join a senior\'s chambers as a junior. Expect ₹15–40K/month for the first year.' },
      { when: 'Years 1–3',       what: 'Independent drafting + court appearances + own briefs. Build personal client base. Income climbs to ₹50K–1.5L/month with a strong senior.' },
      { when: 'Years 4+',        what: 'Independent practice OR senior partnership at a litigation firm. Income highly variable; top SC advocates earn ₹10L+/case.' },
    ],
  },
  {
    key: 'corporate',
    title: 'Corporate / Law-Firm Career',
    icon: '🏢',
    accent: '#2563EB',
    timeline: 'Year 1 of college → partner track 8-10 years post-degree',
    blurb: 'Tier-1 / Tier-2 law firms (CAM, AZB, S&R, Trilegal, L&L, JSA, etc.). High structured pay, long hours, strong learning curve.',
    steps: [
      { when: 'Years 1–2 (UG)', what: 'Strong CGPA. Join Moot Court society. First internship at a Tier-3 firm or in-house counsel.' },
      { when: 'Year 3',         what: 'Tier-2 firm internship + one moot win or paper publication. Apply for international internships (Lex Mundi, IFLR, etc.).' },
      { when: 'Year 4',         what: 'Tier-1 firm internship — CAM, AZB, S&R, Trilegal. Decent CGPA + a published paper + one strong moot = competitive PPO chance.' },
      { when: 'Year 5',         what: 'Pre-Placement Offer (PPO) interviews. Day-Zero / Day-One placements. Pay packets: ₹18-22L (Tier-1), ₹12-16L (Tier-2).' },
      { when: 'Years 0–3',      what: 'Associate. M&A / banking / disputes / capital markets / TMT / IP. Bonuses + lateral moves possible.' },
      { when: 'Years 4–7',      what: 'Senior Associate → Principal Associate. Lateral moves to international firms (London / Singapore) become real options.' },
      { when: 'Years 8–10',     what: 'Counsel → Partner track. Equity Partner = ₹2-5 Cr/year at top firms. Alternative: GC role in a corporate (Reliance, Tata, Infosys).' },
    ],
  },
  {
    key: 'judiciary',
    title: 'Judicial Services',
    icon: '🏛️',
    accent: '#A855F7',
    timeline: 'Year 4 of college onwards (PCS-J entry age varies state-wise)',
    blurb: 'Direct recruitment as a Civil Judge / Judicial Magistrate. Stable, prestigious, slow career arc to District Judge → High Court Judge.',
    steps: [
      { when: 'Year 4 (UG)',     what: 'Start systematic syllabus prep — CPC, CrPC/BNSS, Evidence Act, IPC/BNS, constitutional law, state-specific Acts. NJA / Rajesh Sharma / Mahendra books.' },
      { when: 'Year 5 + Year 0', what: 'Take state PCS-J: UP-PCS-J, Delhi DJS, Rajasthan RJS, MP-CJ, etc. Prelims (MCQ) → Mains (written) → Viva. Min age usually 21-23.' },
      { when: 'Year 0–1 post-selection', what: 'NJA training at Bhopal (1 year). Probation at district court.' },
      { when: 'Years 1–10',      what: 'Civil Judge (Jr. Division) → Civil Judge (Sr. Division) → Additional District Judge. Pay scale ₹56K → ₹1.5L/month + housing + travel.' },
      { when: 'Years 10–25',     what: 'District Judge. Eligible for direct HC elevation as a Judge. Annual income ~₹25-40L incl. allowances.' },
      { when: 'Years 20+',       what: 'High Court Judge (rare path — most HC judges come from bar). Supreme Court elevation possible from HC Chief Justice rank.' },
    ],
  },
  {
    key: 'llm',
    title: 'LLM Abroad / Academia',
    icon: '🎓',
    accent: '#22C55E',
    timeline: 'Year 5 → 2-3 years post-degree',
    blurb: 'Master\'s at Harvard / Yale / Oxford / Cambridge / NUS, etc. Path to international firms, NY/CA Bar, or PhD + academia.',
    steps: [
      { when: 'Years 1–4 (UG)',  what: 'Build a strong academic record (top 10% CGPA), publish in peer-reviewed journals (NLSIR, NUJS Law Review, Journal of Indian Law and Society), 2-3 strong moots.' },
      { when: 'Year 4 summer',   what: 'Take TOEFL/IELTS. Long-list LLM programs by funding (HLS Stipend, Inlaks, Felix, Chevening, Rhodes, K-Bird, OP Jindal).' },
      { when: 'Year 5',          what: 'LLM applications close Oct-Dec. Personal Statement + 2 LoRs (one academic, one professional) + writing sample. Apply for funding in parallel.' },
      { when: 'Year 0 (post-UG)', what: 'Start LLM (1 year). Specialise in International Arbitration / Tax / Constitutional / Tech-law / IP. Network at conferences.' },
      { when: 'Year +1',         what: 'New York / California Bar exam (≈3 months prep). Open OCI (Office of Career Services) interviews for international firms.' },
      { when: 'Year +2 onward',  what: 'Either international firm associate (NY / London / Singapore — $200K+ salary), OR return to India as a partner-track lateral, OR PhD + tenure-track academia.' },
    ],
  },
  {
    key: 'civils',
    title: 'Civil Services (UPSC / State PCS)',
    icon: '🇮🇳',
    accent: '#EF4444',
    timeline: 'Year 4 of UG onwards (3-4 attempts realistic)',
    blurb: 'IAS / IPS / IFS / IRS. Law degree is one of the strongest backgrounds — Constitutional law overlap is substantial in GS-II and Mains.',
    steps: [
      { when: 'Year 4 (UG)',  what: 'NCERT Class 6-12 base. Pick an optional — Law optional is high-scoring for law students. Start reading The Hindu / Indian Express daily.' },
      { when: 'Year 5 (UG)',  what: 'Prelims foundation: CSAT, GS Polity, Economy, Environment, History. Join a test series (Vision IAS / Insight IAS).' },
      { when: 'Year 0',       what: 'First serious attempt: Prelims (June) → Mains (September) → Interview (Feb-Mar). Most law graduates take Law / Public Admin as optional.' },
      { when: 'Years 1–3',    what: '2nd and 3rd attempts if needed. Average successful candidate clears in 2nd or 3rd attempt.' },
      { when: 'Post-selection', what: 'LBSNAA training (Mussoorie, 1.5 years). Cadre allotment → SDM / DCP / ITO posting. Pay scale 7th CPC: ₹56K + perks rising rapidly.' },
    ],
  },
  {
    key: 'in-house',
    title: 'In-House Counsel (Industry)',
    icon: '💼',
    accent: '#F97316',
    timeline: 'Year 5 onwards (typically after 2-3 years at a firm)',
    blurb: 'Legal team at a corporate (Infosys, Reliance, Flipkart, Microsoft India, banks, fintech). Reasonable hours, predictable comp.',
    steps: [
      { when: 'Years 1–4 (UG)', what: 'Internships in compliance / contracts at tech firms or banks alongside firm internships.' },
      { when: 'Year 5',         what: 'Direct hire is uncommon — most join after 2-3 years at a Tier-1/2 firm. Skill stack: contract drafting + commercial law + regulatory compliance.' },
      { when: 'Years 2–4 post-LLB', what: 'Lateral from a firm to a corporate legal team. Starting comp at MNCs: ₹15-25L all-in.' },
      { when: 'Years 5–10',     what: 'Senior Counsel / AGM Legal. Specialise in regulatory (RBI, SEBI, CCI) or contracts (M&A, vendor, employment). ₹35-60L.' },
      { when: 'Years 10+',      what: 'General Counsel / Group GC. Board-level role. ₹1-3 Cr at large listed companies. Often also handles compliance, secretarial, ESG.' },
    ],
  },
]

export default function CareerRoadmapPage() {
  const [open, setOpen] = useState(PATHS[0].key)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 6, fontSize: 12 }}>
        <Link href="/future-lawyer" style={{ color: '#7A7A7A', textDecoration: 'none' }}>← Future Lawyer</Link>
      </div>
      <header style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', margin: 0, letterSpacing: '-0.5px' }}>
          🗺️ Career Roadmap
        </h1>
        <p style={{ color: '#7A7A7A', marginTop: 6, fontSize: 13.5, lineHeight: 1.6, maxWidth: 720 }}>
          Six career paths a law graduate in India can realistically take, with timeline, expected
          comp at each stage, and the prep work to start in each year of UG.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 18 }}>
        {PATHS.map(p => (
          <button
            key={p.key}
            onClick={() => setOpen(p.key)}
            style={{
              padding: '12px 10px',
              background: open === p.key ? `${p.accent}15` : '#141414',
              border: `1px solid ${open === p.key ? p.accent : '#2A2A2A'}`,
              borderRadius: 10, cursor: 'pointer',
              color: open === p.key ? p.accent : '#C0C0C0',
              fontSize: 11.5, fontWeight: 700,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              textAlign: 'center',
            }}>
            <span style={{ fontSize: 22 }}>{p.icon}</span>
            {p.title}
          </button>
        ))}
      </div>

      {PATHS.filter(p => p.key === open).map(p => (
        <div key={p.key} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.accent }}>{p.title}</div>
              <div style={{ fontSize: 11, color: '#7A7A7A', marginTop: 2 }}>{p.timeline}</div>
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: '#C0C0C0', lineHeight: 1.6, marginBottom: 18 }}>{p.blurb}</p>

          <div style={{ borderLeft: `2px solid ${p.accent}40`, paddingLeft: 18, marginLeft: 8 }}>
            {p.steps.map((step, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                <span style={{
                  position: 'absolute', left: -25, top: 4,
                  width: 10, height: 10, borderRadius: '50%',
                  background: p.accent, boxShadow: `0 0 0 3px ${p.accent}22`,
                }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: p.accent, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                  {step.when}
                </div>
                <div style={{ fontSize: 13.5, color: '#E0E0E0', lineHeight: 1.6 }}>
                  {step.what}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 22,
        padding: '14px 18px',
        background: '#0F0F0F',
        border: '1px solid #1C1C1C',
        borderRadius: 10,
        fontSize: 12, color: '#7A7A7A', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#D4A017' }}>Salary figures</strong> are realistic 2025–26 ranges for a graduate
        from a top-15 NLU / Tier-1 university. Actual numbers vary widely by college, city, and individual track
        record. These are starting points, not guarantees.
      </div>
    </div>
  )
}
