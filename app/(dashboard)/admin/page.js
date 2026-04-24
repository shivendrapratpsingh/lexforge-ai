import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminConsole from '@/components/AdminConsole'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2px', fontWeight: 700 }}>ADMIN CONSOLE</div>
        <h1 style={{ fontSize: 28, color: '#F0F0F0', fontWeight: 800, marginTop: 4 }}>Platform Management</h1>
        <div style={{ fontSize: 13, color: '#6A6A6A', marginTop: 4 }}>
          Manage users, toggle Pro tier, monitor usage, and moderate content.
        </div>
      </div>
      <AdminConsole />
    </div>
  )
}
