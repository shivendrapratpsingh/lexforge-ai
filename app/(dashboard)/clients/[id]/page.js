'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DOCUMENT_TYPES } from '@/lib/utils'

const CASE_STATUS_CONFIG = {
  active:   { label: 'Active',   color: '#2196F3', bg: 'rgba(33,150,243,0.1)'  },
  pending:  { label: 'Pending',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  won:      { label: 'Won',      color: '#4CAF50', bg: 'rgba(76,175,80,0.1)'   },
  lost:     { label: 'Lost',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  settled:  { label: 'Settled',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
  closed:   { label: 'Closed',   color: '#5A5A5A', bg: 'rgba(90,90,90,0.1)'    },
}

const DOC_TYPE_LABELS = { label: 'attachment', docType: 'other' }
const PAYMENT_MODES   = ['cash', 'neft', 'cheque', 'upi', 'other']
const DOC_TYPES_ATT   = ['aadhaar', 'id_proof', 'poa', 'vakalatnama', 'other']
const DOC_TYPE_LABELS2 = { aadhaar: 'Aadhaar Card', id_proof: 'ID Proof', poa: 'Power of Attorney', vakalatnama: 'Vakalatnama', other: 'Other' }

const S = {
  input: { width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, padding: '10px 14px', color: '#F0F0F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#5A5A5A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  card:  { background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 22 },
}

function maskAadhaar(n) {
  if (!n) return ''
  const d = n.replace(/\D/g, '')
  if (d.length !== 12) return n
  return `XXXX-XXXX-${d.slice(8)}`
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const fileRef = useRef(null)

  const [client,      setClient]      = useState(null)
  const [totalPaid,   setTotalPaid]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('info')  // info | docs | attachments | payments
  const [editMode,    setEditMode]    = useState(false)
  const [editData,    setEditData]    = useState({})
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [showAadhaar, setShowAadhaar] = useState(false)

  // Payments
  const [payForm,     setPayForm]     = useState({ amount: '', date: new Date().toISOString().split('T')[0], mode: 'cash', description: '' })
  const [addingPay,   setAddingPay]   = useState(false)
  const [payLoading,  setPayLoading]  = useState(false)

  // Attachments
  const [attLoading,  setAttLoading]  = useState(false)
  const [attLabel,    setAttLabel]    = useState('')
  const [attDocType,  setAttDocType]  = useState('other')

  useEffect(() => { fetchClient() }, [id])

  async function fetchClient() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/clients/${id}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setClient(data.client)
      setTotalPaid(data.totalPaid || 0)
      setEditData(data.client)
    } catch { setError('Failed to load client.') }
    finally { setLoading(false) }
  }

  async function saveEdit() {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setClient(data.client)
      setEditData(data.client)
      setEditMode(false)
    } catch { setError('Save failed.') }
    finally { setSaving(false) }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) { setError('Photo must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: base64 }),
      })
      const data = await res.json()
      if (res.ok) { setClient(data.client); setEditData(data.client) }
    }
    reader.readAsDataURL(file)
  }

  async function addPayment() {
    if (!payForm.amount || !payForm.date) return
    setPayLoading(true)
    try {
      const res  = await fetch(`/api/clients/${id}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payForm),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setClient(prev => ({ ...prev, payments: [data.payment, ...(prev.payments || [])] }))
      setTotalPaid(prev => prev + data.payment.amount)
      setPayForm({ amount: '', date: new Date().toISOString().split('T')[0], mode: 'cash', description: '' })
      setAddingPay(false)
    } catch { setError('Failed to add payment.') }
    finally { setPayLoading(false) }
  }

  async function deletePayment(pid, amount) {
    if (!confirm('Delete this payment?')) return
    await fetch(`/api/clients/${id}/payments?pid=${pid}`, { method: 'DELETE' })
    setClient(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== pid) }))
    setTotalPaid(prev => prev - amount)
  }

  async function handleAttachmentUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5_000_000) { setError('File must be under 5MB'); return }
    setAttLoading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const res  = await fetch(`/api/clients/${id}/attachments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, label: attLabel || file.name, docType: attDocType, mimeType: file.type, size: file.size, data: ev.target.result }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        setClient(prev => ({ ...prev, attachments: [data.attachment, ...(prev.attachments || [])] }))
        setAttLabel(''); setAttDocType('other')
        if (e.target) e.target.value = ''
      } catch { setError('Upload failed.') }
      finally { setAttLoading(false) }
    }
    reader.readAsDataURL(file)
  }

  async function downloadAttachment(attId, name, mimeType) {
    const res  = await fetch(`/api/clients/${id}/attachments`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aid: attId }) })
    const data = await res.json()
    if (!data.attachment?.data) return
    const a    = document.createElement('a')
    a.href     = data.attachment.data
    a.download = name
    a.click()
  }

  async function deleteAttachment(attId) {
    if (!confirm('Delete this attachment?')) return
    await fetch(`/api/clients/${id}/attachments?aid=${attId}`, { method: 'DELETE' })
    setClient(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== attId) }))
  }

  if (loading) return <div style={{ padding: 40, color: '#5A5A5A', textAlign: 'center' }}>Loading client...</div>
  if (error && !client) return <div style={{ padding: 40, color: '#EF4444' }}>⚠️ {error}</div>
  if (!client) return null

  const initial      = client.name[0].toUpperCase()
  const tags         = client.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const caseWins     = client.drafts?.filter(d => d.caseStatus === 'won').length  || 0
  const caseLosses   = client.drafts?.filter(d => d.caseStatus === 'lost').length || 0

  return (
    <div>
      <style>{`.tab-btn:hover{background:#1C1C1C !important} .att-row:hover{background:#1A1A1A !important} .pay-row:hover{background:#1A1A1A !important} input:focus,textarea:focus,select:focus{border-color:#D4A017 !important} .doc-row:hover{background:#1C1C1C !important}`}</style>

      {/* Back */}
      <Link href="/clients" style={{ fontSize: 13, color: '#5A5A5A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 22 }}>← All Clients</Link>

      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 28, background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
        {/* Photo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: client.photo ? 'transparent' : 'linear-gradient(135deg, #D4A017, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #2A2A2A' }}>
            {client.photo ? <img src={client.photo} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 26, fontWeight: 800, color: '#0D0D0D' }}>{initial}</span>}
          </div>
          <button onClick={() => fileRef.current?.click()} title="Change photo" style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#1C1C1C', border: '1px solid #3A3A3A', cursor: 'pointer', fontSize: 11, color: '#D4A017', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✎</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', marginBottom: 2 }}>{client.name}</h1>
          {client.fatherName && <div style={{ fontSize: 13, color: '#6A6A6A', marginBottom: 4 }}>s/o {client.fatherName}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, fontSize: 13, color: '#6A6A6A' }}>
            {client.phone    && <span>📞 {client.phone}</span>}
            {client.email    && <span>✉️ {client.email}</span>}
            {client.city     && <span>📍 {client.city}{client.district ? ', ' + client.district : ''}</span>}
            {client.age      && <span>🎂 Age {client.age}</span>}
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.map(t => <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: 'rgba(212,160,23,0.1)', color: '#D4A017', fontWeight: 600 }}>{t}</span>)}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          {[
            { v: client._count?.drafts || 0,   l: 'Documents',  c: '#D4A017' },
            { v: caseWins,                      l: 'Won',        c: '#4CAF50' },
            { v: caseLosses,                    l: 'Lost',       c: '#EF4444' },
            { v: `₹${totalPaid.toLocaleString()}`, l: 'Total Paid', c: '#8B5CF6' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', background: '#0D0D0D', borderRadius: 10, padding: '10px 16px', minWidth: 70 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: '#4A4A4A', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <button onClick={() => { setEditMode(true); setTab('info') }} style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 14px', color: '#8A8A8A', fontSize: 12, cursor: 'pointer' }}>✎ Edit</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>⚠️ {error} <button onClick={() => setError('')} style={{ marginLeft: 10, background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>✕</button></div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0D0D0D', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'info',        label: '👤 Info'        },
          { key: 'docs',        label: `📄 Documents (${client.drafts?.length || 0})` },
          { key: 'attachments', label: `📎 Attachments (${client.attachments?.length || 0})` },
          { key: 'payments',    label: `💰 Payments (${client.payments?.length || 0})` },
        ].map(t => (
          <button key={t.key} className="tab-btn" onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, background: tab === t.key ? '#1C1C1C' : 'transparent', color: tab === t.key ? '#D4A017' : '#5A5A5A' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Info ── */}
      {tab === 'info' && (
        <div style={S.card}>
          {editMode ? (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D0D0D0', marginBottom: 18 }}>Edit Client Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { k: 'name',          label: 'Full Name *'          },
                  { k: 'fatherName',    label: "Father's / Husband's Name" },
                  { k: 'age',           label: 'Age'                  },
                  { k: 'gender',        label: 'Gender'               },
                  { k: 'phone',         label: 'Phone'                },
                  { k: 'email',         label: 'Email'                },
                  { k: 'city',          label: 'City'                 },
                  { k: 'district',      label: 'District'             },
                  { k: 'state',         label: 'State'                },
                  { k: 'pincode',       label: 'Pincode'              },
                  { k: 'aadhaarNumber', label: 'Aadhaar No. (12 digits)' },
                  { k: 'tags',          label: 'Tags (comma-separated, e.g. civil,criminal)' },
                ].map(f => (
                  <div key={f.k}>
                    <label style={S.label}>{f.label}</label>
                    <input type="text" value={editData[f.k] || ''} onChange={e => setEditData({ ...editData, [f.k]: e.target.value })} style={S.input} className="focus-input" />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={S.label}>Address</label>
                <textarea value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} rows={2} style={{ ...S.input, resize: 'vertical' }} />
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={S.label}>Notes</label>
                <textarea value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} rows={3} style={{ ...S.input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={saveEdit} disabled={saving} style={{ padding: '10px 22px', background: saving ? '#1C1C1C' : 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: 8, color: saving ? '#5A5A5A' : '#0D0D0D', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : '✓ Save Changes'}
                </button>
                <button onClick={() => { setEditMode(false); setEditData(client) }} style={{ padding: '10px 18px', background: 'none', border: '1px solid #2A2A2A', borderRadius: 8, color: '#6A6A6A', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {[
                { label: 'Full Name',        v: client.name },
                { label: "Father's Name",    v: client.fatherName },
                { label: 'Age',              v: client.age },
                { label: 'Gender',           v: client.gender },
                { label: 'Phone',            v: client.phone },
                { label: 'Email',            v: client.email },
                { label: 'Address',          v: client.address },
                { label: 'City',             v: client.city },
                { label: 'District',         v: client.district },
                { label: 'State',            v: client.state },
                { label: 'Pincode',          v: client.pincode },
                {
                  label: 'Aadhaar',
                  v: client.aadhaarNumber ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{showAadhaar ? client.aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3') : maskAadhaar(client.aadhaarNumber)}</span>
                      <button onClick={() => setShowAadhaar(x => !x)} style={{ background: 'none', border: 'none', color: '#D4A017', cursor: 'pointer', fontSize: 11 }}>{showAadhaar ? '🙈 Hide' : '👁 Show'}</button>
                    </span>
                  ) : null,
                },
                { label: 'Tags', v: tags.length > 0 ? tags.join(', ') : null },
                { label: 'Notes', v: client.notes, full: true },
              ].filter(f => f.v).map(f => (
                <div key={f.label} style={f.full ? { gridColumn: '1/-1' } : {}}>
                  <div style={{ fontSize: 11, color: '#4A4A4A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: '#C0C0C0' }}>{f.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Documents ── */}
      {tab === 'docs' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D0D0D0' }}>Linked Documents</h3>
            <Link href="/new-draft" style={{ fontSize: 12, color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>+ New Document</Link>
          </div>
          {!client.drafts?.length ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#4A4A4A', fontSize: 13 }}>No documents linked to this client yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {client.drafts.map(d => {
                const dt = DOCUMENT_TYPES.find(t => t.value === d.documentType)
                const cs = CASE_STATUS_CONFIG[d.caseStatus] || CASE_STATUS_CONFIG.active
                return (
                  <Link key={d.id} href={`/drafts/${d.id}`} className="doc-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 10, textDecoration: 'none' }}>
                    <span style={{ fontSize: 20, width: 36, height: 36, background: '#1C1C1C', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{dt?.icon || '📄'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#D0D0D0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 2 }}>{dt?.label} · {d.court || 'No court'} · {new Date(d.updatedAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: cs.bg, color: cs.color, fontWeight: 600, flexShrink: 0 }}>{cs.label}</span>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: d.status === 'finalized' ? 'rgba(76,175,80,0.1)' : 'rgba(212,160,23,0.1)', color: d.status === 'finalized' ? '#4CAF50' : '#D4A017', fontWeight: 600, flexShrink: 0 }}>{d.status}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Attachments ── */}
      {tab === 'attachments' && (
        <div style={S.card}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D0D0D0', marginBottom: 18 }}>Documents & Attachments</h3>

          {/* Upload */}
          <div style={{ background: '#0D0D0D', border: '1px dashed #2A2A2A', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={S.label}>Document Type</label>
                <select value={attDocType} onChange={e => setAttDocType(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  {DOC_TYPES_ATT.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS2[t]}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Label (optional)</label>
                <input type="text" value={attLabel} onChange={e => setAttLabel(e.target.value)} placeholder="e.g. Aadhaar Front Side" style={S.input} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', background: attLoading ? '#1C1C1C' : 'rgba(212,160,23,0.06)', border: `1px solid ${attLoading ? '#2A2A2A' : 'rgba(212,160,23,0.2)'}`, borderRadius: 8, cursor: attLoading ? 'not-allowed' : 'pointer', color: attLoading ? '#5A5A5A' : '#D4A017', fontSize: 13, fontWeight: 600 }}>
              {attLoading ? '⏳ Uploading...' : '📎 Click to Upload File (max 5MB)'}
              <input type="file" style={{ display: 'none' }} disabled={attLoading} onChange={handleAttachmentUpload} />
            </label>
          </div>

          {!client.attachments?.length ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#4A4A4A', fontSize: 13 }}>No attachments yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {client.attachments.map(a => (
                <div key={a.id} className="att-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>{a.mimeType?.startsWith('image/') ? '🖼️' : a.mimeType === 'application/pdf' ? '📋' : '📎'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#C0C0C0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label || a.name}</div>
                    <div style={{ fontSize: 11, color: '#4A4A4A' }}>{DOC_TYPE_LABELS2[a.docType] || a.docType} · {a.size ? Math.round(a.size/1024) + ' KB' : ''} · {new Date(a.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <button onClick={() => downloadAttachment(a.id, a.name, a.mimeType)} style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 6, padding: '5px 10px', color: '#8A8A8A', fontSize: 11, cursor: 'pointer' }}>⬇ Download</button>
                  <button onClick={() => deleteAttachment(a.id)} style={{ background: 'none', border: 'none', color: '#4A4A4A', cursor: 'pointer', fontSize: 13 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Payments ── */}
      {tab === 'payments' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D0D0D0' }}>Fee & Payments</h3>
              <div style={{ fontSize: 13, color: '#8B5CF6', marginTop: 2 }}>Total Received: <strong>₹{totalPaid.toLocaleString('en-IN')}</strong></div>
            </div>
            <button onClick={() => setAddingPay(x => !x)} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '8px 14px', color: '#8B5CF6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {addingPay ? '✕ Cancel' : '+ Add Payment'}
            </button>
          </div>

          {addingPay && (
            <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 10, padding: 16, marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={S.label}>Amount (₹) *</label>
                  <input type="number" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} placeholder="e.g. 5000" style={S.input} min="1" />
                </div>
                <div>
                  <label style={S.label}>Date *</label>
                  <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Mode</label>
                  <select value={payForm.mode} onChange={e => setPayForm({...payForm, mode: e.target.value})} style={{ ...S.input, cursor: 'pointer' }}>
                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Description (optional)</label>
                <input type="text" value={payForm.description} onChange={e => setPayForm({...payForm, description: e.target.value})} placeholder="e.g. Retainer fee, Appearance fee" style={S.input} />
              </div>
              <button onClick={addPayment} disabled={payLoading || !payForm.amount} style={{ padding: '9px 20px', background: !payForm.amount || payLoading ? '#1C1C1C' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', borderRadius: 8, color: !payForm.amount || payLoading ? '#5A5A5A' : '#fff', fontSize: 13, fontWeight: 700, cursor: !payForm.amount || payLoading ? 'not-allowed' : 'pointer' }}>
                {payLoading ? 'Adding...' : '✓ Add Payment'}
              </button>
            </div>
          )}

          {!client.payments?.length ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#4A4A4A', fontSize: 13 }}>No payments recorded yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                  {['Date', 'Amount', 'Mode', 'Description', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#4A4A4A', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {client.payments.map(p => (
                  <tr key={p.id} className="pay-row" style={{ borderBottom: '1px solid #1C1C1C' }}>
                    <td style={{ padding: '11px 10px', fontSize: 13, color: '#A0A0A0' }}>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '11px 10px', fontSize: 13, fontWeight: 700, color: '#4CAF50' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '11px 10px', fontSize: 12 }}><span style={{ padding: '3px 9px', borderRadius: 100, background: '#1C1C1C', color: '#8B5CF6', fontWeight: 600 }}>{p.mode.toUpperCase()}</span></td>
                    <td style={{ padding: '11px 10px', fontSize: 12, color: '#6A6A6A' }}>{p.description || '—'}</td>
                    <td style={{ padding: '11px 10px' }}>
                      <button onClick={() => deletePayment(p.id, p.amount)} style={{ background: 'none', border: 'none', color: '#3A3A3A', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
