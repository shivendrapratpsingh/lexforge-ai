// GET /api/admin/usage — what everything costs, and who costs the most.
//
// The number this exists to produce is `perActiveUserRupees`. Until you
// know what one active user costs per month, any price is a guess, and a
// price set below cost loses money on every single user.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { usageSummary, topSpenders } from '@/lib/usage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const days = Math.min(365, Math.max(1, Number(searchParams.get('days') || 30)))
    const institutionId = searchParams.get('institutionId') || null

    const [summary, spenders] = await Promise.all([
      usageSummary({ days, institutionId }),
      topSpenders({ days, limit: 10, institutionId }),
    ])

    return NextResponse.json({ ...summary, topSpenders: spenders })
  } catch (err) {
    console.error('[admin/usage]', err)
    return NextResponse.json({ error: 'Could not read usage.' }, { status: 500 })
  }
}
