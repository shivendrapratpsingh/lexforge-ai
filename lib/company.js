// Who LexForge legally is.
//
// One place, read from the environment, because these details appear on
// the invoice, the Terms, the Privacy Policy and the Contact page — and
// four copies of an address is three chances for them to disagree.
//
// Nothing here is invented. Where a value is not set the pages say so
// plainly rather than printing a plausible-looking placeholder, because
// a made-up registered address on a public policy page is worse than a
// visibly missing one.

export const COMPANY = {
  name: process.env.SELLER_NAME || 'LexForge AI',
  legalName: process.env.SELLER_LEGAL_NAME || process.env.SELLER_NAME || 'LexForge AI',
  address: process.env.SELLER_ADDRESS || '',
  city: process.env.SELLER_CITY || 'Bengaluru',
  state: process.env.SELLER_STATE || 'Karnataka',
  // Deliberately NOT falling back to ADMIN_EMAIL. That is the owner's
  // personal address and the login for the admin console — publishing it
  // on the Terms, Privacy and Contact pages puts a personal inbox on
  // every policy page and in front of every spam crawler. Set
  // SELLER_EMAIL to a support address instead; until it is set the pages
  // say the contact is missing, which is honest and fixable.
  email: process.env.SELLER_EMAIL || '',
  phone: process.env.SELLER_PHONE || '',
  gstin: process.env.SELLER_GSTIN || '',
  pan: process.env.SELLER_PAN || '',

  // The Digital Personal Data Protection Act 2023 requires a named
  // contact for data complaints. Defaults to the main address rather
  // than inventing a person.
  grievanceName: process.env.GRIEVANCE_OFFICER_NAME || '',
  grievanceEmail: process.env.GRIEVANCE_OFFICER_EMAIL || process.env.SELLER_EMAIL || '',

  site: process.env.NEXT_PUBLIC_SITE_URL || 'https://lexforge-ai.vercel.app',
}

// Shown on every policy page. A date that moves on its own is not a
// version history, so this is set by hand when the text actually changes.
export const POLICY_UPDATED = '21 August 2026'

export const hasAddress = () => Boolean(COMPANY.address)
export const hasEmail = () => Boolean(COMPANY.email)
