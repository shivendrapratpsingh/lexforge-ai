import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const issue = new URL(req.url).searchParams.get('issue')
    if (!issue?.trim()) return NextResponse.json({ error: 'Issue text is required.' }, { status: 400 })

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('REPLACE'))
      return NextResponse.json({ error: 'GROQ_API_KEY not configured in .env.local' }, { status: 503 })

    const { analyzeLegalIssue } = await import('@/lib/groq')
    const analysis = await analyzeLegalIssue(issue)
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('[GET /api/legal/analyze]', err)
    return NextResponse.json({ error: err?.message || 'Analysis failed.' }, { status: 500 })
  }
}
