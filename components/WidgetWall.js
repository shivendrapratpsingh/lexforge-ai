'use client'

import AuroraWidget, { AuroraWords } from './AuroraWidget'
import AddToHomeScreen from './AddToHomeScreen'

// ─────────────────────────────────────────────────────────────────
//  The widget wall — everything that matters at 8 in the morning, on
//  one screen, all running the Aurora motion.
//
//  The day's line leads because it is the one tile that is not a task;
//  the rest report the state of the practice. Each tile rises a beat
//  after the one before it, so the wall assembles rather than
//  appearing all at once.
// ─────────────────────────────────────────────────────────────────

const fmt = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

const daysUntil = (d) => Math.round((new Date(d) - new Date()) / 86400000)

function Big({ children, color = '#F3ECDB' }) {
  return (
    <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color, letterSpacing: '-.02em' }}>
      {children}
    </div>
  )
}

export default function WidgetWall({
  line,                 // { text, attrib, kind } — today's line
  nextHearing = null,   // { title, date } | null
  inProgress = 0,       // drafts not yet finalized
  draftsLeft = null,    // null when Pro (no cap)
  freeLimit = null,
  studyPrompt = '',
  clientCount = 0,
}) {
  return (
    // 150px, not 168: at 168 a 375px phone falls to a single column and the
    // wall becomes a long stack you have to scroll past. 150 gives two up.
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', marginBottom: 24 }}>

      {/* Renders only on a phone that has not installed yet. On Windows
          and macOS the wall is simply here in the app, so this is silent. */}
      <AddToHomeScreen line={line} />

      {/* Today's line — spans the full width of the wall */}
      <div style={{ gridColumn: '1 / -1' }}>
        <AuroraWidget kicker="The day's line" accent="gold" minHeight={118}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 17, lineHeight: 1.4,
            letterSpacing: '-.005em', color: '#FBF0D6', textWrap: 'balance',
          }}>
            <AuroraWords text={line?.text || ''} start={120} />
          </div>
          {line?.attrib && (
            <div style={{
              fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
              color: '#8A7748', marginTop: 4,
            }}>
              <AuroraWords text={line.attrib} start={120 + (line.text || '').split(/\s+/).length * 55} step={28} />
            </div>
          )}
        </AuroraWidget>
      </div>

      {/* Next hearing */}
      <AuroraWidget kicker="Next in court" accent="azure" href="/court-dates"
        footer={nextHearing ? fmt(nextHearing.date) : 'Nothing listed this week'}>
        {nextHearing ? (
          <>
            <Big color="#9CC6F0">
              {(() => {
                const d = daysUntil(nextHearing.date)
                return d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`
              })()}
            </Big>
            <div style={{ fontSize: 12, color: '#B9AE94', lineHeight: 1.4, marginTop: 2 }}>
              <AuroraWords text={nextHearing.title} start={220} step={38} />
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#B9AE94', lineHeight: 1.45, marginTop: 2 }}>
            <AuroraWords text="A clear week. Use it on the file you have been avoiding." start={220} step={38} />
          </div>
        )}
      </AuroraWidget>

      {/* Drafts awaiting you */}
      <AuroraWidget kicker="Awaiting you" accent="ember" href="/drafts"
        footer={inProgress ? 'Unsigned drafts' : 'Everything is finalized'}>
        <Big color="#F0A55C">{inProgress}</Big>
        <div style={{ fontSize: 12, color: '#B9AE94', lineHeight: 1.4, marginTop: 2 }}>
          <AuroraWords
            text={inProgress === 0 ? 'Nothing is waiting on your signature.'
              : inProgress === 1 ? 'One draft still needs your signature.'
              : 'Drafts still need your signature.'}
            start={280} step={38}
          />
        </div>
      </AuroraWidget>

      {/* Study prompt */}
      <AuroraWidget kicker="Study today" accent="violet" href="/study" footer="Five minutes →">
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.42, color: '#E5DAF6', marginTop: 2 }}>
          <AuroraWords text={studyPrompt} start={340} step={40} />
        </div>
      </AuroraWidget>

      {/* Quota / Pro */}
      <AuroraWidget
        kicker={draftsLeft === null ? 'Your plan' : 'Free drafts'}
        accent="jade"
        href={draftsLeft === null ? '/drafts' : '/upgrade'}
        footer={draftsLeft === null ? 'No monthly cap' : `of ${freeLimit} this month`}
      >
        {draftsLeft === null ? (
          <>
            <Big color="#7FD6A4">Pro</Big>
            <div style={{ fontSize: 12, color: '#B9AE94', lineHeight: 1.4, marginTop: 2 }}>
              <AuroraWords text="Unlimited drafts, elevated register, every Act." start={400} step={38} />
            </div>
          </>
        ) : (
          <>
            <Big color={draftsLeft <= 2 ? '#F0A55C' : '#7FD6A4'}>{draftsLeft}</Big>
            <div style={{ fontSize: 12, color: '#B9AE94', lineHeight: 1.4, marginTop: 2 }}>
              <AuroraWords
                text={draftsLeft === 0 ? 'You are out until next month. Upgrade for unlimited.'
                  : draftsLeft <= 2 ? 'Running low. Upgrade for unlimited drafts.'
                  : 'Drafts remaining on the free plan.'}
                start={400} step={38}
              />
            </div>
          </>
        )}
      </AuroraWidget>

      {/* Clients */}
      <AuroraWidget kicker="On your books" accent="gold" href="/clients"
        footer={clientCount === 1 ? 'Client' : 'Clients'}>
        <Big color="#EBC868">{clientCount}</Big>
        <div style={{ fontSize: 12, color: '#B9AE94', lineHeight: 1.4, marginTop: 2 }}>
          <AuroraWords
            text={clientCount === 0 ? 'Add your first client to link drafts and dates.'
              : 'People relying on you to get this right.'}
            start={460} step={38}
          />
        </div>
      </AuroraWidget>

    </div>
  )
}
