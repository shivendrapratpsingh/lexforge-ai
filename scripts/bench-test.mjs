// Generate a spread of real filings and save them for reading.
//
//   node scripts/bench-test.mjs english     -> court-level spread, English
//   node scripts/bench-test.mjs languages   -> one filing in each drafting language
//   node scripts/bench-test.mjs rest        -> the other twelve document types
//
// Outputs land in test-output/ so they can be read as a bench would read
// them, rather than judged by a regex. The regex summary printed here is
// only a first pass — a filing can satisfy every pattern below and still
// be unfileable.
import { generateLegalDocument } from '../lib/groq.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'test-output'
mkdirSync(OUT, { recursive: true })

const asDetails = (o) => Object.entries(o)
  .filter(([, v]) => v?.toString().trim())
  .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
  .join(String.fromCharCode(10))

// Structural markers a filing is expected to carry. Not a substitute for
// reading it — a checklist catches absence, not wrongness.
const MARKERS = {
  causeTitle:   /IN THE (SUPREME COURT|HIGH COURT|COURT OF|FAMILY COURT)/i,
  versus:       /^\s*(VERSUS|V\/S|VS\.?)\s*$/mi,
  partyTag:     /\.\.\.\s*(PETITIONER|APPLICANT|RESPONDENT|OPPOSITE PARTY|COMPLAINANT|APPELLANT)/i,
  caseNumber:   /(NO\.?\s*_+\s*OF|NO\.?\s*\[|CRIMINAL MISC|WRIT PETITION|SPECIAL LEAVE)/i,
  showeth:      /MOST RESPECTFULLY SHOWETH|RESPECTFULLY SHEWETH/i,
  numberedFacts:/^\s*\d+\.\s+That\b/mi,
  prayer:       /\bPRAYER\b|it is (most )?respectfully prayed/i,
  verification: /\bVERIFICATION\b|verified at|solemnly affirm/i,
  signature:    /ADVOCATE|DEPONENT|Counsel for/i,
  placeDate:    /Place\s*:|Date\s*:/i,
  annexure:     /ANNEXURE/i,
  placeholder:  /\[[A-Z][^\]]{2,60}\]/,      // bracketed blanks, expected
  markdown:     /\*\*|^#{1,6}\s/m,           // must NOT appear
}

const CASES = {
  english: [
    ['SUPREME COURT — writ under Art 32', 'WRIT_PETITION', 'SUPREME_COURT', 'english', {
      petitionerName: 'Meera Krishnan, aged 41 years, W/o Late Krishnan R, R/o 8 Anna Nagar, Chennai 600040',
      respondentName: 'Union of India through the Secretary, Ministry of Home Affairs, New Delhi',
      grounds: 'The petitioner’s husband died in police custody at Anna Nagar Police Station on 3 March 2026. No magisterial inquiry under BNSS was held. The State has refused compensation.',
      relief: 'Compensation for custodial death, a court-monitored CBI investigation, and guidelines binding on all States',
      facts: 'Deceased was taken into custody on 1 March 2026 in connection with Crime No. 88/2026. Family was not informed. Body released on 4 March 2026 with injuries.',
    }],
    ['HIGH COURT — writ under Art 226', 'WRIT_PETITION', 'ALLAHABAD_HIGH_COURT', 'english', {
      petitionerName: 'Ram Prakash Verma, aged 52 years, S/o Late Shiv Prakash Verma, R/o 14/2 Civil Lines, Prayagraj',
      respondentName: 'State of Uttar Pradesh through the Principal Secretary, Revenue Department, Lucknow',
      grounds: 'Land acquisition notification issued without hearing the petitioner, in breach of natural justice and Section 11 of the 2013 Act.',
      relief: 'Quash the notification dated 12 January 2026 and restrain dispossession',
      facts: 'The petitioner has been in continuous possession of Khasra No. 221 since 1998. No notice under Section 21 was ever served.',
    }],
    ['SESSIONS — regular bail, post-BNSS FIR', 'BAIL_APPLICATION', 'DISTRICT_COURT', 'english', {
      applicantName: 'Imran Sheikh', fatherName: 'Abdul Sheikh', applicantAge: '29',
      address: '22 Nehru Road, Coimbatore 641009',
      offence: 'Sections 318(4) and 316(2) BNS 2023',
      firNumber: 'FIR 412/2026 dated 18 August 2026',
      policeStation: 'Race Course Police Station, Coimbatore',
      grounds: 'The applicant is falsely implicated, has no antecedents, is in custody since 20 August 2026, and the evidence is entirely documentary.',
    }],
    ['MAGISTRATE — FIR complaint, post-BNSS', 'FIR_COMPLAINT', 'DISTRICT_COURT', 'english', {
      complainantName: 'Lakshmi Narayanan, aged 47, teacher',
      address: '5 Mettupalayam Road, Coimbatore 641043',
      accusedName: 'Suresh Babu, R/o 19 Gandhipuram, Coimbatore',
      incident: 'On 12 August 2026 at about 9.15 pm the accused broke the lock of the complainant’s scooter parked outside her residence and rode it away. The act was captured on the neighbour’s CCTV.',
      policeStation: 'Race Course Police Station',
    }],
    ['PRE-LITIGATION — cheque bounce notice', 'CHEQUE_BOUNCE_NOTICE', 'DISTRICT_COURT', 'english', {
      senderName: 'Ganesan Traders, through its Proprietor Mr. R. Ganesan',
      senderAddress: '3 Bazaar Street, Coimbatore 641001',
      recipientName: 'Gayathri Enterprises, through its Proprietrix Mrs. S. Gayathri',
      chequeNumber: '004512', chequeAmount: 'Rs. 4,50,000',
      chequeDate: '2 August 2026', bankName: 'HDFC Bank, R.S. Puram Branch',
      returnMemoDate: '8 August 2026', reason: 'Funds insufficient',
    }],
    ['DEED — rent agreement', 'RENT_AGREEMENT', 'TN_COIMBATORE', 'english', {
      landlordName: 'Ganesan', tenantName: 'Gayathri',
      propertyAddress: 'Flat 3B, 22 Race Course Road, Coimbatore 641018',
      rent: 'Rs. 20,000 per month, payable in cash on or before the 5th',
      deposit: 'Rs. 2,40,000', term: '1 year, from 1 September 2026 to 1 September 2027',
      specialTerms: 'Tenant bears minor repairs. Owner bears major repairs.',
    }],
    ['AUTHORITY — vakalatnama', 'VAKALATNAMA', 'ALLAHABAD_HIGH_COURT', 'english', {
      clientName: 'Ram Prakash Verma', clientFather: 'Late Shiv Prakash Verma',
      clientAge: '52', clientAddress: '14/2 Civil Lines, Prayagraj',
      advocateName: 'Shivendra Pratap Singh, Advocate',
      caseDetails: 'Writ Petition No. ____ of 2026 against State of Uttar Pradesh',
    }],
    ['CONSUMER — deficiency of service', 'CONSUMER_COMPLAINT', 'DISTRICT_COURT', 'english', {
      complainantName: 'Anitha R, aged 36, R/o 7 Saibaba Colony, Coimbatore',
      oppositeParty: 'Bright Home Appliances Pvt Ltd, Coimbatore',
      goodsOrService: 'Refrigerator, model BH-450, purchased 4 April 2026 for Rs. 42,000',
      deficiency: 'The unit stopped cooling within 6 weeks. Four service visits failed. Replacement refused despite warranty.',
      relief: 'Replacement or refund with interest, compensation for mental agony, and costs',
    }],
  ],

  // One filing type, every drafting language. Bail is the right probe:
  // it has a cause title, numbered grounds, a prayer and a verification,
  // so a language that only half-works shows it immediately.
  languages: ['english', 'hindi', 'bilingual', 'urdu', 'tamil', 'telugu', 'kannada'].map(lang => ([
    `LANGUAGE — bail application in ${lang}`, 'BAIL_APPLICATION', 'DISTRICT_COURT', lang, {
      applicantName: 'Imran Sheikh', fatherName: 'Abdul Sheikh', applicantAge: '29',
      address: '22 Nehru Road, Coimbatore 641009',
      offence: 'Sections 318(4) and 316(2) BNS 2023',
      firNumber: 'FIR 412/2026 dated 18 August 2026',
      policeStation: 'Race Course Police Station, Coimbatore',
      grounds: 'The applicant is falsely implicated, has no antecedents, and the evidence is documentary.',
    },
  ])),
  // The twelve document types the english and languages runs never
  // touch. Between them the three modes now cover all twenty.
  //
  // Half of these are NOT pleadings - a deed, a contract, an opinion, a
  // memo, an email - and must not carry a cause title, a prayer or a
  // sworn verification. Putting pleading furniture on a sale deed is a
  // real defect, so the point of running them is as much what is
  // ABSENT as what is present.
  rest: [
    ['PRE-LITIGATION — notice under s.138 NI Act', 'LEGAL_NOTICE', 'DISTRICT_COURT', 'english', {
      senderName: 'Sunita Agarwal, W/o Rakesh Agarwal, proprietor of M/s Agarwal Traders',
      senderAddress: '18 Naya Bazar, Kanpur Nagar 208001, Uttar Pradesh',
      recipientName: 'M/s Bharat Steel Supplies through its proprietor Mahesh Chandra Gupta',
      recipientAddress: '77 Industrial Estate, Kanpur Nagar 208012, Uttar Pradesh',
      subject: 'Dishonour of cheque bearing no. 447213 for Rs. 6,80,000',
      grievance: 'Cheque no. 447213 dated 2 August 2026 drawn on Punjab National Bank, Naya Bazar branch, for Rs. 6,80,000, issued towards outstanding payment for steel supplied under invoice AT/2026/311, was returned unpaid on 9 August 2026 with the endorsement "funds insufficient".',
      demand: 'Payment of Rs. 6,80,000 together with interest and the bank charges of Rs. 590',
      deadline: '15 days from receipt of this notice',
      legalBasis: 'Section 138 read with Section 142 of the Negotiable Instruments Act, 1881',
    }],
    ['STUDENT — brief of a decided matter', 'CASE_BRIEF', 'SUPREME_COURT', 'english', {
      caseName: 'Ramesh Chandra Yadav v. State of Uttar Pradesh',
      caseNo: 'Criminal Appeal No. 1182 of 2024',
      facts: 'The appellant was convicted under Section 302 IPC on the sole testimony of a child witness aged nine, recorded eleven months after the incident. No test identification parade was held. The recovery of the weapon was made from an open field accessible to the public.',
      issues: 'Whether a conviction can rest on the sole testimony of a child witness recorded after long delay, and whether recovery from an open place is admissible under Section 27 of the Evidence Act.',
      petitionerArgs: 'The delay in recording the statement is fatal; the child was tutored; recovery from a public place has no evidentiary value.',
      respondentArgs: 'The child witness was found competent on voir dire and the testimony is corroborated by medical evidence.',
      applicableLaws: 'Section 302 IPC, Section 118 and Section 27 of the Indian Evidence Act, 1872',
      relief: 'Set aside the conviction and acquit the appellant',
    }],
    ['COMMERCIAL — a vendor agreement', 'CONTRACT', 'DISTRICT_COURT', 'english', {
      partyA: 'Nirmal Logistics Private Limited, a company incorporated under the Companies Act, 2013, having its registered office at 402 Sunrise Chambers, Andheri East, Mumbai 400069',
      partyB: 'Shree Ganesh Packaging LLP, having its principal place of business at Plot 22, MIDC Bhiwandi, Thane 421302',
      purpose: 'Supply of corrugated packaging cartons on a rolling monthly basis',
      terms: 'Minimum 40,000 units per month to specification NL/PKG/2026. Rejection rate above 2% entitles the buyer to reject the consignment. Delivery within 7 working days of purchase order.',
      payment: 'Rs. 14.50 per unit, payable within 45 days of invoice, by NEFT',
      duration: '24 months from 1 October 2026',
      termination: '90 days written notice by either party; immediate on insolvency or three consecutive rejected consignments',
      arbitration: 'Sole arbitrator under the Arbitration and Conciliation Act, 1996, seat at Mumbai',
    }],
    ['DISTRICT — a civil petition', 'PETITION', 'DISTRICT_COURT', 'english', {
      petitionerName: 'Lakshmi Narayanan, aged 58 years, S/o Late Subramanian, R/o 45 Gandhi Street, Madurai 625001',
      respondentName: 'The Executive Officer, Madurai Municipal Corporation, Madurai',
      jurisdiction: 'The property is situated within the local limits of this Court',
      facts: 'The petitioner has held a trade licence for a provision store at 45 Gandhi Street since 1994. The licence was cancelled by an order dated 3 July 2026 without notice or hearing.',
      grounds: 'The cancellation is in breach of the principles of natural justice and of the Corporation’s own bye-laws, which require a show-cause notice and a personal hearing.',
      relief: 'Set aside the cancellation order dated 3 July 2026 and restore the trade licence',
      interimRelief: 'Stay the operation of the cancellation order pending disposal',
    }],
    ['ADVISORY — internal memorandum', 'MEMORANDUM', 'DISTRICT_COURT', 'english', {
      to: 'Ms. Anjali Deshpande, Head of Legal, Nirmal Logistics Private Limited',
      from: 'Advocate R. Venkatesh, Counsel',
      subject: 'Exposure under the vendor agreement following repeated rejected consignments',
      background: 'Three consecutive consignments from Shree Ganesh Packaging LLP were rejected for a defect rate above 2%. The company wishes to terminate immediately and source elsewhere.',
      legalQuestion: 'Whether immediate termination is available without the 90-day notice, and what damages the company may claim.',
      applicableLaws: 'Sections 39, 55 and 73 of the Indian Contract Act, 1872',
      conclusion: 'Advise on the safest route to termination and quantify the exposure if the vendor disputes it.',
    }],
    ['INTERIM — stay of an impugned order', 'STAY_APPLICATION', 'ALLAHABAD_HIGH_COURT', 'english', {
      applicantName: 'Lakshmi Narayanan, aged 58 years, S/o Late Subramanian',
      respondentName: 'The Executive Officer, Madurai Municipal Corporation',
      mainCaseNo: 'Civil Misc. Writ Petition No. 4471 of 2026',
      impugnedOrder: 'Order cancelling trade licence no. MMC/TL/1994/882 and directing closure of the premises within seven days',
      orderDate: '3 July 2026',
      irreparableHarm: 'The store is the sole source of livelihood for the applicant and four employees. Closure would end a business run for thirty-two years and cannot be undone by damages.',
      balanceConvenience: 'The Corporation suffers nothing if the licence continues pending hearing; the applicant loses his entire livelihood if it does not.',
      primafacieCase: 'The order was passed without any show-cause notice, in breach of the Corporation’s own bye-law 14(3).',
    }],
    ['SWORN — affidavit in support', 'AFFIDAVIT', 'ALLAHABAD_HIGH_COURT', 'english', {
      deponentName: 'Lakshmi Narayanan',
      deponentFather: 'Late Subramanian',
      deponentAge: '58',
      deponentAddress: '45 Gandhi Street, Madurai 625001, Tamil Nadu',
      purpose: 'In support of the application for stay of the licence cancellation order',
      caseRef: 'Civil Misc. Writ Petition No. 4471 of 2026',
      statements: 'That I have held trade licence no. MMC/TL/1994/882 since 1994. That no show-cause notice was ever served on me. That I came to know of the cancellation only on 9 July 2026 when the inspector visited the premises. That the store is my only source of income.',
    }],
    ['CONSTITUTIONAL — public interest litigation', 'PIL', 'ALLAHABAD_HIGH_COURT', 'english', {
      petitionerName: 'Jan Seva Samiti, a registered society through its Secretary Vinod Kumar Tripathi',
      publicIssue: 'Untreated effluent from a tannery cluster discharging into the Ramganga at Jajmau, Kanpur',
      affectedParties: 'Approximately 40,000 residents of eleven villages downstream who draw drinking water from the river',
      respondents: 'State of Uttar Pradesh, the Uttar Pradesh Pollution Control Board, and the Kanpur Nagar Nigam',
      facts: 'The common effluent treatment plant at Jajmau has been non-functional since November 2025. Testing by the Board in February 2026 recorded chromium at eleven times the permissible limit. Complaints made in December 2025 and March 2026 went unanswered.',
      officialInaction: 'No closure notice has been issued to any unit and the treatment plant remains unrepaired ten months on.',
      legalViolations: 'Article 21 of the Constitution, Sections 24 and 33A of the Water (Prevention and Control of Pollution) Act, 1974',
      reliefSought: 'Direct restoration of the treatment plant, independent testing, and a compliance report to this Court',
    }],
    ['STATUTORY — request for information', 'RTI_APPLICATION', 'DISTRICT_COURT', 'english', {
      applicantName: 'Vinod Kumar Tripathi',
      applicantAddress: '31 Shastri Nagar, Kanpur Nagar 208005, Uttar Pradesh',
      department: 'Uttar Pradesh Pollution Control Board, Regional Office Kanpur',
      cpio: 'The Central Public Information Officer, UPPCB Regional Office, Kanpur Nagar',
      infoSought: 'Copies of all effluent test reports for the Jajmau common effluent treatment plant; the file notings on its maintenance contract; and copies of any show-cause or closure notices issued to tannery units in the cluster.',
      period: '1 November 2025 to 31 August 2026',
      purpose: 'To ascertain what action was taken on complaints regarding discharge into the Ramganga',
      mode: 'Certified photocopies by post',
    }],
    ['CONVEYANCE — sale of immovable property', 'SALE_DEED', 'DISTRICT_COURT', 'english', {
      vendorName: 'Prakash Rao Deshmukh, aged 64 years, S/o Late Ganpat Rao Deshmukh, R/o 12 Shivaji Nagar, Nagpur 440010',
      purchaserName: 'Sneha Vikram Joshi, aged 37 years, W/o Vikram Joshi, R/o 6 Dharampeth, Nagpur 440010',
      propertyDescription: 'Residential plot admeasuring 2,400 sq ft bearing Plot No. 44, Survey No. 118/2, Mouza Wadi, Nagpur, together with the structure standing thereon',
      boundaries: 'North: Plot No. 43. South: Plot No. 45. East: 30 ft internal road. West: open nala',
      consideration: 'Rs. 92,00,000 (Rupees Ninety Two Lakhs only)',
      paymentMode: 'Rs. 5,00,000 paid as earnest money by cheque no. 220118 dated 4 July 2026; balance Rs. 87,00,000 by RTGS on execution',
      possession: 'Vacant physical possession handed over on the date of execution',
      titleHistory: 'The vendor acquired the property under a registered sale deed dated 11 March 1998, document no. 2214/1998, registered with the Sub-Registrar, Nagpur',
      encumbrance: 'The property is free from all encumbrances, charges and litigation',
    }],
    ['ADVISORY — written opinion to a client', 'LEGAL_OPINION', 'DISTRICT_COURT', 'english', {
      advocateName: 'Advocate R. Venkatesh, Enrolment No. MAH/2214/2009',
      clientName: 'Nirmal Logistics Private Limited',
      matterSubject: 'Enforceability of a two-year non-compete covenant against a departing operations manager',
      facts: 'The employee resigned on 12 August 2026 after four years. His contract contains a covenant restraining him from joining any competing logistics business anywhere in India for 24 months. He has accepted an offer from a competitor in Pune.',
      documentsPerused: 'Employment agreement dated 3 May 2022; resignation letter dated 12 August 2026; the offer letter from the competitor',
      legalQuestion: 'Whether the non-compete covenant is enforceable after termination of employment, and what remedies are available.',
      applicableLaws: 'Section 27 of the Indian Contract Act, 1872',
      jurisdiction: 'Courts at Mumbai per the contract',
      riskLevel: 'The client wants a candid assessment, not reassurance',
    }],
    ['CORRESPONDENCE — letter to opposing counsel', 'LEGAL_EMAIL', 'DISTRICT_COURT', 'english', {
      purpose: 'Seek consent to an adjournment and propose a schedule for exchange of documents',
      tone: 'Firm but courteous',
      recipientName: 'Advocate Nandita Sharma, Counsel for the Respondent',
      recipientEmail: 'nandita.sharma@example.in',
      senderName: 'Advocate R. Venkatesh',
      senderDesignation: 'Counsel for the Petitioner',
      senderContact: '+91 98200 00000',
      subjectHint: 'Civil Misc. Writ Petition No. 4471 of 2026 — listing on 30 September 2026',
      caseRef: 'Civil Misc. Writ Petition No. 4471 of 2026',
      facts: 'The matter is listed for framing of issues on 30 September 2026. Our client is out of the country until 8 October and his affidavit of documents cannot be sworn before then.',
      ask: 'Consent to a short adjournment to the week of 14 October, and agreement to exchange documents by 20 October',
      deadline: 'A reply by 22 September 2026 so that a joint request can be made',
      attachments: 'Draft joint application for adjournment',
    }],
  ],
}

const mode = process.argv[2] || 'english'
const set = CASES[mode]
if (!set) { console.error('mode must be english | languages | rest'); process.exit(1) }

for (const [label, type, court, lang, fields] of set) {
  const t0 = Date.now()
  process.stdout.write(`\n${label}\n  ${type} / ${court} / ${lang}\n`)
  try {
    const text = await generateLegalDocument(type, asDetails(fields), court, lang,
                                             { isPro: true, operation: 'bench' })
    const body = String(text || '')
    const words = body.trim().split(/\s+/).filter(Boolean).length
    const file = join(OUT, `${mode}-${type}-${lang}.txt`)
    writeFileSync(file, body)

    const hit = Object.entries(MARKERS)
      .filter(([k]) => k !== 'markdown' && k !== 'placeholder')
      .filter(([, re]) => re.test(body)).map(([k]) => k)
    const miss = Object.keys(MARKERS)
      .filter(k => k !== 'markdown' && k !== 'placeholder' && !hit.includes(k))

    console.log(`  ${words} words in ${((Date.now()-t0)/1000).toFixed(0)}s -> ${file}`)
    console.log(`  has    : ${hit.join(', ') || '(none)'}`)
    console.log(`  MISSING: ${miss.join(', ') || '(nothing)'}`)
    if (MARKERS.markdown.test(body)) console.log('  !! markdown leaked into the filing')
  } catch (e) {
    console.log(`  FAILED: ${e?.code || ''} ${String(e?.message).slice(0, 110)}`)
  }
}
