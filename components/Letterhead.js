import { COMPANY, hasEmail } from '@/lib/company'
import { formatDate } from '@/lib/dates'
import PrintButton from '@/components/PrintButton'

// ─────────────────────────────────────────────────────────────────
//  The sheet everything official is written on.
//
//  A college's accounts department will not accept a declaration in
//  the body of an email. It wants a document with a name, an address
//  and a registration number at the top, and a signature at the
//  bottom — that is what "on letterhead" means, and it is the whole
//  reason this component exists.
//
//  White with black text and no app chrome, like the invoice and the
//  agreement: this gets printed or saved as PDF from the browser, and
//  the app's dark theme prints as a black rectangle.
//
//  Nothing here is invented. Where a detail is not configured the
//  sheet leaves it out rather than printing a plausible placeholder —
//  a wrong PAN on a signed declaration is worse than a missing one.
// ─────────────────────────────────────────────────────────────────

export function Letterhead({ kicker, title, to, refNo, date, children, signature = true, company }) {
  // `company` overrides the configured identity. Only the dev preview
  // route passes it, so the header can be looked at with every
  // registration number present before the real ones are set.
  const C = company ? { ...COMPANY, ...company } : COMPANY
  const ids = [
    C.udyam && ['Udyam', C.udyam],
    C.pan && ['PAN', C.pan],
    C.gstin && ['GSTIN', C.gstin],
  ].filter(Boolean)

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: '30px 20px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important }
          @page { margin: 16mm }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact }
          .keep { break-inside: avoid; page-break-inside: avoid }
        }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'Georgia, "Times New Roman", serif' }}>

        <div className="no-print" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <a href="/admin/papers" style={{ fontSize: 12.5, color: '#666', textDecoration: 'none' }}>← Papers</a>
          <PrintButton />
        </div>

        {/* ── The letterhead itself ───────────────────────────── */}
        <header style={{ borderBottom: '3px solid #111', paddingBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div>
              <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.4px' }}>{C.name}</div>
              {C.legalName !== C.name && (
                <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
                  Proprietor: {C.legalName}
                </div>
              )}
              {Boolean(C.address) && (
                <div style={{ fontSize: 12, color: '#444', marginTop: 6, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {C.address}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#444', marginTop: 4, lineHeight: 1.6 }}>
                {Boolean(C.email) ? C.email : C.site}
                {C.phone && ` · ${C.phone}`}
              </div>
            </div>

            {ids.length > 0 && (
              <div style={{ textAlign: 'right', flex: 'none', fontSize: 11.5, color: '#444', lineHeight: 1.85 }}>
                {ids.map(([label, value]) => (
                  <div key={label}>
                    <span style={{ color: '#777' }}>{label}</span>{' '}
                    <strong style={{ color: '#111' }}>{value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ── Reference line ──────────────────────────────────── */}
        {(refNo || date !== null) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#555', marginTop: 10 }}>
            <div>{refNo ? <>Ref: <strong style={{ color: '#111' }}>{refNo}</strong></> : <span />}</div>
            <div>Date: <strong style={{ color: '#111' }}>{formatDate(date || new Date())}</strong></div>
          </div>
        )}

        {/* ── Title ───────────────────────────────────────────── */}
        {title && (
          <div style={{ textAlign: 'center', margin: '28px 0 6px' }}>
            {kicker && (
              <div style={{ fontSize: 10.5, letterSpacing: '2px', textTransform: 'uppercase', color: '#8F6608', fontWeight: 700 }}>
                {kicker}
              </div>
            )}
            <h1 style={{ fontSize: 16.5, fontWeight: 700, margin: '7px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </h1>
            <div style={{ width: 90, height: 2, background: '#111', margin: '10px auto 0' }} />
          </div>
        )}

        {/* ── Addressee ───────────────────────────────────────── */}
        {to && (
          <div style={{ fontSize: 12.5, marginTop: 22, lineHeight: 1.7 }}>
            <div style={{ color: '#777', fontSize: 11 }}>To,</div>
            <div style={{ fontWeight: 700 }}>{to}</div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>{children}</div>

        {signature && <SignatureBlock company={C} />}

        <div style={{ marginTop: 30, paddingTop: 12, borderTop: '1px solid #ddd', fontSize: 10.5, color: '#777', lineHeight: 1.7 }}>
          {COMPANY.site.replace(/^https?:\/\//, '')}
          {hasEmail() && ` · ${COMPANY.email}`}
        </div>
      </div>
    </div>
  )
}

/** Signed by a person, in a place, on a date — all three, or a college's file is incomplete. */
export function SignatureBlock({ label = 'For ', company }) {
  const C = company ? { ...COMPANY, ...company } : COMPANY
  return (
    <div className="keep" style={{ marginTop: 44, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 30, fontSize: 11.5, color: '#555' }}>
        <div>
          Place: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 150 }} />
        </div>
        <div>
          Date: <span style={{ display: 'inline-block', borderBottom: '1px solid #999', minWidth: 130 }} />
        </div>
      </div>

      <div style={{ marginTop: 40, width: 280 }}>
        <div style={{ borderBottom: '1px solid #111', height: 44 }} />
        <div style={{ marginTop: 6, fontWeight: 700, fontSize: 12.5 }}>{C.legalName}</div>
        <div style={{ color: '#555', fontSize: 11.5 }}>
          {label}{C.name} — Proprietor
        </div>
      </div>
    </div>
  )
}

/** Shared paragraph and heading styles, so the papers read as one set. */
export const P = ({ children, style }) => (
  <p style={{ fontSize: 12.5, lineHeight: 1.8, margin: '0 0 11px', color: '#222', textAlign: 'justify', ...style }}>
    {children}
  </p>
)

export const H = ({ n, children }) => (
  <h2 style={{ fontSize: 13, fontWeight: 700, margin: '20px 0 8px', color: '#111' }}>
    {n != null ? `${n}. ` : ''}{children}
  </h2>
)

/** Numbered clauses, the way a declaration is actually laid out. */
export const Clause = ({ n, children }) => (
  <div style={{ display: 'flex', gap: 10, margin: '0 0 11px' }}>
    <div style={{ fontSize: 12.5, lineHeight: 1.8, color: '#111', fontWeight: 700, flex: 'none', width: 22 }}>
      {n}.
    </div>
    <div style={{ fontSize: 12.5, lineHeight: 1.8, color: '#222', textAlign: 'justify' }}>{children}</div>
  </div>
)

/** The footer every template carries, for the same reason the agreement does. */
export const TemplateNote = ({ children }) => (
  <div style={{ marginTop: 26, padding: '10px 12px', border: '1px solid #ddd', background: '#FAFAFA', fontSize: 10.5, color: '#666', lineHeight: 1.7 }}>
    {children}
  </div>
)
