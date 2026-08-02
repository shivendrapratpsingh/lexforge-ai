import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AccountSettings from '@/components/AccountSettings'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>YOUR ACCOUNT</div>
        <h1 style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 4 }}>Personal settings</h1>
        <div style={{ fontSize: 13, color: '#6A6A6A', marginTop: 4 }}>
          Your details, password, account recovery, notifications and data.
        </div>
      </div>
      <AccountSettings />
    </div>
  )
}
