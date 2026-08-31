import { notFound } from 'next/navigation'
import { Letterhead } from '@/components/Letterhead'
import { GstDeclarationBody, DpdpBody } from '@/components/papers'
import AgreementDocument from '@/components/AgreementDocument'

// ─────────────────────────────────────────────────────────────────
//  Look at a paper without an admin session.  DEVELOPMENT ONLY.
//
//  The real pages sit behind an admin check, which is right for them
//  and awkward when the question is "does this document sit properly
//  on the page" — a layout question that needs eyes, not a login.
//
//  Hard-disabled outside `next dev`, exactly like /api/dev/demo-login:
//  in production this route 404s unconditionally, so it can never
//  become a way to read the papers without being an admin.
//
//    /dev/papers/gst-declaration
//    /dev/papers/dpdp
//    /dev/papers/letterhead
//    /dev/papers/agreement        (paid licence)
//    /dev/papers/agreement-trial  (the one-month trial)
//
//  ?sample=1 fills in specimen seller details, so the layout can be
//  judged with every field present before the real values are set.
// ─────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export default async function DevPaper({ params, searchParams }) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { doc } = await params
  const sp = await searchParams
  const to = (sp?.to || '').trim() || 'Specimen Law College'

  // Obviously-fake stand-ins, so the header can be judged with every
  // registration number present. Never real values, and never reachable
  // in production.
  const company = sp?.sample ? {
    legalName: 'A. N. Proprietor',
    address: ['Specimen address, line one', 'Specimen city 000000'].join('\n'),
    email: 'support@example.invalid',
    phone: '+91 00000 00000',
    udyam: 'UDYAM-XX-00-0000000',
    pan: 'AAAAA0000A',
  } : undefined

  if (doc === 'agreement' || doc === 'agreement-trial') {
    // A stand-in college, so both variants of the clauses can be read.
    const now = Date.now()
    const trial = doc === 'agreement-trial'
    return (
      <AgreementDocument inst={{
        name: to,
        slug: 'specimen-law-college',
        contactName: 'The Principal',
        contactEmail: 'principal@example.invalid',
        plan: trial ? 'pilot' : 'paid',
        seats: 120,
        startsAt: new Date(now),
        endsAt: new Date(now + (trial ? 30 : 365) * 86400000),
        _count: { members: 120 },
      }} />
    )
  }

  if (doc === 'gst-declaration') {
    return (
      <Letterhead
        company={company}
        kicker="Declaration"
        title="Declaration regarding Goods and Services Tax registration"
        to={to}
      >
        <GstDeclarationBody company={company} />
      </Letterhead>
    )
  }

  if (doc === 'dpdp') {
    return (
      <Letterhead company={company} kicker="Undertaking" title="Data protection undertaking" to={to}>
        <DpdpBody to={to} company={company} />
      </Letterhead>
    )
  }

  if (doc === 'letterhead') {
    return (
      <Letterhead company={company}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} style={{ borderBottom: '1px solid #D8D8D8', height: 30 }} />
        ))}
      </Letterhead>
    )
  }

  notFound()
}
