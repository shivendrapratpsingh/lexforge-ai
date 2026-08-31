import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AgreementDocument from '@/components/AgreementDocument'

// The agreement a college signs, printable to PDF.
//
// On white with black text and no app chrome, for the same reason the
// invoice is: this goes to a Principal or a registrar, gets printed,
// and a dark theme prints as a black rectangle.
//
// It is a TEMPLATE. It states positions that are ordinary in a software
// agreement, but it has not been drafted by a lawyer and the page says
// so on its face, because a legal-tech company handing a college an
// agreement that pretends otherwise is exactly the wrong first
// impression.

export const dynamic = 'force-dynamic'

// The browser names a printed PDF after the page title, so this is what
// the college receives as a filename rather than "agreement".
export async function generateMetadata({ params }) {
  const { id } = await params
  const { prisma } = await import('@/lib/prisma')
  const inst = await prisma.institution.findUnique({
    where: { id }, select: { name: true, plan: true },
  }).catch(() => null)
  const kind = inst?.plan === 'pilot' ? 'Trial Agreement' : 'Licence Agreement'
  return { title: inst ? `LexForge ${kind} - ${inst.name}` : 'LexForge Agreement' }
}

export default async function Agreement({ params }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!isAdmin(session)) redirect('/dashboard')

  const { id } = await params
  const { prisma } = await import('@/lib/prisma')
  const inst = await prisma.institution.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  })
  if (!inst) notFound()

  return <AgreementDocument inst={inst} />
}
