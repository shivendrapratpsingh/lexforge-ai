import LegalPage, { P, H, UL, Callout, ContactBlock } from '@/components/LegalPage'
import { COMPANY } from '@/lib/company'

export const metadata = {
  title: 'Refund & Cancellation Policy — LexForge AI',
  description: 'When LexForge AI refunds a payment, how to ask, and how long it takes.',
}

export default function Refund() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro="When we refund, how to ask, and how long it takes. No conditions buried in a clause."
    >
      <Callout>
        <strong>Nothing renews automatically.</strong> LexForge plans are paid
        once, for a fixed period. We do not store your card and we cannot debit
        you again. There is no subscription to cancel and no silent renewal to
        catch you out.
      </Callout>

      <H>1. Cancellation</H>
      <P>
        Because plans do not auto-renew, cancelling simply means not paying
        again. Your access continues to the end of the period you paid for, and
        then stops.
      </P>
      <P>
        Your account, your documents and all your work survive. You return to the
        free plan — ten documents a month — and everything you wrote is still
        there.
      </P>

      <H>2. When we give a refund</H>
      <UL>
        <li><strong>Within 7 days, if you have barely used it.</strong> If you bought a plan and generated three documents or fewer, write to us within 7 days of payment and we refund in full, no questions asked.</li>
        <li><strong>Charged twice.</strong> A duplicate payment is refunded in full, always. Tell us and we will find it — you do not need to prove it.</li>
        <li><strong>Paid but never got access.</strong> If money left your account and your plan did not activate, we either fix the access or refund it, whichever you prefer.</li>
        <li><strong>We closed your account without cause.</strong> We refund the unused part of your term.</li>
        <li><strong>We removed something a paid plan promised</strong> and you no longer want the plan, we refund the unused part.</li>
      </UL>

      <H>3. When we do not</H>
      <UL>
        <li>After 7 days, or after more than three documents — the service was delivered and used.</li>
        <li>Because a document did not win a case or was rejected by a court. LexForge produces drafts for you to check; the outcome of a matter is not something we can warrant.</li>
        <li>Because an AI draft needed editing. It is a first draft. That is what it is sold as.</li>
        <li>Where an account was closed for breaching our <a href="/terms" style={{ color: '#D4A017' }}>Terms</a>.</li>
        <li>For an institutional plan already invoiced and paid, except by written agreement with the institution.</li>
      </UL>

      <H>4. Outages</H>
      <P>
        Brief interruptions are not refundable. If the service is substantially
        unavailable for more than 72 consecutive hours during a paid term, write
        to us and we will extend your term by the time lost, or refund it
        pro-rata if you would rather.
      </P>

      <H>5. How to ask</H>
      <P>
        Email <a href={`mailto:${COMPANY.email}`} style={{ color: '#D4A017' }}>{COMPANY.email}</a> from
        the address on your account, with:
      </P>
      <UL>
        <li>the date and amount of the payment</li>
        <li>the Razorpay payment ID from your receipt, if you have it</li>
        <li>one line on what went wrong</li>
      </UL>
      <P>
        The payment ID makes it fast, but we can find the payment without it.
      </P>

      <H>6. How long it takes</H>
      <UL>
        <li>We reply within <strong>2 working days</strong>.</li>
        <li>An approved refund is issued within <strong>5 working days</strong>.</li>
        <li>Your bank then takes <strong>5 to 7 working days</strong> to show it. That part is out of our hands.</li>
        <li>Refunds go back to the original payment method. We cannot send them anywhere else.</li>
      </UL>

      <H>7. Institutional plans</H>
      <P>
        Colleges and firms are invoiced separately and their terms are set in
        that invoice. Ending an arrangement never deletes a student account or
        the work in it — members simply lose the institutional benefit.
      </P>

      <H>8. If you are not satisfied</H>
      <P>
        Write to us first and we will try to put it right. If we cannot, you keep
        every right available to you under the Consumer Protection Act, 2019.
      </P>
      <ContactBlock />
    </LegalPage>
  )
}
