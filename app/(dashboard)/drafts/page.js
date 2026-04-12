import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, DOCUMENT_TYPES } from '@/lib/utils'

export default async function DraftsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  let drafts = []
  let dbError = null

  try {
    const { prisma } = await import('@/lib/prisma')
    drafts = await prisma.draft.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })
  } catch (err) {
    console.error('[Drafts page]', err)
    dbError = 'Could not load documents. Make sure the database is connected.'
  }

  return (
    <div>
      <style>{`.draft-card:hover { border-color: #D4A017 !important; box-shadow: 0 0 20px rgba(212,160,23,0.1) !important; }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>My Documents</h1>
          <p style={{ color: '#5A5A5A', fontSize: 15 }}>{drafts.length} document{drafts.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/new-draft" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '11px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          + New Document
        </Link>
      </div>

      {dbError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, color: '#EF4444', fontSize: 14 }}>
          ⚠️ {dbError}
        </div>
      )}

      {drafts.length === 0 && !dbError ? (
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', marginBottom: 8 }}>No documents yet</h3>
          <p style={{ color: '#5A5A5A', marginBottom: 24 }}>Generate your first AI-powered legal document</p>
          <Link href="/new-draft" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
            Create First Document
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {drafts.map(draft => {
            const dt = DOCUMENT_TYPES.find(t => t.value === draft.documentType)
            return (
              <Link key={draft.id} href={`/drafts/${draft.id}`}
                className="draft-card"
                style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20, textDecoration: 'none', display: 'block', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{dt?.icon || '📄'}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600, background: draft.status === 'finalized' ? 'rgba(76,175,80,0.1)' : 'rgba(212,160,23,0.1)', color: draft.status === 'finalized' ? '#4CAF50' : '#D4A017' }}>
                    {draft.status}
                  </span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#D0D0D0', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {draft.title}
                </h3>
                <p style={{ fontSize: 12, color: '#4A4A4A', marginBottom: 10 }}>{dt?.label}</p>
                <p style={{ fontSize: 13, color: '#4A4A4A', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 14 }}>
                  {draft.content?.substring(0, 120)}...
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
