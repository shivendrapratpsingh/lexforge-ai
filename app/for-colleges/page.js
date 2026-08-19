import Link from 'next/link'
import PilotRequestForm from '@/components/PilotRequestForm'

// The page to send a Moot Court Society convenor, a Principal, or a
// faculty co-ordinator. Public — the reader has no account and no reason
// to make one before deciding whether this is worth ten minutes.
//
// Written for someone who has been pitched a great deal of software and
// believed none of it: what it does, what it costs, what it will not do,
// and what happens next.

export const metadata = {
  title: 'LexForge for law colleges',
  description:
    'Research, drafting and moot memorial tools for law students — set up for a whole college with one code, free for the pilot.',
}

const GOLD = '#D4A017'

const WHAT = [
  {
    t: 'Moot memorial builder',
    d: 'A memorial is structured before it is written — Statement of Jurisdiction, Statement of Facts, Issues, Summary of Pleadings, Arguments Advanced, Prayer. Students get that structure and a working draft, then argue with it. Where an authority is needed the draft says so in the open rather than inventing one.',
  },
  {
    t: 'Real judgments, quoted as reported',
    d: 'Search runs against Indian Kanoon and India Code and returns actual judgments with their real citations. Nothing is generated to fill a gap — if the search finds nothing, the answer says nothing was found. This is the single hardest thing to get right about AI in law, and it is the reason a student can be marked on what comes out.',
  },
  {
    t: 'The Acts themselves',
    d: 'Search 269 Central Acts in plain language — describe the problem, not the section number — and read the actual text of the section, pulled from India Code rather than paraphrased.',
  },
  {
    t: 'Drafting practice on real formats',
    d: 'Writ petitions, bail applications, legal notices, affidavits, plaints, vakalatnamas — the documents a junior will be handed in their first week and is expected to already know.',
  },
  {
    t: 'Case-law research with an argument',
    d: 'Enter the facts of a problem and get the relevant precedents ordered from Supreme Court downwards, with what each one actually held — the work of an afternoon in a library, done as a starting point rather than an answer.',
  },
  {
    t: 'Works on the phone they already own',
    d: 'It installs to a home screen from the browser. No lab, no licences to manage, no IT request, nothing for the college to run.',
  },
]

const STEPS = [
  { n: '1', t: 'You tell us the college', d: 'The form below. A name and an email is enough.' },
  { n: '2', t: 'We set it up and send a code', d: 'One code for the whole college, usually the same day.' },
  { n: '3', t: 'Students type it once', d: 'Account → Plan → the code. That is the entire onboarding, and it works with a personal Gmail — no college email needed.' },
  { n: '4', t: 'You see what they use', d: 'How many signed up, how many are active, and what they actually do with it. Numbers for a committee, not a testimonial.' },
]

export default function ForColleges() {
  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F0F0F0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>

        <Link href="/" style={{ color: '#6A6A6A', fontSize: 13, textDecoration: 'none' }}>← LexForge AI</Link>

        <header style={{ marginTop: 32 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '2.5px', fontWeight: 800, textTransform: 'uppercase' }}>
            For law colleges
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.15, margin: '12px 0 0', letterSpacing: '-0.02em' }}>
            Your students are already using AI for legal research.
            <br />
            <span style={{ color: GOLD }}>This one shows its sources.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#A0A0A0', lineHeight: 1.75, margin: '18px 0 0', maxWidth: '65ch' }}>
            The problem with a general chatbot in a law school is not that it is
            unhelpful. It is that it will produce a citation that does not
            exist, in a format that looks exactly like one that does, and a
            second-year has no way to tell. LexForge retrieves the judgment
            first and will only discuss what it actually found — so a student
            can be marked on the output, and taught to check it.
          </p>
        </header>

        <section style={{ marginTop: 44, background: '#111', border: `1px solid ${GOLD}33`, borderRadius: 14, padding: 26 }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase' }}>
            What a pilot costs
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, margin: '10px 0 6px' }}>Nothing</div>
          <p style={{ fontSize: 14.5, color: '#B0B0B0', lineHeight: 1.75, margin: 0, maxWidth: '62ch' }}>
            A full academic term, every feature, every student, no card and no
            purchase order. We would rather find out whether your students use
            it than negotiate before they have touched it. If it turns out to be
            useful we will talk about what it costs; if it does not, it stops
            and nothing is owed. Student accounts and their work survive either
            way — ending a pilot never deletes anybody.
          </p>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 18px' }}>What students get</h2>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
            {WHAT.map(c => (
              <div key={c.t} style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#F0E4C0', marginBottom: 8 }}>{c.t}</div>
                <div style={{ fontSize: 13.5, color: '#9A9A9A', lineHeight: 1.7 }}>{c.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 18px' }}>How a college is set up</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 18 }}>
                <div style={{
                  flex: 'none', width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
                  background: `${GOLD}1A`, color: GOLD, fontWeight: 800, fontSize: 15,
                }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#F0F0F0' }}>{s.t}</div>
                  <div style={{ fontSize: 13.5, color: '#9A9A9A', lineHeight: 1.7, marginTop: 4 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 14px' }}>What it will not do</h2>
          <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 12, padding: 22, fontSize: 14, color: '#9A9A9A', lineHeight: 1.85 }}>
            <p style={{ margin: '0 0 12px' }}>
              It does not write a memorial a student can submit unread. The
              draft is a structure and a starting position; the arguments still
              have to be theirs, and a judge will find out in thirty seconds if
              they are not.
            </p>
            <p style={{ margin: '0 0 12px' }}>
              It does not give legal advice, and it says so. What it produces is
              a draft for a qualified person to check.
            </p>
            <p style={{ margin: 0 }}>
              It does not have every case. Live search covers reported
              judgments through Indian Kanoon and India Code; district court
              records and unreported orders are outside it. When a search finds
              nothing, it says nothing was found rather than filling the space.
            </p>
          </div>
        </section>

        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Ask about a pilot</h2>
          <p style={{ fontSize: 14, color: '#8A8A8A', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '60ch' }}>
            Or just ask a question — whether it fits your syllabus, what the
            students actually see, whether it will survive a moot season.
          </p>
          <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 14, padding: 24 }}>
            <PilotRequestForm />
          </div>
        </section>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/register" style={{ color: GOLD, fontSize: 14, textDecoration: 'none', fontWeight: 700 }}>
            Or make an account and try it yourself first →
          </Link>
        </div>
      </div>
    </div>
  )
}
