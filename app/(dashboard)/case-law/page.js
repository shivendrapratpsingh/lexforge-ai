import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CaseLawSearch from '@/components/CaseLawSearch'

export const dynamic = 'force-dynamic'

export default async function CaseLawPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>LIVE COURT DATA</div>
        <h1 style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 4 }}>Case law &amp; case status</h1>
        <div style={{ fontSize: 13, color: '#6A6A6A', marginTop: 4 }}>
          Judgments from the Supreme Court, High Courts and tribunals; live case
          status by CNR; and new Acts checked every morning.
        </div>
      </div>
      <CaseLawSearch />
    </div>
  )
}
