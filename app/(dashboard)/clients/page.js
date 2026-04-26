'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const DISTRICTS = ['', 'Prayagraj', 'Pratapgarh', 'Kaushambi', 'Fatehpur', 'Chitrakoot', 'Mirzapur', 'Varanasi', 'Lucknow', 'Kanpur', 'Other']
const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name',   label: 'Name (A–Z)'       },
  { value: 'docs',   label: 'Most Documents'   },
]
const COMMON_TAGS    = ['civil', 'criminal', 'family', 'property', 'labour', 'rent', 'consumer', 'writ', 'bail', 'pil']
const GENDER_OPTIONS = ['', 'Male', 'Female', 'Other']
const CSV_HEADERS    = 'name,fatherName,age,gender,phone,email,address,city,district,state,pincode,aadhaarNumber,tags,notes'

function maskAadhaar(n) {
  if (!n) return ''
  const d = n.replace(/\D/g, '')
  return d.length === 12 ? `XXXX-XXXX-${d.slice(8)}` : n
}

const BLANK = { name: '', fatherName: '', age: '', gender: '', phone: '', email: '', address: '', city: '', district: 'Prayagraj', state: 'Uttar Pradesh', pincode: '', aadhaarNumber: '', tags: '', notes: '' }

export default function ClientsPage() {
  const csvRef = useRef(null)

  const [clients,    setClients]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [q,          setQ]          = useState('')
  const [district,   setDistrict]   = useState('')
  const [sort,       setSort]       = useState('recent')
  const [showModal,  setShowModal]  = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [form,       setForm]       = useState(BLANK)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [dupWarn,    setDupWarn]    = useState(null)
  const [csvResult,  setCsvResult]  = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(fetchClients, 300)
    return () => clearTimeout(t)
  }, [q, district, sort])

  async function fetchClients() {
    setLoading(true)
    try {
      const p = new URLSearchParams({ sort })
      if (q)        p.set('q', q)
      if (district) p.set('district', district)
      const res  = await fetch(`/api/clients?${p}`)
      const data = await res.json()
      setClients(data.clients || [])
    } catch { setError('Failed to load clients.') }
    finally { setLoading(false) }
  }

  function openAdd()  { setEditingId(null); setForm(BLANK); setError(''); setDupWarn(null); setShowModal(true) }
  function openEdit(c) {
    setEditingId(c.id)
    setForm({ name: c.name||'', fatherName: c.fatherName||'', age: c.age||'', gender: c.gender||'', phone: c.phone||'', email: c.email||'', address: c.address||'', city: c.city||'', district: c.district||'', state: c.state||'Uttar Pradesh', pincode: c.pincode||'', aadhaarNumber: c.aadhaarNumber||'', tags: c.tags||'', notes: c.notes||'' })
    setError(''); setDupWarn(null); setShowModal(true)
  }

  async function saveClient(force = false) {
    if (!form.name.trim()) { setError('Name is required.'); return }
    const cleanAadhaar = form.aadhaarNumber.replace(/\s|-/g, '')
    if (cleanAadhaar && !/^\d{12}$/.test(cleanAadhaar)) { setError('Aadhaar must be exactly 12 digits.'); return }
    setSaving(true); setError(''); setDupWarn(null)
    try {
      const url    = editingId ? `/api/clients/${editingId}` : '/api/clients'
      const method = editingId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, aadhaarNumber: cleanAadhaar }) })
      const data   = await res.json()
      if (res.status === 409 && data.duplicate && !force) { setDupWarn(data); setSaving(false); return }
      if (!res.ok) { setError(data.error || 'Failed to save.'); return }
      setShowModal(false); fetchClients()
    } catch { setError('Something went wrong.') }
    finally { setSaving(false) }
  }

  async function deleteClient(id, name) {
    if (!confirm(`Delete "${name}"? Their documents will be unlinked, not deleted.`)) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    setClients(prev => prev.filter(c => c.id !== id))
  }

  function downloadTemplate() {
    const a   = document.createElement('a')
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_HEADERS + '\n')
    a.download = 'clients_template.csv'; a.click()
  }

  async function handleCsvImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvLoading(true); setCsvResult(null)
    try {
      const text    = await file.text()
      const lines   = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) { setCsvResult({ error: 'Empty or invalid CSV.' }); return }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      const rows    = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']))
      })
      const res  = await fetch('/api/clients?bulk=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) })
      const data = await res.json()
      setCsvResult(data); fetchClients()
    } catch { setCsvResult({ error: 'Import failed.' }) }
    finally { setCsvLoading(false); if (e.target) e.target.value = '' }
  }

  function toggleTag(t) {
    const existing = form.tags ? form.tags.split(',').map(x => x.trim()).filter(Boolean) : []
    const updated  = existing.includes(t) ? existing.filter(x => x !== t) : [...existing, t]
    setForm({ ...form, tags: updated.join(', ') })
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div>
      <style>{`.ccard:hover{border-color:#3A3A3A !important; background:#161616 !important} input:focus,select:focus,textarea:focus{border-color:#D4A017 !important}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 4 }}>Clients</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14 }}>{clients.length} client{clients.length !== 1 ? 's' : ''}{q || district ? ' (filtered)' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={downloadTemplate} style={{ padding: '9px 13px', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 9, color: '#6A6A6A', fontSize: 12, cursor: 'pointer' }}>⬇ CSV Template</button>
          <label style={{ padding: '9px 13px', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 9, color: csvLoading ? '#4A4A4A' : '#6A6A6A', fontSize: 12, cursor: csvLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {csvLoading ? '⏳ Importing...' : '📥 Import CSV'}
            <input type="file" accept=".csv" style={{ display: 'none' }} disabled={csvLoading} onChange={handleCsvImport} />
          </label>
          <button onClick={openAdd} style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: 9, color: '#0D0D0D', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Client</button>
        </div>
      </div>

      {/* CSV result */}
      {csvResult && (
        <div style={{ background: csvResult.error ? 'rgba(239,68,68,0.08)' : 'rgba(76,175,80,0.08)', border: `1px solid ${csvResult.error ? 'rgba(239,68,68,0.2)' : 'rgba(76,175,80,0.2)'}`, borderRadius: 10, padding: '11px 15px', marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: csvResult.error ? '#EF4444' : '#4CAF50' }}>
            {csvResult.error ? `⚠️ ${csvResult.error}` : `✓ Import complete — ${csvResult.created} added, ${csvResult.skipped} skipped${csvResult.errors?.length ? `, ${csvResult.errors.length} errors` : ''}`}
          </span>
          <button onClick={() => setCsvResult(null)} style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#EF4444', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          {error}<button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Search by name, Aadhaar, phone..."
          style={{ flex: 1, minWidth: 200, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 9, padding: '10px 14px', color: '#F0F0F0', fontSize: 13, outline: 'none' }} />
        <select value={district} onChange={e => setDistrict(e.target.value)}
          style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 9, padding: '10px 14px', color: district ? '#F0F0F0' : '#5A5A5A', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          <option value="">All Districts</option>
          {DISTRICTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 9, padding: '10px 14px', color: '#F0F0F0', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {(q || district) && <button onClick={() => { setQ(''); setDistrict('') }} style={{ padding: '10px 14px', background: 'none', border: '1px solid #2A2A2A', borderRadius: 9, color: '#6A6A6A', fontSize: 12, cursor: 'pointer' }}>✕ Clear</button>}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#5A5A5A' }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <p style={{ color: '#5A5A5A', marginBottom: 16, fontSize: 14 }}>{q || district ? 'No clients match your search.' : 'No clients yet.'}</p>
          {!q && !district && <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#0D0D0D', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Add First Client</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))', gap: 14 }}>
          {clients.map(c => {
            const initial = c.name[0].toUpperCase()
            const tags    = c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            return (
              <div key={c.id} className="ccard" style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18, transition: 'all 0.15s' }}>
                <Link href={`/clients/${c.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.photo ? 'transparent' : 'linear-gradient(135deg, #D4A017, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '2px solid #1C1C1C' }}>
                      {c.photo ? <img src={c.photo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 17, fontWeight: 800, color: '#0D0D0D' }}>{initial}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#E0E0E0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      {c.fatherName && <div style={{ fontSize: 11, color: '#5A5A5A' }}>s/o {c.fatherName}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#D4A017' }}>{c._count?.drafts || 0}</div>
                      <div style={{ fontSize: 10, color: '#4A4A4A' }}>docs</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6A6A6A', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                    {c.phone         && <span>📞 {c.phone}</span>}
                    {(c.city || c.district) && <span>📍 {[c.city, c.district].filter(Boolean).join(', ')}</span>}
                    {c.aadhaarNumber  && <span>🪪 {maskAadhaar(c.aadhaarNumber)}</span>}
                  </div>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                      {tags.map(t => <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(212,160,23,0.1)', color: '#D4A017', fontWeight: 600 }}>{t}</span>)}
                    </div>
                  )}
                </Link>
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #1C1C1C', paddingTop: 10 }}>
                  <Link href={`/clients/${c.id}`} style={{ flex: 1, textAlign: 'center', padding: '7px', background: '#1C1C1C', borderRadius: 7, fontSize: 12, color: '#8A8A8A', textDecoration: 'none' }}>View</Link>
                  <button onClick={() => openEdit(c)} style={{ flex: 1, padding: '7px', background: '#1C1C1C', border: 'none', borderRadius: 7, fontSize: 12, color: '#8A8A8A', cursor: 'pointer' }}>✎ Edit</button>
                  <button onClick={() => deleteClient(c.id, c.name)} style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.06)', border: 'none', borderRadius: 7, fontSize: 12, color: '#EF4444', cursor: 'pointer' }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 18, padding: 28, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#F0F0F0' }}>{editingId ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#5A5A5A', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '9px 14px', marginBottom: 12, color: '#EF4444', fontSize: 13 }}>{error}</div>}

            {dupWarn && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#F59E0B', marginBottom: 8 }}>⚠️ {dupWarn.error}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/clients/${dupWarn.existingId}`} onClick={() => setShowModal(false)} style={{ fontSize: 12, color: '#D4A017', textDecoration: 'none', padding: '6px 12px', background: 'rgba(212,160,23,0.1)', borderRadius: 6 }}>View Existing →</Link>
                  <button onClick={() => saveClient(true)} style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Add Anyway</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { k: 'name',       l: 'Full Name *' },
                { k: 'fatherName', l: "Father's Name" },
                { k: 'age',        l: 'Age' },
                { k: 'phone',      l: 'Phone' },
                { k: 'email',      l: 'Email' },
                { k: 'city',       l: 'City' },
                { k: 'pincode',    l: 'Pincode' },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>{f.l}</label>
                  <input value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                    style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g || 'Select'}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>District</label>
                <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })}
                  style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d || 'Select District'}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Aadhaar (12 digits)</label>
                <input value={form.aadhaarNumber} onChange={e => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })} placeholder="12-digit Aadhaar"
                  style={{ width: '100%', background: '#1C1C1C', border: `1px solid ${form.aadhaarNumber.length > 0 && form.aadhaarNumber.length !== 12 ? 'rgba(239,68,68,0.5)' : '#2A2A2A'}`, borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {form.aadhaarNumber.length > 0 && form.aadhaarNumber.length !== 12 && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3 }}>{form.aadhaarNumber.length}/12 digits</div>}
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Address</label>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2}
                  style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Tags</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. civil, criminal, property"
                  style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {COMMON_TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(t)} type="button"
                      style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, border: `1px solid ${form.tags?.includes(t) ? 'rgba(212,160,23,0.3)' : '#2A2A2A'}`, background: form.tags?.includes(t) ? 'rgba(212,160,23,0.12)' : '#1C1C1C', color: form.tags?.includes(t) ? '#D4A017' : '#5A5A5A', cursor: 'pointer' }}>{t}</button>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, color: '#5A5A5A', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any notes about this client..."
                  style={{ width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 12px', color: '#F0F0F0', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => saveClient(false)} disabled={saving}
                style={{ flex: 1, padding: '12px', background: saving ? '#1C1C1C' : 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: 10, color: saving ? '#5A5A5A' : '#0D0D0D', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : editingId ? '✓ Save Changes' : '+ Add Client'}
              </button>
              <button onClick={() => setShowModal(false)} style={{ padding: '12px 18px', background: 'none', border: '1px solid #2A2A2A', borderRadius: 10, color: '#6A6A6A', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
