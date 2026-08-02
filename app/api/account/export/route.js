// GET /api/account/export — download everything on this account as JSON.
//
// Standard in any app that holds work people depend on, and it is the
// thing that makes "delete my account" a fair offer rather than a
// threat: nobody should have to choose between leaving and keeping
// their drafts. It also answers data-portability requests without
// anyone having to run a query by hand.
//
// Deliberately excluded: the password hash and the security answer
// hash. Neither is useful to the account holder, and both would be
// useful to anyone who intercepted the file.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const userId = session.user.id

    const [user, drafts, clients, courtDates] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, tier: true, createdAt: true, securityQuestion: true },
      }),
      prisma.draft.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.client.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }).catch(() => []),
      prisma.courtDate.findMany({ where: { userId }, orderBy: { date: 'asc' } }).catch(() => []),
    ])

    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: 'LexForge AI',
      note: 'Your password and security answer are deliberately not included.',
      account: user,
      counts: { drafts: drafts.length, clients: clients.length, courtDates: courtDates.length },
      drafts,
      clients,
      courtDates,
    }

    const stamp = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="lexforge-export-${stamp}.json"`,
        // Never let a proxy or the browser keep a copy of someone's
        // entire case file lying around.
        'Cache-Control': 'no-store, private',
      },
    })
  } catch (err) {
    console.error('[GET /api/account/export]', err)
    return NextResponse.json({ error: 'Could not build your export.' }, { status: 500 })
  }
}
