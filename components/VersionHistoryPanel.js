'use client'
import { useState, useEffect } from 'react'

export default function VersionHistoryPanel({ draftId, currentContent, onRestore }) {
  const [versions, setVersions]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [note, setNote]           = useState('')
  const [open, setOpen]           = useState(false)
  const [preview, setPreview]     = useState(null)  // version content being previewed
  const [previewId, setPreviewId] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [msg, setMsg]             = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/drafts/${draftId}/versions`)
      const data = await res.json()
      setVersions(data.versions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { if (open) load() }, [open]) // eslint-disable-line

  async function saveVersion() {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/drafts/${draftId}/versions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeNote: note }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setNote(''); setMsg('Version saved!'); load()
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setMsg(e.message) }
    setSaving(false)
  }

  async function loadPreview(vid) {
    setLoadingPreview(true); setPreviewId(vid); setPreview(null)
    try {
      const res = await fetch(`/api/drafts/${draftId}/versions/${vid}`)
      const data = await res.json()
      setPreview(data.version?.content || '')
    } catch {}
    setLoadingPreview(false)
  }

  async function del(vid) {
    if (!confirm('Delete this version?')) return
    await fetch(`/api/drafts/${draftId}/versions/${vid}`, { method: 'DELETE' })
    if (previewId === vid) { setPreview(null); setPreviewId(null) }
    load()
  }

  function formatDate(d) {
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          🕐 Version History
        </div>
        <span style={{ color: '#3A3A3A', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          {/* Save current as version */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Version note (optional)..."
              style={{ flex: 1, background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8,
                padding: '8px 12px', color: '#E0E0E0', fontSize: 12, outline: 'none' }} />
            <button onClick={saveVersion} disabled={saving}
              style={{ padding: '8px 16px', background: saving ? '#1A1A1A' : '#1C2A1C', border: '1px solid #2A3A2A',
                borderRadius: 8, color: saving ? '#4A4A4A' : '#4CAF50', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {saving ? '...' : '💾 Save Version'}
            </button>
          </div>
          {msg && <div style={{ fontSize: 12, color: '#4CAF50', marginBottom: 10 }}>{msg}</div>}

          {/* Version list */}
          {loading ? (
            <div style={{ fontSize: 12, color: '#3A3A3A', textAlign: 'center', padding: 16 }}>Loading...</div>
          ) : versions.length === 0 ? (
            <div style={{ fontSize: 12, color: '#3A3A3A', textAlign: 'center', padding: 16 }}>No saved versions yet.</div>
          ) : (
            versions.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid #1A1A1A' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C0C0C0' }}>v{v.version}</div>
                  <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 2 }}>
                    {formatDate(v.createdAt)}{v.changeNote ? ` — ${v.changeNote}` : ''}
                  </div>
                </div>
                <button onClick={() => previewId === v.id ? (setPreview(null), setPreviewId(null)) : loadPreview(v.id)}
                  style={{ padding: '4px 10px', background: previewId === v.id ? '#1A2A1A' : '#1A1A1A',
                    border: '1px solid #2A2A2A', borderRadius: 6, color: previewId === v.id ? '#4CAF50' : '#8A8A8A',
                    fontSize: 11, cursor: 'pointer' }}>
                  {previewId === v.id ? 'Hide' : 'View'}
                </button>
                {onRestore && previewId === v.id && preview && (
                  <button onClick={() => onRestore(preview)}
                    style={{ padding: '4px 10px', background: '#1A2A3A', border: '1px solid #2A3A4A', borderRadius: 6, color: '#60A5FA', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Restore
                  </button>
                )}
                <button onClick={() => del(v.id)}
                  style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #2A2A2A',
                    borderRadius: 6, color: '#3A3A3A', fontSize: 11, cursor: 'pointer' }}>✕</button>
              </div>
            ))
          )}

          {/* Preview panel */}
          {loadingPreview && (
            <div style={{ marginTop: 14, fontSize: 12, color: '#3A3A3A', textAlign: 'center' }}>Loading version...</div>
          )}
          {preview && !loadingPreview && (
            <div style={{ marginTop: 14, background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 10, padding: 16,
              fontSize: 12, lineHeight: 1.8, color: '#8A8A8A', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              maxHeight: 320, overflowY: 'auto', fontFamily: 'Georgia, serif' }}>
              {preview}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
