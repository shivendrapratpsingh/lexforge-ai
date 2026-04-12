'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DOCUMENT_TYPES } from '@/lib/utils'

const FIELDS = {
  LEGAL_NOTICE: [
    { name: 'senderName', label: 'Sender Name', ph: 'Your full name / organization' },
    { name: 'recipientName', label: 'Recipient Name', ph: 'Person/entity receiving notice' },
    { name: 'recipientAddress', label: 'Recipient Address', ph: 'Full postal address' },
    { name: 'subject', label: 'Subject', ph: 'Subject of the legal notice' },
    { name: 'grievance', label: 'Grievance / Issue', ph: 'Describe the dispute in detail', multi: true },
    { name: 'demand', label: 'Demanded Action / Relief', ph: 'What action do you demand?' },
    { name: 'deadline', label: 'Response Deadline', ph: 'e.g., 15 days, 30 days' },
  ],
  CASE_BRIEF: [
    { name: 'caseName', label: 'Case Name', ph: 'Petitioner v. Respondent' },
    { name: 'court', label: 'Court', ph: 'e.g., Supreme Court of India' },
    { name: 'facts', label: 'Facts of the Case', ph: 'Key facts chronologically', multi: true },
    { name: 'issues', label: 'Legal Issues', ph: 'What legal questions need to be decided?' },
    { name: 'petitionerArgs', label: "Petitioner's Arguments", ph: 'Arguments for petitioner' },
    { name: 'respondentArgs', label: "Respondent's Arguments", ph: 'Arguments for respondent' },
    { name: 'relief', label: 'Relief Sought', ph: 'What outcome is sought?' },
  ],
  CONTRACT: [
    { name: 'partyA', label: 'Party A', ph: 'Full name and details of first party' },
    { name: 'partyB', label: 'Party B', ph: 'Full name and details of second party' },
    { name: 'purpose', label: 'Contract Purpose', ph: 'What is this contract for?' },
    { name: 'terms', label: 'Key Terms & Obligations', ph: 'Main duties and obligations', multi: true },
    { name: 'payment', label: 'Payment Terms', ph: 'Amount, schedule, mode of payment' },
    { name: 'duration', label: 'Contract Duration', ph: 'e.g., 1 year from signing' },
    { name: 'termination', label: 'Termination Conditions', ph: 'When/how can it be terminated?' },
  ],
  PETITION: [
    { name: 'petitionerName', label: 'Petitioner Name', ph: 'Full name of the person filing' },
    { name: 'respondentName', label: 'Respondent Name', ph: 'Name of opposite party/authority' },
    { name: 'court', label: 'Court', ph: 'e.g., Supreme Court, High Court of Bombay' },
    { name: 'jurisdiction', label: 'Jurisdiction Basis', ph: 'Why does this court have jurisdiction?' },
    { name: 'facts', label: 'Statement of Facts', ph: 'Detailed facts supporting petition', multi: true },
    { name: 'grounds', label: 'Grounds for Petition', ph: 'Legal grounds on which petition is filed' },
    { name: 'relief', label: 'Prayer / Relief Sought', ph: 'Specific order sought from court' },
  ],
  MEMORANDUM: [
    { name: 'to', label: 'To (Recipient)', ph: 'Name and designation of recipient' },
    { name: 'from', label: 'From (Sender)', ph: 'Your name and designation' },
    { name: 'subject', label: 'Subject', ph: 'Subject of the memorandum' },
    { name: 'background', label: 'Background / Facts', ph: 'Background information', multi: true },
    { name: 'legalQuestion', label: 'Legal Question', ph: 'The specific legal question to analyze' },
    { name: 'applicableLaws', label: 'Applicable Laws', ph: 'Relevant acts, sections, rules' },
    { name: 'conclusion', label: 'Desired Conclusion', ph: 'What advice or conclusion is needed?' },
  ],
}

export default function NewDraftPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [formData, setFormData] = useState({})
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: selectedType, templateData: formData }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed.'); return }
      router.push(`/drafts/${data.id}`)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setGenerating(false) }
  }

  const fields = selectedType ? FIELDS[selectedType] || [] : []
  const selectedDoc = DOCUMENT_TYPES.find(t => t.value === selectedType)

  const inputStyle = { width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#F0F0F0', fontSize: 14, outline: 'none', resize: 'vertical' }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>Generate New Document</h1>
        <p style={{ color: '#5A5A5A', fontSize: 15 }}>AI-powered legal document generation</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {['Select Type', 'Fill Details', 'Generate'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step > i+1 ? '#4CAF50' : step === i+1 ? '#D4A017' : '#1C1C1C', color: step > i+1 ? '#fff' : step === i+1 ? '#0D0D0D' : '#3A3A3A', border: step === i+1 ? 'none' : '1px solid #2A2A2A' }}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: step === i+1 ? '#D0D0D0' : '#4A4A4A' }}>{label}</span>
            {i < 2 && <span style={{ color: '#2A2A2A', marginLeft: 8 }}>──</span>}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <p style={{ color: '#6A6A6A', marginBottom: 20, fontSize: 15 }}>Choose the type of legal document:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {DOCUMENT_TYPES.map(type => (
              <button key={type.value} onClick={() => { setSelectedType(type.value); setFormData({}); setStep(2) }}
                style={{ background: '#141414', border: '2px solid #2A2A2A', borderRadius: 16, padding: 24, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4A017'; e.currentTarget.style.boxShadow = '0 0 20px rgba(212,160,23,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: 36, marginBottom: 14 }}>{type.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#D0D0D0', marginBottom: 8 }}>{type.label}</div>
                <div style={{ fontSize: 12, color: '#5A5A5A', lineHeight: 1.5 }}>{type.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && selectedType && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 32 }}>{selectedDoc?.icon}</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0' }}>{selectedDoc?.label}</h2>
              <p style={{ fontSize: 13, color: '#5A5A5A' }}>Fill in the details to generate your document</p>
            </div>
            <button onClick={() => { setStep(1); setSelectedType(null) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#5A5A5A', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>← Change type</button>
          </div>

          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28 }}>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

            {fields.map(field => (
              <div key={field.name} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6A6A6A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                {field.multi ? (
                  <textarea value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})} placeholder={field.ph} rows={4} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#D4A017'}
                    onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                  />
                ) : (
                  <input type="text" value={formData[field.name] || ''} onChange={e => setFormData({...formData, [field.name]: e.target.value})} placeholder={field.ph} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#D4A017'}
                    onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, color: '#6A6A6A', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Back</button>
              <button onClick={handleGenerate} disabled={generating}
                style={{ flex: 1, padding: '13px', background: generating ? '#1C1C1C' : 'linear-gradient(135deg, #D4A017, #B8860B)', color: generating ? '#5A5A5A' : '#0D0D0D', borderRadius: 10, fontSize: 15, fontWeight: 700, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', boxShadow: generating ? 'none' : '0 0 20px rgba(212,160,23,0.3)' }}
              >
                {generating ? '⚙ Generating with AI...' : '🤖 Generate with AI'}
              </button>
            </div>

            {generating && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.1)', borderRadius: 10, fontSize: 13, color: '#D4A017', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span> Generating via Llama 3.3 70B on Groq... Usually takes 10–25 seconds.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
