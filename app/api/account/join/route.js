// POST /api/account/join — a student joins their college with a code.
//
// The third route into an institution. The first two are run by an
// admin: match on email domain, or paste a class list. Neither works
// for a college that issues no student email and whose list nobody has
// — which is most of them. This one needs nothing but a convenor
// reading a code out to a hall.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { joinByCode } from '@/lib/institutions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await req.json().catch(() => ({}))
    if (!code) return NextResponse.json({ error: 'Enter the code your college gave you.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, institutionId: true },
    })
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    const result = await joinByCode(user, code, prisma)
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

    console.log(`[institutions] ${user.email} joined ${result.institution.name} by code`)

    return NextResponse.json({
      ok: true,
      institution: {
        name: result.institution.name,
        plan: result.institution.plan,
        endsAt: result.institution.endsAt,
      },
    })
  } catch (err) {
    console.error('[account/join]', err)
    return NextResponse.json({ error: 'Could not join. Please try again.' }, { status: 500 })
  }
}

// DELETE — leave. Somebody who has graduated should not have to ask an
// admin to be removed, and nothing of theirs is touched by leaving.
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    await prisma.user.update({
      where: { id: session.user.id },
      data: { institutionId: null, batch: null },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/join DELETE]', err)
    return NextResponse.json({ error: 'Could not leave.' }, { status: 500 })
  }
}
