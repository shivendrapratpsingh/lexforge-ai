import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { Letterhead } from '@/components/Letterhead'
import { RateCardBody } from '@/components/papers'

// ─────────────────────────────────────────────────────────────────
//  The price, in writing.
//
//  "What does it cost?" is asked in every first meeting, and answering
//  it in the body of an email invites a negotiation about which number
//  was meant. A rate card answers it once, on letterhead, with the
//  same figures the invoice will carry — because they are read from
//  lib/billing.js, the same place the checkout reads.
//
//  ?seats=400 works the total for a specific college, so the figure in
//  the meeting is the figure on the page.
// ─────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams
  const to = (sp?.to || '').trim()
  return { title: 'LexForge Rate Card' + (to ? ' - ' + to : '') }
}

export default async function RateCard({ searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const sp = await searchParams
  const to = (sp?.to || '').trim()
  const seats = Math.max(0, Math.min(5000, Number(sp?.seats) || 0))

  return (
    <Letterhead
      kicker="Schedule of fees"
      title="Rate card"
      to={to || 'Whomsoever it may concern'}
    >
      <RateCardBody seats={seats} to={to} />
    </Letterhead>
  )
}
