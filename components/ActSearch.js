'use client'
import DownloadButtons from '@/components/DownloadButtons'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────
//  Act Search — describe the problem, or name the Act.
//
//  Each result opens into its key sections, then offers four next
//  steps. None of them run until clicked: two are billed calls (the
//  sample document and the judgment search) and one downloads a PDF,
//  so firing them on render would spend money and seconds nobody asked
//  for. Every panel loads once and is then cached in state.
// ─────────────────────────────────────────────────────────────────

const S = {
  input: {
    width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10,
    padding: '13px 15px', color: '#F0F0F0', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical',
  },
  primary: (busy) => ({
    padding: '12px 22px', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none',
    cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
    background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
  }),
  chip: (on) => ({
    padding: '8px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${on ? 'rgba(212,160,23,.55)' : '#2A2A2A'}`,
    background: on ? 'rgba(212,160,23,.12)' : 'transparent',
    color: on ? '#D4A017' : '#9A9A9A', textAlign: 'left',
  }),
  card: {
    background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14,
    padding: 18, marginBottom: 14,
  },
  err: {
    background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)',
    color: '#FF8A80', padding: '11px 14px', borderRadius: 9, fontSize: 13, lineHeight: 1.6,
  },
  panel: {
    marginTop: 12, padding: 14, borderRadius: 10,
    background: '#0D0D0D', border: '1px solid #232323',
  },
  kicker: {
    fontSize: 10, fontWeight: 800, letterSpacing: '1.4px',
    textTransform: 'uppercase', color: '#D4A017', marginBottom: 7,
  },
}

const N = String.fromCharCode(10)

// The Acts, their key sections and the link to the official text —
// which is the part a student is actually meant to go and read.
function actsText(res) {
  const one = (a) => [
    `${a.fullName || a.shortName}${a.year ? `, ${a.year}` : ''}`,
    ...(a.keySections || []).map(sec => `   ${sec.n}: ${sec.desc}`),
    a.url ? `   ${a.url}` : null,
    '',
  ].filter(Boolean)
  const group = (label, list) =>
    list?.length ? [label.toUpperCase(), '', ...list.flatMap(one)] : []
  return ['ACT SEARCH RESULTS', '',
    ...group('Curated Acts', res?.curated),
    ...group('From India Code', res?.official),
    ...group('Other sources', res?.external),
    'Always read the bare Act. Section numbers change with amendments.',
  ].join(N)
}

export default function ActSearch({ isPro, initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery)
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')

  // Takes the term as an argument rather than reading `q`, so the effect
  // below can run the search on the very first render — before any state
  // update has landed.
  const search = useCallback(async (term) => {
    const query = String(term || '').trim()
    if (!query) return
    setBusy(true); setErr(''); setRes(null)
    try {
      const r = await fetch(`/api/acts/search?q=${encodeURIComponent(query)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setRes(j)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }, [])

  function run(e) { e.preventDefault(); search(q) }

  // Arrived from the Case Assistant with ?q=… — run it straight away.
  // Landing on a filled box that still needs a click is the same dead
  // end as landing on an empty one.
  useEffect(() => { search(initialQuery) }, [initialQuery, search])

  return (
    <div style={{ maxWidth: 820 }}>
      <form onSubmit={run} style={S.card}>
        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#8A8A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Describe your problem, or name an Act
        </label>
        <textarea
          value={q} onChange={e => setQ(e.target.value)} required rows={3} style={S.input}
          placeholder="e.g. my tenant will not leave after the lease ended — or just: Negotiable Instruments Act"
        />
        <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '8px 0 12px', lineHeight: 1.55 }}>
          Plain language works. If nothing matches directly, it restates your
          problem in legal terms and searches again.
        </p>
        <button type="submit" style={S.primary(busy)} disabled={busy}>
          {busy ? 'Searching Acts…' : '📜 Search Indian Acts'}
        </button>
        {err && <div style={{ ...S.err, marginTop: 13 }}>{err}</div>}
      </form>

      {res && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <DownloadButtons compact title="Act search results" content={() => actsText(res)} />
          </div>
          {res.expandedWith && (
            <div style={{ ...S.card, borderColor: 'rgba(212,160,23,.3)' }}>
              <div style={S.kicker}>Searched instead for</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#E0D6BC' }}>
                {res.expandedWith}
              </div>
              <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '8px 0 0', lineHeight: 1.55 }}>
                Your words did not match any Act directly, so they were restated in
                the language statutes use.
              </p>
            </div>
          )}

          {res.total === 0 && (
            <div style={S.card}>
              <p style={{ fontSize: 14, color: '#A3A39C', margin: 0, lineHeight: 1.65 }}>
                No Act matched. Try naming the subject more directly — “cheque
                bounced”, “wrongful dismissal”, “land dispute” — rather than
                describing the sequence of events.
              </p>
            </div>
          )}

          {res.curated.map(act => <ActCard key={act.id} act={act} isPro={isPro} />)}

          {res.official.length > 0 && (
            <>
              <div style={{ ...S.kicker, marginTop: 22, marginBottom: 10 }}>
                Also on India Code
              </div>
              {res.official.map(act => <ActCard key={act.id} act={act} isPro={isPro} />)}
            </>
          )}

          {/* The long tail. Only fetched when the free sources came back
              nearly empty, so its presence means "we went looking". */}
          {res.external?.length > 0 && (
            <>
              <div style={{ ...S.kicker, marginTop: 22, marginBottom: 4 }}>
                Every other Central Act &amp; Rule
              </div>
              <p style={{ fontSize: 12, color: '#6A6A6A', margin: '0 0 12px', lineHeight: 1.6 }}>
                Searched beyond the {269} curated Acts, across the full index of
                Central Acts and Rules. These have no hand-written section notes
                — open the source to read the text.
              </p>
              {res.external.map(act => <ActCard key={act.id} act={act} isPro={isPro} />)}
            </>
          )}

          {res.externalError && (
            <p style={{ fontSize: 12.5, color: '#8A8A8A', marginTop: 18, lineHeight: 1.65 }}>
              The wider Act index could not be reached just now, so this shows
              only the curated Acts. {res.externalError}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ActCard({ act, isPro }) {
  const [open, setOpen] = useState(null)          // which panel is showing
  const [cache, setCache] = useState({})          // panel -> loaded data
  const [loading, setLoading] = useState(false)
  const [perr, setPerr] = useState('')

  async function show(panel) {
    setPerr('')
    if (open === panel) { setOpen(null); return }
    setOpen(panel)
    if (cache[panel]) return                       // already fetched once

    setLoading(true)
    try {
      if (panel === 'fulltext') {
        // Only Acts the daily India Code sync has recorded carry a handle.
        // For the rest we cannot fetch the PDF — India Code has no API and
        // its search is robots-disallowed — so we hand the reader a link
        // and let them look it up themselves, which is not automated access.
        if (!act.handle) { setCache(c => ({ ...c, fulltext: 'no-handle' })); return }
        const r = await fetch(`/api/acts/fulltext?handle=${encodeURIComponent(act.handle)}`)
        const j = await r.json()
        if (!r.ok) throw new Error(j.error)
        setCache(c => ({ ...c, fulltext: j }))
      }
      if (panel === 'judgments') {
        const r = await fetch(`/api/legal/search?q=${encodeURIComponent(act.fullName)}`)
        const j = await r.json()
        if (!r.ok) throw new Error(j.error)
        setCache(c => ({ ...c, judgments: j }))
      }
      if (panel === 'sample') {
        const first = act.services?.[0]
        const r = await fetch('/api/acts/sample', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType: first?.id || 'LEGAL_NOTICE', actName: act.fullName }),
        })
        const j = await r.json()
        if (!r.ok) throw new Error(j.error)
        setCache(c => ({ ...c, sample: j }))
      }
    } catch (e) { setPerr(e.message) } finally { setLoading(false) }
  }

  const btn = (id, label) => (
    <button type="button" style={S.chip(open === id)} onClick={() => show(id)}>{label}</button>
  )

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#F0E4C0', margin: 0, fontWeight: 400 }}>
          {act.fullName}
        </h3>
        {act.year && <span style={{ fontSize: 11.5, color: '#6E6E68' }}>{act.year}</span>}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '3px 7px',
          borderRadius: 5, border: '1px solid #2A2A2A', color: '#8A7748', textTransform: 'uppercase',
        }}>{act.source === 'curated' ? act.category : act.source === 'indiankanoon' ? 'Central Act' : 'India Code'}</span>
      </div>

      {act.sections.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={S.kicker}>Key sections</div>
          {act.sections.map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 11, padding: '7px 0', borderBottom: '1px solid #1C1C1C' }}>
              <div style={{ flex: 'none', width: 78, fontSize: 12, fontWeight: 700, color: '#D4A017' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: '#B9B2A0', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
        {btn('fulltext', '📖 Read the full Act')}
        {btn('services', '🧭 Which service helps me')}
        {btn('draft', '✦ Draft this document')}
        {btn('sample', `📄 See a sample${isPro ? '' : ' (Pro)'}`)}
        {btn('judgments', `⚖️ Judgments${isPro ? '' : ' (Pro)'}`)}
      </div>

      {open && (
        <div style={S.panel}>
          {loading && <div style={{ fontSize: 13, color: '#8A8A8A' }}>Loading…</div>}
          {perr && <div style={S.err}>{perr}</div>}

          {!loading && !perr && open === 'services' && (
            <>
              <div style={S.kicker}>What would help you most</div>
              {act.services.map(s => (
                <div key={s.id} style={{ padding: '9px 0', borderBottom: '1px solid #1C1C1C' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#E8E0CC' }}>{s.label}</div>
                  <div style={{ fontSize: 12.5, color: '#8A8A8A', marginTop: 3, lineHeight: 1.55 }}>{s.why}</div>
                </div>
              ))}
              <p style={{ fontSize: 12, color: '#6E6E68', margin: '11px 0 0', lineHeight: 1.6 }}>
                Also useful: <Link href="/case-law" style={{ color: '#D4A017' }}>Case Law &amp; Status</Link> to
                see how courts have applied this Act, and{' '}
                <Link href="/court-dates" style={{ color: '#D4A017' }}>Court Dates</Link> once a matter is filed.
              </p>
            </>
          )}

          {!loading && !perr && open === 'draft' && (
            <>
              <div style={S.kicker}>File your case</div>
              <p style={{ fontSize: 13, color: '#A3A39C', margin: '0 0 11px', lineHeight: 1.6 }}>
                Start a real document with your own facts. You pick the court and
                language on the next screen.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {act.services.map(s => (
                  <Link key={s.id} href={`/new-draft?type=${s.id}`} style={{ textDecoration: 'none' }}>
                    <span style={{
                      display: 'inline-block', padding: '9px 15px', borderRadius: 8,
                      fontSize: 13, fontWeight: 700, color: '#0D0D0D',
                      background: 'linear-gradient(135deg,#D4A017,#B8860B)',
                    }}>{s.label} →</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {!loading && !perr && open === 'fulltext' && cache.fulltext === 'no-handle' && (
            <>
              <div style={S.kicker}>Official text</div>
              <p style={{ fontSize: 13, color: '#A3A39C', margin: '0 0 11px', lineHeight: 1.65 }}>
                The {act.sections.length} key sections above are the ones used most
                in practice, written out in plain terms. For the complete statute,
                open it on India Code — the Government&apos;s own repository.
              </p>
              <a href={`https://indiacode.gov.in/search?query=${encodeURIComponent(act.fullName)}`}
                target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', padding: '9px 15px', borderRadius: 8,
                  fontSize: 13, fontWeight: 700, color: '#D4A017',
                  border: '1px solid rgba(212,160,23,.45)',
                }}>Find it on India Code →</span>
              </a>
              <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '11px 0 0', lineHeight: 1.6 }}>
                Acts enacted from now on are picked up automatically by the 8 AM
                sync and will open their full text here directly.
              </p>
            </>
          )}

          {!loading && !perr && open === 'fulltext' && cache.fulltext && cache.fulltext !== 'no-handle' && (
            <>
              <div style={S.kicker}>
                Official text — {cache.fulltext.sections.length} sections
                {cache.fulltext.pages ? ` · ${cache.fulltext.pages} pages` : ''}
              </div>
              <p style={{ fontSize: 11.5, color: '#5A5A5A', margin: '0 0 10px' }}>
                From India Code, the Government&apos;s own repository.{' '}
                <a href={cache.fulltext.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#D4A017' }}>
                  Open the original PDF
                </a>
              </p>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {cache.fulltext.sections.map(s => (
                  <details key={s.number} style={{ borderBottom: '1px solid #1C1C1C', padding: '8px 0' }}>
                    <summary style={{ cursor: 'pointer', fontSize: 13, color: '#E8E0CC' }}>
                      <b style={{ color: '#D4A017' }}>{s.number}.</b> {s.title}
                    </summary>
                    <div style={{ fontSize: 12.5, color: '#9A9A9A', lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {s.text}
                    </div>
                  </details>
                ))}
              </div>
            </>
          )}

          {!loading && !perr && open === 'judgments' && cache.judgments && (
            <>
              <div style={S.kicker}>Judgments interpreting this Act</div>
              {cache.judgments.results.length === 0 && (
                <div style={{ fontSize: 13, color: '#8A8A8A' }}>Nothing matched.</div>
              )}
              {cache.judgments.results.slice(0, 8).map(c => (
                <a key={c.docId} href={c.sourceUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', padding: '9px 0', borderBottom: '1px solid #1C1C1C', textDecoration: 'none' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 13.5, color: '#F0E4C0', lineHeight: 1.4 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#8A7748', marginTop: 3 }}>
                    {[c.court, c.date, c.citation].filter(Boolean).join(' · ')}
                  </div>
                </a>
              ))}
            </>
          )}

          {!loading && !perr && open === 'sample' && cache.sample && (
            <>
              <div style={S.kicker}>Specimen — {cache.sample.label}</div>
              <div style={{
                fontSize: 12, color: '#E0A860', background: 'rgba(212,160,23,.08)',
                border: '1px solid rgba(212,160,23,.3)', borderRadius: 8,
                padding: '9px 12px', marginBottom: 11, lineHeight: 1.55,
              }}>
                {cache.sample.notice}
              </div>
              <div style={{
                fontFamily: 'Georgia, serif', fontSize: 12.5, color: '#B9B2A0',
                lineHeight: 1.85, whiteSpace: 'pre-wrap', maxHeight: 420, overflowY: 'auto',
              }}>{cache.sample.sample}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
