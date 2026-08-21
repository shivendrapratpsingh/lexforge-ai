import LegalPage, { P, H, UL, Callout, ContactBlock } from '@/components/LegalPage'
import { COMPANY } from '@/lib/company'

export const metadata = {
  title: 'Terms & Conditions — LexForge AI',
  description: 'The terms on which LexForge AI is provided.',
}

export default function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={`These terms govern your use of ${COMPANY.name}. By creating an account you agree to them.`}
    >
      <Callout tone="warn">
        <strong>LexForge is not a law firm and does not give legal advice.</strong> It
        produces drafts for a qualified person to check. Nothing it generates
        is a substitute for an advocate, and no advocate–client relationship is
        created by using it. Read this in full before relying on any document
        for a court filing.
      </Callout>

      <H>1. Who we are</H>
      <P>
        LexForge AI is operated by {COMPANY.legalName}, based in {COMPANY.city}, {COMPANY.state}, India.
        &ldquo;We&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean that entity. &ldquo;You&rdquo; means
        the person using the service.
      </P>

      <H>2. What the service is</H>
      <P>
        LexForge is software that helps you draft Indian legal documents, search
        reported judgments and read the text of Central Acts. It uses artificial
        intelligence to produce a first draft from the facts you supply.
      </P>
      <UL>
        <li><strong>It drafts.</strong> It does not advise, appear, file, or represent you.</li>
        <li><strong>It retrieves.</strong> Judgments come from Indian Kanoon and Acts from India Code. We do not create case law.</li>
        <li><strong>It can be wrong.</strong> AI output must be verified against the bare Act and the official reporter before it is used anywhere that matters.</li>
      </UL>

      <H>3. Eligibility</H>
      <P>
        You must be at least 18 years old and legally able to enter a contract.
        The service is intended for advocates, law students and people preparing
        their own matters. It is offered for use in India.
      </P>

      <H>4. Your account</H>
      <UL>
        <li>Give accurate details. One account per person.</li>
        <li>You are responsible for everything done through your account.</li>
        <li>Keep your password and your security answer private. Your security answer can set a new password, so it is worth exactly as much as the password itself.</li>
        <li>Tell us at once if you think someone else has access.</li>
      </UL>

      <H>5. What you may not do</H>
      <UL>
        <li>Use the service for anything unlawful, or to draft a document intended to deceive a court.</li>
        <li>Impersonate an advocate you are not, or present AI output as the settled opinion of one.</li>
        <li>Resell, sublicense or white-label the service without our written permission.</li>
        <li>Scrape it, automate it, or attempt to extract the underlying models or prompts.</li>
        <li>Share one account across a firm or a class. Institutional access exists for that.</li>
        <li>Upload another person&rsquo;s confidential information without the right to do so.</li>
      </UL>

      <H>6. Free and paid plans</H>
      <P>
        The free plan includes ten documents per calendar month, resetting on the
        1st. Paid plans remove that limit and unlock the research suite, premium
        document types and the case assistant. Current prices are on the{' '}
        <a href="/pricing" style={{ color: '#D4A017' }}>pricing page</a>.
      </P>

      <H>7. Payment</H>
      <UL>
        <li>Payments are handled by Razorpay. We never see or store your card details.</li>
        <li><strong>Plans are prepaid for a fixed period and do not renew automatically.</strong> Nothing is ever debited without you starting the payment yourself.</li>
        <li>Paying again before your term ends adds to the days you have rather than replacing them.</li>
        <li>Prices may change, but never for a term you have already paid for.</li>
        <li>Refunds are governed by our <a href="/refund" style={{ color: '#D4A017' }}>Refund &amp; Cancellation Policy</a>.</li>
      </UL>

      <H>8. Institutional access</H>
      <P>
        A college or firm may be given access for its members, by email domain,
        by invitation, or by a join code. That access lasts as long as the
        institution&rsquo;s arrangement with us. If it ends, members lose the
        institutional benefit but keep their accounts and everything they have
        written.
      </P>

      <H>9. Who owns what</H>
      <UL>
        <li><strong>Your documents are yours.</strong> You own the drafts you generate and the facts you enter. We claim no ownership over them.</li>
        <li><strong>The software is ours.</strong> The platform, its interface, its prompts and its curated corpus remain our property.</li>
        <li><strong>Judgments and Acts belong to nobody.</strong> Statutes and judicial decisions are in the public domain; we present them, we do not own them.</li>
        <li>We may use anonymous, aggregated usage statistics to improve the service. We do not use the contents of your documents to train models.</li>
      </UL>

      <H>10. Accuracy, and the limits of it</H>
      <P>
        We work hard to ground output in real sources, and the system is built to
        say &ldquo;nothing found&rdquo; rather than invent a citation. Even so,
        AI output can be incomplete, out of date, or wrong. Law changes. Judgments
        get overruled.
      </P>
      <P>
        <strong>Verify every section number and every citation</strong> against
        the bare Act and the official SCC/AIR reporter before filing anything.
        You remain responsible for what you sign and submit.
      </P>

      <H>11. Availability</H>
      <P>
        We aim to keep the service running but do not promise uninterrupted
        access. It depends on services we do not control — AI providers, judgment
        databases, hosting. Any of them can be unavailable. We may change or
        withdraw features, and will give reasonable notice for changes that
        materially reduce what a paid plan includes.
      </P>

      <H>12. Limitation of liability</H>
      <P>
        To the extent permitted by law, our total liability to you for any claim
        arising out of the service is limited to the amount you have paid us in
        the twelve months before the claim. We are not liable for lost profits,
        lost opportunities, or the outcome of any legal proceeding.
      </P>
      <P>
        Nothing in these terms excludes liability that cannot lawfully be
        excluded, including for fraud.
      </P>

      <H>13. Suspension and termination</H>
      <P>
        You may close your account at any time from Account settings. We may
        suspend or close an account that breaches these terms, or that is being
        used in a way that endangers the service or other users. Where a paid
        account is closed by us without cause, we refund the unused portion of
        the term.
      </P>

      <H>14. Changes to these terms</H>
      <P>
        We may update these terms. The date at the top shows when they last
        changed. For material changes affecting paid users we will give notice by
        email or in the app. Continuing to use the service after a change means
        you accept it.
      </P>

      <H>15. Governing law</H>
      <P>
        These terms are governed by the laws of India. The courts at{' '}
        {COMPANY.city}, {COMPANY.state} have exclusive jurisdiction over any
        dispute arising from them.
      </P>

      <H>16. Contact</H>
      <ContactBlock />
    </LegalPage>
  )
}
