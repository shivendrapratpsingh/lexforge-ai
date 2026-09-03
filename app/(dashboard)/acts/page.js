import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ActSearch from '@/components/ActSearch'

export const dynamic = 'force-dynamic'

// `searchParams` is a Promise in Next 16.
// ?q= is set by the Case Assistant when it decides the answer to
// somebody's problem is a statute rather than a document.
export default async function ActsPage({ searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')

  const sp = await searchParams
  const initialQuery = typeof sp?.q === 'string' ? sp.q : ''

  const { hasProAccess } = await import('@/lib/admin')
  const isPro = await hasProAccess(session.user?.email, session.user?.tier).catch(() => false)

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>INDIAN LEGISLATION</div>
        <h1 style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 4 }}>Act Search</h1>
        <div style={{ fontSize: 13, color: '#6A6A6A', marginTop: 4, lineHeight: 1.6, maxWidth: 620 }}>
          Describe the problem you are facing, or name an Act. Read its key sections,
          open the official text, and see which document you would actually file.
        </div>
      </div>
      <ActSearch isPro={isPro} initialQuery={initialQuery} />
    </div>
  )
}
