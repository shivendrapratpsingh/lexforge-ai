'use client'

// ─────────────────────────────────────────────────────────────────
//  Save this page as a PDF.
//
//  It opens the browser's print dialog, where "Save as PDF" is a
//  destination on every current browser. That is deliberately not a
//  server-side PDF: these documents are laid out in HTML with real
//  typography, page breaks and a signature block, and re-drawing them
//  through a PDF library would produce a worse document than the one
//  the browser already renders.
//
//  The saved file takes its name from the page <title>, which is why
//  every page that uses this sets a specific one.
// ─────────────────────────────────────────────────────────────────

export default function PrintButton({ label = 'Save as PDF', hint = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        onClick={() => window.print()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#111', color: '#fff', border: 0,
          borderRadius: 5, padding: '8px 14px',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          letterSpacing: '0.01em',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>⤓</span>
        {label}
      </button>
      {hint && (
        <span style={{ fontSize: 11.5, color: '#999', fontFamily: 'system-ui, sans-serif' }}>
          choose <strong style={{ color: '#666' }}>Save as PDF</strong> as the destination
        </span>
      )}
    </span>
  )
}
