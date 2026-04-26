import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { formatDate, DOCUMENT_TYPES, ALL_COURTS } from '@/lib/utils'
import { DraftActions } from '@/components/DraftActions'
import PositivePointsPanel from '@/components/PositivePointsPanel'
import DraftControls from '@/components/DraftControls'
import VersionHistoryPanel from '@/components/VersionHistoryPanel'
import ParagraphEditor from '@/components/ParagraphEditor'
import CloneButton from '@/components/CloneButton'
import Link from 'next/link'

export default async function DraftPage({ params }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  let draft = null
  try {
    const { prisma } = await import('@/lib/prisma')
    draft = await prisma.draft.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: { select: { id: true, name: true, fatherName: true, phone: true } },
        parentDraft: { select: { id: true, title: true } },
        amendments: { select: { id: true, title: true, createdAt: true, amendmentNote: true }, orderBy: { createdAt: 'desc' } },
      },
    })
  } catch (err) {
    console.error('[DraftPage]', err)
  }

  if (!draft) notFound()

  const dt    = DOCUMENT_TYPES.find(t => t.value === draft.documentType)
  const court = ALL_COURTS.find(c => c.value === draft.court)

  // Build case details string for positive analysis
  const caseDetails = draft.templateData
    ? Object.entries(draft.templateData).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join('\n')
    : draft.content?.substring(0, 1500) || ''

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Link href="/drafts" style={{ color: '#5A5A5A', textDecoration: 'none', fontSize: 13, marginTop: 5, flexShrink: 0, fontWeight: 500 }}>← Back</Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ fontSize: 24 }}>{dt?.icon}</span>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', lineHeight: 1.3 }}>{draft.title}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 13, color: '#5A5A5A' }}>
              <span>{dt?.label}</span>
              {court && <><span>·</span><span>{court.short}</span></>}
              {draft.language && draft.language !== 'english' && <><span>·</span><span style={{ color: '#8B5CF6' }}>{draft.language === 'hindi' ? 'हिन्दी' : 'Bilingual'}</span></>}
              <span>·</span>
              <span>Updated {formatDate(draft.updatedAt)}</span>
              <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: draft.status === 'finalized' ? 'rgba(76,175,80,0.1)' : 'rgba(212,160,23,0.1)', color: draft.status === 'finalized' ? '#4CAF50' : '#D4A017' }}>
                {draft.status}
              </span>
              {/* Amendment badge */}
              {draft.parentDraft && (
                <span style={{ padding: '2px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>
                  Amended from: <Link href={`/drafts/${draft.parentDraft.id}`} style={{ color: '#60A5FA' }}>{draft.parentDraft.title?.substring(0,30)}</Link>
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <CloneButton draftId={draft.id} />
          <DraftActions draft={draft} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
        {/* ── Document Content ── */}
        <div>
          {/* Paragraph Editor (client component) */}
          <ParagraphEditor draftId={draft.id} initialContent={draft.content} />

          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28, marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 18 }}>Document Content</div>
            <div style={{ background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 12, padding: 26, fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 2, color: '#C0C0C0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {draft.content}
            </div>
          </div>

          {/* Version History */}
          <VersionHistoryPanel draftId={draft.id} currentContent={draft.content} />

          {/* Positive Points Panel */}
          <PositivePointsPanel
            draftId={draft.id}
            caseDetails={caseDetails}
            documentType={draft.documentType}
            court={draft.court}
            savedAnalysis={draft.positivePoints}
          />

          {/* Amendment History */}
          {draft.amendments && draft.amendments.length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18, marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Amendment History</div>
              {draft.amendments.map(a => (
                <Link key={a.id} href={`/drafts/${a.id}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 8, textDecoration: 'none', marginBottom: 7, color: '#C0C0C0' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C0C0C0' }}>{a.title}</div>
                    {a.amendmentNote && <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 2 }}>{a.amendmentNote.substring(0, 80)}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: '#5A5A5A', flexShrink: 0 }}>{formatDate(a.createdAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Case Status + Client Link */}
          <DraftControls
            draftId={draft.id}
            initialCaseStatus={draft.caseStatus}
            initialClient={draft.client}
          />

          {/* Details */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Details</div>
            {[
              ['Type',    dt?.label],
              ['Court',   court?.short || '—'],
              ['Status',  draft.status],
              ['Created', formatDate(draft.createdAt)],
              ['Updated', formatDate(draft.updatedAt)],
              ['Words',   draft.content?.split(/\s+/).length || 0],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9, fontSize: 13 }}>
                <span style={{ color: '#5A5A5A' }}>{k}</span>
                <span style={{ color: '#D0D0D0', fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Export */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Export Document</div>
            {['pdf', 'docx', 'txt'].map(fmt => (
              <a key={fmt} href={`/api/export/${draft.id}/${fmt}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 8, textDecoration: 'none', marginBottom: 7, color: '#C0C0C0', fontSize: 13, fontWeight: 500 }}>
                <span>{fmt === 'pdf' ? '📕' : fmt === 'docx' ? '📘' : '📄'} {fmt.toUpperCase()}</span>
                <span style={{ color: '#D4A017', fontSize: 12 }}>↓</span>
              </a>
            ))}
          </div>

          {/* Case Laws */}
          {draft.caseLaws && Array.isArray(draft.caseLaws) && draft.caseLaws.length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Referenced Case Laws</div>
              {draft.caseLaws.map((cl, i) => (
                <div key={i} style={{ background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.1)', borderRadius: 8, padding: 10, marginBottom: 7 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#D4A017' }}>{cl.name || cl}</div>
                  {cl.citation  && <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 3 }}>{cl.citation}</div>}
                  {cl.principle && <div style={{ fontSize: 11, color: '#6A6A6A', marginTop: 3, lineHeight: 1.5 }}>{cl.principle}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Legal Reasoning */}
          {draft.legalReasoning && (
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Legal Basis</div>
              <p style={{ fontSize: 12, color: '#6A6A6A', lineHeight: 1.7 }}>{draft.legalReasoning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
