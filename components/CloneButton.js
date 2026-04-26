'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CloneButton({ draftId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [note, setNote]       = useState('')
  const [showInput, setShowInput] = useState(false)
  const [err, setErr]         = useState('')

  async function clone() {
    setLoading(true); setErr('')
    try {
      const res = await fetch(`/api/drafts/${draftId}/clone`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amendmentNote: note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      router.push(`/drafts/${data.draft.id}`)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  if (showInput) {
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="Clone note (optional)"
          style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: '7px 12px',
            color: '#E0E0E0', fontSize: 12, outline: 'none', width: 160 }} />
        <button onClick={clone} disabled={loading}
          style={{ padding: '7px 14px', background: loading ? '#1A1A1A' : '#1A2A1A', border: '1px solid #2A3A2A',
            borderRadius: 8, color: loading ? '#4A4A4A' : '#4CAF50', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '...' : '✓ Clone'}
        </button>
        <button onClick={() => { setShowInput(false); setErr(''); setNote('') }}
          style={{ padding: '7px 10px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
            color: '#6A6A6A', fontSize: 12, cursor: 'pointer' }}>✕</button>
        {err && <span style={{ fontSize: 11, color: '#F87171' }}>{err}</span>}
      </div>
    )
  }

  return (
    <button onClick={() => setShowInput(true)}
      style={{ padding: '8px 16px', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10,
        color: '#8A8A8A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      📋 Clone
    </button>
  )
}
