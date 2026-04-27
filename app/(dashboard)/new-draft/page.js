'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DOCUMENT_TYPES, COURTS, ALL_COURTS, LANGUAGES } from '@/lib/utils'
import { isJunkValue, validateTemplateData, buildValidationError } from '@/lib/validation'
import { PRO_TAGLINE, getProFeatureList } from '@/lib/pro-features'

// ─── Client field mapping per document type ──────────────────────
const CLIENT_FIELD_MAP = {
  LEGAL_NOTICE:      { name: 'senderName',      addr: 'senderAddress' },
  PETITION:          { name: 'petitionerName' },
  WRIT_PETITION:     { name: 'petitionerName' },
  PIL:               { name: 'petitionerName' },
  BAIL_APPLICATION:  { name: 'applicantName',   father: 'fatherName',   age: 'applicantAge', addr: 'address' },
  STAY_APPLICATION:  { name: 'applicantName' },
  AFFIDAVIT:         { name: 'deponentName',    father: 'deponentFather', age: 'deponentAge', addr: 'deponentAddress' },
  VAKALATNAMA:       { name: 'clientName',      father: 'clientFather',  age: 'clientAge',   addr: 'clientAddress' },
  CONTRACT:          { name: 'partyA' },
  CONSUMER_COMPLAINT:{ name: 'complainantName', addr: 'complainantAddress' },
  DIVORCE_PETITION:  { name: 'petitionerName',  addr: 'petitionerAddress' },
  RENT_AGREEMENT:    { name: 'tenantName',      addr: 'tenantAddress' },
  CHEQUE_BOUNCE:     { name: 'senderName',      addr: 'senderAddress' },
  FIR_COMPLAINT:     { name: 'complainantName', addr: 'complainantAddress' },
}

// ─── Form fields per document type ────────────────────────────────
const FIELDS = {
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
    { name: 'arbitration',      label: 'Dispute Resolution',     ph: 'e.g., Arbitration at Prayagraj under Arbitration Act 1996' },
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
    { name: 'respondentName',   label: 'Respondents',            ph: 'State of UP through Principal Secretary + other respondents (numbered)' },
    { name: 'impugnedOrder',    label: 'Impugned Order/Action',  ph: 'The specific order, notification or action being challenged' },
    { name: 'impugnedDate',     label: 'Date of Impugned Order', ph: 'Date when the impugned order/action was passed/taken' },
    { name: 'facts',            label: 'Statement of Facts',     ph: 'Numbered, chronological facts leading to this writ petition', multi: true },
    { name: 'grounds',          label: 'Grounds',                ph: 'Constitutional grounds — Art. 14, 19, 21, 226; statutory grounds; UP-specific laws', multi: true },
    { name: 'legalProvisions',  label: 'Legal Provisions Violated', ph: 'Specific Articles, Sections, Rules violated' },
    { name: 'relief',           label: 'Relief/Prayer Sought',   ph: 'Specific orders — Rule NISI, mandamus, certiorari, stay, compensation' },
  ],
  VAKALATNAMA: [
    { name: 'advocateName',     label: 'Advocate Name',          ph: 'Full name of the advocate' },
    { name: 'enrollmentNo',     label: 'Enrollment No.',         ph: 'UP/Allahabad Bar Council enrollment number' },
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
    { name: 'respondents',      label: 'Respondents',            ph: 'State of UP, concerned Principal Secretaries, DM Prayagraj, other authorities' },
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
    { name: 'jurisdiction',     label: 'Jurisdiction',           ph: 'Which court/state law applies? (e.g., Tamil Nadu, Uttar Pradesh)' },
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
}

// ─── Chat Q&A questions per document type ─────────────────────────
const CHAT_QUESTIONS = {
  LEGAL_NOTICE: [
    { key: 'senderName',       q: 'What is your full name (or your organization\'s name)?' },
    { key: 'senderAddress',    q: 'What is your complete postal address?' },
    { key: 'recipientName',    q: 'Who is this notice being sent to? (Name of person or organization)' },
    { key: 'recipientAddress', q: 'What is the complete postal address of the recipient?' },
    { key: 'subject',          q: 'What is the nature of this dispute? (e.g., Cheque Dishonour, Property Dispute, Loan Default, Service Deficiency)' },
    { key: 'grievance',        q: 'Describe the dispute in detail — what happened, when, and how it affected you?' },
    { key: 'demand',           q: 'What specific action do you demand from the recipient?' },
    { key: 'deadline',         q: 'How many days should the recipient have to comply? (Standard is 15 days)' },
  ],
  WRIT_PETITION: [
    { key: 'writType',         q: 'What type of writ are you filing? (Certiorari / Mandamus / Habeas Corpus / Prohibition / Quo Warranto)' },
    { key: 'petitionCategory', q: 'Is this a Civil Misc. Writ Petition (WRIT-C), Service matter (WRIT-A), or Habeas Corpus (WRIT-B)?' },
    { key: 'petitionerName',   q: 'What is the full name of the petitioner? (include s/o, age, and residential address)' },
    { key: 'respondentName',   q: 'Who are the respondents? (State of UP through Principal Secretary is usually Respondent No. 1)' },
    { key: 'impugnedOrder',    q: 'What is the impugned order or action being challenged? Give brief details.' },
    { key: 'impugnedDate',     q: 'What is the date of the impugned order/action?' },
    { key: 'facts',            q: 'Describe the chronological facts — what happened, when, and what authorities did or failed to do?' },
    { key: 'grounds',          q: 'On what legal/constitutional grounds are you challenging this? (e.g., violation of Art. 14, 21, natural justice)' },
    { key: 'relief',           q: 'What specific orders/relief are you seeking from the High Court?' },
  ],
  BAIL_APPLICATION: [
    { key: 'applicantName',    q: 'What is the full name of the accused/applicant?' },
    { key: 'fatherName',       q: "What is the applicant's father's name?" },
    { key: 'applicantAge',     q: 'What is the age of the applicant?' },
    { key: 'address',          q: 'What is the permanent residential address of the applicant?' },
    { key: 'firNo',            q: 'What is the FIR number, date, and name of the police station?' },
    { key: 'offence',          q: 'Under which sections is the applicant accused? (e.g., Section 302/307/420 IPC)' },
    { key: 'custodyDate',      q: 'When was the applicant arrested or taken into custody?' },
    { key: 'bailType',         q: 'What type of bail? (Regular Bail Sec 437/439, Anticipatory Sec 438, or Default Bail Sec 167)' },
    { key: 'bailGrounds',      q: 'What are the main grounds for grant of bail? (false implication, no antecedents, cooperating, etc.)' },
  ],
  PIL: [
    { key: 'petitionerName',   q: 'What is the name of the petitioner or organization filing this PIL?' },
    { key: 'publicIssue',      q: 'What is the public issue? Describe it in one clear sentence.' },
    { key: 'affectedParties',  q: 'Who is affected by this issue? How many people and in which area?' },
    { key: 'respondents',      q: 'Who are the respondents? (Usually State of UP + relevant authorities)' },
    { key: 'facts',            q: 'Describe the documented facts — dates, locations, and evidence of harm.' },
    { key: 'officialInaction', q: 'Have you made any representations to authorities? What action was taken?' },
    { key: 'legalViolations',  q: 'Which fundamental rights or laws are being violated by the inaction/action?' },
    { key: 'reliefSought',     q: 'What specific directions do you want the High Court to issue?' },
  ],
  CASE_BRIEF: [
    { key: 'caseName',         q: 'What is the name of the case? (Petitioner/Plaintiff vs. Respondent/Defendant)' },
    { key: 'caseNo',           q: 'What is the case number (if known)?' },
    { key: 'facts',            q: 'What are the key facts of the case (chronologically)?' },
    { key: 'issues',           q: 'What are the main legal issues/questions to be decided?' },
    { key: 'petitionerArgs',   q: 'What are the main arguments for the petitioner/plaintiff?' },
    { key: 'respondentArgs',   q: 'What are the expected counter-arguments from the respondent?' },
    { key: 'applicableLaws',   q: 'What are the applicable laws, sections, and constitutional provisions?' },
    { key: 'relief',           q: 'What relief or order are you seeking from the court?' },
  ],
  CONTRACT: [
    { key: 'partyA',           q: 'Who is Party A? (Full name, address, role — e.g., seller, service provider)' },
    { key: 'partyB',           q: 'Who is Party B? (Full name, address, role — e.g., buyer, client)' },
    { key: 'purpose',          q: 'What is the purpose of this contract? (e.g., Sale of property, Service Agreement)' },
    { key: 'terms',            q: 'What are the key obligations of each party?' },
    { key: 'payment',          q: 'What are the payment terms? (amount, schedule, mode)' },
    { key: 'duration',         q: 'How long will this contract last?' },
    { key: 'termination',      q: 'Under what conditions can either party terminate this contract?' },
  ],
  PETITION: [
    { key: 'petitionerName',   q: 'Who is the petitioner/plaintiff? (Full name, s/o, age, address)' },
    { key: 'respondentName',   q: 'Who is the respondent/defendant?' },
    { key: 'jurisdiction',     q: 'Why does this court have jurisdiction over this matter?' },
    { key: 'facts',            q: 'What are the detailed facts of the dispute?' },
    { key: 'grounds',          q: 'What are the legal grounds for filing this petition?' },
    { key: 'relief',           q: 'What specific relief are you seeking from the court?' },
  ],
  MEMORANDUM: [
    { key: 'to',               q: 'Who is this memo addressed to? (Name and designation)' },
    { key: 'from',             q: 'Who is sending this memo? (Your name and designation)' },
    { key: 'subject',          q: 'What is the subject of this legal memorandum?' },
    { key: 'background',       q: 'What is the background and factual context?' },
    { key: 'legalQuestion',    q: 'What is the specific legal question to be analyzed?' },
    { key: 'applicableLaws',   q: 'What laws and sections are relevant?' },
    { key: 'conclusion',       q: 'What conclusion or legal opinion is needed?' },
  ],
  VAKALATNAMA: [
    { key: 'advocateName',     q: 'What is the full name of the advocate?' },
    { key: 'enrollmentNo',     q: 'What is the UP/Allahabad Bar Council enrollment number?' },
    { key: 'clientName',       q: 'What is the full name of the client?' },
    { key: 'clientFather',     q: "What is the client's father's/husband's name?" },
    { key: 'clientAge',        q: 'What is the age of the client?' },
    { key: 'clientAddress',    q: 'What is the complete address of the client?' },
    { key: 'caseName',         q: 'What is the case title? (Petitioner vs. Respondent)' },
    { key: 'caseNo',           q: 'What is the case number? (leave blank if new filing)' },
  ],
  STAY_APPLICATION: [
    { key: 'applicantName',    q: 'Who is the applicant seeking the stay?' },
    { key: 'respondentName',   q: 'Who is the opposite party?' },
    { key: 'mainCaseNo',       q: 'What is the main case/writ/appeal number?' },
    { key: 'impugnedOrder',    q: 'What is the order/judgment you want stayed? (Brief details)' },
    { key: 'orderDate',        q: 'What is the date of the impugned order?' },
    { key: 'irreparableHarm',  q: 'What irreparable harm will occur if the stay is not granted?' },
    { key: 'balanceConvenience', q: 'How is the balance of convenience in your favour?' },
    { key: 'primafacieCase',   q: 'What is your prima facie case on merits?' },
  ],
  AFFIDAVIT: [
    { key: 'deponentName',     q: 'What is the full name of the deponent (person swearing the affidavit)?' },
    { key: 'deponentFather',   q: "What is the deponent's father's/husband's name?" },
    { key: 'deponentAge',      q: 'What is the age of the deponent?' },
    { key: 'deponentAddress',  q: 'What is the full residential address of the deponent?' },
    { key: 'purpose',          q: 'What is the purpose of this affidavit? (for which court/authority/proceeding)' },
    { key: 'caseRef',          q: 'Is this for a specific case? If yes, case name and number?' },
    { key: 'statements',       q: 'What facts are being sworn to? (List them — these become the numbered statements)' },
  ],
  // ── New document types ─────────────────────────────────────────
  RTI_APPLICATION: [
    { key: 'applicantName',    q: 'What is your full name (the RTI applicant)?' },
    { key: 'applicantAddress', q: 'What is your complete postal address and phone number?' },
    { key: 'department',       q: 'Which public authority / department / ministry is the RTI addressed to?' },
    { key: 'infoSought',       q: 'What specific information or documents do you want? (Describe each item clearly — numbered questions work best)' },
    { key: 'period',           q: 'What time period does the information relate to? (e.g., 2022–2024)' },
    { key: 'mode',             q: 'How do you want the information? (Certified copies / Inspection / Electronic copy)' },
  ],
  CONSUMER_COMPLAINT: [
    { key: 'complainantName',  q: 'What is your full name (the complainant)?' },
    { key: 'complainantAddress', q: 'What is your complete address, phone, and email?' },
    { key: 'oppositeName',     q: 'Who is the opposite party? (Company name and address)' },
    { key: 'productService',   q: 'What product or service did you purchase? When, and at what price?' },
    { key: 'deficiency',       q: 'Describe the deficiency or defect in detail — what went wrong and when?' },
    { key: 'complaintsGiven',  q: 'Did you complain to the company? What was their response?' },
    { key: 'reliefSought',     q: 'What relief do you want? (refund / replacement / compensation — with amounts)' },
  ],
  DIVORCE_PETITION: [
    { key: 'petitionerName',   q: 'What is your full name, age, and address (petitioner filing the divorce)?' },
    { key: 'respondentName',   q: "What is your spouse's full name, age, and current address?" },
    { key: 'marriageDate',     q: 'When and where were you married? (Date and place)' },
    { key: 'childrenDetails',  q: 'Do you have children? If yes, their names and ages?' },
    { key: 'separationDate',   q: 'When did you stop living together? (Date of separation)' },
    { key: 'divorceGround',    q: 'On what ground are you seeking divorce? (Cruelty / Desertion / Adultery / Mutual Consent — cite section)' },
    { key: 'facts',            q: 'Describe the key incidents / facts that led to this divorce petition.' },
    { key: 'reliefSought',     q: 'What relief do you seek? (Divorce decree / custody / maintenance / alimony / stridhan)' },
  ],
  RENT_AGREEMENT: [
    { key: 'landlordName',     q: 'What is the full name and address of the landlord?' },
    { key: 'tenantName',       q: 'What is the full name and address of the tenant?' },
    { key: 'propertyAddress',  q: 'What is the complete address of the property being rented?' },
    { key: 'propertyDetails',  q: 'Describe the property — type (residential/commercial), area, floor, furnishing, parking etc.' },
    { key: 'rent',             q: 'What is the monthly rent? (Amount, due date, payment mode)' },
    { key: 'deposit',          q: 'What is the security deposit amount and refund terms?' },
    { key: 'term',             q: 'What is the duration of the agreement? (Start date, end date)' },
    { key: 'specialTerms',     q: 'Any special conditions? (subletting, pets, renovation, notice period for termination)' },
  ],
  SALE_DEED: [
    { key: 'vendorName',       q: 'Who is the seller? (Full name, age, PAN, address)' },
    { key: 'purchaserName',    q: 'Who is the buyer? (Full name, age, PAN, address)' },
    { key: 'propertyDescription', q: 'Describe the property — survey/plot number, area, locality, district, pincode.' },
    { key: 'boundaries',       q: 'What are the four boundaries of the property? (North, South, East, West)' },
    { key: 'consideration',    q: 'What is the sale price? (In words and figures)' },
    { key: 'paymentMode',      q: 'How was/is payment being made? (Cheque no., NEFT, or cash)' },
    { key: 'possession',       q: 'When is physical possession of the property being handed over?' },
    { key: 'titleHistory',     q: "How did the seller acquire this property? Any previous deeds?" },
  ],
  CHEQUE_BOUNCE: [
    { key: 'senderName',       q: 'What is your full name (the payee — person to whom cheque was given)?' },
    { key: 'senderAddress',    q: 'What is your complete address?' },
    { key: 'drawerName',       q: 'Who is the drawer (the person who gave you the cheque)? Full name and address?' },
    { key: 'chequeDetails',    q: 'Provide cheque details: Cheque no., date, bank name, branch, and amount?' },
    { key: 'chequePurpose',    q: 'Why was the cheque given to you? (Loan repayment / business payment / security)' },
    { key: 'dishonourDate',    q: 'When was the cheque dishonoured by the bank?' },
    { key: 'dishonourReason',  q: 'What reason did the bank give for dishonour? (Insufficient funds / payment stopped / account closed)' },
    { key: 'amountWords',      q: 'State the cheque amount in words (e.g., Rupees Five Lakhs Only).' },
  ],
  LEGAL_OPINION: [
    { key: 'advocateName',     q: 'Who is giving this legal opinion? (Advocate name and designation)' },
    { key: 'clientName',       q: 'Who is this opinion addressed to? (Client name and address)' },
    { key: 'matterSubject',    q: 'What is the subject of this legal opinion? (Brief one-line description)' },
    { key: 'facts',            q: 'What are the facts as furnished by the client? (Be comprehensive — include all relevant details)' },
    { key: 'documentsPerused', q: 'Which documents have you reviewed? (Title deeds, agreements, FIR, notices, etc.)' },
    { key: 'legalQuestion',    q: 'What specific legal questions need to be answered?' },
    { key: 'applicableLaws',   q: 'Which laws, acts, or sections are relevant to this matter?' },
  ],
  FIR_COMPLAINT: [
    { key: 'complainantName',  q: 'What is your full name, age, occupation, and phone number?' },
    { key: 'complainantAddress', q: 'What is your complete residential address?' },
    { key: 'policeStation',    q: 'Which police station are you filing this complaint at?' },
    { key: 'incidentDate',     q: 'When did the incident occur? (Date and approximate time)' },
    { key: 'incidentPlace',    q: 'Where did the incident occur? (Complete address or location)' },
    { key: 'accusedDetails',   q: 'Who is the accused? (Name, address, description — or unknown if not identified)' },
    { key: 'incidentFacts',    q: 'Describe what happened in detail — chronologically, with any witnesses and evidence.' },
    { key: 'offenceSections',  q: 'Under which IPC/BNS sections should the FIR be registered? (If unsure, describe the nature of the crime)' },
  ],
}

// ─── Styles ────────────────────────────────────────────────────────
const S = {
  input: { width: '100%', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px', color: '#F0F0F0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  card:  { background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, padding: 28 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#6A6A6A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  btn:   (active) => ({ padding: '8px 14px', background: active ? 'rgba(212,160,23,0.15)' : 'transparent', border: `1px solid ${active ? '#D4A017' : '#2A2A2A'}`, borderRadius: 8, color: active ? '#D4A017' : '#6A6A6A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
}

export default function NewDraftPage() {
  const router = useRouter()

  const [step, setStep]                     = useState(1)
  const [selectedType, setSelectedType]     = useState(null)
  const [selectedCourt, setSelectedCourt]   = useState('PRAYAGRAJ_HC')
  const [selectedLang, setSelectedLang]     = useState('english')
  const [intakeMethod, setIntakeMethod]     = useState('form')

  const [formData, setFormData]             = useState({})
  const [similarDrafts, setSimilarDrafts]   = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [chatStep, setChatStep]             = useState(0)
  const [chatAnswer, setChatAnswer]         = useState('')
  const [chatAnswers, setChatAnswers]       = useState({})
  const chatEndRef                          = useRef(null)

  const [uploadText, setUploadText]         = useState('')
  const [extracting, setExtracting]         = useState(false)
  const [extracted, setExtracted]           = useState(false)

  const [generating, setGenerating]         = useState(false)
  const [error, setError]                   = useState('')

  // Result state (split screen)
  const [result,         setResult]         = useState(null)   // full draft object from API
  const [autoClientMsg,  setAutoClientMsg]  = useState('')

  // Client selector
  // Court autocomplete state
  const [courtSearch,       setCourtSearch]     = useState('')
  const [courtDropdown,     setCourtDropdown]   = useState(false)

  // Client selector
  const [clientSearch,   setClientSearch]   = useState('')
  const [clientResults,  setClientResults]  = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientLoading,  setClientLoading]  = useState(false)

  // Effective user tier (drives Pro badges + upgrade banner)
  const [me, setMe] = useState(null)
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMe(d))
      .catch(() => {})
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatStep])

  useEffect(() => {
    if (!selectedType || step < 2) return
    setLoadingHistory(true)
    fetch(`/api/drafts/similar?documentType=${selectedType}&court=${selectedCourt}`)
      .then(r => r.json())
      .then(d => setSimilarDrafts(d.similar || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [selectedType, selectedCourt, step])

  useEffect(() => {
    if (!clientSearch.trim() || clientSearch.length < 2) { setClientResults([]); return }
    const t = setTimeout(async () => {
      setClientLoading(true)
      try {
        const res  = await fetch(`/api/clients?q=${encodeURIComponent(clientSearch)}&limit=6`)
        const data = await res.json()
        setClientResults(data.clients || [])
      } catch {} finally { setClientLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [clientSearch])

  function applyClientAutoFill(client) {
    if (!selectedType || !client) return
    const map = CLIENT_FIELD_MAP[selectedType]
    if (!map) return
    const patch = {}
    if (map.name)   patch[map.name]   = `${client.name}${client.fatherName ? ` s/o ${client.fatherName}` : ''}${client.age ? `, Age: ${client.age}` : ''}${client.address ? `, r/o ${client.address}${client.city ? ', ' + client.city : ''}` : ''}`
    if (map.father && client.fatherName) patch[map.father] = client.fatherName
    if (map.age    && client.age)        patch[map.age]    = client.age
    if (map.addr   && client.address)    patch[map.addr]   = `${client.address}${client.city ? ', ' + client.city : ''}${client.district ? ', ' + client.district : ''}${client.pincode ? ' - ' + client.pincode : ''}`
    setFormData(prev => ({ ...prev, ...patch }))
    setSelectedClient(client)
    setClientSearch('')
    setClientResults([])
  }

  function selectType(type) {
    setSelectedType(type); setFormData({}); setChatStep(0)
    setChatAnswers({}); setChatAnswer(''); setUploadText(''); setExtracted(false); setError(''); setStep(2)
  }

  function loadFromHistory(draft) {
    if (draft?.templateData && typeof draft.templateData === 'object') {
      setFormData(draft.templateData)
      if (draft.court)    setSelectedCourt(draft.court)
      if (draft.language) setSelectedLang(draft.language)
    }
  }

  function submitChatAnswer() {
    if (!chatAnswer.trim()) return
    // Reject placeholders like "NA", "no", "don't know" — force a real answer.
    if (isJunkValue(chatAnswer)) {
      setError('Please give a real answer — "NA", "no", and "don\'t know" are not accepted. If the detail genuinely does not exist for your case, leave the document type and try a different one.')
      return
    }
    setError('')
    const questions = CHAT_QUESTIONS[selectedType] || []
    const q = questions[chatStep]
    if (!q) return
    const updated = { ...chatAnswers, [q.key]: chatAnswer.trim() }
    setChatAnswers(updated)
    setChatAnswer('')
    if (chatStep + 1 >= questions.length) setFormData(updated)
    else setChatStep(chatStep + 1)
  }

  async function handleExtract() {
    if (!uploadText.trim()) return
    setExtracting(true); setError('')
    try {
      const res  = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawText: uploadText, documentType: selectedType }) })
      const data = await res.json()
      if (data?.extracted && Object.keys(data.extracted).length > 0) { setFormData(data.extracted); setExtracted(true) }
      else setError('Could not extract details. Please fill the form manually.')
    } catch { setError('Extraction failed. Please try again or fill manually.') }
    finally { setExtracting(false) }
  }

  async function handleGenerate() {
    setError('')
    const dataToSend = intakeMethod === 'chat' ? chatAnswers : formData
    // ── Mandatory-field validation ─────────────────────────────────
    // Every field shown to the user must be filled with a real value.
    // Placeholders like "NA", "no", "don't know" are rejected so the AI
    // never has to invent content to fill the gap.
    const requiredFields = (() => {
      if (intakeMethod === 'chat') {
        const qs = CHAT_QUESTIONS[selectedType] || []
        return qs.map(q => ({ name: q.key, label: q.q.replace(/\?\s*$/, '') }))
      }
      return fields
    })()
    const v = validateTemplateData(dataToSend, requiredFields)
    if (!v.valid) {
      setError(buildValidationError(v))
      return
    }
    setGenerating(true)
    try {
      // 90-second timeout for AI generation
      const controller = new AbortController()
      const timeoutId  = setTimeout(() => controller.abort(), 90000)

      const res = await fetch('/api/drafts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ documentType: selectedType, templateData: dataToSend, court: selectedCourt, language: selectedLang, intakeMethod, sourceText: intakeMethod === 'upload' ? uploadText : null }),
        signal:  controller.signal,
      })
      clearTimeout(timeoutId)

      const data = await res.json()
      if (!res.ok) {
        // Show error + hint together for refusal / validation errors
        const msg = data.error || 'Generation failed. Please check the app console for details.'
        const hint = data.hint ? `\n\n💡 ${data.hint}` : ''
        setError(msg + hint)
        return
      }
      if (!data?.id || !data?.content) {
        setError('Server returned an empty response. Please try again.')
        return
      }

      // Set result for split-screen view
      setResult(data)
      if (data.autoClientAction === 'created') setAutoClientMsg('✓ Client profile created automatically')
      else if (data.autoClientAction === 'linked') setAutoClientMsg(`✓ Linked to existing client: ${data.client?.name}`)

      // Auto-download PDF
      setTimeout(() => {
        const a    = document.createElement('a')
        a.href     = `/api/export/${data.id}/pdf`
        a.download = `${data.title?.replace(/[^a-z0-9]/gi, '_')}.pdf`
        a.click()
      }, 800)
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError('Request timed out after 90 seconds. The server may be overloaded — please try again.')
      } else {
        setError(`Something went wrong: ${err?.message || 'Unknown error'}. Please try again.`)
      }
    } finally { setGenerating(false) }
  }

  const selectedDoc    = DOCUMENT_TYPES.find(t => t.value === selectedType)
  const chatQuestions  = selectedType ? CHAT_QUESTIONS[selectedType] || [] : []
  // Form fields, with a safety net: if a document type doesn't have explicit FIELDS
  // defined, derive a form from its CHAT_QUESTIONS so the "Fill Form" mode never
  // shows an empty card. Heuristic: if the question text is long or asks for a
  // narrative ("describe", "explain", "facts"), render a multi-line textarea.
  const fields = (() => {
    if (!selectedType) return []
    const explicit = FIELDS[selectedType]
    if (Array.isArray(explicit) && explicit.length > 0) return explicit
    const q = CHAT_QUESTIONS[selectedType] || []
    return q.map(item => {
      const labelGuess = item.q
        .replace(/\?\s*$/, '')
        .replace(/^(what|who|when|where|why|how|describe|provide|state|on what|under which|which)\s+/i, '')
        .replace(/^./, c => c.toUpperCase())
        .substring(0, 60)
      const isMulti = /describe|explain|facts|grounds|details|what happened|chronolog/i.test(item.q)
      return { name: item.key, label: labelGuess, ph: item.q, multi: isMulti }
    })
  })()
  const chatComplete   = chatQuestions.length > 0 && chatStep >= chatQuestions.length
  const courtLabel     = ALL_COURTS.find(c => c.value === selectedCourt)?.short || selectedCourt
  const currentQ       = chatQuestions[chatStep]

  // ── Split-screen result view ─────────────────────────────────
  if (result) {
    const dt         = DOCUMENT_TYPES.find(t => t.value === result.documentType)
    const courtName  = ALL_COURTS.find(c => c.value === result.court)?.short || result.court || ''
    const inputData  = intakeMethod === 'chat' ? chatAnswers : formData
    const fieldDefs  = FIELDS[result.documentType] || []

    const proExtras = getProFeatureList(result.documentType)

    return (
      <div>
        <style>{`.res-field:hover{background:#1A1A1A !important}`}</style>

        {/* Upgrade banner — only shown when Pro is being enforced and user is on Free */}
        {me && !me.isPro && (
          <div style={{
            marginBottom: 18,
            padding: '14px 18px',
            background: 'linear-gradient(90deg, rgba(212,160,23,0.10), rgba(212,160,23,0.02))',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 320px', minWidth: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#D4A017', marginBottom: 4, letterSpacing: '0.5px' }}>
                ★ Want a longer, more authoritative draft?
              </div>
              <div style={{ fontSize: 12, color: '#A8A8A8', lineHeight: 1.55 }}>
                Pro gives you {proExtras.slice(0, 3).join(' · ')} and a private AI Case Assistant that suggests favourable IPC sections.
              </div>
            </div>
            <Link href="/upgrade" style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #D4A017, #B8860B)',
              color: '#0D0D0D',
              fontSize: 13,
              fontWeight: 800,
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}>Upgrade to Pro</Link>
          </div>
        )}

        {/* Result Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{dt?.icon}</span>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 3 }}>{result.title}</h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#6A6A6A' }}>
                <span style={{ padding: '2px 9px', borderRadius: 100, background: 'rgba(76,175,80,0.1)', color: '#4CAF50', fontWeight: 700 }}>✓ Generated</span>
                {courtName && <span>{courtName}</span>}
                {result.language !== 'english' && <span style={{ color: '#8B5CF6' }}>{result.language === 'hindi' ? 'हिन्दी' : result.language === 'tamil' ? 'தமிழ்' : 'Bilingual'}</span>}
                {autoClientMsg && <span style={{ color: '#D4A017' }}>{autoClientMsg}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/api/export/${result.id}/pdf`} download style={{ padding: '9px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, color: '#EF4444', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>📕 PDF</a>
            <a href={`/api/export/${result.id}/docx`} download style={{ padding: '9px 16px', background: 'rgba(33,150,243,0.1)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 9, color: '#2196F3', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>📘 DOCX</a>
            <a href={`/drafts/${result.id}`} style={{ padding: '9px 16px', background: 'linear-gradient(135deg, #D4A017, #B8860B)', border: 'none', borderRadius: 9, color: '#0D0D0D', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>View Full →</a>
            <button onClick={() => { setResult(null); setStep(1); setSelectedType(null); setFormData({}); setChatAnswers({}); setChatStep(0); setAutoClientMsg('') }}
              style={{ padding: '9px 16px', background: '#141414', border: '1px solid #2A2A2A', borderRadius: 9, color: '#8A8A8A', fontSize: 13, cursor: 'pointer' }}>+ New Doc</button>
          </div>
        </div>

        {/* Split Screen */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, alignItems: 'start' }}>

          {/* ── Left: Input Summary ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Client panel */}
            {result.client && (
              <div style={{ background: '#141414', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D4A017', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>👤 Client Profile {result.autoClientAction === 'created' ? '— Auto Created' : result.autoClientAction === 'linked' ? '— Linked' : ''}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 3 }}>{result.client.name}</div>
                {result.client.fatherName && <div style={{ fontSize: 12, color: '#6A6A6A' }}>s/o {result.client.fatherName}</div>}
                <a href={`/clients/${result.client.id}`} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#D4A017', textDecoration: 'none', padding: '5px 12px', background: 'rgba(212,160,23,0.08)', borderRadius: 6 }}>View Profile →</a>
              </div>
            )}

            {/* Input details */}
            <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>📋 Case Details Entered</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {fieldDefs.filter(f => inputData[f.name]).map(f => (
                  <div key={f.name} className="res-field" style={{ borderRadius: 8, padding: '9px 10px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: '#B0B0B0', lineHeight: 1.5, wordBreak: 'break-word' }}>{String(inputData[f.name]).substring(0, 200)}{String(inputData[f.name]).length > 200 ? '...' : ''}</div>
                  </div>
                ))}
                {Object.keys(inputData).length === 0 && <div style={{ fontSize: 12, color: '#4A4A4A', textAlign: 'center', padding: '12px 0' }}>No form data captured.</div>}
              </div>
            </div>

            {/* Case laws used */}
            {Array.isArray(result.caseLaws) && result.caseLaws.length > 0 && (
              <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3A3A3A', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 12 }}>⚖️ Case Laws Referenced</div>
                {result.caseLaws.map((cl, i) => (
                  <div key={i} style={{ background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.08)', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#D4A017' }}>{cl.name || cl}</div>
                    {cl.citation && <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 2 }}>{cl.citation}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Generated Document ── */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5A5A5A', letterSpacing: '1px', textTransform: 'uppercase' }}>Generated Result</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#4A4A4A' }}>
                <span>{result.content?.split(/\s+/).length || 0} words</span>
                <span>·</span>
                <span>status: {result.status}</span>
              </div>
            </div>
            <div style={{ padding: '26px 28px', maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 14, lineHeight: 2, color: '#C8C8C8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {result.content}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #1C1C1C', display: 'flex', gap: 10 }}>
              <a href={`/api/export/${result.id}/pdf`} download style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'linear-gradient(135deg, #D4A017, #B8860B)', borderRadius: 9, color: '#0D0D0D', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>⬇ Download PDF</a>
              <a href={`/drafts/${result.id}`} style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 9, color: '#A0A0A0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Open Full View</a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F0F0', marginBottom: 4 }}>Generate New Document</h1>
        <p style={{ color: '#5A5A5A', fontSize: 14 }}>Uttar Pradesh & Tamil Nadu Courts Edition — AI-powered legal drafting</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {['Select Type', 'Court & Context', 'Intake & Generate'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
              background: step > i+1 ? '#4CAF50' : step === i+1 ? '#D4A017' : '#1C1C1C',
              color:      step > i+1 ? '#fff'    : step === i+1 ? '#0D0D0D' : '#3A3A3A',
              border:     step === i+1 ? 'none' : '1px solid #2A2A2A' }}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: step === i+1 ? '#D0D0D0' : '#4A4A4A' }}>{label}</span>
            {i < 2 && <span style={{ color: '#2A2A2A', marginLeft: 8 }}>──</span>}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Select Document Type ── */}
      {step === 1 && (
        <div>
          <p style={{ color: '#6A6A6A', marginBottom: 18, fontSize: 14 }}>Choose the type of legal document:</p>

          {/* Tier banner — what Pro adds vs. Free */}
          {me && (
            me.isPro ? (
              <div style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'linear-gradient(90deg, rgba(212,160,23,0.12), rgba(212,160,23,0.04))',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 10,
                fontSize: 12,
                color: '#D4A017',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>★</span>
                <span>{PRO_TAGLINE}</span>
              </div>
            ) : (
              <div style={{
                marginBottom: 16,
                padding: '12px 14px',
                background: '#141414',
                border: '1px solid #2A2A2A',
                borderRadius: 10,
                fontSize: 12,
                color: '#9A9A9A',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}>
                <span><b style={{ color: '#C0C0C0' }}>Free plan:</b> short drafts, limited citations, {me.freeDocsLimit ?? 10} documents/month.</span>
                <Link href="/upgrade" style={{
                  marginLeft: 'auto',
                  padding: '6px 12px',
                  background: 'rgba(212,160,23,0.12)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  borderRadius: 8,
                  color: '#D4A017',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 12,
                }}>★ Upgrade to Pro</Link>
              </div>
            )
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 12 }}>
            {DOCUMENT_TYPES.map(type => {
              const proExtras = getProFeatureList(type.value)
              const tip = proExtras.length
                ? `Pro adds: ${proExtras.slice(0, 4).join(' · ')}${proExtras.length > 4 ? '…' : ''}`
                : PRO_TAGLINE
              return (
                <button key={type.value} onClick={() => selectType(type.value)}
                  title={tip}
                  style={{ background: '#141414', border: '2px solid #2A2A2A', borderRadius: 14, padding: '18px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4A017'; e.currentTarget.style.boxShadow = '0 0 16px rgba(212,160,23,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.boxShadow = 'none' }}>
                  <span style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: me?.isPro ? 'rgba(212,160,23,0.18)' : 'rgba(212,160,23,0.08)',
                    color: '#D4A017',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    border: `1px solid rgba(212,160,23,${me?.isPro ? 0.5 : 0.25})`,
                  }}>
                    {me?.isPro ? '★ PRO' : 'PRO'}
                  </span>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{type.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D0D0D0', marginBottom: 5 }}>{type.label}</div>
                  <div style={{ fontSize: 11, color: '#4A4A4A', lineHeight: 1.4 }}>{type.description}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: Court, Language & Intake ── */}
      {step === 2 && selectedType && (
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <span style={{ fontSize: 26 }}>{selectedDoc?.icon}</span>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0' }}>{selectedDoc?.label}</h2>
              <p style={{ fontSize: 12, color: '#5A5A5A' }}>Set the court, language and intake method</p>
            </div>
            <button onClick={() => setStep(1)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#5A5A5A', fontSize: 12, cursor: 'pointer' }}>← Change type</button>
          </div>

          <div style={S.card}>
            {/* Court — Searchable Autocomplete */}
            <div style={{ marginBottom: 22 }}>
              <label style={S.label}>Court</label>
              {/* Selected court badge */}
              {selectedCourt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 8, fontSize: 13, color: '#D4A017', fontWeight: 600 }}>
                    {ALL_COURTS.find(c => c.value === selectedCourt)?.short || selectedCourt}
                    {ALL_COURTS.find(c => c.value === selectedCourt)?.state && (
                      <span style={{ fontSize: 11, color: '#7A7A3A', marginLeft: 8 }}>{ALL_COURTS.find(c => c.value === selectedCourt).state}</span>
                    )}
                  </div>
                  <button onClick={() => { setSelectedCourt(''); setCourtSearch(''); setCourtDropdown(true) }}
                    style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 6, padding: '5px 10px', color: '#5A5A5A', fontSize: 11, cursor: 'pointer' }}>Change</button>
                </div>
              )}
              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={courtSearch}
                  onChange={e => { setCourtSearch(e.target.value); setCourtDropdown(true) }}
                  onFocus={() => setCourtDropdown(true)}
                  onBlur={() => setTimeout(() => setCourtDropdown(false), 180)}
                  placeholder={selectedCourt ? 'Search to change court…' : 'Search court by name or city…'}
                  style={{ ...S.input, resize: 'none' }}
                />
                {courtDropdown && (() => {
                  const q = courtSearch.toLowerCase().trim()
                  // Group filtered results by state section
                  const sections = [
                    { title: 'UP – High Courts',       courts: COURTS.UP_HIGH_COURTS },
                    { title: 'UP – Prayagraj Courts',  courts: COURTS.UP_PRAYAGRAJ },
                    { title: 'UP – Nearby Districts',  courts: COURTS.UP_NEARBY },
                    { title: 'TN – High Courts',       courts: COURTS.TN_HIGH_COURTS },
                    { title: 'TN – District Courts',   courts: COURTS.TN_DISTRICT },
                    { title: 'TN – Special Courts',    courts: COURTS.TN_SPECIAL },
                  ]
                  const filtered = sections.map(s => ({
                    ...s,
                    courts: q ? s.courts.filter(c => c.short.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q)) : s.courts,
                  })).filter(s => s.courts.length > 0)

                  if (filtered.length === 0) return (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, zIndex: 50, marginTop: 3, padding: '10px 14px', fontSize: 12, color: '#5A5A5A' }}>
                      No courts found for "{courtSearch}"
                    </div>
                  )
                  return (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, zIndex: 50, marginTop: 3, maxHeight: 320, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                      {filtered.map(section => (
                        <div key={section.title}>
                          <div style={{ padding: '7px 14px 4px', fontSize: 10, fontWeight: 700, color: '#3A3A3A', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #222' }}>
                            {section.title}
                          </div>
                          {section.courts.map(c => (
                            <button key={c.value} onMouseDown={() => { setSelectedCourt(c.value); setCourtSearch(''); setCourtDropdown(false) }}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: selectedCourt === c.value ? 'rgba(212,160,23,0.08)' : 'none', border: 'none', borderBottom: '1px solid #1E1E1E', cursor: 'pointer', textAlign: 'left' }}>
                              <span style={{ fontSize: 13, color: selectedCourt === c.value ? '#D4A017' : '#C0C0C0', fontWeight: selectedCourt === c.value ? 700 : 400 }}>{c.short}</span>
                              {selectedCourt === c.value && <span style={{ fontSize: 11, color: '#D4A017' }}>✓</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
              {!selectedCourt && !courtDropdown && (
                <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 5 }}>Type court name, city, or "Madras" / "Prayagraj" to filter</div>
              )}
            </div>

            {/* Language */}
            <div style={{ marginBottom: 22 }}>
              <label style={S.label}>Language</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {LANGUAGES.map(l => (
                  <button key={l.value} onClick={() => setSelectedLang(l.value)} style={{ ...S.btn(selectedLang === l.value), flex: 1, textAlign: 'center', padding: '10px 8px' }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{l.label}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.6 }}>{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Intake Method */}
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>How to provide case details?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { value: 'form',   icon: '📋', title: 'Fill Form',     desc: 'Fill structured fields' },
                  { value: 'chat',   icon: '💬', title: 'Smart Q&A',     desc: 'AI asks questions one by one' },
                  { value: 'upload', icon: '📤', title: 'Paste Document', desc: 'AI extracts details from pasted doc' },
                ].map(m => (
                  <button key={m.value} onClick={() => setIntakeMethod(m.value)}
                    style={{ background: intakeMethod === m.value ? 'rgba(212,160,23,0.08)' : '#0D0D0D', border: `1px solid ${intakeMethod === m.value ? '#D4A017' : '#2A2A2A'}`, borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: intakeMethod === m.value ? '#D4A017' : '#C0C0C0', marginBottom: 3 }}>{m.title}</div>
                    <div style={{ fontSize: 10, color: '#4A4A4A', lineHeight: 1.4 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Load from history */}
            {similarDrafts.length > 0 && (
              <div style={{ marginTop: 18, padding: '10px 14px', background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.1)', borderRadius: 10 }}>
                <div style={{ fontSize: 12, color: '#D4A017', fontWeight: 600, marginBottom: 7 }}>🕐 Load from previous case (AI Memory)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {similarDrafts.map(d => (
                    <button key={d.id} onClick={() => loadFromHistory(d)} title={`Load template from: ${d.title}`}
                      style={{ background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 7, padding: '5px 11px', color: '#9A9A9A', fontSize: 11, cursor: 'pointer' }}>
                      {d.title.substring(0, 38)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingHistory && <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 6 }}>Loading case history...</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setStep(1)} style={{ padding: '11px 18px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, color: '#6A6A6A', fontSize: 13, cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#0D0D0D', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Continue → {intakeMethod === 'form' ? 'Fill Details' : intakeMethod === 'chat' ? 'Start Q&A' : 'Paste Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Intake & Generate ── */}
      {step === 3 && selectedType && (
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 24 }}>{selectedDoc?.icon}</span>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0' }}>{selectedDoc?.label}</h2>
              <p style={{ fontSize: 11, color: '#5A5A5A' }}>{courtLabel} · {selectedLang.charAt(0).toUpperCase() + selectedLang.slice(1)}</p>
            </div>
            <button onClick={() => setStep(2)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#5A5A5A', fontSize: 12, cursor: 'pointer' }}>← Change settings</button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', padding: '14px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              ❌ {error}
            </div>
          )}

          {/* ── Client Auto-fill ── */}
          {CLIENT_FIELD_MAP[selectedType] && (
            <div style={{ background: '#141414', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 8 }}>👤 Load Client Details</div>
              {selectedClient ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#D0D0D0', fontWeight: 600 }}>{selectedClient.name}</span>
                    {selectedClient.phone && <span style={{ fontSize: 12, color: '#5A5A5A', marginLeft: 10 }}>📞 {selectedClient.phone}</span>}
                    <span style={{ fontSize: 11, color: '#4CAF50', marginLeft: 10 }}>✓ Applied to form</span>
                  </div>
                  <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer', fontSize: 12 }}>Change</button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search client by name or Aadhaar..."
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 14px', color: '#F0F0F0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#8B5CF6'} onBlur={e => setTimeout(() => { e.target.style.borderColor = '#2A2A2A' }, 150)}
                  />
                  {clientLoading && <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 4 }}>Searching...</div>}
                  {clientResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 8, zIndex: 50, marginTop: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      {clientResults.map(c => (
                        <button key={c.id} onMouseDown={() => applyClientAutoFill(c)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #2A2A2A', cursor: 'pointer', textAlign: 'left' }}>
                          <div>
                            <div style={{ fontSize: 13, color: '#D0D0D0', fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: '#5A5A5A' }}>{c.fatherName ? `s/o ${c.fatherName}` : ''}{c.city ? ` · ${c.city}` : ''}</div>
                          </div>
                          {c.phone && <span style={{ fontSize: 11, color: '#6A6A6A' }}>📞 {c.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {clientSearch.length >= 2 && !clientLoading && clientResults.length === 0 && (
                    <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 4 }}>No clients found. <a href="/clients" style={{ color: '#8B5CF6' }}>Add client →</a></div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FORM MODE */}
          {intakeMethod === 'form' && (
            <div style={S.card}>
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 10, color: '#D4A017', fontSize: 12, lineHeight: 1.5 }}>
                ⚠️ All fields are required. Placeholders like <b>NA</b>, <b>no</b>, <b>don't know</b> are not accepted — please provide the real detail so the document is accurate.
              </div>
              {fields.map(field => {
                const v = formData[field.name]
                const empty = !v || !String(v).trim()
                const junk  = !empty && isJunkValue(v)
                const bad   = empty || junk
                return (
                  <div key={field.name} style={{ marginBottom: 14 }}>
                    <label style={S.label}>
                      {field.label} <span style={{ color: '#FF6B6B' }}>*</span>
                    </label>
                    {field.multi ? (
                      <textarea value={formData[field.name] || ''} onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.ph} rows={4} style={{ ...S.input, borderColor: junk ? '#FF6B6B' : (S.input.border || '#2A2A2A') }}
                        onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = junk ? '#FF6B6B' : '#2A2A2A'} />
                    ) : (
                      <input type="text" value={formData[field.name] || ''} onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder={field.ph} style={{ ...S.input, resize: 'none', borderColor: junk ? '#FF6B6B' : '#2A2A2A' }}
                        onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = junk ? '#FF6B6B' : '#2A2A2A'} />
                    )}
                    {junk && (
                      <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4 }}>
                        Please give a real answer — placeholders like "NA" or "no" aren't accepted.
                      </div>
                    )}
                  </div>
                )
              })}
              <GenBtn generating={generating} onClick={handleGenerate} />
            </div>
          )}

          {/* CHAT MODE */}
          {intakeMethod === 'chat' && (
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#6A6A6A' }}>{chatComplete ? '✅ All details collected' : `Question ${Math.min(chatStep+1,chatQuestions.length)} of ${chatQuestions.length}`}</span>
                <div style={{ height: 3, flex: 1, background: '#1C1C1C', borderRadius: 4, margin: '0 14px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(Math.min(chatStep,chatQuestions.length)/chatQuestions.length)*100}%`, background: '#D4A017', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ background: '#0D0D0D', borderRadius: 10, padding: 14, marginBottom: 14, minHeight: 180, maxHeight: 360, overflowY: 'auto' }}>
                {chatQuestions.slice(0, chatStep + (chatComplete ? 0 : 1)).map((q, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#D4A017', marginBottom: 3 }}>🤖 {q.q}</div>
                    {chatAnswers[q.key] && <div style={{ fontSize: 13, color: '#C0C0C0', background: '#1C1C1C', borderRadius: 8, padding: '7px 12px', marginTop: 3 }}>You: {chatAnswers[q.key]}</div>}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {!chatComplete ? (
                <div>
                  <div style={{ fontSize: 13, color: '#D4A017', marginBottom: 8, fontWeight: 600 }}>🤖 {currentQ?.q}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={chatAnswer} onChange={e => setChatAnswer(e.target.value)} placeholder="Type your answer..."
                      style={{ ...S.input, flex: 1, resize: 'none' }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitChatAnswer()}
                      onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
                    <button onClick={submitChatAnswer} style={{ padding: '12px 16px', background: '#D4A017', border: 'none', borderRadius: 10, color: '#0D0D0D', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>→</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#4A4A4A', marginTop: 5 }}>Press Enter or → to continue</div>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '10px 14px', background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 10, color: '#4CAF50', fontSize: 13, marginBottom: 14 }}>
                    ✅ All questions answered — ready to generate.
                  </div>
                  <GenBtn generating={generating} onClick={handleGenerate} />
                </div>
              )}
            </div>
          )}

          {/* UPLOAD / PASTE MODE */}
          {intakeMethod === 'upload' && (
            <div style={S.card}>
              {!extracted ? (
                <div>
                  <label style={S.label}>Paste your existing document / FIR / order text</label>
                  <p style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 10 }}>Paste any FIR, court order, complaint, agreement, or previous draft. AI will extract all relevant details and pre-fill the form.</p>
                  <textarea value={uploadText} onChange={e => setUploadText(e.target.value)}
                    placeholder="Paste document text here... (FIR content, court order, complaint, earlier draft, etc.)"
                    rows={10} style={{ ...S.input, background: '#0D0D0D' }}
                    onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
                  <button onClick={handleExtract} disabled={!uploadText.trim() || extracting} style={{ marginTop: 12, width: '100%', padding: '12px', background: uploadText.trim() && !extracting ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : '#1C1C1C', color: uploadText.trim() && !extracting ? '#fff' : '#5A5A5A', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: uploadText.trim() && !extracting ? 'pointer' : 'not-allowed' }}>
                    {extracting ? '⚙ Extracting details...' : '🔍 Extract & Auto-fill Details'}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ padding: '10px 14px', background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)', borderRadius: 10, color: '#4CAF50', fontSize: 13, marginBottom: 18 }}>
                    ✅ Details extracted! Review and edit below before generating. <b>All fields are required</b> — replace any blank or placeholder ("NA", "no", etc.) with the real detail.
                  </div>
                  {fields.map(field => {
                    const v = formData[field.name]
                    const empty = !v || !String(v).trim()
                    const junk  = !empty && isJunkValue(v)
                    return (
                      <div key={field.name} style={{ marginBottom: 14 }}>
                        <label style={S.label}>
                          {field.label} <span style={{ color: '#FF6B6B' }}>*</span>
                        </label>
                        {field.multi ? (
                          <textarea value={formData[field.name] || ''} onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                            placeholder={field.ph} rows={4} style={{ ...S.input, borderColor: junk ? '#FF6B6B' : '#2A2A2A' }}
                            onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = junk ? '#FF6B6B' : '#2A2A2A'} />
                        ) : (
                          <input type="text" value={formData[field.name] || ''} onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                            placeholder={field.ph} style={{ ...S.input, resize: 'none', borderColor: junk ? '#FF6B6B' : '#2A2A2A' }}
                            onFocus={e => e.target.style.borderColor = '#D4A017'} onBlur={e => e.target.style.borderColor = junk ? '#FF6B6B' : '#2A2A2A'} />
                        )}
                        {junk && (
                          <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4 }}>
                            Please give a real answer — placeholders like "NA" or "no" aren't accepted.
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <button onClick={() => { setExtracted(false); setFormData({}) }} style={{ marginBottom: 10, padding: '9px 14px', background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 8, color: '#6A6A6A', fontSize: 12, cursor: 'pointer' }}>↩ Re-paste</button>
                  <GenBtn generating={generating} onClick={handleGenerate} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GenBtn({ generating, onClick }) {
  return (
    <div style={{ marginTop: 6 }}>
      <button onClick={onClick} disabled={generating}
        style={{ width: '100%', padding: '13px', background: generating ? '#1C1C1C' : 'linear-gradient(135deg, #D4A017, #B8860B)', color: generating ? '#5A5A5A' : '#0D0D0D', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: generating ? 'not-allowed' : 'pointer', boxShadow: generating ? 'none' : '0 0 20px rgba(212,160,23,0.25)' }}>
        {generating ? '⚙ Generating with AI...' : '🤖 Generate with AI'}
      </button>
      {generating && (
        <div style={{ marginTop: 12, padding: '11px 14px', background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.1)', borderRadius: 10, fontSize: 13, color: '#D4A017', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡</span> Generating court-specific document via Llama 3.3 70B on Groq... ~15–30 seconds.
        </div>
      )}
    </div>
  )
}
