// ─────────────────────────────────────────────────────────────────
//  Who else touches a user's data.
//
//  This list was written twice — once in the Privacy Policy and once,
//  in a table, in the DPDP undertaking a college signs. Two copies of
//  the same list is one chance for them to disagree, and the copy a
//  college's compliance officer reads is the copy that matters. So it
//  lives here, and both render from it.
//
//  `short` is the sentence the Privacy Policy prints, kept verbatim so
//  the public page reads exactly as it did. The structured fields feed
//  the undertaking's table, which needs country and category split out.
// ─────────────────────────────────────────────────────────────────

export const PROCESSORS = [
  {
    name: 'Groq',
    country: 'United States',
    short: 'receives the facts you enter, to generate the draft. This is the only third party that sees your document text.',
    purpose: 'Generates the draft from the facts supplied.',
    data: 'The text of the document being drafted.',
  },
  {
    name: 'Neon',
    country: 'United States',
    short: 'hosts the database where your account and documents are stored.',
    purpose: 'Hosts the database.',
    data: 'Account records and saved documents.',
  },
  {
    name: 'Vercel',
    country: 'United States',
    short: 'hosts and serves the application.',
    purpose: 'Hosts and serves the application.',
    data: 'Requests and technical logs.',
  },
  {
    name: 'Razorpay',
    country: 'India',
    short: 'processes payments. Receives your name, email and the amount. Handles all card and UPI details itself.',
    purpose: 'Processes payments.',
    data: 'Name, email and amount. Card and UPI details are handled entirely by Razorpay and never reach the Provider.',
  },
  {
    name: 'Indian Kanoon',
    country: 'India',
    short: 'receives your search terms when you search judgments. It does not receive your documents or your identity.',
    purpose: 'Judgment search.',
    data: 'Search terms only. Not documents, not identity.',
  },
  {
    name: 'India Code',
    country: 'India',
    short: 'a Government repository we read from. It receives nothing about you.',
    purpose: 'Government repository read for the text of Acts.',
    data: 'Nothing about the user.',
  },
  {
    name: 'Email delivery',
    // The public page has always called this "our email provider"
    // rather than naming a vendor, because the vendor is configurable.
    publicName: 'Our email provider',
    publicCountry: null,
    country: 'Depends on the configured provider',
    short: 'receives your address to deliver service emails such as receipts.',
    purpose: 'Delivers service email — sign-in help, receipts, notices.',
    data: 'Email address and the content of that message.',
  },
]

// Which of them sit outside India. DPDP s.16 permits transfer abroad
// except to a country the Central Government has notified as
// restricted; naming them is what makes the transfer disclosed rather
// than discovered.
export const OFFSHORE = PROCESSORS.filter(p => p.country === 'United States')
