'use client'
import { useState } from 'react'

export default function ParagraphEditor({ draftId, initialContent, onSaved }) {
  const [editing, setEditing]     = useState(false)
  const [content, setContent]     = useState(initialContent || '')
  const [editPara, setEditPara]   = useState(null)  // { index, text }
  const [paraEdit, setParaEdit]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiInstr, setAiInstr]     = useState('')

  // Split content into paragraphs
  const paragraphs = content.split(/\n{2,}/).filter(p => p.trim())

  function startEditPara(i) {
    setEditPara(i); setParaEdit(paragraphs[i])
  }

  function savePara() {
    const updated = [...paragraphs]
    updated[editPara] = paraEdit
    const newContent = updated.join('\n\n')
    setContent(newContent); setEditPara(null); setParaEdit('')
    autosave(newContent)
  }

  function deletePara(i) {
    if (!confirm('Delete this paragraph?')) return
    const updated = paragraphs.filter((_, idx) => idx !== i)
    const newContent = updated.join('\n\n')
    setContent(newContent)
    autosave(newContent)
  }

  function addPara(i) {
    const updated = [...paragraphs]
    updated.splice(i + 1, 0, 'New paragraph...')
    const newContent = updated.join('\n\n')
    setContent(newContent)
    setEditPara(i + 1); setParaEdit('New paragraph...')
  }

  function movePara(i, dir) {
    const j = i + dir
    if (j < 0 || j >= paragraphs.length) return
    const updated = [...paragraphs]
    ;[updated[i], updated[j]] = [updated[j], updated[i]]
    const newContent = updated.join('\n\n')
    setContent(newContent)
    autosave(newContent)
  }

  async function autosave(newContent) {
    setSaving(true); setMsg('')
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      if (!res.ok) throw new Error('Save failed')
      if (onSaved) onSaved(newContent)
      setMsg('Saved'); setTimeout(() => setMsg(''), 2500)
    } catch (e) { setMsg(e.message) }
    setSaving(false)
  }

  async function aiRewrite(i) {
    if (!aiInstr.trim()) return
    setAiLoading(true); setMsg('')
    try {
      const res = await fetch('/api/analyze/amendment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: paragraphs[i],
          amendments: aiInstr,
          documentType: 'PETITION',
          language: 'english',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const rewritten = data.content?.trim() || paragraphs[i]
      const updated = [...paragraphs]; updated[i] = rewritten
      const newContent = updated.join('\n\n')
      setContent(newContent); setEditPara(null); setAiInstr('')
      autosave(newContent)
    } catch (e) { setMsg(e.message) }
    setAiLoading(false)
  }

  if (!editing) {
    return (
      <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: '14px 18px', marginBottom: 10 }}>
        <button onClick={() => setEditing(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            ✏️ Paragraph Editor
          </div>
          <span style={{ color: '#3A3A3A', fontSize: 12, marginLeft: 'auto' }}>▼ Open</span>
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, marginBottom: 10 }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1C1C1C' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          ✏️ Paragraph Editor
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 11, color: saving ? '#D4A017' : '#4CAF50' }}>{saving ? 'Saving…' : msg}</span>}
          <button onClick={() => setEditing(false)}
            style={{ padding: '5px 12px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7, color: '#8A8A8A', fontSize: 11, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>

      {/* Paragraphs */}
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {paragraphs.map((p, i) => (
          <div key={i} style={{ background: '#0D0D0D', border: `1px solid ${editPara === i ? '#D4A017' : '#1C1C1C'}`, borderRadius: 10, overflow: 'hidden' }}>
            {editPara === i ? (
              <div style={{ padding: 14 }}>
                <textarea value={paraEdit} onChange={e => setParaEdit(e.target.value)}
                  rows={5} style={{ width: '100%', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8,
                    padding: '10px 12px', color: '#E0E0E0', fontSize: 13, fontFamily: 'Georgia, serif', lineHeight: 1.8,
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                {/* AI Rewrite Row */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={aiInstr} onChange={e => setAiInstr(e.target.value)}
                    placeholder="AI instruction — e.g. 'Add medical grounds', 'Make more concise', 'Add case law reference'..."
                    style={{ flex: 1, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8,
                      padding: '8px 12px', color: '#E0E0E0', fontSize: 12, outline: 'none' }} />
                  <button onClick={() => aiRewrite(i)} disabled={aiLoading || !aiInstr.trim()}
                    style={{ padding: '8px 14px', background: aiLoading ? '#1A1A1A' : 'rgba(212,160,23,0.1)',
                      border: '1px solid rgba(212,160,23,0.2)', borderRadius: 8, color: aiLoading ? '#4A4A4A' : '#D4A017',
                      fontSize: 12, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {aiLoading ? '⏳' : '✨ AI Rewrite'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={savePara}
                    style={{ padding: '7px 16px', background: '#D4A017', border: 'none', borderRadius: 8, color: '#0A0A0A', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => { setEditPara(null); setParaEdit(''); setAiInstr('') }}
                    style={{ padding: '7px 12px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#8A8A8A', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => deletePara(i)}
                    style={{ padding: '7px 12px', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)',
                      borderRadius: 8, color: '#F87171', fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, color: '#2A2A2A', fontWeight: 700, marginTop: 3, flexShrink: 0, minWidth: 22 }}>
                  {i + 1}.
                </span>
                <div style={{ flex: 1, fontSize: 13, color: '#8A8A8A', lineHeight: 1.7, fontFamily: 'Georgia, serif',
                  cursor: 'pointer', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  onClick={() => startEditPara(i)}>
                  {p.length > 300 ? p.substring(0, 300) + '…' : p}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => movePara(i, -1)} disabled={i === 0}
                    style={{ padding: '3px 7px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 5,
                      color: i === 0 ? '#2A2A2A' : '#6A6A6A', fontSize: 10, cursor: i === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                  <button onClick={() => movePara(i, 1)} disabled={i === paragraphs.length - 1}
                    style={{ padding: '3px 7px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 5,
                      color: i === paragraphs.length - 1 ? '#2A2A2A' : '#6A6A6A', fontSize: 10, cursor: i === paragraphs.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
                  <button onClick={() => startEditPara(i)}
                    style={{ padding: '3px 7px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 5,
                      color: '#D4A017', fontSize: 10, cursor: 'pointer' }}>✏</button>
                  <button onClick={() => addPara(i)}
                    style={{ padding: '3px 7px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 5,
                      color: '#4CAF50', fontSize: 10, cursor: 'pointer' }}>+</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
