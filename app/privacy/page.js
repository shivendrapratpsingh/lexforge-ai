import LegalPage, { P, H, UL, Callout, ContactBlock } from '@/components/LegalPage'
import { COMPANY } from '@/lib/company'
import { PROCESSORS } from '@/lib/processors'

export const metadata = {
  title: 'Privacy Policy — LexForge AI',
  description: 'What LexForge AI collects, why, how long it is kept, and who it is shared with.',
}

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, why, how long we keep it, and who else sees it. Written to be read, not to be scrolled past."
    >
      <Callout>
        <strong>The short version.</strong> We keep your account details and the
        documents you write. Your documents are private to you — no other user,
        and no college co-ordinator, can read them. We share the text you enter
        with the AI provider that drafts it, and nothing else. We do not sell
        your data or use your documents to train models.
      </Callout>

      <H>1. Who is responsible</H>
      <P>
        {COMPANY.legalName}, {COMPANY.city}, {COMPANY.state}, India is the Data
        Fiduciary for the purposes of the Digital Personal Data Protection Act,
        2023. Contact details are at the end.
      </P>

      <H>2. What we collect</H>
      <UL>
        <li><strong>Account details</strong> — your name, email address, and the answer to your security question. Your password and your security answer are stored only as bcrypt hashes; we cannot read either of them.</li>
        <li><strong>What you write</strong> — the facts you enter, the documents generated from them, saved versions, and any client or hearing details you record.</li>
        <li><strong>Usage records</strong> — which features you used and when, the number of AI tokens and searches consumed, and the cost of each. Used for capacity and billing, not profiling.</li>
        <li><strong>Payment records</strong> — plan, amount, dates, and the Razorpay order and payment identifiers. <strong>We never receive your card number, CVV, UPI PIN or bank credentials.</strong> Those go directly to Razorpay.</li>
        <li><strong>Institution membership</strong> — if you join a college, the fact of your membership and, if set, your batch.</li>
        <li><strong>Technical data</strong> — a session cookie to keep you signed in, and server logs including IP address for security and debugging.</li>
      </UL>

      <H>3. Why we collect it</H>
      <UL>
        <li>To provide the service you asked for — that is the lawful basis for most of it.</li>
        <li>To keep your account secure and let you recover it if you forget your password.</li>
        <li>To take payment and issue receipts.</li>
        <li>To understand load and cost so the service stays affordable and available.</li>
        <li>To comply with Indian tax and accounting law.</li>
      </UL>

      <H>4. How long we keep it</H>
      <UL>
        <li><strong>Your documents are kept until you delete them.</strong> There is no automatic expiry. Delete a draft and it is removed from the live database.</li>
        <li><strong>Your account</strong> is kept until you close it. Closing it deletes your drafts, clients and hearing records with it.</li>
        <li><strong>Backups</strong> are held by our database provider on a rolling basis and are overwritten in the normal course. Something deleted from the live service may persist in a backup for a short period before ageing out.</li>
        <li><strong>Payment and invoice records</strong> are kept as long as Indian tax law requires, even after an account is closed. We cannot delete these on request.</li>
        <li><strong>Usage logs</strong> are kept in aggregate for capacity planning.</li>
      </UL>

      <H>5. Who else sees your data</H>
      <P>
        We use the following providers. Each receives only what it needs to do
        its job, and none of them is permitted to use your data for their own
        purposes.
      </P>
      <UL>
        {/* Rendered from lib/processors.js, which the DPDP undertaking a
            college signs also renders from. Two hand-maintained copies of
            this list is one chance for the public page and the signed one
            to disagree. */}
        {PROCESSORS.map(p => {
          const country = p.publicCountry === null ? null : (p.publicCountry ?? p.country)
          return (
            <li key={p.name}>
              <strong>{p.publicName || p.name}</strong>
              {country ? ` (${country})` : ''} &mdash; {p.short}
            </li>
          )
        })}
      </UL>
      <P>
        Some of these operate outside India, so your data may be processed
        abroad. We will also disclose data where the law or a court requires it.
      </P>

      <Callout>
        <strong>We do not sell your data, share it with advertisers, or use the
        contents of your documents to train AI models.</strong>
      </Callout>

      <H>6. Who can see your documents inside LexForge</H>
      <UL>
        <li><strong>You.</strong> Nobody else, by default.</li>
        <li><strong>Not your college.</strong> A faculty co-ordinator can see that you are active and how many documents you have made. They cannot open one or read a word of it.</li>
        <li><strong>Not other users.</strong> Accounts are isolated.</li>
        <li><strong>Our administrator</strong> has database access, which is unavoidable for running and repairing the service. It is used for support and diagnosis, not for reading.</li>
      </UL>

      <H>7. Your rights</H>
      <P>Under the Digital Personal Data Protection Act, 2023 you may:</P>
      <UL>
        <li><strong>Access</strong> the personal data we hold about you.</li>
        <li><strong>Correct</strong> anything inaccurate — your name and email from Account settings, anything else by writing to us.</li>
        <li><strong>Erase</strong> your data by deleting individual drafts or closing your account, subject to records we must keep by law.</li>
        <li><strong>Complain</strong> to us first, and to the Data Protection Board of India if we do not resolve it.</li>
        <li><strong>Nominate</strong> someone to exercise these rights if you die or become incapacitated — write to us.</li>
      </UL>

      <H>8. Security</H>
      <UL>
        <li>All traffic is encrypted in transit over HTTPS.</li>
        <li>Passwords and security answers are hashed with bcrypt at cost 12 and are never stored in readable form.</li>
        <li>We deliberately hold no password reset tokens. Recovery works through your security question instead, so there is no long-lived token in the database for anyone to steal.</li>
        <li>Repeated wrong answers to a security question lock recovery temporarily.</li>
      </UL>
      <P>
        No system is perfectly secure. If a breach affects your data we will
        notify you and the Data Protection Board as the law requires.
      </P>

      <H>9. Cookies</H>
      <P>
        We use one essential cookie to keep you signed in. There are no
        advertising cookies, no third-party trackers, and no cross-site
        analytics. There is nothing to opt out of, which is why you are not
        asked.
      </P>

      <H>10. Children</H>
      <P>
        LexForge is not for anyone under 18 and we do not knowingly collect data
        from children. If you believe a child has created an account, write to us
        and we will remove it.
      </P>

      <H>11. Changes</H>
      <P>
        We will update this policy as the service changes. The date at the top
        shows when it last changed, and we will give notice in the app for
        changes that materially affect you.
      </P>

      <H>12. Grievance Officer</H>
      <P>
        For any question or complaint about your personal data, contact us. We
        respond within 30 days, and usually far sooner.
      </P>
      <ContactBlock />
    </LegalPage>
  )
}
