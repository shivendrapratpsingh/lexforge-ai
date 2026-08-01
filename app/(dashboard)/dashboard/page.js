import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatDate, DOCUMENT_TYPES } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import DailyBriefWidget from '@/components/DailyBriefWidget'

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
        where: {
          userId,
          completed: false,
          // Show upcoming + recently overdue (last 30 days) so follow-up alerts appear
          date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { date: 'asc' },
        take: 10,
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

  // Drives the quota line in the daily-brief preview (Pro has no cap).
  const { hasProAccess } = await import('@/lib/admin')
  const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-ink mb-1.5">{t('greeting', { name: firstName })}</h1>
          <p className="text-ink-faint text-[15px]">{t('subtitle')}</p>
        </div>
        <Link href="/new-draft" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto">✦ {tNav('generateDocument')}</Button>
        </Link>
      </div>

      {/* DB error banner */}
      {error && (
        <div className="bg-danger-bg border border-danger/20 rounded-xl px-4 py-3.5 mb-6 text-danger text-sm">
          {t('dbError', { error })}
        </div>
      )}

      {/* Stats — fixed: was a hard-coded 4-col grid with no breakpoints */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => {
          const content = (
            <>
              <div className="text-2xl sm:text-[28px] mb-3">{s.icon}</div>
              <div className="text-2xl sm:text-3xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[13px] text-ink-faint mt-1.5">{s.label}</div>
            </>
          )
          return s.href ? (
            <Link key={s.label} href={s.href}>
              <Card interactive className="block">{content}</Card>
            </Link>
          ) : (
            <Card key={s.label}>{content}</Card>
          )
        })}
      </div>

      {/* ── Action Required banner (overdue follow-ups) ─────────────── */}
      {(() => {
        const overdueItems = upcomingDates.filter(d => d.type === 'deadline' && new Date(d.date) < new Date())
        if (overdueItems.length === 0) return null
        return (
          <div className="bg-danger-bg border border-danger/25 rounded-2xl px-4 sm:px-5 py-3.5 mb-6">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-base">🚨</span>
              <span className="text-[13px] font-bold text-danger">Action Required — {overdueItems.length} overdue follow-up{overdueItems.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {overdueItems.map(d => (
                <Link key={d.id} href={d.draft ? `/drafts/${d.draft.id}` : '/court-dates'}
                  className="flex justify-between items-center gap-3 px-3 py-2 bg-danger/[0.05] border border-danger/10 rounded-lg no-underline">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-danger">{d.title}</div>
                    {d.draft && <div className="text-[11px] text-ink-faint mt-0.5 truncate">{d.draft.title?.substring(0, 50)}</div>}
                  </div>
                  <span className="text-[11px] text-danger font-semibold shrink-0">View →</span>
                </Link>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Recent Documents */}
        <Card className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[17px] font-bold text-ink">{t('recentDocuments')}</h2>
            <Link href="/drafts" className="text-[13px] text-gold no-underline font-semibold">{t('viewAll')}</Link>
          </div>

          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📄</div>
              <p className="text-ink-faint mb-4">{t('noDocuments')}</p>
              <Link href="/new-draft">
                <Button variant="primary">{t('createFirst')}</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {drafts.map(draft => {
                const dt = DOCUMENT_TYPES.find(t => t.value === draft.documentType)
                return (
                  <Link key={draft.id} href={`/drafts/${draft.id}`}
                    className="flex items-center gap-3.5 px-3 py-3.5 rounded-btn no-underline hover:bg-surface-2 transition-colors"
                  >
                    <div className="size-10 bg-surface-2 rounded-btn flex items-center justify-center shrink-0 text-xl">
                      {dt?.icon || '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">{draft.title}</div>
                      <div className="text-xs text-ink-faint mt-0.5">{dt?.label} · {formatDate(draft.updatedAt)}</div>
                    </div>
                    <Badge tone={draft.status === 'finalized' ? 'success' : 'warning'} className="shrink-0">{draft.status}</Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        {/* Quick Actions + Upcoming Dates */}
        <div className="flex flex-col gap-4">
          {/* Daily brief: notification control + a preview of tomorrow's push */}
          <DailyBriefWidget
            nextHearing={upcomingDates[0] ? { title: upcomingDates[0].title, date: upcomingDates[0].date } : null}
            isPro={isPro}
          />

          <Card className="p-5">
            <h3 className="text-[15px] font-bold text-ink mb-3.5">{t('quickActions')}</h3>
            <div className="flex flex-col gap-2">
              <Link href="/new-draft" className="flex items-center gap-2.5 px-3.5 py-3 bg-gradient-to-br from-gold to-gold-dim rounded-btn no-underline text-base font-bold text-sm">
                <span>✦</span> {tNav('generateDocument')}
              </Link>
              {[
                ['/clients', '👤', t('manageClients'), '#8B5CF6'],
                ['/court-dates', '📅', tNav('courtDates'), '#60A5FA'],
                ['/tools', '⚒️', tNav('legalTools'), '#F97316'],
                ['/research', '◎', t('researchCaseLaws'), '#D4A017'],
                ['/drafts', '◉', t('viewAllDocuments'), '#D4A017'],
              ].map(([href, icon, label, color]) => (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3.5 py-3 bg-surface-2 border border-border rounded-btn no-underline text-ink-muted text-sm">
                  <span style={{ color }}>{icon}</span> {label}
                </Link>
              ))}
            </div>
          </Card>

          {/* Upcoming Court Dates widget */}
          <Card className="p-5">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-sm font-bold text-ink">{t('upcomingDates')}</h3>
              <Link href="/court-dates" className="text-xs text-gold no-underline font-semibold">{t('viewAll')}</Link>
            </div>
            {upcomingDates.length === 0 ? (
              <div className="text-center py-4 text-ink-faint text-[13px]">
                {t('noUpcomingDates')}{' '}
                <Link href="/court-dates" className="text-gold no-underline">{t('addOne')}</Link>
              </div>
            ) : (
              upcomingDates.map(d => {
                const diff = Math.round((new Date(d.date) - new Date()) / 86400000)
                const typeColors = { hearing: '#60A5FA', compliance: '#F97316', filing: '#8B5CF6', order: '#D4A017', deadline: '#F87171' }
                const color = typeColors[d.type] || '#5A5A5A'
                return (
                  <Link key={d.id} href="/court-dates" className="block py-2.5 border-b border-[#1A1A1A] no-underline last:border-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-ink-muted truncate">{d.title}</div>
                        <div className="text-[11px] text-ink-faint mt-0.5">
                          {new Date(d.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' })}
                          {d.client && <span className="text-[#8B5CF6] ml-1.5">· {d.client.name}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${color}1A`, color }}>
                        {diff === 0 ? t('today') : diff === 1 ? t('tomorrow') : `${diff}d`}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1200] to-surface border-gold/15 p-5">
            <h3 className="text-xs font-bold text-gold mb-3 uppercase tracking-wide">{t('documentTypes')}</h3>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {DOCUMENT_TYPES.map(dtype => (
                <div key={dtype.value} className="flex items-center gap-2 text-[13px] text-ink-muted">
                  <span>{dtype.icon}</span> {dtype.label}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
