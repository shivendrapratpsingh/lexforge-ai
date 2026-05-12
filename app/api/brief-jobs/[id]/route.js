// ─────────────────────────────────────────────────────────────────
//  GET /api/brief-jobs/[id]
//  Poll the status of a queued brief.  Returns enough state for the
//  client to render a progress bar and, when finished, the brief.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req, { params }) {
  const session = await auth().catch(() => null)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { prisma } = await import('@/lib/prisma')
  const job = await prisma.briefJob.findUnique({
    where: { id },
    select: {
      id: true, userId: true,
      state: true,
      totalWindows: true, doneWindows: true,
      brief: true, error: true,
      createdAt: true, updatedAt: true,
    },
  })
  if (!job) return NextResponse.json({ error: 'job not found' }, { status: 404 })
  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const progress = job.totalWindows > 0 ? job.doneWindows / job.totalWindows : 0
  return NextResponse.json({
    jobId:        job.id,
    state:        job.state,
    totalWindows: job.totalWindows,
    doneWindows:  job.doneWindows,
    progress,
    brief:        job.state === 'done' ? job.brief : '',
    error:        job.error || null,
    createdAt:    job.createdAt,
    updatedAt:    job.updatedAt,
  })
}
