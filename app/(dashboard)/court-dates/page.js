'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DATE_TYPES = [
  { value: 'hearing',    label: 'Hearing',    color: '#60A5FA' },
  { value: 'compliance', label: 'Compliance', color: '#F97316' },
  { value: 'filing',     label: 'Filing',     color: '#8B5CF6' },
  { value: 'order',      label: 'Order',      color: '#D4A017' },
  { value: 'deadline',   label: 'Deadline',   color: '#F87171' },
]

const BLANK = { title: '', date: '', type: 'hearing', caseNumber: '', notes: '', draftId: '', clientId: '' }

function typeColor(type) {
  return DATE_TYPES.find(t => t.value === type)?.color || '#5A5A5A'
}

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
}

function daysUntil(d) {
  const now  = new Date(); now.setHours(0,0,0,0)
  const then = new Date(d); then.setHours(0,0,0,0)
  return Math.round((then - now) / 86400000)
}

function DaysChip({ date }) {
  const diff = daysUntil(date)
  if (diff < 0)  return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(100,100,100,0.15)', color: '#5A5A5A' }}>Past</span>
  if (diff === 0) return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>TODAY</span>
  if (diff === 1) return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>Tomorrow</span>
  if (diff <= 7)  return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(212,160,23,0.1)', color: '#D4A017' }}>{diff}d away</span>
  return <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>{diff}d</span>
}

const iBox = {
  width: '100%', background: '#0D0D0D', border: '1px solid #2A2A2A',
  borderRadius: 8, padding: '10px 12px', color: '#E0E0E0', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const selBox = { ...iBox }
const taBox  = { ...iBox, resize: 'vertical' }

export default function CourtDatesPage() {
  const [dates, setDates]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('upcoming')  // upcoming | all | completed
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')
  const [editId, setEditId]   = useState(null)

  async function load() {
    setLoading(true)
    try {
      const q = filter === 'upcoming' ? '?upcoming=1' : filter === 'completed' ? '?completed=1' : ''
      const res = await fetch('/api/court-dates' + q)
      const data = await res.json()
      setDates(data.courtDates || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [filter]) // eslint-disable-line

  async function save() {
    if (!form.title.trim()) return setErr('Title is required.')
    if (!form.date)         return setErr('Date is required.')
    setSaving(true); setErr('')
    try {
      const url = editId ? `/api/court-dates/${editId}` : '/api/court-dates'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowForm(false); setForm(BLANK); setEditId(null); load()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  async function toggle(id, completed) {
    await fetch(`/api/court-dates/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    })
    load()
  }

  async function del(id) {
    if (!confirm('Delete this court date?')) return
    await fetch(`/api/court-dates/${id}`, { method: 'DELETE' })
    load()
  }

  function startEdit(d) {
    setForm({
      title: d.title, date: d.date?.slice(0, 16) || '',
      type: d.type, caseNumber: d.caseNumber || '',
      notes: d.notes || '', draftId: d.draftId || '', clientId: d.clientId || '',
    })
    setEditId(d.id); setShowForm(true); setErr('')
  }

  // Group by month
  const grouped = {}
  for (const d of dates) {
    const m = new Date(d.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(d)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', marginBottom: 4 }}>📅 Court Dates</h1>
          <p style={{ fontSize: 13, color: '#5A5A5A', margin: 0 }}>Track hearings, compliance dates, deadlines and orders.</p>
        </div>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true); setErr('') }}
          style={{ padding: '10px 20px', background: '#D4A017', border: 'none', borderRadius: 10, color: '#0A0A0A', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          + Add Date
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['upcoming','Upcoming'],['all','All'],['completed','Completed']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filter === v ? '#D4A017' : '#1A1A1A', color: filter === v ? '#0A0A0A' : '#6A6A6A' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 22, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 16 }}>
            {editId ? 'Edit Court Date' : 'Add Court Date'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              placeholder="Title / Case Name *" style={iBox} />
            <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} style={iBox} />
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} style={selBox}>
              {DATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input value={form.caseNumber} onChange={e => setForm(f => ({...f, caseNumber: e.target.value}))}
              placeholder="Case Number" style={iBox} />
            <input value={form.draftId} onChange={e => setForm(f => ({...f, draftId: e.target.value}))}
              placeholder="Draft ID (optional)" style={iBox} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
            rows={2} placeholder="Notes (optional)..." style={taBox} />
          {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={save} disabled={saving}
              style={{ padding: '10px 24px', background: saving ? '#3A3A3A' : '#D4A017', border: 'none', borderRadius: 10, color: saving ? '#6A6A6A' : '#0A0A0A', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Date'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setErr('') }}
              style={{ padding: '10px 18px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, color: '#8A8A8A', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Date Type Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {DATE_TYPES.map(t => (
          <span key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5A5A5A' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* Dates List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#3A3A3A', fontSize: 14 }}>Loading...</div>
      ) : dates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#3A3A3A' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#5A5A5A', marginBottom: 6 }}>No court dates found</div>
          <div style={{ fontSize: 13, color: '#3A3A3A' }}>Add your first hearing or compliance date above.</div>
        </div>
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <div key={month} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>
              {month}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(d => (
                <div key={d.id} style={{
                  background: d.completed ? '#0D0D0D' : '#141414',
                  border: `1px solid ${d.completed ? '#1A1A1A' : '#2A2A2A'}`,
                  borderLeft: `3px solid ${d.completed ? '#2A2A2A' : typeColor(d.type)}`,
                  borderRadius: 12, padding: '14px 18px',
                  opacity: d.completed ? 0.6 : 1,
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  {/* Checkbox */}
                  <button onClick={() => toggle(d.id, d.completed)}
                    style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${d.completed ? '#3A3A3A' : typeColor(d.type)}`,
                      background: d.completed ? '#1A1A1A' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor(d.type), fontWeight: 800 }}>
                    {d.completed ? '✓' : ''}
                  </button>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: d.completed ? '#5A5A5A' : '#E0E0E0',
                        textDecoration: d.completed ? 'line-through' : 'none' }}>
                        {d.title}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                        background: `${typeColor(d.type)}1A`, color: typeColor(d.type) }}>
                        {d.type}
                      </span>
                      {!d.completed && <DaysChip date={d.date} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#5A5A5A', flexWrap: 'wrap' }}>
                      <span>📅 {formatDate(d.date)}</span>
                      {d.caseNumber && <span>📋 {d.caseNumber}</span>}
                      {d.client && (
                        <Link href={`/clients/${d.client.id}`} style={{ color: '#8B5CF6', textDecoration: 'none' }}>
                          👤 {d.client.name}
                        </Link>
                      )}
                      {d.draft && (
                        <Link href={`/drafts/${d.draft.id}`} style={{ color: '#60A5FA', textDecoration: 'none' }}>
                          📄 {d.draft.title?.substring(0, 30)}
                        </Link>
                      )}
                    </div>
                    {d.notes && <div style={{ fontSize: 12, color: '#4A4A4A', marginTop: 5, lineHeight: 1.5 }}>{d.notes}</div>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => startEdit(d)}
                      style={{ padding: '5px 10px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 7,
                        color: '#8A8A8A', fontSize: 11, cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => del(d.id)}
                      style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 7,
                        color: '#4A4A4A', fontSize: 11, cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
