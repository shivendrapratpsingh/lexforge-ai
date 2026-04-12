'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DraftActions({ draft }) {
  const router = useRouter()
  const [exporting, setExporting] = useState(null)
  const [finalizing, setFinalizing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const res = await fetch(`/api/export/${draft.id}/${format}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${draft.title.replace(/[^a-z0-9]/gi, '_').substring(0,50)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { alert('Export failed. Please try again.') }
    finally { setExporting(null) }
  }

  const handleFinalize = async () => {
    if (draft.status === 'finalized') return
    setFinalizing(true)
    try {
      await fetch(`/api/drafts/${draft.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'finalized' }) })
      router.refresh()
    } catch { alert('Failed to finalize.') }
    finally { setFinalizing(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this document permanently?')) return
    setDeleting(true)
    try {
      await fetch(`/api/drafts/${draft.id}`, { method: 'DELETE' })
      router.push('/drafts')
    } catch { alert('Failed to delete.'); setDeleting(false) }
  }

  const btnBase = { padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: 4 }}>
        {['pdf', 'docx', 'txt'].map(fmt => (
          <button key={fmt} onClick={() => handleExport(fmt)} disabled={!!exporting} style={{ ...btnBase, background: 'transparent', color: exporting === fmt ? '#D4A017' : '#8A8A8A', padding: '7px 12px' }}>
            {exporting === fmt ? '...' : `↓ ${fmt.toUpperCase()}`}
          </button>
        ))}
      </div>
      {draft.status !== 'finalized' && (
        <button onClick={handleFinalize} disabled={finalizing} style={{ ...btnBase, background: 'rgba(76,175,80,0.1)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.2)' }}>
          {finalizing ? '...' : '✓ Finalize'}
        </button>
      )}
      <button onClick={handleDelete} disabled={deleting} style={{ ...btnBase, background: 'transparent', color: '#5A5A5A', border: '1px solid #2A2A2A' }}>
        {deleting ? '...' : '🗑'}
      </button>
    </div>
  )
}
