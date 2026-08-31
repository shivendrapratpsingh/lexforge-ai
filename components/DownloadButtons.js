'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────
//  Download whatever is on screen. Pro only.
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
//
//  The gate is enforced on the server; this is only the UI half. A
//  free account is shown the lock rather than a download that fails,
//  because a form post navigates away and cannot report an error back
//  to the page — a silent failure is the one outcome to avoid here.
// ─────────────────────────────────────────────────────────────────

const LABELS = { pdf: 'PDF', docx: 'Word', txt: 'Text' }

export default function DownloadButtons({
  title,
  content,
  // A saved draft exports by GET from its own route. Everything else
  // posts its text. Both land on the same builders and the same gate,
  // so there is one download control in the app rather than five.
  draftId = null,
  formats = ['pdf', 'docx', 'txt'],
  compact = false,
  label = 'Download',
}) {
  const formRef   = useRef(null)
  const formatRef = useRef(null)
  // null = not known yet. Render nothing rather than flash the wrong
  // state at somebody who has paid for this.
  const [isPro, setIsPro] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('/api/me')
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (alive) setIsPro(Boolean(j?.isPro)) })
      .catch(() => { if (alive) setIsPro(false) })
    return () => { alive = false }
  }, [])

  const text = typeof content === 'function' ? null : String(content || '')
  if (!draftId && text !== null && !text.trim()) return null
  if (isPro === null) return null

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

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: compact ? '6px 10px' : '7px 13px',
    background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8,
    color: '#9A9A9A', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', lineHeight: 1.2,
    minHeight: 36,          // comfortably tappable on a phone
    textDecoration: 'none',
  }

  // ── Free: one lock, not three dead buttons ───────────────────
  if (!isPro) {
    return (
      <Link
        href="/upgrade"
        title="Downloading is part of Pro"
        style={{
          ...btnStyle,
          borderColor: 'rgba(212,160,23,0.3)',
          color: '#D4A017',
        }}
      >
        <span aria-hidden="true">🔒</span>
        Download<span style={{ opacity: 0.65, fontWeight: 700 }}>· PRO</span>
      </Link>
    )
  }

  // A saved draft: plain links. A GET with Content-Disposition is
  // already a proper download on every device.
  if (draftId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!compact && (
          <span style={{ fontSize: 11, color: '#5A5A5A', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {label}
          </span>
        )}
        {formats.map(fmt => (
          <a key={fmt} href={`/api/export/${draftId}/${fmt}`} download style={btnStyle}
             title={`Download as ${LABELS[fmt] || fmt}`}>
            <span aria-hidden="true">⤓</span>{LABELS[fmt] || fmt}
          </a>
        ))}
      </div>
    )
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
            style={btnStyle}
          >
            <span aria-hidden="true">⤓</span>{LABELS[fmt] || fmt}
          </button>
        ))}
      </div>
    </>
  )
}
