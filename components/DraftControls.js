'use client'
import { useState } from 'react'
import Link from 'next/link'

const CASE_STATUSES = [
  { value: 'active',   label: 'Active',   color: '#2196F3' },
  { value: 'pending',  label: 'Pending',  color: '#F59E0B' },
  { value: 'won',      label: 'Won',      color: '#4CAF50' },
  { value: 'lost',     label: 'Lost',     color: '#EF4444' },
  { value: 'settled',  label: 'Settled',  color: '#8B5CF6' },
  { value: 'closed',   label: 'Closed',   color: '#5A5A5A' },
]

export default function DraftControls({ draftId, initialCaseStatus, initialClient }) {
  const [caseStatus,    setCaseStatus]    = useState(initialCaseStatus || 'active')
  const [client,        setClient]        = useState(initialClient)
  const [statusSaving,  setStatusSaving]  = useState(false)
  const [linkSearch,    setLinkSearch]    = useState('')
  const [linkResults,   setLinkResults]   = useState([])
  const [linkLoading,   setLinkLoading]   = useState(false)
  const [showLink,      setShowLink]      = useState(false)
  const [error,         setError]         = useState('')

  const cs = CASE_STATUSES.find(s => s.value === caseStatus) || CASE_STATUSES[0]

  async function updateCaseStatus(val) {
    setStatusSaving(true)
    try {
      await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStatus: val }),
      })
      setCaseStatus(val)
    } catch { setError('Failed to update status.') }
    finally { setStatusSaving(false) }
  }

  async function searchClients(val) {
    setLinkSearch(val)
    if (val.length < 2) { setLinkResults([]); return }
    setLinkLoading(true)
    try {
      const res  = await fetch(`/api/clients?q=${encodeURIComponent(val)}&limit=6`)
      const data = await res.json()
      setLinkResults(data.clients || [])
    } catch {} finally { setLinkLoading(false) }
  }

  async function linkClient(c) {
    try {
      await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: c.id }),
      })
      setClient(c); setShowLink(false); setLinkSearch(''); setLinkResults([])
    } catch { setError('Failed to link client.') }
  }

  async function unlinkClient() {
    if (!confirm('Unlink this client from the document?')) return
    try {
      await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: null }),
      })
      setClient(null)
    } catch { setError('Failed to unlink.') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Case Status ── */}
      <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Case Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {CASE_STATUSES.map(s => (
            <button key={s.value} onClick={() => updateCaseStatus(s.value)} disabled={statusSaving}
              style={{ padding: '7px 8px', border: `1px solid ${caseStatus === s.value ? s.color + '55' : '#2A2A2A'}`, borderRadius: 8, background: caseStatus === s.value ? s.color + '14' : 'transparent', color: caseStatus === s.value ? s.color : '#5A5A5A', fontSize: 12, fontWeight: caseStatus === s.value ? 700 : 400, cursor: statusSaving ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
              {s.label}
            </button>
          ))}
        </div>
        {statusSaving && <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 6 }}>Saving...</div>}
      </div>

      {/* ── Client Link ── */}
      <div style={{ background: '#141414', border: `1px solid ${client ? 'rgba(212,160,23,0.2)' : '#2A2A2A'}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: client ? '#D4A017' : '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Client</div>

        {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>⚠️ {error}</div>}

        {client ? (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 3 }}>{client.name}</div>
            {client.fatherName && <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 2 }}>s/o {client.fatherName}</div>}
            {client.phone      && <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 8 }}>📞 {client.phone}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/clients/${client.id}`} style={{ flex: 1, textAlign: 'center', padding: '7px', background: '#1C1C1C', borderRadius: 7, fontSize: 12, color: '#D4A017', textDecoration: 'none' }}>View Profile →</Link>
              <button onClick={unlinkClient} style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.06)', border: 'none', borderRadius: 7, fontSize: 11, color: '#EF4444', cursor: 'pointer' }}>Unlink</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 10 }}>No client linked to this document.</p>
            {!showLink ? (
              <button onClick={() => setShowLink(true)} style={{ width: '100%', padding: '9px', background: 'rgba(212,160,23,0.06)', border: '1px dashed rgba(212,160,23,0.2)', borderRadius: 8, color: '#D4A017', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>+ Link a Client</button>
            ) : (
              <div style={{ position: 'relative' }}>
                <input autoFocus type="text" value={linkSearch} onChange={e => searchClients(e.target.value)} placeholder="Search client by name or Aadhaar..."
                  style={{ width: '100%', background: '#1C1C1C', border: '1px solid #D4A017', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                {linkLoading && <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 4 }}>Searching...</div>}
                {linkResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, zIndex: 50, marginTop: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {linkResults.map(c => (
                      <button key={c.id} onMouseDown={() => linkClient(c)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid #2A2A2A', cursor: 'pointer', textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#D0D0D0', fontWeight: 600 }}>{c.name}</div>
                          {c.fatherName && <div style={{ fontSize: 11, color: '#5A5A5A' }}>s/o {c.fatherName}</div>}
                        </div>
                        {c.phone && <span style={{ fontSize: 11, color: '#6A6A6A' }}>📞 {c.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {linkSearch.length >= 2 && !linkLoading && linkResults.length === 0 && (
                  <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 4 }}>No clients found. <Link href="/clients" style={{ color: '#8B5CF6' }}>Add client →</Link></div>
                )}
                <button onClick={() => { setShowLink(false); setLinkSearch(''); setLinkResults([]) }} style={{ marginTop: 8, fontSize: 11, color: '#5A5A5A', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
