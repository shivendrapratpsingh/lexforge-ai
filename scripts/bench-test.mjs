// Generate a spread of real filings and save them for reading.
//
//   node scripts/bench-test.mjs english     -> court-level spread, English
//   node scripts/bench-test.mjs languages   -> one filing in each drafting language
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
}

const mode = process.argv[2] || 'english'
const set = CASES[mode]
if (!set) { console.error('mode must be english | languages'); process.exit(1) }

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
