// ─────────────────────────────────────────────────────────────────
//  POST /api/extract
//  Extracts structured case details from a pasted/uploaded document
//  Used by the "Upload" intake method on the new-draft page
// ─────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body?.rawText || !body?.documentType)
      return NextResponse.json({ error: 'rawText and documentType are required.' }, { status: 400 })

    const { extractDocumentDetails } = await import('@/lib/groq')
    const extracted = await extractDocumentDetails(body.documentType, body.rawText)

    return NextResponse.json({ extracted }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/extract]', err)
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 500 })
  }
}
