// ─────────────────────────────────────────────────────────────────
//  /api/admin/system-config — admin runtime feature flags
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import { getSystemConfig, invalidateSystemConfig } from '@/lib/system-config'

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const config = await getSystemConfig()
    return NextResponse.json({ config })
  } catch (err) {
    console.error('[GET /api/admin/system-config]', err)
    return NextResponse.json({ error: 'Failed to load config.' }, { status: 500 })
  }
}

export async function POST(req) {
  const session = await auth()
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const data = {}
    if (typeof body.proEnforcementEnabled === 'boolean') {
      data.proEnforcementEnabled = body.proEnforcementEnabled
    }
    if (typeof body.freeDocsLimit === 'number' && body.freeDocsLimit >= 0 && body.freeDocsLimit <= 1000) {
      data.freeDocsLimit = Math.floor(body.freeDocsLimit)
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }
    data.updatedBy = session.user.email

    const { prisma } = await import('@/lib/prisma')
    const config = await prisma.systemConfig.upsert({
      where:  { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    })

    invalidateSystemConfig()  // flush in-memory cache so new value takes effect immediately

    return NextResponse.json({
      config: {
        proEnforcementEnabled: !!config.proEnforcementEnabled,
        freeDocsLimit: config.freeDocsLimit,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/system-config]', err)
    return NextResponse.json({
      error: err?.message?.includes('PrismaClient') || err?.message?.includes('does not exist')
        ? 'SystemConfig table not found. Run `npx prisma db push` and restart the dev server.'
        : 'Failed to save config.',
    }, { status: 500 })
  }
}
