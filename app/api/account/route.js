// GET    /api/account  — everything the account page needs
// PATCH  /api/account  — update the profile (name)
// DELETE /api/account  — delete the account and everything in it
//
// Deletion is irreversible and cascades to drafts, clients and court
// dates, so it asks for the password AND the email typed out. Two
// confirmations for an action with no undo is the standard, and cheap.

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prisma } = await import('@/lib/prisma')
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [user, drafts, draftsThisMonth, clients, courtDates] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true, name: true, email: true, tier: true,
          securityQuestion: true, securityAnswerHash: true,
          passwordChangedAt: true, createdAt: true,
        },
      }),
      prisma.draft.count({ where: { userId: session.user.id } }),
      prisma.draft.count({ where: { userId: session.user.id, createdAt: { gte: startOfMonth } } }),
      prisma.client.count({ where: { userId: session.user.id } }).catch(() => 0),
      prisma.courtDate.count({ where: { userId: session.user.id } }).catch(() => 0),
    ])

    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    const { hasProAccess, getFreeDocsLimit } = await import('@/lib/admin')
    const isPro = await hasProAccess(user.email, user.tier).catch(() => false)
    const freeLimit = isPro ? null : await getFreeDocsLimit().catch(() => null)

    return NextResponse.json({
      account: {
        name: user.name,
        email: user.email,
        tier: user.tier,
        isPro,
        memberSince: user.createdAt,
        passwordChangedAt: user.passwordChangedAt,
        // The question is safe to return; the answer never is, so only
        // its presence is reported.
        securityQuestion: user.securityQuestion,
        hasSecurityAnswer: !!user.securityAnswerHash,
      },
      usage: { drafts, draftsThisMonth, clients, courtDates, freeLimit },
    })
  } catch (err) {
    console.error('[GET /api/account]', err)
    return NextResponse.json({ error: 'Could not load your account.' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : null

    if (name === null) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    if (name.length < 1) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
    if (name.length > 120) return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { name: true },
    })

    return NextResponse.json({ ok: true, name: user.name })
  } catch (err) {
    console.error('[PATCH /api/account]', err)
    return NextResponse.json({ error: 'Could not save your details.' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { password, confirmEmail } = body

    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true },
    })
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    if (String(confirmEmail || '').toLowerCase().trim() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'The email you typed does not match this account.' }, { status: 400 })
    }
    if (!password || !user.password || !(await bcrypt.compare(String(password), user.password))) {
      return NextResponse.json({ error: 'That password is not correct.' }, { status: 400 })
    }

    // The admin account is the only way back into the console, so it
    // cannot delete itself out of existence from here.
    const { ADMIN_EMAIL } = await import('@/lib/admin')
    if (user.email.toLowerCase() === String(ADMIN_EMAIL).toLowerCase()) {
      return NextResponse.json({ error: 'The administrator account cannot be deleted from here.' }, { status: 400 })
    }

    // Cascades to drafts, clients and court dates via the schema.
    await prisma.user.delete({ where: { id: user.id } })
    console.log(`[account] Deleted account ${user.email}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/account]', err)
    return NextResponse.json({ error: 'Could not delete the account.' }, { status: 500 })
  }
}
