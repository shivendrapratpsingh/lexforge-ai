// POST /api/pilot-request — a college asks to be set up.
//
// Public and unauthenticated on purpose: the person filling this in is a
// Moot Court Society convenor or a Principal who has never seen the app
// and has no reason to create an account first. Asking them to sign up
// before they can ask a question loses most of them.
//
// Unauthenticated means it will be found by bots, so it is rate-limited
// by IP and quietly drops anything that fills the honeypot field.

import { NextResponse } from 'next/server'
import { ADMIN_EMAIL } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory, per-instance. Not a real limiter — serverless spreads
// requests across instances — but enough to stop one script filling the
// table, and it costs nothing.
const seen = new Map()
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5

function rateLimited(ip) {
  const now = Date.now()
  const hits = (seen.get(ip) || []).filter(t => now - t < WINDOW_MS)
  hits.push(now)
  seen.set(ip, hits)
  if (seen.size > 5000) seen.clear() // never grow without bound
  return hits.length > MAX_PER_WINDOW
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

export async function POST(req) {
  try {
    const b = await req.json().catch(() => ({}))

    // Honeypot: a field hidden from people and irresistible to bots.
    // Answered with the same success a person gets, so a bot learns
    // nothing from the response.
    if (b.website) return NextResponse.json({ ok: true })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const college = String(b.college || '').trim()
    const contactName = String(b.contactName || '').trim()
    const contactEmail = String(b.contactEmail || '').trim().toLowerCase()

    if (college.length < 3) return NextResponse.json({ error: 'Which college?' }, { status: 400 })
    if (contactName.length < 2) return NextResponse.json({ error: 'Please give a name we can reply to.' }, { status: 400 })
    if (!EMAIL_RE.test(contactEmail)) return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma')
    const request = await prisma.pilotRequest.create({
      data: {
        college: college.slice(0, 200),
        contactName: contactName.slice(0, 120),
        contactEmail: contactEmail.slice(0, 200),
        phone: String(b.phone || '').trim().slice(0, 30) || null,
        role: ['student', 'faculty', 'society', 'other'].includes(b.role) ? b.role : null,
        students: String(b.students || '').trim().slice(0, 60) || null,
        message: String(b.message || '').trim().slice(0, 2000) || null,
      },
    })

    // The record is what matters; the email is a convenience. A mail
    // failure must not tell a Principal their request was lost when it
    // is sitting safely in the database.
    try {
      const { sendMail } = await import('@/lib/mail')
      await sendMail({
        to: ADMIN_EMAIL,
        subject: `LexForge pilot request — ${college}`,
        text: [
          `${contactName} <${contactEmail}> asked about a pilot.`,
          '',
          `College:  ${college}`,
          `Role:     ${request.role || '—'}`,
          `Students: ${request.students || '—'}`,
          `Phone:    ${request.phone || '—'}`,
          '',
          request.message || '(no message)',
        ].join('\n'),
      })
    } catch (e) {
      console.error('[pilot-request] mail failed:', e?.message)
    }

    console.log(`[pilot-request] ${college} via ${contactEmail}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pilot-request]', err)
    return NextResponse.json({ error: 'Could not send that. Please email us directly.' }, { status: 500 })
  }
}
