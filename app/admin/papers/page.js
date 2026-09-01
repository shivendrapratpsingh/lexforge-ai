import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { COMPANY, hasAddress, hasEmail } from '@/lib/company'
import { SELLER } from '@/lib/invoicing'

// ─────────────────────────────────────────────────────────────────
//  The folder you walk into a college with.
//
//  Each paper here answers a question somebody at the college is going
//  to ask, and the point of gathering them on one screen is that you
//  find out what is missing here — at a desk — rather than in a
//  meeting.
//
//  The readiness list is not decoration. Every row is a detail that
//  prints on one of these documents, and a declaration signed with a
//  blank where the PAN should be is a declaration that gets sent back.
// ─────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export default async function Papers() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const checks = [
    { label: 'Registered address',   ok: hasAddress(),                 env: 'SELLER_ADDRESS', why: 'Heads every document. Razorpay also requires it.' },
    { label: 'Contact email',        ok: hasEmail(),                   env: 'SELLER_EMAIL',   why: 'Printed on the letterhead and the policy pages.' },
    { label: 'Udyam number',         ok: Boolean(COMPANY.udyam),       env: 'SELLER_UDYAM',   why: 'Clause 1 of the GST declaration cites it.' },
    { label: 'PAN',                  ok: Boolean(COMPANY.pan),         env: 'SELLER_PAN',     why: 'Asked for wherever TDS is deducted.' },
    { label: 'Bank account',         ok: Boolean(SELLER.bankAccount || SELLER.upi), env: 'SELLER_BANK_ACCOUNT / SELLER_UPI', why: 'Without it the invoice prints no way to pay it.' },
    { label: 'Bank IFSC',            ok: Boolean(SELLER.bankIfsc),     env: 'SELLER_BANK_IFSC', why: 'Needed alongside the account number.' },
    { label: 'Named grievance officer', ok: Boolean(COMPANY.grievanceName), env: 'GRIEVANCE_OFFICER_NAME', why: 'The DPDP undertaking names a person; without one it falls back to the support address.' },
  ]
  const missing = checks.filter(c => !c.ok)

  const papers = [
    {
      href: '/admin/papers/rate-card',
      title: 'Rate card',
      asked: 'Every college, in the first meeting.',
      does: 'The schedule of fees on your letterhead — individual and institutional, monthly and annual — read from the same place the checkout and the invoice read, so the three can never quote different prices.',
      tip: 'Add ?seats=400&to=Name of College and it works the total for that college.',
    },
    {
      href: '/admin/papers/gst-declaration',
      title: 'GST non-registration declaration',
      asked: 'The accounts department, when the invoice shows no tax.',
      does: 'States on your letterhead that you are below the ₹20 lakh services threshold, that you hold no GSTIN, and that no input credit arises. Undertakes to register and switch to tax invoices if you cross it.',
      tip: 'Add ?to=Name of College to address it to one college.',
      blocked: !COMPANY.gstin ? null : 'A GSTIN is set, so this declaration no longer applies.',
    },
    {
      href: '/admin/papers/dpdp',
      title: 'Data protection undertaking',
      asked: 'Whoever signs off on handing you a spreadsheet of student names.',
      does: 'Sets out that the college is the Data Fiduciary and you are only its processor: what you hold, who else touches it, that it goes to the United States, that a co-ordinator cannot read a student’s document, breach notice in 72 hours, deletion in 30 days.',
      tip: 'Add ?to=Name of College. The sub-processor table renders from the same list as the public Privacy Policy.',
    },
    {
      href: '/admin/papers/letterhead',
      title: 'Blank letterhead',
      asked: 'Anything the other two do not cover.',
      does: 'An empty sheet with your identity, registrations and contact details at the top and a signature block at the bottom.',
      tip: '?lines=20 rules it for writing by hand · ?subject=… &to=… fills the heading.',
    },
  ]

  const CARD = { background: '#141414', border: '1px solid #2A2A2A', borderRadius: 12, padding: '18px 20px' }

  // This route sits outside the (dashboard) group — like the agreement
  // and the invoice — so it owns its own background rather than
  // inheriting the app chrome.
  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', color: '#F0F0F0' }}>
     <div style={{ maxWidth: 900, margin: '0 auto', padding: '34px 20px 70px', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
      <a href="/admin" style={{ fontSize: 13, color: '#6A6A6A', textDecoration: 'none' }}>← Admin</a>
      <div style={{ margin: '24px 0 22px' }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>ADMIN</div>
        <h1 style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 4 }}>Papers</h1>
        <div style={{ fontSize: 13, color: '#6A6A6A', marginTop: 4, lineHeight: 1.6, maxWidth: 640 }}>
          The documents a college asks for that are not the agreement and not the
          invoice. Each prints on your letterhead. Save as PDF from the print dialog.
        </div>
      </div>

      {/* ── What is missing ─────────────────────────────────── */}
      <div style={{ ...CARD, marginBottom: 22, borderColor: missing.length ? '#4A3010' : '#1E3A28' }}>
        <div style={{ fontSize: 11, letterSpacing: '2px', fontWeight: 700, color: missing.length ? '#D4A017' : '#5FCC8D', textTransform: 'uppercase' }}>
          {missing.length ? `${missing.length} detail${missing.length > 1 ? 's' : ''} still missing` : 'Every detail is set'}
        </div>
        <div style={{ fontSize: 13, color: '#9A958C', marginTop: 8, lineHeight: 1.7 }}>
          {missing.length
            ? 'These print on the documents below. Set them in Vercel → Settings → Environment Variables, then redeploy.'
            : 'The papers below will print complete.'}
        </div>
        {missing.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {missing.map(c => (
              <div key={c.env} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: '#FF8A80', flex: 'none', fontSize: 13 }}>●</span>
                <div>
                  <div style={{ fontSize: 13.5, color: '#E8E4DC', fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: '#7A756E', marginTop: 2 }}>
                    <code style={{ color: '#D4A017' }}>{c.env}</code> — {c.why}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── The papers ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gap: 14 }}>
        {papers.map(p => (
          <div key={p.href} style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: '#F0F0F0' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#D4A017', marginTop: 5 }}>
                  Who asks for it: <span style={{ color: '#9A958C' }}>{p.asked}</span>
                </div>
                <div style={{ fontSize: 13, color: '#9A958C', marginTop: 9, lineHeight: 1.75 }}>{p.does}</div>
                <div style={{ fontSize: 11.5, color: '#6A6560', marginTop: 9 }}>{p.tip}</div>
                {p.blocked && (
                  <div style={{ fontSize: 12, color: '#FF8A80', marginTop: 9 }}>{p.blocked}</div>
                )}
              </div>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 'none', textDecoration: 'none', fontSize: 13, fontWeight: 700,
                  color: '#0D0D0D', background: 'linear-gradient(135deg,#D4A017,#B8860B)',
                  padding: '9px 16px', borderRadius: 9,
                }}
              >
                Open →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#6A6560', lineHeight: 1.7 }}>
        The agreement and the invoice live with each college, under{' '}
        <a href="/admin" style={{ color: '#8A8A8A' }}>Admin → Institutions</a>.
      </div>
     </div>
    </div>
  )
}
