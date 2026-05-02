import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatDate, DOCUMENT_TYPES } from '@/lib/utils'

async function getDashboardData(userId) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const now = new Date()
    const [drafts, total, finalized, clientCount, upcomingDates] = await Promise.all([
      prisma.draft.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
      prisma.draft.count({ where: { userId } }),
      prisma.draft.count({ where: { userId, status: 'finalized' } }),
      prisma.client.count({ where: { userId } }).catch(() => 0),
      prisma.courtDate.findMany({
        where: { userId, completed: false, date: { gte: now } },
        orderBy: { date: 'asc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
          draft:  { select: { id: true, title: true } },
        },
      }).catch(() => []),
    ])
    return { drafts, total, finalized, clientCount, upcomingDates, error: null }
  } catch (err) {
    console.error('[Dashboard] DB error:', err)
    return { drafts: [], total: 0, finalized: 0, clientCount: 0, upcomingDates: [], error: 'Database not connected. Run: npx prisma db push' }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const t       = await getTranslations('dashboard')
  const tNav    = await getTranslations('nav')
  const locale  = await getLocale()

  const { drafts, total, finalized, clientCount, upcomingDates, error } = await getDashboardData(session.user.id)
  const firstName = session.user?.name?.split(' ')[0] || t('defaultName')

  const stats = [
    { label: t('stats.totalDocuments'), value: total,       icon: '📄', color: '#D4A017' },
    { label: t('stats.finalized'),      value: finalized,    icon: '✅', color: '#4CAF50' },
    { label: t('stats.clients'),        value: clientCount,  icon: '👤', color: '#8B5CF6', href: '/clients' },
    { label: t('stats.docTypes'),       value: DOCUMENT_TYPES.length, icon: '⚖️', color: '#2196F3' },
  ]

  // Use Hindi-friendly date formatting when locale=hi
  const dateLocale = locale === 'hi' ? 'hi-IN' : 'en-IN'

  return (
    <div>
      <style>{`.draft-row:hover { background: #1C1C1C !important; }`}</style>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>
          {t('greeting', { name: firstName })}
        </h1>
        <p style={{ color: '#5A5A5A', fontSize: 15 }}>{t('subtitle')}</p>
      </div>

      {/* DB error banner */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, color: '#EF4444', fontSize: 14 }}>
          {t('dbError', { error })}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          s.href ? (
            <Link key={s.label} href={s.href} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20, textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#5A5A5A', marginTop: 6 }}>{s.label}</div>
            </Link>
          ) : (
            <div key={s.label} style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#5A5A5A', marginTop: 6 }}>{s.label}</div>
            </div>
          )
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Recent Documents */}
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F0F0F0' }}>{t('recentDocuments')}</h2>
            <Link href="/drafts" style={{ fontSize: 13, color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>{t('viewAll')}</Link>
          </div>

          {drafts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <p style={{ color: '#5A5A5A', marginBottom: 16 }}>{t('noDocuments')}</p>
              <Link href="/new-draft" style={{ background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                {t('createFirst')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {drafts.map(draft => {
                const dt = DOCUMENT_TYPES.find(t => t.value === draft.documentType)
                return (
                  <Link key={draft.id} href={`/drafts/${draft.id}`}
                    className="draft-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', borderRadius: 10, textDecoration: 'none' }}
                  >
                    <div style={{ fontSize: 22, width: 40, height: 40, background: '#1C1C1C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {dt?.icon || '📄'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#D0D0D0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.title}</div>
                      <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>{dt?.label} · {formatDate(draft.updatedAt)}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600, flexShrink: 0, background: draft.status === 'finalized' ? 'rgba(76,175,80,0.1)' : 'rgba(212,160,23,0.1)', color: draft.status === 'finalized' ? '#4CAF50' : '#D4A017' }}>
                      {draft.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions + Upcoming Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0', marginBottom: 14 }}>{t('quickActions')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/new-draft" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'linear-gradient(135deg, #D4A017, #B8860B)', borderRadius: 10, textDecoration: 'none', color: '#0D0D0D', fontWeight: 700, fontSize: 14 }}>
                <span>✦</span> {tNav('generateDocument')}
              </Link>
              <Link href="/clients" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, textDecoration: 'none', color: '#A0A0A0', fontSize: 14 }}>
                <span style={{ color: '#8B5CF6' }}>👤</span> {t('manageClients')}
              </Link>
              <Link href="/court-dates" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, textDecoration: 'none', color: '#A0A0A0', fontSize: 14 }}>
                <span style={{ color: '#60A5FA' }}>📅</span> {tNav('courtDates')}
              </Link>
              <Link href="/tools" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, textDecoration: 'none', color: '#A0A0A0', fontSize: 14 }}>
                <span style={{ color: '#F97316' }}>⚒️</span> {tNav('legalTools')}
              </Link>
              <Link href="/research" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, textDecoration: 'none', color: '#A0A0A0', fontSize: 14 }}>
                <span style={{ color: '#D4A017' }}>◎</span> {t('researchCaseLaws')}
              </Link>
              <Link href="/drafts" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, textDecoration: 'none', color: '#A0A0A0', fontSize: 14 }}>
                <span style={{ color: '#D4A017' }}>◉</span> {t('viewAllDocuments')}
              </Link>
            </div>
          </div>

          {/* Upcoming Court Dates widget */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>{t('upcomingDates')}</h3>
              <Link href="/court-dates" style={{ fontSize: 12, color: '#D4A017', textDecoration: 'none', fontWeight: 600 }}>{t('viewAll')}</Link>
            </div>
            {upcomingDates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#3A3A3A', fontSize: 13 }}>
                {t('noUpcomingDates')}{' '}
                <Link href="/court-dates" style={{ color: '#D4A017', textDecoration: 'none' }}>{t('addOne')}</Link>
              </div>
            ) : (
              upcomingDates.map(d => {
                const diff = Math.round((new Date(d.date) - new Date()) / 86400000)
                const typeColors = { hearing: '#60A5FA', compliance: '#F97316', filing: '#8B5CF6', order: '#D4A017', deadline: '#F87171' }
                const color = typeColors[d.type] || '#5A5A5A'
                return (
                  <Link key={d.id} href="/court-dates"
                    style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid #1A1A1A', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#C0C0C0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                        <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 2 }}>
                          {new Date(d.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' })}
                          {d.client && <span style={{ color: '#8B5CF6', marginLeft: 6 }}>· {d.client.name}</span>}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: `${color}1A`, color }}>
                          {diff === 0 ? t('today') : diff === 1 ? t('tomorrow') : `${diff}d`}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1A1200, #141414)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#D4A017', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('documentTypes')}</h3>
            {DOCUMENT_TYPES.map(t => (
              <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#7A7A7A' }}>
                <span>{t.icon}</span> {t.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
