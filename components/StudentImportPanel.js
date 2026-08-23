'use client'

import { useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────
//  Upload a college's student list.
//
//  Two steps on purpose. The upload is checked and reported first —
//  how many accounts it will create, and crucially how many students it
//  will REMOVE — and only then applied. Removal is automatic once
//  confirmed, but "47 students will lose access" is not a sentence
//  anyone should read for the first time afterwards.
//
//  Generated passwords come back once and are stored nowhere. If this
//  panel is closed without copying them, those students need a reset
//  rather than a lookup, and the panel says so.
// ─────────────────────────────────────────────────────────────────

const S = {
  input: {
    width: '100%', background: '#0D0D0D', border: '1px solid #232323', borderRadius: 9,
    padding: '10px 13px', color: '#F0F0F0', fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#8A8A8A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' },
  gold: (busy) => ({
    padding: '10px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
    background: 'linear-gradient(135deg,#D4A017,#B8860B)', color: '#0D0D0D',
    cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1,
  }),
  ghost: { padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid #2E2718', background: 'transparent', color: '#9A8C6E' },
  stat: { background: '#0D0D0D', border: '1px solid #232323', borderRadius: 10, padding: '12px 14px' },
  err: { background: 'rgba(225,88,75,.08)', border: '1px solid rgba(225,88,75,.28)', color: '#FF8A80', padding: '11px 14px', borderRadius: 9, fontSize: 13, lineHeight: 1.65, marginTop: 12 },
}

const Stat = ({ n, label, tone }) => (
  <div style={S.stat}>
    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: tone || '#F0F0F0' }}>{n}</div>
    <div style={{ fontSize: 10.5, color: '#6E6E68', marginTop: 5 }}>{label}</div>
  </div>
)

export default function StudentImportPanel({ id, institutionName }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [batch, setBatch] = useState('')
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  async function send(dryRun) {
    if (!file) return setErr('Choose a .xlsx or .csv file first.')
    setBusy(dryRun ? 'checking' : 'importing'); setErr('')

    const fd = new FormData()
    fd.append('file', file)
    if (batch.trim()) fd.append('batch', batch.trim())
    if (dryRun) fd.append('dryRun', '1')

    try {
      const r = await fetch(`/api/admin/institutions/${id}/import`, { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok) {
        setErr(j.error + (j.errors?.length ? ` — first problem: row ${j.errors[0].row}, ${j.errors[0].problem}` : ''))
        setPreview(null)
      } else if (dryRun) {
        setPreview(j); setResult(null)
      } else {
        setResult(j); setPreview(null)
      }
    } catch (e) { setErr(e.message) } finally { setBusy('') }
  }

  const copyAll = () => {
    const text = result.credentials.map(c => `${c.email}\t${c.password}`).join('\n')
    navigator.clipboard?.writeText(text)
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.75, margin: '0 0 16px', maxWidth: '70ch' }}>
        Upload {institutionName}&rsquo;s student list and every student on it gets an
        account, Pro from the moment they sign in. They set their own password and
        a security question the first time, so the one in your spreadsheet stops
        working immediately.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <a href={`/api/admin/institutions/${id}/import`} style={{ ...S.ghost, textDecoration: 'none', display: 'inline-block' }}>
          ↓ Download the template
        </a>
        <span style={{ fontSize: 12, color: '#6A6A6A' }}>
          Only an Email column is required.
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', marginBottom: 14 }}>
        <div>
          <label style={S.label}>Student list</label>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
            onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); setResult(null); setErr('') }}
            style={{ ...S.input, padding: '8px 10px' }} />
        </div>
        <div>
          <label style={S.label}>Batch, if the sheet has no column</label>
          <input value={batch} onChange={e => setBatch(e.target.value)} style={S.input} placeholder="BA LLB 2027" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={S.ghost} onClick={() => send(true)} disabled={Boolean(busy) || !file}>
          {busy === 'checking' ? 'Reading…' : 'Check the file first'}
        </button>
        {preview && (
          <button type="button" style={S.gold(busy)} onClick={() => send(false)} disabled={Boolean(busy)}>
            {busy === 'importing' ? 'Importing…' : `Import ${preview.willCreate + preview.willLink} students`}
          </button>
        )}
      </div>

      {err && <div style={S.err}>{err}</div>}

      {/* ── what it will do ──────────────────────────────────── */}
      {preview && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '1.5px', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
            What this file will do
          </div>
          <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' }}>
            <Stat n={preview.rowsRead} label="Rows read" />
            <Stat n={preview.willCreate} label="New accounts" tone="#5FCC8D" />
            <Stat n={preview.willLink} label="Existing users joined" />
            <Stat n={preview.willRemove} label="Lose access" tone={preview.willRemove ? '#FF8A80' : undefined} />
            <Stat n={preview.errors.length} label="Rows skipped" tone={preview.errors.length ? '#E8C25A' : undefined} />
          </div>

          {preview.willRemove > 0 && (
            <div style={{ ...S.err, background: 'rgba(225,88,75,.06)' }}>
              <strong>{preview.willRemove} student{preview.willRemove === 1 ? '' : 's'} on this college&rsquo;s roll
              are not in this file and will lose access.</strong> Their accounts and
              everything they have written are kept — only the institutional access
              goes, and re-uploading them restores it. If that number looks wrong,
              you are probably uploading only the new students rather than the whole
              current list.
              <div style={{ marginTop: 8, fontSize: 12, color: '#C0A0A0', fontFamily: 'ui-monospace, Menlo, monospace' }}>
                {preview.removing.slice(0, 8).join(', ')}
                {preview.willRemove > 8 && ` … and ${preview.willRemove - 8} more`}
              </div>
            </div>
          )}

          {preview.errors.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#8A8A8A', lineHeight: 1.7 }}>
              <strong style={{ color: '#E8C25A' }}>Skipped rows</strong> — these are left out, the rest still import:
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {preview.errors.slice(0, 6).map((e, i) => <li key={i}>Row {e.row}: {e.problem}</li>)}
                {preview.errors.length > 6 && <li>…and {preview.errors.length - 6} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── what it did ──────────────────────────────────────── */}
      {result && (
        <div style={{ marginTop: 18 }}>
          <div style={{
            background: 'rgba(63,166,107,.08)', border: '1px solid rgba(63,166,107,.28)',
            color: '#5FCC8D', padding: '12px 15px', borderRadius: 9, fontSize: 13.5, marginBottom: 14,
          }}>
            Imported. {result.created} new account{result.created === 1 ? '' : 's'},
            {' '}{result.relinked} existing user{result.relinked === 1 ? '' : 's'} joined,
            {' '}{result.removed} removed.
          </div>

          {result.credentials?.length > 0 && (
            <div style={{ background: '#0D0D0D', border: '1px solid #3A3010', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, color: '#E8C25A', fontWeight: 700 }}>
                  {result.credentials.filter(c => c.generated).length} generated password{result.credentials.filter(c => c.generated).length === 1 ? '' : 's'} — shown once
                </div>
                <button type="button" style={{ ...S.ghost, padding: '6px 12px', fontSize: 12 }} onClick={copyAll}>
                  Copy all
                </button>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, lineHeight: 1.9 }}>
                {result.credentials.filter(c => c.generated).map(c => (
                  <div key={c.email} style={{ color: '#C0C0C0' }}>{c.email} &nbsp;·&nbsp; <span style={{ color: '#F0E4C0' }}>{c.password}</span></div>
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: '#7A7268', margin: '10px 0 0', lineHeight: 1.65 }}>
                These are stored nowhere. Copy them now and pass them to the college —
                if this closes, those students need a fresh import rather than a lookup.
                Students whose row already had a password are not listed; the college
                already knows those.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
