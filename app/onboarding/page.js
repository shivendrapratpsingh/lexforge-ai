import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import OnboardingForm from '@/components/OnboardingForm'

// Where a student lands the first time they sign in with the password
// their college gave them. The dashboard layout sends them here and will
// keep sending them here until it is done.

export const metadata = { title: 'Welcome to LexForge AI' }
export const dynamic = 'force-dynamic'

export default async function Onboarding() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { prisma } = await import('@/lib/prisma')
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, mustOnboard: true, institution: { select: { name: true } } },
  })

  // Someone who has already done this has no business here.
  if (!me?.mustOnboard) redirect('/dashboard')

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F0F0F0' }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '52px 20px 80px' }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 11, color: '#D4A017', letterSpacing: '2.5px', fontWeight: 800, textTransform: 'uppercase' }}>
            Welcome
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 800, margin: '10px 0 0', letterSpacing: '-0.02em' }}>
            Two minutes, and it is yours
          </h1>
          <p style={{ fontSize: 14.5, color: '#9A9A9A', lineHeight: 1.75, margin: '12px 0 0' }}>
            {me.institution?.name
              ? `${me.institution.name} has set up your account.`
              : 'Your college has set up your account.'}{' '}
            Choose your own password so the one on their list stops working, and
            set a question we can ask if you ever forget it.
          </p>
        </div>

        <div style={{ background: '#141414', border: '1px solid #1F1F1F', borderRadius: 14, padding: 26 }}>
          <OnboardingForm email={me.email} institutionName={me.institution?.name || null} />
        </div>
      </div>
    </div>
  )
}
