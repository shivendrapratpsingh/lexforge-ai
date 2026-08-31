import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { Letterhead } from '@/components/Letterhead'
import { DpdpBody } from '@/components/papers'

// ─────────────────────────────────────────────────────────────────
//  The paper a college's compliance officer asks for.
//
//  When a college hands over a spreadsheet of student names and email
//  addresses, the college stays legally answerable for that data — it
//  is the Data Fiduciary under the DPDP Act 2023 and we are its
//  processor. A fiduciary that hands personal data to a processor
//  without a written arrangement has a problem of its own, so this is
//  the first thing a competent compliance officer asks for.
//
//  Every factual claim in the body is checked against the code by
//  scripts/verify-papers.mjs, and the sub-processor table renders from
//  lib/processors.js — the same list the public Privacy Policy prints.
//  A college that reads both and finds them disagreeing has found a
//  reason not to sign.
// ─────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams
  const to = (sp?.to || '').trim()
  return { title: 'LexForge Data Protection Undertaking' + (to ? ' - ' + to : '') }
}

export default async function DpdpUndertaking({ searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const sp = await searchParams
  const to = (sp?.to || '').trim()

  return (
    <Letterhead
      kicker="Undertaking"
      title="Data protection undertaking"
      to={to || 'Whomsoever it may concern'}
    >
      <DpdpBody to={to} />
    </Letterhead>
  )
}
