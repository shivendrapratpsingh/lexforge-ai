'use client'
//
// /future-lawyer — student-focused hub.
// Grid of services for law students, judiciary aspirants and CLAT
// candidates.  Each card links to its own focused workspace.
//
import Link from 'next/link'

const SERVICES = [
  {
    href:  '/future-lawyer/qa',
    icon:  '💬',
    title: 'AI Legal Q&A',
    blurb: 'Ask any Indian law question. Get a citation-backed answer with statutory provisions, leading judgments and exam tips.',
    cta:   'Ask a question →',
    accent: '#D4A017',
    live:  true,
  },
  {
    href:  '/future-lawyer/moot',
    icon:  '⚖️',
    title: 'Moot Court Memorial Builder',
    blurb: 'Paste a moot problem and pick a side. AI drafts a full memorial outline — facts, issues, arguments, prayer.',
    cta:   'Draft a memorial →',
    accent: '#22C55E',
    live:  true,
  },
  {
    href:  '/future-lawyer/roadmap',
    icon:  '🗺️',
    title: 'Career Roadmap',
    blurb: 'Where does a law degree take you? Litigation, corporate, judiciary, LLM abroad, civils, academia — laid out year by year.',
    cta:   'Open roadmap →',
    accent: '#2563EB',
    live:  true,
  },
  {
    href:  '/study',
    icon:  '📚',
    title: 'Landmark Judgments & Doctrines',
    blurb: 'Curated SC + HC judgments and core legal doctrines, with AI Tutor and quiz mode for exam revision.',
    cta:   'Open study deck →',
    accent: '#A855F7',
    live:  true,
  },
  {
    href:  '/future-lawyer/internships',
    icon:  '🎯',
    title: 'Internships & Placements',
    blurb: 'Curated internship leads at chambers, courts, NGOs and Tier-1 firms — plus tips for the CV, cover letter and viva.',
    cta:   'Coming soon',
    accent: '#F97316',
    live:  false,
  },
  {
    href:  '/future-lawyer/exam-prep',
    icon:  '📝',
    title: 'CLAT / Judicial Exam Prep',
    blurb: 'MCQs, mock tests and topic-wise drills for CLAT, AIBE, DJS, UP-PCS-J and other judicial services exams.',
    cta:   'Coming soon',
    accent: '#EF4444',
    live:  false,
  },
]

export default function FutureLawyerHub() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F0F0F0', margin: 0, letterSpacing: '-0.5px' }}>
          🎓 Future Lawyer
        </h1>
        <p style={{ color: '#7A7A7A', marginTop: 8, fontSize: 14, lineHeight: 1.6, maxWidth: 720 }}>
          Tools for law students, CLAT candidates and judicial aspirants. AI tutors, memorial builders,
          curated case law and career guidance — all in one place.
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        {SERVICES.map(s => {
          const cardInner = (
            <div style={{
              background: s.live ? '#141414' : '#0E0E0E',
              border: `1px solid ${s.live ? '#2A2A2A' : '#1A1A1A'}`,
              borderRadius: 14,
              padding: '22px 22px 18px',
              transition: 'border-color .15s, transform .15s, box-shadow .15s',
              cursor: s.live ? 'pointer' : 'default',
              opacity: s.live ? 1 : 0.55,
              position: 'relative',
              height: '100%',
              display: 'flex', flexDirection: 'column',
            }}
              onMouseEnter={(e) => {
                if (!s.live) return
                e.currentTarget.style.borderColor = s.accent
                e.currentTarget.style.transform   = 'translateY(-2px)'
                e.currentTarget.style.boxShadow   = `0 8px 24px -10px ${s.accent}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = s.live ? '#2A2A2A' : '#1A1A1A'
                e.currentTarget.style.transform   = 'translateY(0)'
                e.currentTarget.style.boxShadow   = 'none'
              }}
            >
              {!s.live && (
                <span style={{
                  position: 'absolute', top: 14, right: 14,
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9A9A9A',
                  padding: '3px 8px', borderRadius: 999,
                  textTransform: 'uppercase',
                }}>Coming Soon</span>
              )}
              <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.55, flex: 1 }}>
                {s.blurb}
              </div>
              <div style={{
                marginTop: 16,
                fontSize: 12, fontWeight: 700,
                color: s.live ? s.accent : '#5A5A5A',
                letterSpacing: 0.2,
              }}>
                {s.cta}
              </div>
            </div>
          )
          return s.live
            ? <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>{cardInner}</Link>
            : <div   key={s.href}>{cardInner}</div>
        })}
      </div>

      <footer style={{
        marginTop: 30,
        padding: '14px 18px',
        background: '#0F0F0F',
        border: '1px solid #1C1C1C',
        borderRadius: 10,
        fontSize: 12, color: '#7A7A7A', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#D4A017' }}>Note for students:</strong> These tools are study aids.
        AI answers cite real Indian statutes and judgments but you should verify every citation against
        the official text (Bare Acts, SC/HC reporters) before relying on it in coursework or moots.
      </footer>
    </div>
  )
}
