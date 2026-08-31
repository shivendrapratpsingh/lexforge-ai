import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { COMPANY } from '@/lib/company'
import { Letterhead } from '@/components/Letterhead'
import { GstDeclarationBody } from '@/components/papers'

// ─────────────────────────────────────────────────────────────────
//  Why this invoice has no GST on it.
//
//  An invoice with no tax line looks, to an accounts clerk who sees a
//  hundred of them a month, like an invoice with a mistake on it. They
//  do not usually reject it — they park it, and ask a question that
//  takes a week to come back. This is the one page that stops that,
//  and it is the cheapest document in the set to produce.
//
//  Address it to a college with ?to=Name, or print it unaddressed.
//  The text lives in components/papers.js so it can be rendered and
//  checked without an admin session.
// ─────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams
  const to = (sp?.to || '').trim()
  return { title: 'LexForge GST Declaration' + (to ? ' - ' + to : '') }
}

export default async function GstDeclaration({ searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const sp = await searchParams
  const to = (sp?.to || '').trim()

  // If a GSTIN is ever set this document becomes false. Say so on the
  // page rather than letting it be printed and signed.
  if (COMPANY.gstin) {
    return (
      <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: 40, fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: 620, margin: '60px auto', border: '2px solid #B42318', padding: '20px 24px' }}>
          <h1 style={{ fontSize: 18, margin: '0 0 10px', color: '#B42318' }}>This declaration no longer applies.</h1>
          <p style={{ fontSize: 13, lineHeight: 1.8, color: '#333' }}>
            A GSTIN is configured (<strong>{COMPANY.gstin}</strong>), so you are registered
            and this declaration would be untrue. Issue tax invoices instead — the invoice
            page switches to a tax invoice automatically once a GSTIN is set.
          </p>
          <p style={{ fontSize: 12.5, marginTop: 14 }}>
            <a href="/admin/papers" style={{ color: '#8F6608' }}>← Back to papers</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <Letterhead
      kicker="Declaration"
      title="Declaration regarding Goods and Services Tax registration"
      to={to || 'Whomsoever it may concern'}
    >
      <GstDeclarationBody />
    </Letterhead>
  )
}
