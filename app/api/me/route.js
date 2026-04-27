// ─────────────────────────────────────────────────────────────────
//  /api/me — minimal session info for client components.
//  Returns the user's effective Pro status (taking the admin
//  proEnforcementEnabled toggle into account) so the UI can decide
//  whether to show Pro badges, upgrade banners, etc.
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin, hasProAccess, getFreeDocsLimit } from '@/lib/admin'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  try {
    const admin = isAdmin(session)
    const pro   = await hasProAccess(session.user.email, session.user.tier)
    const free  = await getFreeDocsLimit()
    return NextResponse.json({
      authenticated: true,
      email:  session.user.email,
      name:   session.user.name || null,
      isAdmin: admin,
      isPro:   pro || admin,
      tier:    admin ? 'admin' : (pro ? 'pro' : 'free'),
      freeDocsLimit: free,
    })
  } catch (err) {
    console.error('[GET /api/me]', err)
    return NextResponse.json({ error: 'Failed to load session info.' }, { status: 500 })
  }
}
