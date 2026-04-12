import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { formatDate, DOCUMENT_TYPES } from '@/lib/utils'
import { DraftActions } from '@/components/DraftActions'
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
    })
  } catch (err) {
    console.error('[DraftPage]', err)
  }

  if (!draft) notFound()

  const dt = DOCUMENT_TYPES.find(t => t.value === draft.documentType)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Link href="/drafts" style={{ color: '#5A5A5A', textDecoration: 'none', fontSize: 13, marginTop: 6, flexShrink: 0, fontWeight: 500 }}>← Back</Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 26 }}>{dt?.icon}</span>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: '#F0F0F0', lineHeight: 1.3 }}>{draft.title}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#5A5A5A' }}>
              <span>{dt?.label}</span>
              <span>·</span>
              <span>Updated {formatDate(draft.updatedAt)}</span>
              <span style={{ padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: draft.status === 'finalized' ? 'rgba(76,175,80,0.1)' : 'rgba(212,160,23,0.1)', color: draft.status === 'finalized' ? '#4CAF50' : '#D4A017' }}>
                {draft.status}
              </span>
            </div>
          </div>
        </div>
        <DraftActions draft={draft} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Document content */}
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 20 }}>Document Content</div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: 12, padding: 28, fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 2, color: '#C0C0C0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {draft.content}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Details */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Details</div>
            {[
              ['Type', dt?.label],
              ['Status', draft.status],
              ['Created', formatDate(draft.createdAt)],
              ['Updated', formatDate(draft.updatedAt)],
              ['Words', draft.content?.split(/\s+/).length || 0],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: '#5A5A5A' }}>{k}</span>
                <span style={{ color: '#D0D0D0', fontWeight: 500, textTransform: 'capitalize' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Case Laws */}
          {draft.caseLaws && Array.isArray(draft.caseLaws) && draft.caseLaws.length > 0 && (
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Referenced Case Laws</div>
              {draft.caseLaws.map((cl, i) => (
                <div key={i} style={{ background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.1)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#D4A017' }}>{cl.name || cl}</div>
                  {cl.citation && <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 4 }}>{cl.citation}</div>}
                  {cl.principle && <div style={{ fontSize: 12, color: '#6A6A6A', marginTop: 4 }}>{cl.principle}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Legal basis */}
          {draft.legalReasoning && (
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Legal Basis</div>
              <p style={{ fontSize: 13, color: '#6A6A6A', lineHeight: 1.7 }}>{draft.legalReasoning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
