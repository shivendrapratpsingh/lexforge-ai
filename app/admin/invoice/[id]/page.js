import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import {
  SELLER, IS_GST_REGISTERED, rupees, amountInWords, formatDate,
} from '@/lib/invoicing'

// A printable invoice. Deliberately on white with black text and no app
// chrome — this is going to a college's accounts department, printed or
// saved as PDF from the browser, and a dark theme prints as a black
// rectangle. Nothing here depends on JavaScript.

export const dynamic = 'force-dynamic'

export default async function InvoicePage({ params }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const { id } = await params
  const { prisma } = await import('@/lib/prisma')
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { institution: true },
  })
  if (!invoice) notFound()

  const inst = invoice.institution
  const proforma = invoice.status === 'proforma'

  const cell = { padding: '10px 12px', borderBottom: '1px solid #ddd', fontSize: 13 }
  const th = { ...cell, fontWeight: 700, background: '#f4f4f4', borderBottom: '2px solid #ccc', textAlign: 'left' }
  const num = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }

  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: '32px 20px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>

        <div className="no-print" style={{ marginBottom: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <a href="/admin" style={{ fontSize: 13, color: '#666', textDecoration: 'none', alignSelf: 'center' }}>← Admin</a>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, borderBottom: '3px solid #111', paddingBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>{SELLER.name}</div>
            {SELLER.address && <div style={{ fontSize: 12.5, color: '#444', marginTop: 5, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{SELLER.address}</div>}
            <div style={{ fontSize: 12.5, color: '#444', marginTop: 5, lineHeight: 1.6 }}>
              {SELLER.email}{SELLER.phone && ` · ${SELLER.phone}`}
            </div>
            {SELLER.gstin && <div style={{ fontSize: 12.5, color: '#444', marginTop: 3 }}>GSTIN {SELLER.gstin}</div>}
            {SELLER.pan && <div style={{ fontSize: 12.5, color: '#444' }}>PAN {SELLER.pan}</div>}
          </div>
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <div style={{ fontSize: 19, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {proforma ? 'Proforma Invoice' : 'Tax Invoice'}
            </div>
            <div style={{ fontSize: 13, marginTop: 7 }}><strong>{invoice.number}</strong></div>
            <div style={{ fontSize: 12.5, color: '#444', marginTop: 3 }}>{formatDate(invoice.issuedAt || invoice.createdAt)}</div>
            {invoice.status === 'paid' && (
              <div style={{ marginTop: 8, display: 'inline-block', border: '2px solid #1a7f37', color: '#1a7f37', padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 800, letterSpacing: '1px' }}>
                PAID
              </div>
            )}
            {invoice.status === 'cancelled' && (
              <div style={{ marginTop: 8, display: 'inline-block', border: '2px solid #b42318', color: '#b42318', padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 800, letterSpacing: '1px' }}>
                CANCELLED
              </div>
            )}
          </div>
        </div>

        {/* Bill to */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#666' }}>Bill to</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 5 }}>{inst.name}</div>
          {inst.contactName && <div style={{ fontSize: 13, color: '#444', marginTop: 3 }}>Attn: {inst.contactName}</div>}
          {inst.contactEmail && <div style={{ fontSize: 13, color: '#444' }}>{inst.contactEmail}</div>}
        </div>

        {/* Lines */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 22 }}>
          <thead>
            <tr>
              <th style={th}>Description</th>
              <th style={{ ...th, textAlign: 'right', width: 80 }}>Seats</th>
              <th style={{ ...th, textAlign: 'right', width: 110 }}>Rate</th>
              <th style={{ ...th, textAlign: 'right', width: 120 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>
                {invoice.description}
                {(invoice.periodStart || invoice.periodEnd) && (
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}
                  </div>
                )}
              </td>
              <td style={num}>{invoice.seats}</td>
              <td style={num}>₹{rupees(invoice.unitPaise)}</td>
              <td style={num}>₹{rupees(invoice.amountPaise)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ ...num, borderBottom: 'none', paddingTop: 14 }}>Subtotal</td>
              <td style={{ ...num, borderBottom: 'none', paddingTop: 14 }}>₹{rupees(invoice.amountPaise)}</td>
            </tr>
            {invoice.taxPercent > 0 && (
              <tr>
                <td colSpan={3} style={{ ...num, borderBottom: 'none' }}>GST @ {invoice.taxPercent}%</td>
                <td style={{ ...num, borderBottom: 'none' }}>₹{rupees(invoice.taxPaise)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3} style={{ ...num, fontWeight: 800, fontSize: 15, borderTop: '2px solid #111', borderBottom: 'none' }}>Total</td>
              <td style={{ ...num, fontWeight: 800, fontSize: 15, borderTop: '2px solid #111', borderBottom: 'none' }}>₹{rupees(invoice.totalPaise)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginTop: 14, fontSize: 12.5, color: '#333' }}>
          <strong>In words:</strong> {amountInWords(invoice.totalPaise)}
        </div>

        {!IS_GST_REGISTERED && (
          <div style={{ marginTop: 18, padding: '11px 14px', border: '1px solid #ddd', background: '#fafafa', fontSize: 12, color: '#555', lineHeight: 1.7 }}>
            This is a proforma invoice. {SELLER.name} is not registered under
            GST, so no tax has been charged and none may be claimed as input
            credit against this document. A tax invoice will be issued in place
            of this one should registration be completed before payment.
          </div>
        )}

        {/* Payment */}
        {(SELLER.bankAccount || SELLER.upi) && (
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#666' }}>Payment</div>
            <div style={{ fontSize: 12.5, color: '#333', marginTop: 6, lineHeight: 1.8 }}>
              {SELLER.bankName && <div>Bank: {SELLER.bankName}</div>}
              {SELLER.bankAccount && <div>Account: {SELLER.bankAccount}</div>}
              {SELLER.bankIfsc && <div>IFSC: {SELLER.bankIfsc}</div>}
              {SELLER.upi && <div>UPI: {SELLER.upi}</div>}
            </div>
          </div>
        )}

        {invoice.notes && (
          <div style={{ marginTop: 20, fontSize: 12.5, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {invoice.notes}
          </div>
        )}

        <div style={{ marginTop: 34, paddingTop: 14, borderTop: '1px solid #ddd', fontSize: 11.5, color: '#777', lineHeight: 1.7 }}>
          Access continues for the full period billed even if the subscription
          is not renewed, and ending it never deletes a student account or the
          work in it. Questions about this invoice: {SELLER.email}
        </div>

        <div className="no-print" style={{ marginTop: 24, fontSize: 12, color: '#888' }}>
          Print this page, or save it as PDF from the print dialog, to send to the college.
        </div>
      </div>
    </div>
  )
}
