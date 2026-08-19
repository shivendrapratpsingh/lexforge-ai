import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CollegeDashboard from '@/components/CollegeDashboard'

// The faculty co-ordinator's view of their own college. The API is the
// real gate — this only avoids rendering a shell to somebody who will be
// refused a moment later.

export const dynamic = 'force-dynamic'

export default async function CollegePage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <CollegeDashboard />
}
