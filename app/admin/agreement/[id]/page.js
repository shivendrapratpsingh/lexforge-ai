import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { COMPANY, hasAddress, hasEmail } from '@/lib/company'
import { INSTITUTION_SEAT, rupees } from '@/lib/billing'
import { formatDate } from '@/lib/dates'

// The agreement a college signs, printable to PDF.
//
// On white with black text and no app chrome, for the same reason the
// invoice is: this goes to a Principal or a registrar, gets printed,
// and a dark theme prints as a black rectangle.
//
// It is a TEMPLATE. It states positions that are ordinary in a software
// agreement, but it has not been drafted by a lawyer and the page says
// so on its face, because a legal-tech company handing a college an
// agreement that pretends otherwise is exactly the wrong first
// impression.

export const dynamic = 'force-dynamic'

export default async function Agreement({ params }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const { id } = await params
  const { prisma } = await import('@/lib/prisma')
  const inst = await prisma.institution.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  })
  if (!inst) notFound()

  const isTrial = inst.plan === 'pilot'
  const seats = inst.seats > 0 ? inst.seats : inst._count.members
  const perSeatYear = rupees(INSTITUTION_SEAT.yearlyPaise)

  const H = ({ n, children }) => (
    <h2 style={{ fontSize: 13.5, fontWeight: 700, margin: '22px 0 8px', color: '#111' }}>
      {n}. {children}
    </h2>
  )
  const P = ({ children }) => (
    <p style={{ fontSize: 12.5, lineHeight: 1.75, margin: '0 0 9px', color: '#222' }}>{children}</p>
  )
  const LI = ({ children }) => (
    <li style={{ fontSize: 12.5, lineHeight: 1.75, marginBottom: 6, color: '#222' }}>{children}</li>
  )

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: '30px 20px' }}>
      <style>{`@media print { .no-print { display:none !important } @page { margin: 16mm } }`}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'Georgia, "Times New Roman", serif' }}>

        <div className="no-print" style={{ marginBottom: 18, textAlign: 'right' }}>
          <a href="/admin" style={{ fontSize: 12.5, color: '#666', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontSize: 12, color: '#999', marginLeft: 14 }}>
            Print this page, or save as PDF from the print dialog.
          </span>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '3px solid #111', paddingBottom: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#8F6608', fontWeight: 700 }}>
            {isTrial ? 'Trial Agreement' : 'Institutional Licence Agreement'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>LexForge AI</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
            Dated {formatDate()} · Reference LF/{inst.slug.toUpperCase().slice(0, 14)}
          </div>
        </div>

        {/* Parties */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6, fontSize: 12.5 }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', verticalAlign: 'top', paddingRight: 16 }}>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: 5 }}>The Provider</div>
                <div style={{ fontWeight: 700 }}>{COMPANY.legalName}</div>
                {hasAddress()
                  ? <div style={{ whiteSpace: 'pre-line', color: '#333', lineHeight: 1.6 }}>{COMPANY.address}</div>
                  : <div style={{ color: '#333' }}>{COMPANY.city}, {COMPANY.state}, India</div>}
                {hasEmail() && <div style={{ color: '#333' }}>{COMPANY.email}</div>}
                {COMPANY.phone && <div style={{ color: '#333' }}>{COMPANY.phone}</div>}
              </td>
              <td style={{ width: '50%', verticalAlign: 'top' }}>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#777', marginBottom: 5 }}>The Institution</div>
                <div style={{ fontWeight: 700 }}>{inst.name}</div>
                {inst.contactName && <div style={{ color: '#333' }}>Attn: {inst.contactName}</div>}
                {inst.contactEmail && <div style={{ color: '#333' }}>{inst.contactEmail}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Commercial summary */}
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '18px 0 6px', fontSize: 12.5 }}>
          <tbody>
            {[
              ['Service', 'LexForge AI — legal drafting, judgment and Act research, moot memorial tools'],
              ['Plan', isTrial ? 'Free trial' : 'Paid institutional licence'],
              ['Seats', seats > 0 ? `${seats} students` : 'As uploaded by the Institution'],
              ['Fee', isTrial ? 'Nil for the trial period' : `₹${perSeatYear.toLocaleString('en-IN')} per student per year`],
              ['Begins', formatDate(inst.startsAt)],
              ['Ends', inst.endsAt ? formatDate(inst.endsAt) : 'No fixed end date'],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '7px 0', borderBottom: '1px solid #ddd', color: '#666', width: 130 }}>{k}</td>
                <td style={{ padding: '7px 0', borderBottom: '1px solid #ddd', color: '#111', fontWeight: k === 'Fee' || k === 'Ends' ? 700 : 400 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Clauses ───────────────────────────────────────── */}

        <H n={1}>Grant of access</H>
        <P>
          The Provider grants the Institution access to LexForge AI for the students
          the Institution enrols, for the period stated above. Access is for the
          Institution&rsquo;s own students and staff and may not be resold,
          sublicensed or shared with another institution.
        </P>

        <H n={2}>How students are enrolled</H>
        <P>
          The Institution supplies a list of its students as a spreadsheet. An
          account is created for each. A student sets their own password and a
          security question on first sign-in, after which the password supplied by
          the Institution ceases to work.
        </P>
        <ul style={{ paddingLeft: 20, margin: '0 0 9px' }}>
          <LI>An account is for one person and may be signed in on one device at a time.</LI>
          <LI>A student left off a list the Institution later supplies loses access, but keeps their account and everything they have written.</LI>
          <LI>The Institution is responsible for supplying accurate student details and for the list it uploads.</LI>
        </ul>

        {isTrial && (
          <>
            <H n={3}>The trial</H>
            <P>
              The trial is free and carries no obligation. It ends on the date above.
              There is no automatic renewal, no card is held, and nothing is charged
              unless the Institution separately agrees to a paid licence in writing.
            </P>
            <P>
              If the Institution converts to a paid licence, <strong>no student is
              disturbed</strong>: accounts, passwords and documents continue
              unchanged, and any unused days of the trial are added to the paid
              term. If the Institution does not convert, access simply ends and
              every student account reverts to the free plan with all work intact.
            </P>
          </>
        )}

        <H n={isTrial ? 4 : 3}>Fees and payment</H>
        <ul style={{ paddingLeft: 20, margin: '0 0 9px' }}>
          <LI>Fees are as stated above and are invoiced in advance for the term.</LI>
          <LI>Payment is due within 30 days of invoice, by cheque or bank transfer.</LI>
          <LI>Tax deducted at source, where applicable, is the Institution&rsquo;s responsibility to deposit and certify.</LI>
          <LI>Fees already paid for a term are not refundable on early termination, save as set out in clause {isTrial ? 9 : 8}.</LI>
        </ul>

        <H n={isTrial ? 5 : 4}>What LexForge is, and is not</H>
        <P>
          <strong>LexForge is software. It is not a law firm, it does not give legal
          advice, and no advocate&ndash;client relationship arises from its use.</strong>{' '}
          It produces drafts and search results for a qualified person to check.
        </P>
        <ul style={{ paddingLeft: 20, margin: '0 0 9px' }}>
          <LI>Judgments and statutory text are retrieved from third-party and Government sources and reproduced as reported.</LI>
          <LI>Where no authority is found, the output says so rather than supplying one.</LI>
          <LI>Every section number and citation must be verified against the bare Act and the official reporter before any filing or submission.</LI>
          <LI>The Provider gives no warranty as to the outcome of any matter, examination, moot or proceeding.</LI>
        </ul>

        <H n={isTrial ? 6 : 5}>Student data</H>
        <ul style={{ paddingLeft: 20, margin: '0 0 9px' }}>
          <LI>The Institution confirms it may lawfully share its students&rsquo; details for this purpose.</LI>
          <LI>Uploaded lists are read and discarded; the file is not retained.</LI>
          <LI>Documents a student writes are private to that student. Faculty may see that a student is active and how much they have produced, never the contents.</LI>
          <LI>Both parties comply with the Digital Personal Data Protection Act, 2023. The Provider&rsquo;s <em>Privacy Policy</em> at {COMPANY.site}/privacy forms part of this agreement.</LI>
        </ul>

        <H n={isTrial ? 7 : 6}>Availability</H>
        <P>
          The Provider aims to keep the service available but does not warrant
          uninterrupted access. The service depends on third parties — AI providers,
          judgment databases and hosting — any of which may be unavailable. Where
          the service is substantially unavailable for more than 72 consecutive
          hours in a paid term, the term is extended by the time lost.
        </P>

        <H n={isTrial ? 8 : 7}>Limitation of liability</H>
        <P>
          To the extent permitted by law, the Provider&rsquo;s total liability under
          this agreement is limited to the fees paid by the Institution in the twelve
          months preceding the claim. The Provider is not liable for indirect or
          consequential loss, loss of profit or opportunity, or the outcome of any
          proceeding, examination or competition. Nothing here excludes liability
          that cannot lawfully be excluded, including for fraud.
        </P>

        <H n={isTrial ? 9 : 8}>Term and termination</H>
        <ul style={{ paddingLeft: 20, margin: '0 0 9px' }}>
          <LI>Either party may end this agreement on 30 days&rsquo; written notice.</LI>
          <LI>Ending it never deletes a student account or any work in it. Students revert to the free plan and retain everything they have written.</LI>
          <LI>Where the Provider ends the agreement without cause, the unused portion of any fee paid is refunded.</LI>
        </ul>

        <H n={isTrial ? 10 : 9}>Governing law and jurisdiction</H>
        <P>
          This agreement is governed by the laws of India. <strong>Any dispute,
          claim or proceeding arising out of or in connection with this agreement,
          or with the use of LexForge AI, shall be subject to the exclusive
          jurisdiction of the courts at {COMPANY.city}, {COMPANY.state}</strong>, and
          the parties submit to that jurisdiction to the exclusion of any other.
        </P>
        <P>
          Before commencing proceedings, the parties shall first attempt to resolve
          the dispute by discussion, and failing that by a single arbitrator
          appointed by agreement under the Arbitration and Conciliation Act, 1996,
          seated at {COMPANY.city} and conducted in English.
        </P>

        <H n={isTrial ? 11 : 10}>General</H>
        <ul style={{ paddingLeft: 20, margin: '0 0 9px' }}>
          <LI>This agreement, together with the <em>Terms</em> at {COMPANY.site}/terms and the <em>Privacy Policy</em>, is the entire agreement between the parties.</LI>
          <LI>Amendments must be in writing and signed by both parties.</LI>
          <LI>If any clause is unenforceable, the rest continues in force.</LI>
        </ul>

        {/* Signatures */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 40, fontSize: 12 }}>
          <tbody>
            <tr>
              {['For the Provider', 'For the Institution'].map((label, i) => (
                <td key={label} style={{ width: '50%', verticalAlign: 'bottom', paddingRight: i === 0 ? 24 : 0 }}>
                  <div style={{ borderBottom: '1px solid #111', height: 46 }} />
                  <div style={{ marginTop: 6, color: '#555' }}>{label}</div>
                  <div style={{ marginTop: 16, color: '#777', fontSize: 11 }}>Name</div>
                  <div style={{ borderBottom: '1px solid #bbb', height: 20 }} />
                  <div style={{ marginTop: 12, color: '#777', fontSize: 11 }}>Designation &amp; date</div>
                  <div style={{ borderBottom: '1px solid #bbb', height: 20 }} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 34, paddingTop: 12, borderTop: '1px solid #ddd', fontSize: 10.5, color: '#777', lineHeight: 1.7 }}>
          This document is a standard template prepared by {COMPANY.legalName}. It has
          not been settled by counsel. Both parties should take their own advice
          before signing. Questions: {hasEmail() ? COMPANY.email : 'see ' + COMPANY.site + '/contact'}
        </div>
      </div>
    </div>
  )
}
