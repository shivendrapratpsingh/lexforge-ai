'use client'
// ─────────────────────────────────────────────────────────────────
//  components/WhatsNextCard.js
//  "What's Next" follow-up card shown on the draft detail page.
//
//  Props:
//    followUp  — output of getFollowUp() from lib/followup.js
//    draftId   — current draft ID (used to build ?from= URL)
// ─────────────────────────────────────────────────────────────────
import { useRouter } from 'next/navigation'

const URGENCY_COLORS = {
  high:   { border: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.06)',   dot: '#EF4444', label: '#EF4444' },
  medium: { border: 'rgba(251,146,60,0.3)',  bg: 'rgba(251,146,60,0.06)',  dot: '#FB923C', label: '#FB923C' },
  low:    { border: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.06)',  dot: '#60A5FA', label: '#60A5FA' },
}

function formatDeadline(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function WhatsNextCard({ followUp, draftId }) {
  const router = useRouter()
  if (!followUp) return null

  const colors   = URGENCY_COLORS[followUp.urgency] || URGENCY_COLORS.low
  const overdue  = followUp.isOverdue
  const daysLeft = followUp.daysLeft

  const urgencyLabel = overdue
    ? `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''}`
    : daysLeft === 0
      ? 'Due today'
      : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`

  function handleDraftNext() {
    // Build URL to new-draft page with parent draft ID and next doc type pre-selected
    const params = new URLSearchParams()
    params.set('from', draftId)
    if (followUp.nextDocType) params.set('type', followUp.nextDocType)
    // Pass prefill fields as JSON
    if (followUp.prefill && Object.keys(followUp.prefill).length > 0) {
      params.set('prefill', JSON.stringify(followUp.prefill))
    }
    router.push(`/new-draft?${params.toString()}`)
  }

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      padding: 18,
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.label, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          What&apos;s Next
        </span>
      </div>

      {/* Title + urgency badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#E0E0E0', lineHeight: 1.3 }}>
          {followUp.title}
        </div>
        <span style={{
          flexShrink: 0,
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 9px',
          borderRadius: 100,
          background: overdue ? 'rgba(239,68,68,0.15)' : 'rgba(251,146,60,0.12)',
          color: overdue ? '#EF4444' : '#FB923C',
        }}>
          {urgencyLabel}
        </span>
      </div>

      {/* Deadline date */}
      <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 10 }}>
        📅 Deadline: <span style={{ color: '#A0A0A0', fontWeight: 600 }}>{formatDeadline(followUp.deadlineDate)}</span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: '#7A7A7A', lineHeight: 1.65, margin: '0 0 14px 0' }}>
        {followUp.description}
      </p>

      {/* Action note (procedural steps with no next document) */}
      {followUp.actionOnly && followUp.actionNote && (
        <div style={{
          background: 'rgba(212,160,23,0.07)',
          border: '1px solid rgba(212,160,23,0.15)',
          borderRadius: 8,
          padding: '9px 12px',
          fontSize: 12,
          color: '#D4A017',
          marginBottom: 10,
        }}>
          ✔ Action required: {followUp.actionNote}
        </div>
      )}

      {/* Draft Next Document button */}
      {followUp.nextDocType && followUp.nextLabel && (
        <button
          onClick={handleDraftNext}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: 'linear-gradient(135deg, #D4A017, #B8860B)',
            border: 'none',
            borderRadius: 9,
            color: '#0D0D0D',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          ✦ {followUp.nextLabel}
        </button>
      )}
    </div>
  )
}
