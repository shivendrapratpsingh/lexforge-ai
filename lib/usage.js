// ─────────────────────────────────────────────────────────────────
//  lib/usage.js — what a user actually costs.
//
//  Every upstream call that is billed gets a row. Without this there is
//  no honest answer to "what should we charge", only a guess — and the
//  wrong price is worse than no price.
//
//  Two rules that shape the design:
//
//  1. Recording usage must NEVER break the feature. A failed insert is
//     swallowed and logged. Somebody's bail application does not fail
//     because the accounting did.
//  2. Cost is in PAISE, as an integer. Money in floating point is a bug
//     waiting to happen. The rates below are estimates, so the value is
//     approximate — but the unit is exact, and the two are different
//     things.
//
//  RATES ARE ESTIMATES and are the one thing here that will go stale.
//  They live in one block, are overridable by environment variable
//  without a deploy, and each is labelled with where it came from.
// ─────────────────────────────────────────────────────────────────

// Paise. Override in the environment as providers change their pricing —
// e.g. RATE_KANOON_SEARCH=250 for ₹2.50 a search.
const num = (v, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export const RATES = {
  // Groq bills per token. Public per-million-token pricing on the
  // gpt-oss models works out well under a paisa for our prompt sizes,
  // so this is deliberately rounded UP: it is better for a cost model
  // to overstate than to flatter.
  groqPerKToken: num(process.env.RATE_GROQ_PER_KTOKEN, 3),   // 3 paise / 1K tokens

  // Indian Kanoon's published per-request pricing, taken from
  // api.indiankanoon.org/pricing. These were guesses before — ₹2.00 and
  // ₹3.00 — which overstated the real cost by four and fifteen times and
  // made Kanoon look like the thing to design around. It is not.
  //
  //   Search             ₹0.50
  //   Original Document  ₹0.50
  //   Document           ₹0.20   ← what fetchJudgment calls (/doc/)
  //   Document Fragment  ₹0.05
  //   Document Metainfo  ₹0.02
  //
  // Pre-paid: the balance is spent down, so a runaway loop stops when
  // the credit does rather than arriving as a bill.
  kanoonSearch:  num(process.env.RATE_KANOON_SEARCH, 50),    // ₹0.50
  kanoonDoc:     num(process.env.RATE_KANOON_DOC, 20),       // ₹0.20 — /doc/, not /origdoc/

  // eCourts reseller, per lookup. ₹200 free credit on signup.
  ecourtsCase:   num(process.env.RATE_ECOURTS_CASE, 200),    // ₹2.00

  // India Code is the Government's own repository — free, but recorded
  // anyway so the sync's volume is visible.
  indiacode:     0,

  // What the platform costs every month whether one person uses it or a
  // thousand do: Vercel Pro (about ₹1,750) and the domain amortised.
  // Neon's free tier, Razorpay and Gmail add nothing.
  //
  // Without this the panel reported a cost per user that ignored every
  // bill actually being paid — a per-user figure of ₹0.01 against ₹1,850
  // of infrastructure is not a costing, it is an invitation to price
  // below cost.
  fixedMonthlyPaise: num(process.env.RATE_FIXED_MONTHLY_PAISE, 185000),
}

/** Estimated cost in paise for one call. */
export function estimateCost({ provider, operation, tokens = 0, calls = 1 }) {
  switch (provider) {
    case 'groq':
      return Math.ceil((tokens / 1000) * RATES.groqPerKToken)
    case 'indiankanoon':
      return calls * (operation === 'doc' ? RATES.kanoonDoc : RATES.kanoonSearch)
    case 'ecourts':
      return calls * RATES.ecourtsCase
    default:
      return 0
  }
}

/**
 * Record one billed call. Fire and forget — never awaited by a feature,
 * never allowed to throw into one.
 *
 * @param provider  groq | indiankanoon | ecourts | indiacode
 * @param operation draft | search | analyze | fulltext | case | sample | moot | sync
 */
export async function recordUsage({
  userId = null, institutionId = null,
  provider, operation, calls = 1, tokens = null, ok = true,
}) {
  try {
    const { prisma } = await import('./prisma.js')

    // If the caller knew the user but not their institution, resolve it
    // once here so every row can be rolled up by college later.
    let instId = institutionId
    if (!instId && userId) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { institutionId: true },
      })
      instId = u?.institutionId ?? null
    }

    await prisma.apiUsage.create({
      data: {
        userId, institutionId: instId,
        provider, operation, calls,
        tokens: tokens ?? null,
        costPaise: estimateCost({ provider, operation, tokens: tokens || 0, calls }),
        ok,
      },
    })
  } catch (e) {
    // Deliberately swallowed. See rule 1 at the top of this file.
    console.error('[usage] could not record:', provider, operation, e?.message)
  }
}

/** Convenience: never blocks the caller, never rejects. */
export function trackUsage(args) {
  recordUsage(args).catch(() => {})
}

const rupees = (paise) => Math.round(paise) / 100

// Subscribers needed to cover the fixed monthly bill, at each price on
// offer. Razorpay keeps about 2% plus 18% GST on its own fee, so the
// money that actually arrives is a little under the sticker price.
function breakEvenAt(perUserVariablePaise) {
  const NET_OF_FEES = 0.9764
  const out = {}
  for (const price of [336, 420, 630, 840]) {   // yearly-equivalent, list, and two what-ifs
    const margin = price * 100 * NET_OF_FEES - perUserVariablePaise
    out[price] = margin > 0 ? Math.ceil(RATES.fixedMonthlyPaise / margin) : null
  }
  return out
}

/**
 * What everything has cost over a window, and per user — the figure a
 * price has to clear.
 */
export async function usageSummary({ days = 30, institutionId = null } = {}) {
  const { prisma } = await import('./prisma.js')
  const since = new Date(Date.now() - days * 86400000)
  const where = { createdAt: { gte: since }, ...(institutionId ? { institutionId } : {}) }

  const [rows, byProvider, activeUsers] = await Promise.all([
    prisma.apiUsage.aggregate({ where, _sum: { costPaise: true, calls: true, tokens: true }, _count: true }),
    prisma.apiUsage.groupBy({
      by: ['provider'], where,
      _sum: { costPaise: true, calls: true }, _count: true,
    }),
    prisma.apiUsage.findMany({
      where: { ...where, userId: { not: null } },
      distinct: ['userId'], select: { userId: true },
    }),
  ])

  const totalPaise = rows._sum.costPaise || 0
  const users = activeUsers.length

  return {
    days,
    totalRupees: rupees(totalPaise),
    calls: rows._sum.calls || 0,
    tokens: rows._sum.tokens || 0,
    activeUsers: users,
    // What the upstream calls alone cost per active user.
    perActiveUserRupees: users ? rupees(totalPaise / users) : 0,

    // The number a price actually has to clear: upstream cost per user
    // PLUS that user's share of the monthly infrastructure bill. With
    // few users the fixed share dominates completely, which is the real
    // shape of this business and worth seeing rather than hiding.
    fixedMonthlyRupees: rupees(RATES.fixedMonthlyPaise),
    trueCostPerUserRupees: users
      ? rupees((totalPaise * (30 / days)) / users + RATES.fixedMonthlyPaise / users)
      : rupees(RATES.fixedMonthlyPaise),

    // How many subscribers at each price cover everything. A plain value,
    // not a function — this crosses an API boundary as JSON, and a
    // function would simply vanish on the way.
    breakEven: breakEvenAt(users ? (totalPaise * (30 / days)) / users : 0),
    byProvider: byProvider
      .map(p => ({
        provider: p.provider,
        rupees: rupees(p._sum.costPaise || 0),
        calls: p._sum.calls || 0,
        rows: p._count,
      }))
      .sort((a, b) => b.rupees - a.rupees),
    rates: RATES,
  }
}

/** The heaviest users — who would cost you most on an unlimited plan. */
export async function topSpenders({ days = 30, limit = 10, institutionId = null } = {}) {
  const { prisma } = await import('./prisma.js')
  const since = new Date(Date.now() - days * 86400000)

  const grouped = await prisma.apiUsage.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: since }, userId: { not: null },
      ...(institutionId ? { institutionId } : {}),
    },
    _sum: { costPaise: true, calls: true },
    orderBy: { _sum: { costPaise: 'desc' } },
    take: limit,
  })
  if (!grouped.length) return []

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map(g => g.userId) } },
    select: { id: true, email: true, name: true, institution: { select: { name: true } } },
  })
  const byId = new Map(users.map(u => [u.id, u]))

  return grouped.map(g => ({
    userId: g.userId,
    email: byId.get(g.userId)?.email ?? '(deleted)',
    name: byId.get(g.userId)?.name ?? null,
    institution: byId.get(g.userId)?.institution?.name ?? null,
    rupees: rupees(g._sum.costPaise || 0),
    calls: g._sum.calls || 0,
  }))
}
