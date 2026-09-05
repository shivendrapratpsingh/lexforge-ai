import { COMPANY } from '@/lib/company'
import { PROCESSORS, OFFSHORE } from '@/lib/processors'
import { Clause, P, H, TemplateNote } from '@/components/Letterhead'
import { RATE_CARD, rupees } from '@/lib/billing'

// ─────────────────────────────────────────────────────────────────
//  The text of the papers, separated from the pages that serve them.
//
//  The pages are three lines of auth and a <Letterhead>. Everything a
//  college actually reads is here, as plain components that take
//  props and touch neither the session nor the database — which is
//  what lets the dev-only preview at /dev/papers/[doc] render them
//  for a look at the layout, without an admin session and without
//  minting one.
// ─────────────────────────────────────────────────────────────────

// ── GST non-registration declaration ────────────────────────────
export function GstDeclarationBody({ company }) {
  // `company` is the dev preview's stand-in identity; everywhere else
  // this reads the configured one. See components/Letterhead.js.
  const C = company ? { ...COMPANY, ...company } : COMPANY
  const state = C.state || 'the State'

  return (
    <>
      <P>
        I, <strong>{C.legalName}</strong>, sole proprietor of{' '}
        <strong>{C.name}</strong>, do hereby solemnly declare and state as
        follows:
      </P>

      <Clause n={1}>
        I am the sole proprietor of {C.name}
        {C.udyam ? <>, a proprietorship concern registered under the Udyam
          Registration scheme of the Ministry of Micro, Small and Medium Enterprises
          bearing Registration Number <strong>{C.udyam}</strong></> : null}.
        {C.pan ? <> My Permanent Account Number is <strong>{C.pan}</strong>.</> : null}
      </Clause>

      <Clause n={2}>
        The supplies made by me are supplies of <strong>services</strong> — namely a
        software platform for the preparation of legal documents and related legal
        research, made available over the internet on subscription.
      </Clause>

      <Clause n={3}>
        My aggregate turnover, as defined in Section 2(6) of the Central Goods and
        Services Tax Act, 2017, has not exceeded, in the current financial year or in
        the financial year preceding it, the threshold of{' '}
        <strong>₹20,00,000 (Rupees twenty lakh only)</strong> specified in Section 22
        of that Act for a supplier engaged exclusively in the supply of services in{' '}
        {state}.
      </Clause>

      <Clause n={4}>
        I am further not liable to compulsory registration under Section 24 of the
        said Act. In particular, and for the avoidance of doubt where the recipient
        is situated in another State, the inter-State supply of services by a supplier
        whose aggregate turnover is below the said threshold has been exempted from
        compulsory registration by Notification No. 10/2017 — Integrated Tax, dated
        13 October 2017.
      </Clause>

      <Clause n={5}>
        I am accordingly <strong>not registered</strong> under the Goods and Services
        Tax Act and I hold no GSTIN.
      </Clause>

      <Clause n={6}>
        In consequence, the invoices raised by me neither charge, show nor collect any
        amount by way of Goods and Services Tax, and{' '}
        <strong>no input tax credit arises to the recipient</strong> in respect of
        them. The amount stated on the invoice is the whole amount payable.
      </Clause>

      <Clause n={7}>
        I undertake that if my aggregate turnover exceeds the said threshold, or if I
        otherwise become liable to registration, I shall (a) obtain registration
        within the time allowed by law, (b) inform the recipient in writing forthwith,
        and (c) issue tax invoices in the prescribed form with effect from the date my
        registration takes effect.
      </Clause>

      <Clause n={8}>
        This declaration is made for the information of the addressee and its accounts
        department, and the contents are true to the best of my knowledge and belief.
        Nothing has been concealed.
      </Clause>

      <TemplateNote>
        This is a self-declaration in a standard form. It has not been settled by a
        chartered accountant or by counsel. Have your CA confirm the turnover position
        and the notification reference before you sign it — the clauses above are
        drafted for a supplier of services only, and the position differs for goods.
      </TemplateNote>
    </>
  )
}

// ── DPDP data protection undertaking ────────────────────────────
export function DpdpBody({ to, company }) {
  const C = company ? { ...COMPANY, ...company } : COMPANY
  const INST = to || 'the Institution'

  const cell = { padding: '7px 9px', borderBottom: '1px solid #ddd', fontSize: 11.5, lineHeight: 1.6, verticalAlign: 'top' }
  const th = { ...cell, fontWeight: 700, background: '#F4F4F4', borderBottom: '2px solid #ccc', textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <>
      <P style={{ textAlign: 'left', color: '#555', fontSize: 11.5, marginTop: -4 }}>
        Given under the Digital Personal Data Protection Act, 2023
      </P>

      <P>
        This undertaking is given by <strong>{C.legalName}</strong>, sole
        proprietor of <strong>{C.name}</strong> (“the Provider”), to{' '}
        <strong>{INST}</strong> in respect of personal data made available to the
        Provider in connection with {INST}’s use of the LexForge AI platform.
      </P>

      <Clause n={1}>
        <strong>Roles.</strong> {INST} is the <em>Data Fiduciary</em> in respect of the
        personal data of its students and staff. The Provider acts only as a{' '}
        <em>Data Processor</em>, processing that data on {INST}’s instructions and for
        no purpose of its own.
      </Clause>

      <Clause n={2}>
        <strong>What is processed.</strong> Only the following:
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0 4px' }}>
          <thead>
            <tr><th style={th}>Category</th><th style={th}>What it is</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}><strong>Identity</strong></td>
              <td style={cell}>Name and email address, as supplied by {INST} or entered by the user.</td>
            </tr>
            <tr>
              <td style={cell}><strong>Enrolment</strong></td>
              <td style={cell}>Batch or class, as supplied by {INST}.</td>
            </tr>
            <tr>
              <td style={cell}><strong>Credentials</strong></td>
              <td style={cell}>A one-way cryptographic hash of the password, and the answer to a recovery question. The Provider does not store, and cannot recover, any password in readable form.</td>
            </tr>
            <tr>
              <td style={cell}><strong>Content</strong></td>
              <td style={cell}>The documents the user creates, and any material the user uploads in order to create them.</td>
            </tr>
            <tr>
              <td style={cell}><strong>Usage</strong></td>
              <td style={cell}>Sign-in times, counts of documents generated, and technical logs needed to run and repair the service.</td>
            </tr>
          </tbody>
        </table>
        No special category of data is sought. The Provider does not ask for
        identity-document numbers, financial details or biometric data in order to
        create a student account.
      </Clause>

      <Clause n={3}>
        <strong>Purpose, and the limits of it.</strong> The data is processed solely to
        make the platform available to the users {INST} nominates, to support them, and
        to bill {INST}. The Provider{' '}
        <strong>does not sell personal data, does not share it with advertisers, and
        does not use the contents of users’ documents to train AI models.</strong>
      </Clause>

      <Clause n={4}>
        <strong>What {INST} can and cannot see.</strong> A faculty co-ordinator
        nominated by {INST} can see whether a student has signed up, whether they have
        been active in the last thirty days, how many documents they have made, and the
        same figures broken down by batch. The co-ordinator{' '}
        <strong>cannot open a student’s document or read a word of its contents</strong>.
        This is a property of the software, not a promise about conduct.
      </Clause>

      <Clause n={5}>
        <strong>Sub-processors.</strong> The Provider engages the following, each
        receiving only what it needs and none permitted to use the data for its own
        purposes:
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0 4px' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '20%' }}>Who</th>
              <th style={{ ...th, width: '22%' }}>Location</th>
              <th style={th}>What it receives</th>
            </tr>
          </thead>
          <tbody>
            {PROCESSORS.map(p => (
              <tr key={p.name}>
                <td style={cell}><strong>{p.name}</strong><div style={{ color: '#666', fontSize: 10.5 }}>{p.purpose}</div></td>
                <td style={cell}>{p.country}</td>
                <td style={cell}>{p.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
        The Provider will give {INST} written notice before adding a sub-processor that
        receives personal data.
      </Clause>

      <Clause n={6}>
        <strong>Processing outside India.</strong> {OFFSHORE.map(p => p.name).join(', ')}{' '}
        {OFFSHORE.length === 1 ? 'operates' : 'operate'} in the United States, so
        personal data is processed outside India. Section 16 of the Act permits such
        transfer except to a country the Central Government has notified as restricted.
        The Provider will cease transferring personal data to any country so notified,
        and will tell {INST} when it does.
      </Clause>

      <Clause n={7}>
        <strong>Security.</strong> Passwords are stored only as bcrypt hashes. All
        traffic is served over TLS. An account may be signed in on one device at a
        time, so a shared or leaked credential does not become a shared session.
        Administrative access to the database is limited to the proprietor and is used
        for support and repair, not for reading users’ documents.
      </Clause>

      <Clause n={8}>
        <strong>Retention and deletion.</strong> Data is retained while the account is
        in use. A user may export everything they hold, or delete their account
        permanently, from within the application at any time. On written request from{' '}
        {INST}, the Provider will delete the accounts and stored documents of that
        institution’s users <strong>within 30 days</strong>. Where the Provider is
        obliged by law to retain a record, it will say so and retain only that record.
      </Clause>

      <Clause n={9}>
        <strong>Personal data breach.</strong> On becoming aware of a personal data
        breach affecting {INST}’s users, the Provider will notify {INST}{' '}
        <strong>without undue delay and in any event within 72 hours</strong>, stating
        what is known and what is being done, and will co-operate with {INST} in any
        notification that the Act or the Rules require to be made to the Data
        Protection Board of India or to affected individuals.
      </Clause>

      <Clause n={10}>
        <strong>Rights of individuals.</strong> A user may exercise their rights of
        access, correction and erasure directly in the application, or by writing to
        the Grievance Officer below. Where a request reaches {INST} instead, the
        Provider will assist {INST} in answering it.
      </Clause>

      <Clause n={11}>
        <strong>Grievance Officer.</strong>{' '}
        {C.grievanceName ? <><strong>{C.grievanceName}</strong>, </> : null}
        {C.grievanceEmail || C.email || `contactable through ${C.site.replace(/^https?:\/\//, '')}/contact`}.
        Complaints about personal data are answered within 30 days.
      </Clause>

      <Clause n={12}>
        <strong>Evidence.</strong> The Provider will answer {INST}’s reasonable written
        questions about anything in this undertaking, and will confirm in writing on
        request that it remains accurate.
      </Clause>

      <P style={{ marginTop: 14 }}>
        This undertaking is to be read with the Privacy Policy at{' '}
        {C.site.replace(/^https?:\/\//, '')}/privacy, which states the same
        position publicly.
      </P>

      <TemplateNote>
        This is a standard-form undertaking prepared by {C.legalName}. It has not
        been settled by counsel, and it describes the platform as it is built at the
        date printed above. If the stack changes — a new sub-processor, a new place of
        storage — this page changes with it, and any copy already signed will be out of
        date. Re-issue it when that happens.
      </TemplateNote>
    </>
  )
}

// ── Rate card ────────────────────────────────────────────────────
// Every figure is read from lib/billing.js, so the rate card, the
// checkout and the invoice can never quote three different prices.
export function RateCardBody({ seats = 0, to = '', company }) {
  const C = company ? { ...COMPANY, ...company } : COMPANY
  const money = (p) => '₹' + rupees(p).toLocaleString('en-IN')
  const D = RATE_CARD.direct
  const I = RATE_CARD.institution

  const cell = { padding: '9px 10px', borderBottom: '1px solid #ddd', fontSize: 12, lineHeight: 1.6, verticalAlign: 'top' }
  const th = { ...cell, fontWeight: 700, background: '#F4F4F4', borderBottom: '2px solid #ccc', textAlign: 'left', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const num = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }

  return (
    <>
      <P>
        The fees below are the standard rates of <strong>{C.name}</strong> and are
        valid for ninety days from the date of this letter.
      </P>

      <H n={1}>Individual subscription — students and advocates</H>
      <P style={{ marginTop: -2 }}>
        One rate for everyone who subscribes directly. A law student and a
        practising advocate pay the same.
      </P>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 6px' }}>
        <thead>
          <tr><th style={th}>Term</th><th style={{ ...th, textAlign: 'right' }}>Rate</th><th style={{ ...th, textAlign: 'right' }}>Payable</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style={cell}><strong>Monthly</strong></td>
            <td style={num}>{money(D.monthly)} per month</td>
            <td style={num}>{money(D.monthly)}</td>
          </tr>
          <tr>
            <td style={cell}><strong>Annual</strong><div style={{ color: '#666', fontSize: 10.5 }}>Paid once for twelve months</div></td>
            <td style={num}>{money(D.yearlyPerMonth)} per month</td>
            <td style={num}>{money(D.yearlyTotal)}</td>
          </tr>
        </tbody>
      </table>

      <H n={2}>Institutional licence — colleges</H>
      <P style={{ marginTop: -2 }}>
        Charged per student, so a college with forty students is not billed like
        one with four hundred.
      </P>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '4px 0 6px' }}>
        <thead>
          <tr><th style={th}>Term</th><th style={{ ...th, textAlign: 'right' }}>Rate per student</th><th style={{ ...th, textAlign: 'right' }}>Per student, per year</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style={cell}><strong>Monthly</strong></td>
            <td style={num}>{money(I.monthlyPerSeat)} per month</td>
            <td style={num}>—</td>
          </tr>
          <tr>
            <td style={cell}><strong>Annual</strong><div style={{ color: '#666', fontSize: 10.5 }}>Paid once for twelve months</div></td>
            <td style={num}>{money(I.yearlyPerSeatPerMonth)} per month</td>
            <td style={num}>{money(I.yearlyPerSeatTotal)}</td>
          </tr>
          {/* Printed WITH its limits. A discount whose boundary is left
              unstated is not a programme, it is just a lower price, and
              it becomes the number the next college expects. */}
          <tr>
            <td style={cell}>
              <strong>Founding college</strong>
              <div style={{ color: '#666', fontSize: 10.5 }}>
                First year only, for the first colleges to adopt. Reverts to the
                standard annual rate on renewal.
              </div>
            </td>
            <td style={num}>{money(I.foundingPerSeat)} per month</td>
            <td style={num}>{money(I.foundingPerSeatTotal)}</td>
          </tr>
        </tbody>
      </table>

      {seats > 0 && (
        <div className="keep" style={{ border: '2px solid #111', padding: '12px 14px', margin: '12px 0', background: '#FAFAFA' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8F6608', fontWeight: 700, marginBottom: 7 }}>
            Worked for {to || 'this institution'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ ...cell, borderBottom: 'none' }}>{seats} students, annual licence</td>
                <td style={{ ...num, borderBottom: 'none', fontWeight: 700, fontSize: 14 }}>
                  {money(I.yearlyPerSeatTotal * seats)} per year
                </td>
              </tr>
              <tr>
                <td style={{ ...cell, borderBottom: 'none', color: '#555' }}>{seats} students, monthly</td>
                <td style={{ ...num, borderBottom: 'none', color: '#555' }}>
                  {money(I.monthlyPerSeat * seats)} per month
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <H n={3}>What is included at every rate</H>
      <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>
        {[
          'All twenty document types, in seven languages, for every Indian court — the Supreme Court, all High Courts and their benches, national tribunals and district courts.',
          'Judgment search across the Supreme Court, High Courts and tribunals, with live case status by CNR.',
          'Act search with the official text, and the moot memorial builder, AI tutor and quiz tools.',
          'Export of every document to PDF, Word or plain text.',
          'For colleges: a faculty dashboard showing enrolment and activity by batch.',
        ].map((t, i) => (
          <li key={i} style={{ fontSize: 12, lineHeight: 1.75, marginBottom: 5, color: '#222' }}>{t}</li>
        ))}
      </ul>

      <H n={4}>Terms</H>
      <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>
        {[
          'A one-month trial is available to institutions at no charge and with no obligation.',
          'Fees are invoiced in advance of the term and are payable within 30 days.',
          'Tax deducted at source, where applicable, is the payer’s responsibility to deposit and certify.',
          'Fees already paid are not refunded on early termination. The full refund position is set out in the licence agreement, which is provided before signature.',
          'These rates are exclusive of any tax that may become chargeable.',
        ].map((t, i) => (
          <li key={i} style={{ fontSize: 12, lineHeight: 1.75, marginBottom: 5, color: '#222' }}>{t}</li>
        ))}
      </ul>

      <TemplateNote>
        Rates are quoted per student and per month, and the annual figure is that
        monthly rate paid once for twelve months. Where an institution’s student
        numbers change during a term, the licence is not re-priced mid-term;
        the count is taken at the start of each renewal.
      </TemplateNote>
    </>
  )
}
