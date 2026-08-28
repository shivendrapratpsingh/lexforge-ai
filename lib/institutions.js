// ─────────────────────────────────────────────────────────────────
//  lib/institutions.js — colleges and firms as first-class members.
//
//  The problem this solves: before it existed, Pro could be granted to
//  EVERYONE (GlobalPromo) or to ONE EMAIL AT A TIME (EmailPromo). A law
//  college with 300 students meant 300 rows added by hand, so no college
//  could realistically be onboarded at all.
//
//  Membership is decided two ways, in this order:
//
//   1. Email domain — a student signing up with @ulc.ac.in is linked and
//      granted access with nobody doing anything. This is the path that
//      makes a whole college possible.
//   2. A pre-authorised invite — because many Indian colleges do not
//      issue student email addresses at all, and those students sign up
//      with Gmail. Without this, domain matching would exclude exactly
//      the students least able to pay.
//
//  Access is time-boxed: a pilot that has ended stops granting Pro
//  without anyone remembering to switch it off.
// ─────────────────────────────────────────────────────────────────

/** "Ravi@ULC.AC.IN " → "ulc.ac.in" */
export function domainOf(email) {
  const at = String(email || '').trim().toLowerCase().lastIndexOf('@')
  return at === -1 ? '' : String(email).trim().toLowerCase().slice(at + 1)
}

/** "ULC.ac.in, @bub.ernet.in" → ["ulc.ac.in","bub.ernet.in"] */
export function parseDomains(raw) {
  return String(raw || '')
    .split(/[,\s;]+/)
    .map(d => d.trim().toLowerCase().replace(/^@+/, '').replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(d => d.includes('.') && !d.includes(' '))
}

// Nobody should be able to claim an entire public mail provider as their
// institution's domain: one row with "gmail.com" would hand Pro to every
// user who ever signs up. Blocked at the point of creation, not later.
export const PUBLIC_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.in',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'rediffmail.com', 'rediff.com', 'protonmail.com', 'proton.me',
  'icloud.com', 'me.com', 'aol.com', 'zoho.com', 'zohomail.com',
  'mail.com', 'gmx.com', 'yandex.com',
])

export function rejectPublicDomains(domains) {
  return domains.filter(d => PUBLIC_DOMAINS.has(d))
}

/** Is this institution's access live right now? */
export function isActive(inst, now = new Date()) {
  if (!inst) return false
  if (inst.plan === 'expired') return false
  if (inst.startsAt && new Date(inst.startsAt) > now) return false
  if (inst.endsAt && new Date(inst.endsAt) < now) return false
  return true
}

/**
 * Find the institution an email belongs to, by domain or by invite.
 * Returns null when there is none, or when its access window has closed.
 */
export async function institutionForEmail(email, prisma) {
  const addr = String(email || '').trim().toLowerCase()
  if (!addr.includes('@')) return null

  // The direct link comes FIRST, because it is the one the spreadsheet
  // import creates and it was missing here entirely. A student imported
  // from a college's list has institutionId set and, very often, a
  // personal Gmail — no domain to match and no invite row. This function
  // returned null for exactly the students the college is paying for.
  //
  // The import papered over it by stamping tier='pro' on each student,
  // which hasProAccess honours before it ever reaches this code. That
  // hid the bug and created a worse one: when the college's trial
  // expired, the tier column still said 'pro', so nobody lost access and
  // a trial could never be converted into revenue.
  const linked = await prisma.user.findUnique({
    where: { email: addr },
    select: { institution: true },
  }).catch(() => null)
  if (linked?.institution && isActive(linked.institution)) return linked.institution

  const domain = domainOf(addr)
  if (!domain || PUBLIC_DOMAINS.has(domain)) {
    // A public address can still belong to a college — but only through
    // an explicit invite, never by domain.
    return inviteInstitution(addr, prisma)
  }

  // emailDomains is a comma-separated string rather than a relation: a
  // college has two or three domains, not thousands, and a `contains`
  // over a handful of rows is cheaper than a join table to maintain.
  const all = await prisma.institution.findMany({
    where: { emailDomains: { contains: domain, mode: 'insensitive' } },
  })

  // `contains` would also match "ulc.ac.in" inside "notulc.ac.in", so the
  // parsed list is checked exactly.
  const exact = all.find(i => parseDomains(i.emailDomains).includes(domain))
  if (exact && isActive(exact)) return exact

  return inviteInstitution(addr, prisma)
}

async function inviteInstitution(addr, prisma) {
  const invite = await prisma.institutionInvite.findFirst({
    where: { email: addr },
    include: { institution: true },
  })
  if (invite?.institution && isActive(invite.institution)) return invite.institution
  return null
}

/**
 * Link a user to their institution, if any. Called on sign-up and again
 * on access checks, so a user who signed up before their college existed
 * is picked up the first time they return.
 */
export async function linkUserToInstitution(user, prisma) {
  if (!user?.email) return null
  const inst = await institutionForEmail(user.email, prisma)
  if (!inst) return null
  if (user.institutionId === inst.id) return inst

  await prisma.user.update({
    where: { id: user.id },
    data: { institutionId: inst.id },
  }).catch(() => {})

  // Mark the invite used, so an admin can see who has actually arrived.
  await prisma.institutionInvite.updateMany({
    where: { institutionId: inst.id, email: user.email.toLowerCase(), claimedAt: null },
    data: { claimedAt: new Date() },
  }).catch(() => {})

  return inst
}

/**
 * Does this email currently get Pro through an institution?
 * Deliberately tolerant: an error here must not lock a paying user out,
 * so it fails closed on access but never throws into the caller.
 */
export async function institutionGrantsPro(email) {
  try {
    const { prisma } = await import('./prisma.js')
    const inst = await institutionForEmail(email, prisma)
    if (!inst) return null

    // A seat cap that has been exceeded still lets existing members in —
    // cutting off students mid-semester because the 201st signed up would
    // be a worse failure than briefly exceeding a number.
    return { id: inst.id, name: inst.name, plan: inst.plan }
  } catch (e) {
    console.error('[institutions] lookup failed:', e?.message)
    return null
  }
}

// ── Join codes ───────────────────────────────────────────────────
//
// The third way in, after email domain and invite list. Many colleges
// issue no student email and nobody has the class list to hand — but a
// convenor can read a code out to a hall of three hundred once, and
// they onboard themselves.
//
// No 0/O or 1/I/L: this gets read aloud, written on a whiteboard, and
// typed from a photograph.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateJoinCode(length = 8) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  // Grouped for reading: LEXF-2K9M rather than LEXF2K9M.
  return out.slice(0, 4) + '-' + out.slice(4)
}

// Typed by hand off a whiteboard, so spaces, dashes and case are all
// forgiven — the only thing that matters is the letters and digits.
export function normaliseJoinCode(raw) {
  const clean = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length < 6) return null
  return clean.slice(0, 4) + '-' + clean.slice(4)
}

export async function joinByCode(user, rawCode, prisma) {
  const code = normaliseJoinCode(rawCode)
  if (!code) return { error: 'That code is too short. It looks like LEXF-2K9M.' }

  const inst = await prisma.institution.findUnique({ where: { joinCode: code } })
  if (!inst) return { error: 'No college matches that code. Check it with whoever gave it to you.' }
  if (!isActive(inst)) return { error: `${inst.name} does not have an active plan at the moment.` }

  // A seat limit only means anything if it is checked at the door.
  if (inst.seats > 0) {
    const taken = await prisma.user.count({ where: { institutionId: inst.id } })
    if (taken >= inst.seats && user.institutionId !== inst.id) {
      return { error: `${inst.name} has used all ${inst.seats} of its seats. Ask the co-ordinator to add more.` }
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { institutionId: inst.id } })
  await prisma.institutionInvite.updateMany({
    where: { institutionId: inst.id, email: user.email, claimedAt: null },
    data: { claimedAt: new Date() },
  })

  return { institution: inst }
}
