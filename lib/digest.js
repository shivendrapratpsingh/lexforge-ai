import { formatDayMonth } from './dates.js'
import { emailShell, h1, p as para, facts, note, button } from './email-theme.js'
// ─────────────────────────────────────────────────────────────────
//  The daily "is it actually working" email.
//
//  This exists because of two outages that lasted months and nobody
//  noticed. Groq retired both Llama models and every AI call started
//  failing; India Code moved and the Act harvest silently found nothing.
//  Neither crashed the app. Neither produced an error anyone saw. Both
//  were eventually discovered by looking, not by being told.
//
//  So the thing to report is not "the server is up" — a health check
//  covers that. It is whether the work actually happened: did anyone
//  sign up, did drafts get generated, did upstream calls succeed, did
//  yesterday's sync run. A quiet day and a broken day look identical on
//  a dashboard and completely different in this email.
//
//  Sent to the admin only. Deliberately small enough to read on a phone
//  without scrolling.
// ─────────────────────────────────────────────────────────────────

const pct = (ok, total) => (total ? Math.round((ok / total) * 100) : 100)
const inr = (paise) => '₹' + (Math.round(paise) / 100).toLocaleString('en-IN')

export async function buildDailyDigest({ hours = 24 } = {}) {
  const { prisma } = await import('./prisma.js')
  const since = new Date(Date.now() - hours * 3600000)

  const [
    newUsers, totalUsers, newDrafts, totalDrafts,
    calls, failures, activeUsers, payments, lastSync, pilots,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count(),
    prisma.draft.count({ where: { createdAt: { gte: since } } }),
    prisma.draft.count(),
    prisma.apiUsage.aggregate({ where: { createdAt: { gte: since } }, _sum: { costPaise: true }, _count: true }),
    prisma.apiUsage.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: since }, ok: false },
      _count: true,
    }),
    prisma.apiUsage.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      distinct: ['userId'], select: { userId: true },
    }),
    prisma.subscription.findMany({
      where: { lastPaymentAt: { gte: since } },
      select: { plan: true, amountPaise: true },
    }),
    prisma.legalSyncRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.pilotRequest.count({ where: { status: 'new' } }),
  ])

  const totalCalls = calls._count || 0
  const failed = failures.reduce((n, f) => n + f._count, 0)
  const revenue = payments.reduce((n, p) => n + p.amountPaise, 0)

  // What is worth waking up for. Everything else is just numbers.
  const alerts = []

  if (totalCalls > 0 && pct(totalCalls - failed, totalCalls) < 90) {
    alerts.push(`${failed} of ${totalCalls} upstream calls failed — ${failures.map(f => `${f.provider} ${f._count}`).join(', ')}`)
  }
  // The signal that would have caught the Groq outage on day one: people
  // are here and trying, and nothing is coming back.
  if (newDrafts === 0 && activeUsers.length > 0) {
    alerts.push(`${activeUsers.length} people were active but not one document was generated — check the AI provider`)
  }
  if (lastSync && !lastSync.ok) {
    alerts.push(`Legal data sync failed: ${lastSync.error || 'no reason recorded'}`)
  }
  if (lastSync && Date.now() - new Date(lastSync.startedAt).getTime() > 48 * 3600000) {
    alerts.push('Legal data sync has not run in over 48 hours')
  }
  if (pilots > 0) {
    alerts.push(`${pilots} college${pilots === 1 ? '' : 's'} waiting for a reply`)
  }

  return {
    since,
    users: { new: newUsers, total: totalUsers, active: activeUsers.length },
    drafts: { new: newDrafts, total: totalDrafts },
    upstream: {
      calls: totalCalls,
      failed,
      successRate: pct(totalCalls - failed, totalCalls),
      byProvider: failures.map(f => ({ provider: f.provider, failed: f._count })),
      costPaise: calls._sum.costPaise || 0,
    },
    money: { payments: payments.length, revenuePaise: revenue },
    sync: lastSync ? { job: lastSync.job, ok: lastSync.ok, at: lastSync.startedAt, added: lastSync.added, error: lastSync.error } : null,
    pilotsWaiting: pilots,
    alerts,
  }
}

export function digestEmail(d) {
  const day = formatDayMonth()
  const quiet = d.alerts.length === 0
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexforge-ai.vercel.app'

  // The subject line is the whole email on most days — it should be
  // readable from a notification without opening anything.
  const subject = quiet
    ? `LexForge ${day} — ${d.users.new} new, ${d.drafts.new} documents, all well`
    : `LexForge ${day} — ${d.alerts.length} thing${d.alerts.length === 1 ? '' : 's'} need${d.alerts.length === 1 ? 's' : ''} a look`

  const lines = [
    quiet ? 'Nothing needs your attention today.' : 'NEEDS A LOOK:',
    ...d.alerts.map(a => `  • ${a}`),
    '',
    `Users      ${d.users.new} new, ${d.users.active} active, ${d.users.total} total`,
    `Documents  ${d.drafts.new} today, ${d.drafts.total} all time`,
    `Upstream   ${d.upstream.calls} calls, ${d.upstream.successRate}% succeeded, ${inr(d.upstream.costPaise)} spent`,
    `Money      ${d.money.payments} payment${d.money.payments === 1 ? '' : 's'}, ${inr(d.money.revenuePaise)}`,
    d.sync ? `Sync       ${d.sync.job} ${d.sync.ok ? 'ok' : 'FAILED'}, ${d.sync.added} added` : 'Sync       has never run',
    '',
    '— LexForge AI',
  ]

  const body = [
    h1(quiet ? `All well · ${day}` : `${d.alerts.length} thing${d.alerts.length === 1 ? '' : 's'} to look at`),

    quiet
      ? para('Nothing needs your attention today. The numbers below are for the record.')
      : d.alerts.map(a => note(`<b>•</b> ${a}`, 'warn')).join(''),

    facts([
      ['New users', d.users.new],
      ['Active today', d.users.active],
      ['Documents today', d.drafts.new, true],
      ['Upstream success', `${d.upstream.successRate}% of ${d.upstream.calls}`],
      ['Spent today', inr(d.upstream.costPaise)],
      ['Payments', `${d.money.payments} · ${inr(d.money.revenuePaise)}`],
      ['Legal sync', d.sync ? `${d.sync.ok ? 'ok' : 'FAILED'} · ${d.sync.added} added` : 'never run'],
    ]),

    para(`${d.users.total} users and ${d.drafts.total} documents in total.`, { muted: true }),
    button('Open the admin console', `${site}/admin`),
  ].join('')

  return {
    subject,
    html: emailShell({
      title: `Daily report · ${day}`,
      preheader: quiet
        ? `${d.users.new} new users, ${d.drafts.new} documents, nothing broken.`
        : d.alerts[0],
      site,
      body,
    }),
    text: lines.join('\n'),
  }
}
