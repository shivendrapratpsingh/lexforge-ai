import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import { Letterhead } from '@/components/Letterhead'

// A blank sheet.
//
// Not every letter a college asks for can be anticipated — a covering
// note, a confirmation of dates, a reply to a query from their audit.
// Printing a blank letterhead and writing on it is how that has always
// been done, and it beats inventing a template for each one.
//
// ?lines=N gives ruled lines to write on by hand; without it the body
// is empty, which is what you want when typing into the print dialog
// is not the plan and you are going to paste text in instead.

export const dynamic = 'force-dynamic'

export const metadata = { title: 'LexForge Letterhead' }

export default async function BlankLetterhead({ searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const sp = await searchParams
  const lines = Math.min(28, Math.max(0, Number(sp?.lines) || 0))
  const to = (sp?.to || '').trim()
  const subject = (sp?.subject || '').trim()

  return (
    <Letterhead to={to || null} title={subject || null} kicker={subject ? 'Letter' : null}>
      {lines > 0 ? (
        <div style={{ marginTop: 10 }}>
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} style={{ borderBottom: '1px solid #D8D8D8', height: 30 }} />
          ))}
        </div>
      ) : (
        <div style={{ minHeight: 330 }} />
      )}
    </Letterhead>
  )
}
