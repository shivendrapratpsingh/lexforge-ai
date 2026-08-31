'use client'

import { useRef } from 'react'

// ─────────────────────────────────────────────────────────────────
//  Download whatever is on screen.
//
//  Dropped in wherever the app produces something worth keeping — an
//  order analysis, a legal analysis, a memorial, a page of judgments.
//  Before this, all of it was readable and nothing was portable.
//
//  It submits a real form rather than fetching a blob. On a phone a
//  blob download is unreliable — iOS Safari often opens the file in a
//  viewer instead of saving it — whereas a form post is an ordinary
//  navigation, so the browser sees Content-Disposition and downloads
//  the file the way it downloads everything else. `content` can be
//  long, which is the other reason this is a POST.
// ─────────────────────────────────────────────────────────────────

const LABELS = { pdf: 'PDF', docx: 'Word', txt: 'Text' }

export default function DownloadButtons({
  title,
  content,
  formats = ['pdf', 'docx', 'txt'],
  compact = false,
  label = 'Download',
}) {
  const formRef   = useRef(null)
  const formatRef = useRef(null)

  // Nothing to offer until there is something to download.
  const text = typeof content === 'function' ? null : String(content || '')
  if (text !== null && !text.trim()) return null

  function go(fmt) {
    const f = formRef.current
    if (!f) return
    // Resolved at click time: a caller may build the text lazily from
    // whatever is currently on screen.
    f.elements.content.value = typeof content === 'function' ? String(content() || '') : text
    f.elements.title.value   = title || 'LexForge document'
    formatRef.current.value  = fmt
    if (!f.elements.content.value.trim()) return
    f.submit()
  }

  return (
    <>
      <form
        ref={formRef}
        action="/api/export/adhoc"
        method="POST"
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <input type="hidden" name="title" />
        <input type="hidden" name="content" />
        <input type="hidden" name="format" ref={formatRef} />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!compact && (
          <span style={{ fontSize: 11, color: '#5A5A5A', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {label}
          </span>
        )}
        {formats.map(fmt => (
          <button
            key={fmt}
            type="button"
            onClick={() => go(fmt)}
            title={`Download as ${LABELS[fmt] || fmt}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: compact ? '6px 10px' : '7px 13px',
              background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8,
              color: '#9A9A9A', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', lineHeight: 1.2,
              // Comfortably tappable on a phone.
              minHeight: 36,
            }}
          >
            <span aria-hidden="true">⤓</span>{LABELS[fmt] || fmt}
          </button>
        ))}
      </div>
    </>
  )
}
