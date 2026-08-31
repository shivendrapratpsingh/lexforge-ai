// ─────────────────────────────────────────────────────────────────
//  LexForge AI — document-fields.js
//  SINGLE SOURCE OF TRUTH for the intake-form field schema of every
//  one of the 20 document "services".
//
//  Consumed by:
//    • app/(dashboard)/new-draft/page.js  → renders the "Fill Form"
//      and "Upload Folder/File" intake UIs.
//    • lib/groq.js  → extractDocumentDetails() builds a service-aware
//      extraction prompt so folder/file uploads pre-fill the EXACT
//      field names this schema declares (no more generic guesswork).
//
//  Keep this list and the FIELDS that the form renders identical —
//  that is the whole point of having one module.
// ─────────────────────────────────────────────────────────────────

export const DOC_FIELDS = {
  LEGAL_NOTICE: [
    { name: 'senderName',       label: 'Sender Name',            ph: 'Your full name / organization' },
    { name: 'senderAddress',    label: 'Sender Address',         ph: 'Your complete postal address' },
    { name: 'recipientName',    label: 'Recipient Name',         ph: 'Person/entity receiving notice' },
    { name: 'recipientAddress', label: 'Recipient Address',      ph: 'Full postal address of recipient' },
    { name: 'subject',          label: 'Subject',                ph: 'e.g. Dishonour of Cheque / Property Dispute / Service Deficiency' },
    { name: 'grievance',        label: 'Grievance / Issue',      ph: 'Describe the dispute in detail — what happened, when, how it affected you', multi: true },
    { name: 'demand',           label: 'Demanded Action',        ph: 'What specific action do you demand?' },
    { name: 'deadline',         label: 'Deadline',               ph: 'e.g., 15 days from receipt (default: 15 days)' },
    { name: 'legalBasis',       label: 'Legal Basis (optional)', ph: 'e.g., Section 138 NI Act, Section 420 IPC, Consumer Protection Act' },
  ],
  CASE_BRIEF: [
    { name: 'caseName',         label: 'Case Name',              ph: 'Petitioner/Plaintiff v. Respondent/Defendant' },
    { name: 'caseNo',           label: 'Case No.',               ph: 'e.g., Writ-C No. 1234/2024 or Civil Suit No. 56/2024' },
    { name: 'facts',            label: 'Facts of the Case',      ph: 'Key facts in chronological order', multi: true },
    { name: 'issues',           label: 'Legal Issues',           ph: 'What legal questions need to be decided?' },
    { name: 'petitionerArgs',   label: "Petitioner's Arguments", ph: 'Arguments and grounds for petitioner/plaintiff' },
    { name: 'respondentArgs',   label: "Respondent's Arguments", ph: 'Counter-arguments for respondent/defendant' },
    { name: 'applicableLaws',   label: 'Applicable Laws',        ph: 'Relevant IPC/CrPC/CPC sections, Constitutional articles, Acts' },
    { name: 'relief',           label: 'Relief Sought',          ph: 'What specific order/relief is being sought?' },
  ],
  CONTRACT: [
    { name: 'partyA',           label: 'Party A',                ph: 'Full name, address, designation of first party' },
    { name: 'partyB',           label: 'Party B',                ph: 'Full name, address, designation of second party' },
    { name: 'purpose',          label: 'Contract Purpose',       ph: 'What is this contract for? (e.g., Sale of Property, Service Agreement)' },
    { name: 'terms',            label: 'Key Terms & Obligations', ph: 'Main duties and obligations of each party', multi: true },
    { name: 'payment',          label: 'Payment Terms',          ph: 'Amount, schedule, mode of payment (NEFT/cheque/cash)' },
    { name: 'duration',         label: 'Contract Duration',      ph: 'e.g., 1 year from signing / till completion of project' },
    { name: 'termination',      label: 'Termination Conditions', ph: 'When and how can the contract be terminated?' },
    { name: 'arbitration',      label: 'Dispute Resolution',     ph: 'e.g., Arbitration at [city] under the Arbitration and Conciliation Act, 1996' },
  ],
  PETITION: [
    { name: 'petitionerName',   label: 'Petitioner/Plaintiff',   ph: 'Full name, s/o, age, address, occupation' },
    { name: 'respondentName',   label: 'Respondent/Defendant',   ph: 'Full name(s) of opposite party/authority' },
    { name: 'jurisdiction',     label: 'Jurisdiction Basis',     ph: 'Why does this court have jurisdiction? (CPC Section/territorial)' },
    { name: 'facts',            label: 'Statement of Facts',     ph: 'Detailed chronological facts of the dispute', multi: true },
    { name: 'grounds',          label: 'Grounds / Cause of Action', ph: 'Legal grounds on which petition is filed' },
    { name: 'relief',           label: 'Prayer / Relief Sought', ph: 'Specific orders sought from court (numbered)' },
    { name: 'interimRelief',    label: 'Interim Relief (if any)', ph: 'Any urgent/interim relief required (stay, injunction, etc.)' },
  ],
  MEMORANDUM: [
    { name: 'to',               label: 'To (Recipient)',         ph: 'Name and designation of recipient' },
    { name: 'from',             label: 'From (Sender)',          ph: 'Your name and designation' },
    { name: 'subject',          label: 'Subject',                ph: 'Subject of the legal memorandum' },
    { name: 'background',       label: 'Background / Facts',     ph: 'Background information and factual context', multi: true },
    { name: 'legalQuestion',    label: 'Legal Question',         ph: 'The specific legal question to be analyzed' },
    { name: 'applicableLaws',   label: 'Applicable Laws',        ph: 'Relevant acts, sections, rules, UP-specific statutes' },
    { name: 'conclusion',       label: 'Desired Conclusion',     ph: 'What advice, opinion or conclusion is needed?' },
  ],
  WRIT_PETITION: [
    { name: 'writType',         label: 'Writ Type',              ph: 'e.g., Certiorari, Mandamus, Habeas Corpus, Prohibition, Quo Warranto' },
    { name: 'petitionCategory', label: 'Petition Category',      ph: 'Civil Misc. (WRIT-C) / Criminal Misc. / Habeas Corpus (WRIT-B) / Service (WRIT-A)' },
    { name: 'petitionerName',   label: 'Petitioner',             ph: 'Full name, s/o, age, r/o — the person filing writ' },
    { name: 'respondentName',   label: 'Respondents',            ph: 'The State through its Principal Secretary + other respondents (numbered)' },
    { name: 'impugnedOrder',    label: 'Impugned Order/Action',  ph: 'The specific order, notification or action being challenged' },
    { name: 'impugnedDate',     label: 'Date of Impugned Order', ph: 'Date when the impugned order/action was passed/taken' },
    { name: 'facts',            label: 'Statement of Facts',     ph: 'Numbered, chronological facts leading to this writ petition', multi: true },
    { name: 'grounds',          label: 'Grounds',                ph: 'Constitutional grounds — Art. 14, 19, 21, 226; statutory grounds; UP-specific laws', multi: true },
    { name: 'legalProvisions',  label: 'Legal Provisions Violated', ph: 'Specific Articles, Sections, Rules violated' },
    { name: 'relief',           label: 'Relief/Prayer Sought',   ph: 'Specific orders — Rule NISI, mandamus, certiorari, stay, compensation' },
  ],
  VAKALATNAMA: [
    { name: 'advocateName',     label: 'Advocate Name',          ph: 'Full name of the advocate' },
    { name: 'enrollmentNo',     label: 'Enrollment No.',         ph: 'State Bar Council enrollment number' },
    { name: 'clientName',       label: 'Client Name',            ph: 'Full name of the client (s/o, d/o, w/o)' },
    { name: 'clientFather',     label: "Client's Father/Husband Name", ph: "Father's / Husband's name" },
    { name: 'clientAge',        label: 'Client Age',             ph: 'Age of the client' },
    { name: 'clientAddress',    label: 'Client Address',         ph: 'Full permanent/correspondence address of client' },
    { name: 'caseName',         label: 'Case Title',             ph: 'Petitioner/Plaintiff vs. Respondent/Defendant' },
    { name: 'caseNo',           label: 'Case/Writ No.',          ph: 'Case number if already filed (leave blank if new filing)' },
  ],
  BAIL_APPLICATION: [
    { name: 'applicantName',    label: 'Applicant (Accused) Name', ph: 'Full name of the accused person' },
    { name: 'fatherName',       label: "Father's Name",          ph: "Father's name of applicant" },
    { name: 'applicantAge',     label: 'Age',                    ph: 'Age of applicant' },
    { name: 'address',          label: 'Address',                ph: 'Permanent/current residential address' },
    { name: 'firNo',            label: 'FIR Details',            ph: 'FIR No., Date, Police Station name, District' },
    { name: 'offence',          label: 'Offence / Sections',     ph: 'IPC/CrPC sections under which accused is charged' },
    { name: 'custodyDate',      label: 'Date of Arrest/Custody', ph: 'Date when accused was arrested' },
    { name: 'bailType',         label: 'Type of Bail',           ph: 'Regular Bail (Sec 437/439) / Anticipatory Bail (Sec 438) / Default Bail (Sec 167)' },
    { name: 'bailGrounds',      label: 'Grounds for Bail',       ph: 'False implication, no antecedents, cooperating, Article 21 violation etc.', multi: true },
    { name: 'suretyDetails',    label: 'Surety/Guarantor',       ph: 'Name, address and relationship of surety person' },
  ],
  STAY_APPLICATION: [
    { name: 'applicantName',    label: 'Applicant Name',         ph: 'Petitioner/Applicant name (party seeking stay)' },
    { name: 'respondentName',   label: 'Respondent Name',        ph: 'Opposite party / authority against whom stay sought' },
    { name: 'mainCaseNo',       label: 'Main Case/Writ No.',     ph: 'Case/Writ/Appeal number of the main matter' },
    { name: 'impugnedOrder',    label: 'Order/Judgment to Stay', ph: 'Details — date, court, operative part of order' },
    { name: 'orderDate',        label: 'Date of Impugned Order', ph: 'Date when the order/judgment was passed' },
    { name: 'irreparableHarm',  label: 'Irreparable Harm',       ph: 'What specific harm will occur if stay is not granted?', multi: true },
    { name: 'balanceConvenience', label: 'Balance of Convenience', ph: "Why the balance of convenience is in applicant's favour" },
    { name: 'primafacieCase',   label: 'Prima Facie Case',       ph: 'Why applicant has a strong prima facie case on merits' },
  ],
  AFFIDAVIT: [
    { name: 'deponentName',     label: 'Deponent Name',          ph: 'Full name of the person swearing the affidavit' },
    { name: 'deponentFather',   label: "Father's/Husband's Name", ph: "Father's or husband's name" },
    { name: 'deponentAge',      label: 'Age',                    ph: 'Age of deponent' },
    { name: 'deponentAddress',  label: 'Address',                ph: 'Full residential address of deponent' },
    { name: 'purpose',          label: 'Purpose of Affidavit',   ph: 'Why is this affidavit being made? (court/authority/proceeding)' },
    { name: 'caseRef',          label: 'Case Reference (if any)', ph: 'Case name and number if for a court case' },
    { name: 'statements',       label: 'Statements / Facts to Depose', ph: 'List the facts being sworn to (numbered)', multi: true },
  ],
  PIL: [
    { name: 'petitionerName',   label: 'Petitioner / Organization', ph: 'Name of person or organization filing PIL — with locus standi' },
    { name: 'publicIssue',      label: 'Public Issue',           ph: 'Nature of the public interest matter (e.g., illegal demolition, pollution, corruption)' },
    { name: 'affectedParties',  label: 'Affected Parties',       ph: 'Who is affected, how many people, which area/community' },
    { name: 'respondents',      label: 'Respondents',            ph: 'The State, the concerned Principal Secretaries, the District Magistrate, other authorities' },
    { name: 'facts',            label: 'Facts & Evidence',       ph: 'Documented facts — dates, locations, numbers', multi: true },
    { name: 'officialInaction', label: 'Official Inaction',      ph: 'Previous representations/complaints made and result thereof' },
    { name: 'legalViolations',  label: 'Legal/Constitutional Violations', ph: 'Fundamental rights, directive principles or laws being violated' },
    { name: 'reliefSought',     label: 'Relief Sought',          ph: 'Specific HC directions sought — time-bound action, compensation, SIT etc.' },
  ],
  // ── New document types ────────────────────────────────────────
  RTI_APPLICATION: [
    { name: 'applicantName',    label: 'Applicant Name',         ph: 'Your full name' },
    { name: 'applicantAddress', label: 'Applicant Address',      ph: 'Your complete postal address and phone number' },
    { name: 'department',       label: 'Department / Public Authority', ph: 'Full name of the public authority to whom RTI is addressed' },
    { name: 'cpio',             label: 'CPIO / SPIO Name & Address', ph: 'Central or State Public Information Officer details (if known)' },
    { name: 'infoSought',       label: 'Information Sought',     ph: 'List specific information / documents sought (numbered questions)', multi: true },
    { name: 'period',           label: 'Period of Information',  ph: 'e.g., 2022–2025, or "current/last financial year"' },
    { name: 'purpose',          label: 'Purpose (optional)',     ph: 'Brief reason for seeking information (not mandatory under RTI Act)' },
    { name: 'mode',             label: 'Preferred Mode',         ph: 'e.g., Certified copies / Inspection of records / Soft copy by email' },
  ],
  CONSUMER_COMPLAINT: [
    { name: 'complainantName',  label: 'Complainant Name',       ph: 'Your full name' },
    { name: 'complainantAddress', label: 'Complainant Address',  ph: 'Your complete postal address, phone and email' },
    { name: 'oppositeName',     label: 'Opposite Party',         ph: 'Company / service provider full name and address' },
    { name: 'commissionType',   label: 'Commission Type',        ph: 'District (up to ₹1 crore) / State (₹1–10 crore) / National (above ₹10 crore)' },
    { name: 'productService',   label: 'Product / Service',      ph: 'What product was purchased or service availed? Include date and invoice/receipt number' },
    { name: 'amountPaid',       label: 'Amount Paid',            ph: 'Total amount paid (in words and figures)' },
    { name: 'deficiency',       label: 'Deficiency / Defect',    ph: 'Describe the deficiency in service or defect in product in detail', multi: true },
    { name: 'complaintsGiven',  label: 'Previous Complaints',    ph: 'Complaints made to the company — dates, responses received' },
    { name: 'reliefSought',     label: 'Relief Sought',          ph: 'Refund / replacement / compensation / damages / costs (with amounts)' },
  ],
  DIVORCE_PETITION: [
    { name: 'petitionerName',   label: 'Petitioner Name',        ph: 'Your full name, s/o / d/o, age, r/o address' },
    { name: 'respondentName',   label: 'Respondent Name',        ph: "Spouse's full name, s/o / d/o, age, r/o address" },
    { name: 'marriageDate',     label: 'Date of Marriage',       ph: 'Date and place of marriage — temple / court / church / arya samaj' },
    { name: 'registrationNo',   label: 'Marriage Reg. No. (if any)', ph: 'Marriage certificate registration number and date' },
    { name: 'childrenDetails',  label: 'Children Details',       ph: 'Names and ages of children (if any). Who has custody currently?' },
    { name: 'separationDate',   label: 'Date of Separation',     ph: 'When did cohabitation cease? Current living arrangements?' },
    { name: 'divorceGround',    label: 'Ground for Divorce',     ph: 'e.g., Cruelty (Sec 13(1)(ia)) / Desertion (Sec 13(1)(ib)) / Adultery / Mutual Consent (Sec 13B)' },
    { name: 'facts',            label: 'Facts / Incidents',      ph: 'Detailed chronological facts — incidents of cruelty / desertion / adultery with dates', multi: true },
    { name: 'reliefSought',     label: 'Relief Sought',          ph: 'Divorce decree / custody / maintenance / alimony / stridhan' },
    { name: 'applicableLaw',    label: 'Applicable Law',         ph: 'Hindu Marriage Act 1955 / Special Marriage Act 1954 / Divorce Act 1869 (Christians)' },
  ],
  RENT_AGREEMENT: [
    { name: 'landlordName',     label: 'Landlord Name',          ph: 'Full name, s/o, age, address of the landlord / owner' },
    { name: 'tenantName',       label: 'Tenant Name',            ph: 'Full name, s/o, age, address of the tenant / licensee' },
    { name: 'tenantAddress',    label: 'Tenant Permanent Address', ph: "Tenant's permanent residential address" },
    { name: 'propertyAddress',  label: 'Property Address',       ph: 'Full address of the property being rented — Door No., floor, locality, city, pincode' },
    { name: 'propertyDetails',  label: 'Property Details',       ph: 'Type (residential / commercial), area in sq.ft, floor, amenities (furnishing, parking, etc.)' },
    { name: 'rent',             label: 'Monthly Rent',           ph: 'Amount in words and figures, due date (e.g., 5th of each month), mode of payment' },
    { name: 'deposit',          label: 'Security Deposit',       ph: 'Amount, refund period after vacation, deductions permitted' },
    { name: 'term',             label: 'Term / Duration',        ph: 'Start date, end date, duration (11 months / 2 years / 3 years)' },
    { name: 'utilities',        label: 'Utilities',              ph: 'Who pays electricity / water / maintenance / property tax? (specify each)' },
    { name: 'specialTerms',     label: 'Special Terms (optional)', ph: 'Pet policy, subletting, renovation, parking, notice period for termination' },
  ],
  SALE_DEED: [
    { name: 'vendorName',       label: 'Vendor (Seller) Name',   ph: 'Full name, s/o, age, PAN, Aadhaar, address of seller' },
    { name: 'purchaserName',    label: 'Purchaser (Buyer) Name', ph: 'Full name, s/o, age, PAN, Aadhaar, address of buyer' },
    { name: 'propertyDescription', label: 'Property Description', ph: 'Survey / Plot / Door No., area (sq.ft and acres), locality, taluk, village, district, pincode', multi: true },
    { name: 'boundaries',       label: 'Property Boundaries',    ph: 'North: ___, South: ___, East: ___, West: ___' },
    { name: 'consideration',    label: 'Sale Consideration',     ph: 'Total sale price in words and figures (e.g., Rupees Fifty Lakhs only — ₹50,00,000)' },
    { name: 'paymentMode',      label: 'Payment Mode',           ph: 'Cheque / NEFT / RTGS / cash — details of payment made' },
    { name: 'possession',       label: 'Possession Date',        ph: 'Date on which possession of property is being handed over' },
    { name: 'titleHistory',     label: 'Title History',          ph: "How did seller acquire the property? Previous deed details, if any" },
    { name: 'encumbrance',      label: 'Encumbrances',           ph: 'Any mortgage / loan / litigation on the property? EC number and period verified.' },
  ],
  CHEQUE_BOUNCE: [
    { name: 'senderName',       label: 'Notice Sender (Payee) Name', ph: 'Your full name — the person/company to whom cheque was issued' },
    { name: 'senderAddress',    label: 'Sender Address',         ph: 'Your complete postal address' },
    { name: 'drawerName',       label: 'Cheque Drawer (Accused) Name', ph: 'Full name and complete address of the person who gave the cheque' },
    { name: 'drawerAddress',    label: 'Drawer Address',         ph: 'Complete postal address of the drawer' },
    { name: 'chequeDetails',    label: 'Cheque Details',         ph: 'Cheque No., Date on cheque, Bank name and branch, Account number (last 4 digits), Amount' },
    { name: 'amountWords',      label: 'Amount in Words',        ph: 'e.g., Rupees Five Lakhs Only (₹5,00,000)' },
    { name: 'chequePurpose',    label: 'Purpose of Cheque',      ph: 'e.g., Repayment of loan advanced on [date] / business transaction / security cheque' },
    { name: 'dishonourDate',    label: 'Date of Dishonour',      ph: 'Date when bank returned the cheque dishonoured' },
    { name: 'dishonourReason',  label: 'Reason for Dishonour',   ph: 'As per bank memo: "Insufficient Funds" / "Payment Stopped by Drawer" / "Account Closed"' },
    { name: 'bankMemoRef',      label: 'Bank Memo / Return Memo Ref.', ph: 'Reference number of the bank dishonour memo / cheque return memo' },
  ],
  LEGAL_OPINION: [
    { name: 'advocateName',     label: 'Advocate / Expert Name', ph: 'Name and designation of the advocate giving opinion' },
    { name: 'clientName',       label: 'Client Name (Addressee)', ph: 'Name and address of the person to whom opinion is addressed' },
    { name: 'matterSubject',    label: 'Subject / Matter',       ph: 'Brief description of the legal issue in one line' },
    { name: 'facts',            label: 'Facts as Furnished',     ph: 'Facts as provided by the client — be comprehensive', multi: true },
    { name: 'documentsPerused', label: 'Documents Perused',      ph: 'List of documents reviewed before giving this opinion (title deeds, agreements, FIR copy, etc.)' },
    { name: 'legalQuestion',    label: 'Legal Questions',        ph: 'Specific legal questions to be answered (numbered)', multi: true },
    { name: 'applicableLaws',   label: 'Applicable Laws',        ph: 'Relevant Acts, Sections, Rules, Constitutional provisions' },
    { name: 'jurisdiction',     label: 'Jurisdiction',           ph: 'Which court or State law applies?' },
    { name: 'riskLevel',        label: 'Risk Level Required',    ph: 'e.g., Assessment of chances of success, timeline, costs' },
  ],
  FIR_COMPLAINT: [
    { name: 'complainantName',  label: 'Complainant Name',       ph: 'Your full name, age, occupation, address, phone number' },
    { name: 'complainantAddress', label: 'Complainant Address',  ph: 'Your complete permanent address' },
    { name: 'policeStation',    label: 'Police Station',         ph: 'Name of police station where complaint is being submitted' },
    { name: 'incidentDate',     label: 'Date & Time of Incident', ph: 'Exact date and approximate time when offence occurred' },
    { name: 'incidentPlace',    label: 'Place of Incident',      ph: 'Complete address / location where offence occurred' },
    { name: 'accusedDetails',   label: 'Accused Person Details', ph: 'Name, address, age of accused (if known). If unknown, describe physical appearance' },
    { name: 'incidentFacts',    label: 'Facts of Incident',      ph: 'Detailed chronological account — what happened, how, witnesses present, evidence available', multi: true },
    { name: 'offenceSections',  label: 'IPC / BNS Sections',    ph: 'Applicable sections (e.g., IPC 420 cheating, 379 theft, 323 assault, 498A cruelty, 354 molestation)' },
    { name: 'witnesses',        label: 'Witnesses',              ph: 'Names and addresses of persons who witnessed the offence' },
    { name: 'evidence',         label: 'Evidence Available',     ph: 'CCTV footage, medical reports, photographs, WhatsApp messages, bank statements etc.' },
  ],
  LEGAL_EMAIL: [
    { name: 'purpose',          label: 'Purpose of Email',       ph: 'Choose: LEGAL_DEMAND / CLIENT_UPDATE / ADVOCATE_TO_ADVOCATE / SETTLEMENT / FOLLOW_UP / TRANSMITTAL / RETAINER / GENERIC' },
    { name: 'tone',             label: 'Tone',                   ph: 'Formal / Semi-formal / Firm  (default: Formal)' },
    { name: 'recipientName',    label: 'Recipient Name',         ph: 'Full name of person you are emailing (e.g., Mr. Rajesh Kumar)' },
    { name: 'recipientEmail',   label: 'Recipient Email',        ph: 'recipient@example.com (optional - leave blank if not yet known)' },
    { name: 'senderName',       label: 'Your Name',              ph: 'Your full name as you sign off (e.g., Adv. Shivendra Pratap Singh)' },
    { name: 'senderDesignation',label: 'Your Designation',       ph: 'e.g., Advocate, High Court (optional)' },
    { name: 'senderContact',    label: 'Your Contact',           ph: 'Phone / email / Bar Council Enrollment No. (optional)' },
    { name: 'subjectHint',      label: 'Subject (optional)',     ph: 'Leave blank to auto-generate. Otherwise: short subject line you want.' },
    { name: 'caseRef',          label: 'Case / Reference No.',   ph: 'Optional. e.g., FIR No. 123/2024, WP No. 5678/2024, your client ID' },
    { name: 'facts',            label: 'Facts / Background',     ph: 'What is the situation? Provide all relevant facts, dates, amounts, names', multi: true },
    { name: 'ask',              label: 'Action Sought',          ph: 'What do you want the recipient to do? (e.g., pay X by Y, share documents, attend hearing)' },
    { name: 'deadline',         label: 'Deadline',               ph: 'Optional. e.g., 7 days, 15 days, by 15 May 2026' },
    { name: 'attachments',      label: 'Attachments mentioned',  ph: 'Optional. List of documents being attached (e.g., copy of cheque, FIR, agreement)' },
  ],
}

// Convenience: ordered list of every supported document-type key.
export const DOC_FIELD_KEYS = Object.keys(DOC_FIELDS)

// Build a compact, human-readable schema string for a given document
// type — used by lib/groq.js to make the AI extraction service-aware so
// folder/file uploads pre-fill the EXACT field names the form expects.
// Returns '' for unknown types so the caller can fall back gracefully.
export function fieldSchemaForPrompt(documentType) {
  const fields = DOC_FIELDS[documentType]
  if (!Array.isArray(fields) || fields.length === 0) return ''
  return fields
    .map(f => {
      const kind = f.multi ? 'long text' : 'short text'
      return `  "${f.name}": ${kind} — ${f.label}. ${f.ph}`
    })
    .join('\n')
}
