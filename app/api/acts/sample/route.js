// POST /api/acts/sample — a worked example document under a given Act.
//
// The point is to show someone what a real filing under this statute
// actually looks like before they type a word of their own facts. So the
// example is built from obviously fictional particulars, and says so on
// its face: nobody should be able to mistake it for a document about
// their own matter, or file it by accident.
//
// Pro-only, because it is a full generation call.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DOCUMENT_TYPES } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Deliberately generic placeholder facts. Real-looking enough that the
// structure of the document reads properly, fictional enough that the
// result is plainly a specimen.
const SPECIMEN = {
  name: 'A B C (specimen party)',
  other: 'X Y Z (specimen opposite party)',
  addr: '[ADDRESS — SPECIMEN]',
  city: '[CITY — SPECIMEN]',
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hasProAccess } = await import('@/lib/admin')
    const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)
    if (!isPro) {
      return NextResponse.json({ error: 'Sample documents are a Pro feature.', upgrade: '/upgrade' }, { status: 402 })
    }

    const { documentType, actName, court } = await req.json().catch(() => ({}))
    const known = DOCUMENT_TYPES.find(d => d.value === documentType)
    if (!known) {
      return NextResponse.json({ error: 'Unknown document type.' }, { status: 400 })
    }

    const details = [
      `Court: ${court || 'DISTRICT_COURT'}`,
      'Language: english',
      '',
      'THIS IS A SPECIMEN. Use clearly fictional particulars throughout.',
      actName ? `Governing statute: ${actName}` : null,
      `Applicant / Sender: ${SPECIMEN.name}`,
      `Opposite party / Recipient: ${SPECIMEN.other}`,
      `Address: ${SPECIMEN.addr}, ${SPECIMEN.city}`,
      'Facts: A representative set of facts of the kind this document is normally used for,',
      'stated briefly, so the structure and the statutory references can be seen clearly.',
      'Relief sought: The relief this document type normally asks for.',
    ].filter(Boolean).join('\n')

    const { generateLegalDocument } = await import('@/lib/groq')
    const content = await generateLegalDocument(
      documentType, details, court || null, 'english', { isPro: true, targetWords: 700, userId: session.user.id, operation: 'sample' }
    )

    const text = typeof content === 'string' ? content : (content?.content || content?.text || '')
    if (!text) {
      return NextResponse.json({ error: 'Could not produce a sample just now. Try again in a moment.' }, { status: 502 })
    }

    return NextResponse.json({
      documentType,
      label: known.label,
      actName: actName || null,
      sample: text,
      notice: 'This is a specimen built from fictional particulars, to show the structure. It is not about your matter and must not be filed.',
    })
  } catch (err) {
    if (err?.code === 'GROQ_RATE_LIMIT') {
      return NextResponse.json({ error: 'The AI is rate-limited right now. Try again in a minute.' }, { status: 429 })
    }
    console.error('[acts/sample]', err)
    return NextResponse.json({ error: 'Could not produce a sample document.' }, { status: 500 })
  }
}
