import LegalPage, { P, H, UL, ContactBlock } from '@/components/LegalPage'
import { COMPANY, hasAddress } from '@/lib/company'

export const metadata = {
  title: 'Contact — LexForge AI',
  description: 'How to reach LexForge AI — support, billing, privacy and colleges.',
}

export default function Contact() {
  return (
    <LegalPage
      title="Contact"
      intro="One person reads every email. You will not get a ticket number."
    >
      <H>Reach us</H>
      <ContactBlock />

      {!hasAddress() && (
        <P>
          <span style={{ color: '#FF9B90' }}>
            Registered address not yet configured — set SELLER_ADDRESS in the
            environment. A payment gateway will ask for it.
          </span>
        </P>
      )}

      <H>What to write about, and where</H>
      <UL>
        <li><strong>Something is broken</strong> — email us with what you were doing when it happened. A screenshot helps more than a description.</li>
        <li><strong>Billing or refunds</strong> — see the <a href="/refund" style={{ color: '#D4A017' }}>Refund &amp; Cancellation Policy</a>, then email us with your payment ID.</li>
        <li><strong>Your data</strong> — access, correction, or deletion requests go to the same address and are answered within 30 days.</li>
        <li><strong>Your college wants access</strong> — the <a href="/for-colleges" style={{ color: '#D4A017' }}>colleges page</a> has a form, and a pilot is free for a term.</li>
        <li><strong>You cannot get into your account</strong> — try <a href="/forgot-password" style={{ color: '#D4A017' }}>forgot password</a> first. It asks the security question you set at sign-up. If you have forgotten that too, email us.</li>
      </UL>

      <H>How fast</H>
      <UL>
        <li>Support and general questions — within <strong>2 working days</strong>.</li>
        <li>Billing and refunds — within <strong>2 working days</strong>.</li>
        <li>Privacy and data requests — within <strong>30 days</strong>, usually much sooner.</li>
      </UL>
      <P>
        We are a small operation in {COMPANY.city}. Working hours are Monday to
        Friday, and we do not have a phone queue — email genuinely is the fastest
        way to reach a person.
      </P>

      <H>Grievance Officer</H>
      <P>
        For complaints about your personal data under the Digital Personal Data
        Protection Act, 2023, write to{' '}
        <a href={`mailto:${COMPANY.grievanceEmail}`} style={{ color: '#D4A017' }}>
          {COMPANY.grievanceEmail}
        </a>
        {COMPANY.grievanceName ? ` (${COMPANY.grievanceName})` : ''} with
        &ldquo;Grievance&rdquo; in the subject line.
      </P>
    </LegalPage>
  )
}
