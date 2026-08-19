import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatDate, DOCUMENT_TYPES } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import DailyBriefWidget from '@/components/DailyBriefWidget'
import WidgetWall from '@/components/WidgetWall'
import RelevantCaseFinder from '@/components/RelevantCaseFinder'
import { lineForDay, studyPromptForDay } from '@/lib/daily-lines'

async function getDashboardData(userId) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const [drafts, total, finalized, clientCount, upcomingDates, draftsThisMonth] = await Promise.all([
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
      prisma.draft.count({ where: { userId, createdAt: { gte: startOfMonth } } }).catch(() => 0),
    ])
    return { drafts, total, finalized, clientCount, upcomingDates, draftsThisMonth, error: null }
  } catch (err) {
    console.error('[Dashboard] DB error:', err)
    return { drafts: [], total: 0, finalized: 0, clientCount: 0, upcomingDates: [], draftsThisMonth: 0, error: 'Database not connected. Run: npx prisma db push' }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const t       = await getTranslations('dashboard')
  const tNav    = await getTranslations('nav')
  const locale  = await getLocale()

  const { drafts, total, finalized, clientCount, upcomingDates, draftsThisMonth, error } = await getDashboardData(session.user.id)
  const firstName = session.user?.name?.split(' ')[0] || t('defaultName')

  // Drives the quota line in the daily-brief preview (Pro has no cap).
  const { hasProAccess, getFreeDocsLimit } = await import('@/lib/admin')
  const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)
  const freeLimit = isPro ? null : await getFreeDocsLimit().catch(() => null)

  // The widget wall. Resolved on the server so the line, the study
  // prompt and the 8 AM notification all agree on what today is.
  const todaysLine = lineForDay()
  const nextHearing = upcomingDates.find(d => new Date(d.date) >= new Date()) || null

  // No "document types" tile: it counted a constant (always 20), which is
  // not a statistic, and it is the same clutter the Document Types list was.
  const stats = [
    { label: t('stats.totalDocuments'), value: total,       icon: '📄', color: '#D4A017' },
    { label: t('stats.finalized'),      value: finalized,    icon: '✅', color: '#4CAF50' },
    { label: t('stats.clients'),        value: clientCount,  icon: '👤', color: '#8B5CF6', href: '/clients' },
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

      {/* Describe a matter, get the authorities. First on the page
          because it is the thing a lawyer opens the app to do. */}
      <RelevantCaseFinder isPro={isPro} />

      {/* Widget wall — the Aurora tiles. Everything that matters at 8 AM,
          above the fold, before the reporting numbers. */}
      <WidgetWall
        line={todaysLine}
        nextHearing={nextHearing ? { title: nextHearing.title, date: nextHearing.date } : null}
        inProgress={Math.max(0, total - finalized)}
        draftsLeft={isPro || !freeLimit ? null : Math.max(0, freeLimit - draftsThisMonth)}
        freeLimit={freeLimit}
        studyPrompt={studyPromptForDay()}
        clientCount={clientCount}
      />

      {/* Stats — fixed: was a hard-coded 4-col grid with no breakpoints */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
        {/* ── The two research surfaces, given the main column so every
             user meets them on the page they land on after signing in.
             Free users are pointed at /upgrade rather than hidden from
             the feature, so they can see what they are missing. ── */}
        <div className="flex flex-col gap-5">
          <Link href={isPro ? '/case-law' : '/upgrade'} className="no-underline">
            <Card interactive className="block p-5 sm:p-6 bg-gradient-to-br from-[#141008] to-surface border-gold/20">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-card bg-gold/10 border border-gold/25 flex items-center justify-center text-2xl shrink-0">
                  ⚖️
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-[17px] font-bold text-ink">Case Law &amp; Status</h2>
                    {!isPro && <Badge tone="warning" className="shrink-0">PRO</Badge>}
                  </div>
                  <p className="text-[13.5px] text-ink-muted leading-relaxed mt-1.5">
                    Search judgments from the Supreme Court, every High Court and the
                    tribunals. Enter a CNR number to pull a live case — parties, stage
                    and the next hearing date — and it stays tracked from then on.
                  </p>
                  <div className="flex gap-4 flex-wrap mt-3">
                    <span className="text-[11.5px] text-ink-faint">◆ Judgment search</span>
                    <span className="text-[11.5px] text-ink-faint">◆ Case by CNR</span>
                    <span className="text-[11.5px] text-ink-faint">◆ New Acts daily</span>
                  </div>
                  <div className="text-[13px] text-gold font-semibold mt-3.5">
                    {isPro ? 'Open case law →' : 'Upgrade to unlock →'}
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={isPro ? '/research' : '/upgrade'} className="no-underline">
            <Card interactive className="block p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-card bg-surface-2 border border-border flex items-center justify-center text-2xl shrink-0">
                  ◎
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-[17px] font-bold text-ink">{t('researchCaseLaws')}</h2>
                    {!isPro && <Badge tone="warning" className="shrink-0">PRO</Badge>}
                  </div>
                  <p className="text-[13.5px] text-ink-muted leading-relaxed mt-1.5">
                    Ask a question in plain language and get the provisions, the leading
                    authorities and the reasoning that applies — with the exact Act and
                    section, ready to cite.
                  </p>
                  <div className="text-[13px] text-gold font-semibold mt-3.5">
                    {isPro ? 'Start researching →' : 'Upgrade to unlock →'}
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          {/* For students. Free, deliberately — a moot team has no budget,
              and a memorial is the hardest thing they have to write. */}
          <Link href="/future-lawyer/moot" className="no-underline">
            <Card interactive className="block p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-card bg-surface-2 border border-border flex items-center justify-center text-2xl shrink-0">
                  🎓
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-[17px] font-bold text-ink">Moot Court Memorial Builder</h2>
                    <Badge tone="success" className="shrink-0">FREE</Badge>
                  </div>
                  <p className="text-[13.5px] text-ink-muted leading-relaxed mt-1.5">
                    Paste the moot proposition, pick your side, and get a full
                    memorial outline — jurisdiction, facts, issues, arguments and
                    prayer. Generate the Petitioner and Respondent versions from
                    the same problem.
                  </p>
                  <div className="flex gap-4 flex-wrap mt-3">
                    <span className="text-[11.5px] text-ink-faint">◆ For law students</span>
                    <span className="text-[11.5px] text-ink-faint">◆ Both sides</span>
                    <span className="text-[11.5px] text-ink-faint">◆ Court-format structure</span>
                  </div>
                  <div className="text-[13px] text-gold font-semibold mt-3.5">
                    Build a memorial →
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Sidebar */}
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

          {/* Recent Documents — moved into the sidebar so the main column
              belongs to the research surfaces. */}
          <Card className="p-5">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-sm font-bold text-ink">{t('recentDocuments')}</h3>
              <Link href="/drafts" className="text-xs text-gold no-underline font-semibold">{t('viewAll')}</Link>
            </div>

            {drafts.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2.5">📄</div>
                <p className="text-ink-faint text-[13px] mb-3.5">{t('noDocuments')}</p>
                <Link href="/new-draft">
                  <Button variant="primary" className="text-[13px]">{t('createFirst')}</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {drafts.map(draft => {
                  const dt = DOCUMENT_TYPES.find(t => t.value === draft.documentType)
                  return (
                    <Link key={draft.id} href={`/drafts/${draft.id}`}
                      className="flex items-center gap-2.5 px-2 py-2.5 rounded-btn no-underline hover:bg-surface-2 transition-colors"
                    >
                      <div className="size-8 bg-surface-2 rounded-btn flex items-center justify-center shrink-0 text-base">
                        {dt?.icon || '📄'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-ink truncate">{draft.title}</div>
                        <div className="text-[11px] text-ink-faint mt-0.5 truncate">{formatDate(draft.updatedAt)}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Upcoming court dates — only once there are some. An empty
              "no dates yet" card is dead weight on every login for
              anyone who does not use the feature. */}
          {upcomingDates.length > 0 && (
            <Card className="p-5">
              <div className="flex justify-between items-center mb-3.5">
                <h3 className="text-sm font-bold text-ink">{t('upcomingDates')}</h3>
                <Link href="/court-dates" className="text-xs text-gold no-underline font-semibold">{t('viewAll')}</Link>
              </div>
              {upcomingDates.map(d => {
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
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
