'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TOOLS = [
  { id: 'order',     label: 'Order Analyzer',       icon: '⚖️',  desc: 'Paste a court order to get structured action plan, compliance dates & next steps.' },
  { id: 'amendment', label: 'Document Amendment',   icon: '✏️',  desc: 'Amend an existing document — specify what to change and get an updated version.' },
  { id: 'fresh',     label: 'Fresh Application',    icon: '🔄',  desc: 'Generate a fresh bail/petition after rejection with changed circumstances.' },
  { id: 'appeal',    label: 'Appeal Generator',     icon: '📢',  desc: 'Generate appeal petition from a lower court judgment with all legal grounds.' },
  { id: 'counter',   label: 'Counter / Reply',      icon: '↩️',  desc: 'Generate counter affidavit or reply to the opposite party\'s document.' },
  { id: 'compliance',label: 'Compliance Report',    icon: '📋',  desc: 'Generate compliance affidavit/report after fulfilling court directions.' },
]

const COURTS = [
  { value: '', label: '— Select Court —' },
  { value: 'ALLAHABAD_HC', label: 'Allahabad High Court' },
  { value: 'ALLAHABAD_HC_LB', label: 'Allahabad HC — Lucknow Bench' },
  { value: 'SUPREME_COURT', label: 'Supreme Court of India' },
  { value: 'DISTRICT_COURT', label: 'District Court' },
  { value: 'SESSIONS_COURT', label: 'Sessions Court' },
  { value: 'MAGISTRATE', label: 'Magistrate Court' },
]

const DOC_TYPES = [
  { value: 'BAIL_APPLICATION', label: 'Bail Application' },
  { value: 'STAY_APPLICATION', label: 'Stay Application' },
  { value: 'PETITION', label: 'Petition' },
  { value: 'WRIT_PETITION', label: 'Writ Petition' },
  { value: 'PIL', label: 'PIL' },
  { value: 'AFFIDAVIT', label: 'Affidavit' },
  { value: 'LEGAL_NOTICE', label: 'Legal Notice' },
]

const APPEAL_TYPES = [
  { value: 'HIGH_COURT', label: 'High Court Appeal' },
  { value: 'SUPREME_COURT', label: 'Supreme Court (SLP)' },
  { value: 'SESSIONS', label: 'Sessions Court Appeal' },
  { value: 'REVISION', label: 'Revision Petition' },
]

const sBox = {
  width: '100%', background: '#0D0D0D', border: '1px solid #2A2A2A',
  borderRadius: 10, padding: '11px 14px', color: '#E0E0E0', fontSize: 13,
  fontFamily: 'inherit', resize: 'vertical', outline: 'none',
  boxSizing: 'border-box',
}
const iBox = { ...sBox, resize: undefined, height: 44 }
const selBox = { ...iBox }
const btn = (active) => ({
  padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  border: 'none', background: active ? '#D4A017' : '#1A1A1A',
  color: active ? '#0A0A0A' : '#6A6A6A', transition: 'all .18s',
})
const primaryBtn = (loading) => ({
  padding: '12px 28px', background: loading ? '#3A3A3A' : '#D4A017', color: loading ? '#6A6A6A' : '#0A0A0A',
  border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
  width: '100%', marginTop: 10,
})
const resultBox = {
  background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 12, padding: 24,
  fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.9, color: '#C0C0C0',
  whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 520, overflowY: 'auto',
}

// ── Order Analyzer ─────────────────────────────────────────────
function OrderAnalyzer() {
  const [text, setText]     = useState('')
  const [court, setCourt]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [err, setErr]         = useState('')

  async function run() {
    if (!text.trim()) return setErr('Please paste the court order.')
    setErr(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/analyze/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderText: text, court }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.analysis)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Court Order Text *</label>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={7} placeholder="Paste the full court order here..." style={sBox} />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <select value={court} onChange={e => setCourt(e.target.value)} style={{ ...selBox, flex: 1 }}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
      <button onClick={run} disabled={loading} style={primaryBtn(loading)}>
        {loading ? '⏳ Analyzing Order...' : '⚖️ Analyze Order'}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>
            Order Analysis
          </div>
          {/* Order Type */}
          {result.orderType && (
            <div style={{ background: 'rgba(212,160,23,0.07)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#D4A017', fontWeight: 700 }}>
              {result.orderType}
            </div>
          )}
          {/* Directions */}
          {result.directions?.length > 0 && (
            <Section title="Court Directions" items={result.directions} color="#8B5CF6" />
          )}
          {/* Immediate Actions */}
          {result.immediateActions?.length > 0 && (
            <Section title="⚡ Immediate Actions" items={result.immediateActions} color="#F87171" />
          )}
          {/* Documents Needed */}
          {result.documentsNeeded?.length > 0 && (
            <Section title="📄 Documents Needed" items={result.documentsNeeded} color="#60A5FA" />
          )}
          {/* Compliance Dates */}
          {result.complianceDates?.length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5A5A5A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>📅 Compliance Dates</div>
              {result.complianceDates.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, padding: '6px 0', borderBottom: '1px solid #1A1A1A' }}>
                  <span style={{ color: '#C0C0C0' }}>{d.task || d}</span>
                  {d.date && <span style={{ color: '#D4A017', fontWeight: 600 }}>{d.date}</span>}
                </div>
              ))}
            </div>
          )}
          {/* Next Date */}
          {result.nextDate && (
            <div style={{ background: 'rgba(76,175,80,0.07)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4CAF50', fontWeight: 700, marginBottom: 10 }}>
              📅 Next Date: {result.nextDate}
            </div>
          )}
          {/* Favorable / Adverse */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {result.favorablePoints?.length > 0 && (
              <MiniSection title="✅ Favorable" items={result.favorablePoints} color="#4CAF50" />
            )}
            {result.adversePoints?.length > 0 && (
              <MiniSection title="❌ Adverse" items={result.adversePoints} color="#F87171" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, items, color }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#5A5A5A', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#C0C0C0', marginBottom: 7, lineHeight: 1.6 }}>
          <span style={{ color, flexShrink: 0, marginTop: 1 }}>▸</span>
          <span>{typeof item === 'string' ? item : item.direction || item.action || item.document || JSON.stringify(item)}</span>
        </div>
      ))}
    </div>
  )
}

function MiniSection({ title, items, color }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 5, lineHeight: 1.5 }}>• {typeof item === 'string' ? item : JSON.stringify(item)}</div>
      ))}
    </div>
  )
}

// ── Amendment Tool ─────────────────────────────────────────────
function AmendmentTool() {
  const router = useRouter()
  const [original, setOriginal] = useState('')
  const [amendments, setAmendments] = useState('')
  const [docType, setDocType]   = useState('PETITION')
  const [court, setCourt]       = useState('')
  const [lang, setLang]         = useState('english')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [err, setErr]           = useState('')

  async function run() {
    if (!original.trim() || !amendments.trim()) return setErr('Both fields are required.')
    setErr(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/analyze/amendment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalContent: original, amendments, documentType: docType, court, language: lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <select value={docType} onChange={e => setDocType(e.target.value)} style={selBox}>
          {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={court} onChange={e => setCourt(e.target.value)} style={selBox}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} style={selBox}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="bilingual">Bilingual</option>
        </select>
      </div>
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Original Document *</label>
      <textarea value={original} onChange={e => setOriginal(e.target.value)} rows={6} placeholder="Paste the original document content here..." style={sBox} />
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginTop: 12, marginBottom: 6 }}>Amendment Instructions *</label>
      <textarea value={amendments} onChange={e => setAmendments(e.target.value)} rows={4}
        placeholder="Describe what needs to change — e.g. 'Change the bail grounds in para 5 to include medical grounds. Update the prayer clause to add interim bail relief.'" style={sBox} />
      {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
      <button onClick={run} disabled={loading} style={primaryBtn(loading)}>
        {loading ? '⏳ Generating Amendment...' : '✏️ Generate Amended Document'}
      </button>

      {result?.content && (
        <ResultPanel content={result.content} draft={result.draft} title="Amended Document" router={router} />
      )}
    </div>
  )
}

// ── Fresh Application ──────────────────────────────────────────
function FreshApplication() {
  const router = useRouter()
  const [rejectionText, setRejectionText] = useState('')
  const [additionalGrounds, setAdditional] = useState('')
  const [docType, setDocType]   = useState('BAIL_APPLICATION')
  const [court, setCourt]       = useState('')
  const [lang, setLang]         = useState('english')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [err, setErr]           = useState('')

  async function run() {
    if (!rejectionText.trim()) return setErr('Rejection order text is required.')
    setErr(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/analyze/fresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionOrderText: rejectionText, documentType: docType, court, language: lang, additionalGrounds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <select value={docType} onChange={e => setDocType(e.target.value)} style={selBox}>
          {DOC_TYPES.filter(d => ['BAIL_APPLICATION','STAY_APPLICATION','PETITION','WRIT_PETITION'].includes(d.value)).map(d =>
            <option key={d.value} value={d.value}>{d.label}</option>
          )}
        </select>
        <select value={court} onChange={e => setCourt(e.target.value)} style={selBox}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} style={selBox}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="bilingual">Bilingual</option>
        </select>
      </div>
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Previous Rejection Order *</label>
      <textarea value={rejectionText} onChange={e => setRejectionText(e.target.value)} rows={6}
        placeholder="Paste the rejection order / earlier order refusing bail/stay/petition..." style={sBox} />
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginTop: 12, marginBottom: 6 }}>Changed Circumstances / New Grounds</label>
      <textarea value={additionalGrounds} onChange={e => setAdditional(e.target.value)} rows={3}
        placeholder="e.g. Sureties arranged, co-accused released, medical condition worsened, prolonged incarceration, trial delay..." style={sBox} />
      {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
      <button onClick={run} disabled={loading} style={primaryBtn(loading)}>
        {loading ? '⏳ Drafting Fresh Application...' : '🔄 Generate Fresh Application'}
      </button>
      {result?.content && (
        <ResultPanel content={result.content} draft={result.draft} title="Fresh Application" router={router} />
      )}
    </div>
  )
}

// ── Appeal Generator ───────────────────────────────────────────
function AppealGenerator() {
  const router = useRouter()
  const [judgment, setJudgment] = useState('')
  const [appealType, setAppealType] = useState('HIGH_COURT')
  const [grounds, setGrounds]   = useState('')
  const [court, setCourt]       = useState('')
  const [lang, setLang]         = useState('english')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [err, setErr]           = useState('')

  async function run() {
    if (!judgment.trim()) return setErr('Judgment text is required.')
    setErr(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/analyze/appeal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgmentText: judgment, appealType, court, language: lang, additionalGrounds: grounds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <select value={appealType} onChange={e => setAppealType(e.target.value)} style={selBox}>
          {APPEAL_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <select value={court} onChange={e => setCourt(e.target.value)} style={selBox}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} style={selBox}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="bilingual">Bilingual</option>
        </select>
      </div>
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Impugned Judgment / Order *</label>
      <textarea value={judgment} onChange={e => setJudgment(e.target.value)} rows={7}
        placeholder="Paste the full judgment or order being appealed against..." style={sBox} />
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginTop: 12, marginBottom: 6 }}>Additional Grounds of Appeal</label>
      <textarea value={grounds} onChange={e => setGrounds(e.target.value)} rows={3}
        placeholder="e.g. Perversity, non-consideration of evidence, erroneous finding on fact/law..." style={sBox} />
      {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
      <button onClick={run} disabled={loading} style={primaryBtn(loading)}>
        {loading ? '⏳ Generating Appeal...' : '📢 Generate Appeal Petition'}
      </button>
      {result?.content && (
        <ResultPanel content={result.content} draft={result.draft} title="Appeal Petition" router={router} />
      )}
    </div>
  )
}

// ── Counter / Reply ────────────────────────────────────────────
function CounterReply() {
  const router = useRouter()
  const [oppDoc, setOppDoc]     = useState('')
  const [position, setPosition] = useState('')
  const [docType, setDocType]   = useState('AFFIDAVIT')
  const [court, setCourt]       = useState('')
  const [lang, setLang]         = useState('english')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [err, setErr]           = useState('')

  async function run() {
    if (!oppDoc.trim()) return setErr('Opposite party document is required.')
    setErr(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/analyze/counter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oppositePartyDoc: oppDoc, documentType: docType, court, language: lang, clientPosition: position }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <select value={docType} onChange={e => setDocType(e.target.value)} style={selBox}>
          {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select value={court} onChange={e => setCourt(e.target.value)} style={selBox}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} style={selBox}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="bilingual">Bilingual</option>
        </select>
      </div>
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Opposite Party's Document *</label>
      <textarea value={oppDoc} onChange={e => setOppDoc(e.target.value)} rows={7}
        placeholder="Paste the affidavit / petition / notice from the opposite party that you want to counter..." style={sBox} />
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginTop: 12, marginBottom: 6 }}>Your Client's Position</label>
      <textarea value={position} onChange={e => setPosition(e.target.value)} rows={3}
        placeholder="Key facts from your client's side, specific points to refute, any new evidence..." style={sBox} />
      {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
      <button onClick={run} disabled={loading} style={primaryBtn(loading)}>
        {loading ? '⏳ Generating Counter...' : '↩️ Generate Counter Affidavit'}
      </button>
      {result?.content && (
        <ResultPanel content={result.content} draft={result.draft} title="Counter Affidavit" router={router} />
      )}
    </div>
  )
}

// ── Compliance Report ──────────────────────────────────────────
function ComplianceReport() {
  const router = useRouter()
  const [orderText, setOrderText]   = useState('')
  const [complianceDetails, setDetails] = useState('')
  const [court, setCourt]           = useState('')
  const [lang, setLang]             = useState('english')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [err, setErr]               = useState('')

  async function run() {
    if (!orderText.trim()) return setErr('Court order is required.')
    setErr(''); setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/analyze/compliance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderText, complianceDetails, court, language: lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <select value={court} onChange={e => setCourt(e.target.value)} style={selBox}>
          {COURTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={lang} onChange={e => setLang(e.target.value)} style={selBox}>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="bilingual">Bilingual</option>
        </select>
      </div>
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginBottom: 6 }}>Court Order to Comply With *</label>
      <textarea value={orderText} onChange={e => setOrderText(e.target.value)} rows={5}
        placeholder="Paste the court order that has been complied with (or is being complied with)..." style={sBox} />
      <label style={{ fontSize: 12, color: '#5A5A5A', display: 'block', marginTop: 12, marginBottom: 6 }}>Compliance Details</label>
      <textarea value={complianceDetails} onChange={e => setDetails(e.target.value)} rows={4}
        placeholder="What steps were taken? e.g. Documents filed on 10.04.2025, amount deposited in registry, road constructed, FIR registered..." style={sBox} />
      {err && <div style={{ color: '#F87171', fontSize: 12, marginTop: 8 }}>{err}</div>}
      <button onClick={run} disabled={loading} style={primaryBtn(loading)}>
        {loading ? '⏳ Generating Compliance Report...' : '📋 Generate Compliance Report'}
      </button>
      {result?.content && (
        <ResultPanel content={result.content} draft={result.draft} title="Compliance Report" router={router} />
      )}
    </div>
  )
}

// ── Shared Result Panel ────────────────────────────────────────
function ResultPanel({ content, draft, title, router }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copy} style={{ padding: '6px 14px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: copied ? '#4CAF50' : '#C0C0C0', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          {draft?.id && (
            <>
              <a href={`/api/export/${draft.id}/pdf`} style={{ padding: '6px 14px', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#C0C0C0', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                📕 PDF
              </a>
              <button onClick={() => router.push(`/drafts/${draft.id}`)}
                style={{ padding: '6px 14px', background: '#D4A017', border: 'none', borderRadius: 8, color: '#0A0A0A', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                Open Draft →
              </button>
            </>
          )}
        </div>
      </div>
      <div style={resultBox}>{content}</div>
      {draft?.id && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(76,175,80,0.07)', border: '1px solid rgba(76,175,80,0.15)', borderRadius: 10, fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>
          ✓ Saved to Documents — you can edit, export and track it from <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => router.push(`/drafts/${draft.id}`)}>the draft page</span>.
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function ToolsPage() {
  const [active, setActive] = useState('order')
  const tool = TOOLS.find(t => t.id === active)

  const PANELS = {
    order:      <OrderAnalyzer />,
    amendment:  <AmendmentTool />,
    fresh:      <FreshApplication />,
    appeal:     <AppealGenerator />,
    counter:    <CounterReply />,
    compliance: <ComplianceReport />,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>⚒️ Legal Tools</h1>
        <p style={{ fontSize: 13, color: '#5A5A5A' }}>AI-powered workflows for amendments, appeals, compliance and more.</p>
      </div>

      {/* Tool Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={btn(active === t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Active Tool */}
      <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>{tool?.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#F0F0F0' }}>{tool?.label}</span>
          </div>
          <p style={{ fontSize: 13, color: '#5A5A5A', margin: 0 }}>{tool?.desc}</p>
        </div>
        <div style={{ height: 1, background: '#1C1C1C', marginBottom: 22 }} />
        {PANELS[active]}
      </div>
    </div>
  )
}
