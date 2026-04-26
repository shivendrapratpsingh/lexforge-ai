'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { DOCUMENT_TYPES, ALL_COURTS, formatDate } from '@/lib/utils'

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'finalized', label: 'Finalized' },
]

export default function DraftsPage() {
  const [drafts,       setDrafts]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [searchQ,      setSearchQ]      = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error,        setError]        = useState('')
  const [total,        setTotal]        = useState(0)

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/drafts')
      const data = await res.json()
      const all  = data.drafts || []
      setTotal(all.length)
      const q = searchQ.toLowerCase().trim()
      const filtered = all.filter(d => {
        const matchQ      = !q || d.title.toLowerCase().includes(q) || d.content?.toLowerCase().includes(q) || d.court?.toLowerCase().includes(q)
        const matchType   = !typeFilter   || d.documentType === typeFilter
        const matchStatus = !statusFilter || d.status === statusFilter
        return matchQ && matchType && matchStatus
      })
      setDrafts(filtered)
    } catch { setError('Could not load documents.') }
    finally   { setLoading(false) }
  }, [searchQ, typeFilter, statusFilter])

  useEffect(() => {
    const t = setTimeout(fetchDrafts, 300)
    return () => clearTimeout(t)
  }, [fetchDrafts])

  const clearFilters = () => { setSearchQ(''); setTypeFilter(''); setStatusFilter('') }
  const hasFilters = searchQ || typeFilter || statusFilter

  return (
    <div>
      <style>{`.draft-card:hover { border-color: #D4A017 !important; box-shadow: 0 0 18px rgba(212,160,23,0.08) !important; }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 4 }}>My Documents</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>
            {loading ? 'Loading...' : `${drafts.length}${hasFilters ? ` of ${total}` : ''} document${drafts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/new-draft" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>+ New Document</Link>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4A4A4A' }}>🔍</span>
          <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by title, content, court..."
            style={{ width: '100%', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 36px', color: '#F0F0F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
          {searchQ && <button onClick={() => setSearchQ('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer' }}>✕</button>}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 14px', color: typeFilter ? '#D4A017' : '#6A6A6A', fontSize: 13, outline: 'none', cursor: 'pointer', minWidth: 155 }}
          onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'}>
          <option value="">All Types</option>
          {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 14px', color: statusFilter ? '#D4A017' : '#6A6A6A', fontSize: 13, outline: 'none', cursor: 'pointer', minWidth: 125 }}
          onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '10px 14px', color: '#EF4444', fontSize: 13, cursor: 'pointer' }}>Clear ✕</button>
        )}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#4A4A4A', fontSize: 14 }}>Loading documents...</div>
      ) : drafts.length === 0 ? (
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0', marginBottom: 8 }}>{hasFilters ? 'No matching documents' : 'No documents yet'}</h3>
          <p style={{ color: '#5A5A5A', marginBottom: 20 }}>{hasFilters ? 'Try adjusting your search or filters' : 'Generate your first AI-powered legal document'}</p>
          {hasFilters
            ? <button onClick={clearFilters} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 20px', color: '#D4A017', fontSize: 14, cursor: 'pointer' }}>Clear Filters</button>
            : <Link href="/new-draft" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '10px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Create First Document</Link>
          }
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {drafts.map(draft => {
            const dt    = DOCUMENT_TYPES.find(t => t.value === draft.documentType)
            const court = ALL_COURTS.find(c => c.value === draft.court)
            return (
              <Link key={draft.id} href={`/drafts/${draft.id}`} className="draft-card"
                style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18, textDecoration: 'none', display: 'block', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{dt?.icon || '📄'}</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {draft.language && draft.language !== 'english' && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 600 }}>
                        {draft.language === 'hindi' ? 'हिन्दी' : 'Bilingual'}
                      </span>
                    )}
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 600, background: draft.status === 'finalized' ? 'rgba(76,175,80,0.1)' : 'rgba(212,160,23,0.1)', color: draft.status === 'finalized' ? '#4CAF50' : '#D4A017' }}>
                      {draft.status}
                    </span>
                  </div>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D0D0D0', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{draft.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 9 }}>
                  <span style={{ fontSize: 11, color: '#5A5A5A', background: '#1C1C1C', padding: '2px 8px', borderRadius: 6 }}>{dt?.label}</span>
                  {court && <span style={{ fontSize: 11, color: '#5A5A5A', background: '#1C1C1C', padding: '2px 8px', borderRadius: 6 }}>{court.short}</span>}
                </div>
                <p style={{ fontSize: 12, color: '#4A4A4A', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 12 }}>
                  {draft.content?.substring(0, 100)}...
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#3A3A3A' }}>{formatDate(draft.updatedAt)}</span>
                  <span style={{ fontSize: 12, color: '#D4A017', fontWeight: 600 }}>View →</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
