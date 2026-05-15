// ─────────────────────────────────────────────────────────────────
//  verify-copy-outputs.mjs
//  Verification harness for the per-service "Copy to clipboard"
//  feature. Imports the ACTUAL shipping logic (lib/copy-presets.js +
//  lib/document-fields.js) and runs it against a representative
//  sample draft for every one of the 20 document services, then
//  writes a Markdown report.
//
//  Run:  node verify-copy-outputs.mjs
//  (also re-run from the project root after any change to the presets)
// ─────────────────────────────────────────────────────────────────

import { writeFileSync } from 'fs'
import { COPY_PRESETS, DEFAULT_PRESET, getCopyPreset, buildText, FORMATS } from './lib/copy-presets.js'
import { DOC_FIELDS, DOC_FIELD_KEYS } from './lib/document-fields.js'

// A representative sample draft for each service. Each one deliberately
// contains a **markdown bold** artefact, a "## heading" artefact and an
// over-long run of blank lines, so the effect of the "Clean / plain"
// format is visible in the report.
const SAMPLES = {
  LEGAL_NOTICE: {
    title: 'Legal Notice — Ramesh Gupta to Sunil Traders',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## LEGAL NOTICE

To,
Sunil Traders, 14 Civil Lines, Prayagraj

Under instructions from my client **Sri Ramesh Gupta**, I hereby call upon you to pay Rs. 2,50,000/- outstanding against Invoice No. 88/2025 within **15 days** of receipt of this notice, failing which my client shall be constrained to initiate civil and criminal proceedings at your risk as to cost and consequences.



Adv. S. P. Singh`,
  },
  CASE_BRIEF: {
    title: 'Case Brief — Gupta v. Sunil Traders',
    court: 'District Court, Prayagraj', date: '15 May 2026',
    content: `## CASE BRIEF

**Parties:** Ramesh Gupta (Plaintiff) v. Sunil Traders (Defendant)
**Issue:** Recovery of Rs. 2,50,000 for goods supplied.
**Rule:** Sections 73-74, Indian Contract Act, 1872.
**Application:** Invoice and delivery challans prove supply; defendant has not denied receipt.
**Conclusion:** Strong case for a decree of recovery with interest.`,
  },
  CONTRACT: {
    title: 'Service Agreement — Acme Pvt Ltd & Verma Consultants',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## SERVICE AGREEMENT

This Agreement is made between **Acme Pvt. Ltd.** ("Client") and **Verma Consultants** ("Consultant").

1. Scope: Consultant shall provide monthly accounting services.
2. Fee: Rs. 40,000 per month, payable by NEFT on the 7th.
3. Term: 12 months from the date of signing.`,
  },
  PETITION: {
    title: 'Civil Petition — Anita Devi v. Municipal Board',
    court: 'District Court, Prayagraj', date: '15 May 2026',
    content: `## PETITION

The Petitioner **Smt. Anita Devi** most respectfully submits:

1. That the Petitioner owns House No. 22, Katra, Prayagraj.
2. That the Respondent Municipal Board issued a demolition notice dated 02.04.2026 without hearing.
3. PRAYER: that the notice be quashed and the Respondent restrained from demolition.`,
  },
  MEMORANDUM: {
    title: 'Legal Memorandum — Tenancy Rights',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## LEGAL MEMORANDUM

**To:** Managing Partner   **From:** Adv. S. P. Singh   **Subject:** Tenant eviction query

The question is whether a tenant in occupation since 2009 can be evicted for bona fide need. On the facts, the landlord must strictly prove bona fide need under the U.P. Urban Buildings Act, 1972.`,
  },
  WRIT_PETITION: {
    title: 'Writ Petition (Mandamus) — Rajesh Singh v. State of U.P.',
    court: 'Allahabad HC – Prayagraj', date: '15 May 2026',
    content: `## WRIT PETITION UNDER ARTICLE 226

**Petitioner:** Rajesh Singh   **Respondent:** State of U.P. through Principal Secretary

The Petitioner seeks a writ of **mandamus** directing the Respondents to release his withheld pension. The arbitrary withholding violates Articles 14 and 21 of the Constitution of India, 1950.`,
  },
  VAKALATNAMA: {
    title: 'Vakalatnama — Rajesh Singh',
    court: 'Allahabad HC – Prayagraj', date: '15 May 2026',
    content: `## VAKALATNAMA

I, **Rajesh Singh** s/o Late Mahesh Singh, do hereby appoint **Adv. S. P. Singh** (Enrolment No. UP/1234/2010) to appear, act and plead on my behalf in Writ-A No. 4521 of 2026.`,
  },
  BAIL_APPLICATION: {
    title: 'Bail Application — State v. Imran Khan',
    court: 'District & Sessions Court, Prayagraj', date: '15 May 2026',
    content: `## BAIL APPLICATION UNDER SECTION 439 CrPC

The applicant **Imran Khan** s/o Yusuf Khan is in custody since 01.03.2026 in connection with FIR No. 145/2026, P.S. Civil Lines, under Sections 420 and 406 IPC.

Grounds: false implication, no criminal antecedents, and the applicant is cooperating with the investigation.`,
  },
  STAY_APPLICATION: {
    title: 'Stay Application — Anita Devi v. Municipal Board',
    court: 'District Court, Prayagraj', date: '15 May 2026',
    content: `## STAY APPLICATION

The applicant prays for a **stay** of operation of the demolition order dated 02.04.2026 passed in Case No. 56/2026, pending disposal of the main matter. Irreparable harm will be caused if the structure is demolished before adjudication.`,
  },
  AFFIDAVIT: {
    title: 'Affidavit — Anita Devi',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## AFFIDAVIT

I, **Smt. Anita Devi** w/o Sri Mohan Lal, aged 47 years, r/o House No. 22, Katra, Prayagraj, do hereby solemnly affirm and state:

1. That I am the deponent and competent to swear this affidavit.
2. That the facts stated in the accompanying petition are true to my knowledge.`,
  },
  PIL: {
    title: 'PIL — Clean Ganga Front',
    court: 'Allahabad HC – Prayagraj', date: '15 May 2026',
    content: `## PUBLIC INTEREST LITIGATION

The Petitioner organisation **Clean Ganga Front** brings to the notice of this Hon'ble Court the unchecked discharge of untreated sewage into the river at Prayagraj, affecting over 2 lakh residents and violating the right to a clean environment under Article 21.`,
  },
  RTI_APPLICATION: {
    title: 'RTI Application — Road Repair Funds',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005

To: The CPIO, Public Works Department, Prayagraj

The applicant **Ramesh Gupta** seeks the following information:
1. Total funds sanctioned for repair of Katra Road in FY 2024-25.
2. Copies of work orders and completion certificates.`,
  },
  CONSUMER_COMPLAINT: {
    title: 'Consumer Complaint — Gupta v. QuickFix Appliances',
    court: 'District Consumer Commission, Prayagraj', date: '15 May 2026',
    content: `## CONSUMER COMPLAINT

The Complainant **Ramesh Gupta** purchased a refrigerator from QuickFix Appliances on 10.01.2026 for Rs. 38,000. The unit stopped cooling within 20 days and repeated complaints went unattended — a clear **deficiency in service**.

Relief: refund of Rs. 38,000 with compensation of Rs. 15,000.`,
  },
  DIVORCE_PETITION: {
    title: 'Divorce Petition — Priya Sharma v. Anil Sharma',
    court: 'Family Court, Prayagraj', date: '15 May 2026',
    content: `## PETITION FOR DISSOLUTION OF MARRIAGE

The Petitioner **Smt. Priya Sharma** was married to the Respondent **Sri Anil Sharma** on 12.02.2018 at Prayagraj. The parties have lived separately since 05.06.2024. The Petitioner seeks a decree of divorce on the ground of cruelty under Section 13(1)(ia) of the Hindu Marriage Act, 1955.`,
  },
  RENT_AGREEMENT: {
    title: 'Rent Agreement — 22 Katra, Prayagraj',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## RENT AGREEMENT

This Agreement is between **Sri Mohan Lal** ("Landlord") and **Sri Ravi Kumar** ("Tenant") for House No. 22, Katra, Prayagraj.

Rent: Rs. 12,000 per month, due on the 5th.
Deposit: Rs. 36,000, refundable on vacation.
Term: 11 months from 01.06.2026.`,
  },
  SALE_DEED: {
    title: 'Sale Deed — Plot 47, Naini',
    court: 'Sub-Registrar, Prayagraj', date: '15 May 2026',
    content: `## SALE DEED

This Sale Deed is executed by **Sri Mohan Lal** ("Vendor") in favour of **Sri Ravi Kumar** ("Purchaser") for Plot No. 47, Naini, Prayagraj, admeasuring 1,200 sq. ft.

Sale consideration: Rs. 50,00,000 (Rupees Fifty Lakhs only), paid by RTGS.`,
  },
  CHEQUE_BOUNCE: {
    title: 'Cheque Bounce Notice — Gupta to Anil Sharma',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

Cheque No. 004512 dated 02.04.2026 for Rs. 1,00,000 drawn on SBI, Civil Lines, issued by **Sri Anil Sharma** in favour of my client was returned unpaid for **"Funds Insufficient"** vide memo dated 08.04.2026.

You are called upon to pay the said amount within 15 days.`,
  },
  LEGAL_OPINION: {
    title: 'Legal Opinion — Marketability of Plot 47, Naini',
    court: 'Prayagraj', date: '15 May 2026',
    content: `## LEGAL OPINION

**Addressee:** Sri Ravi Kumar   **Subject:** Marketability of title to Plot No. 47, Naini

On a perusal of the chain of title for the last 30 years and the encumbrance certificate, the title of the Vendor is found to be clear and marketable, subject to obtaining the latest mutation entry.`,
  },
  FIR_COMPLAINT: {
    title: 'FIR Complaint — Theft at 22 Katra',
    court: 'P.S. Civil Lines, Prayagraj', date: '15 May 2026',
    content: `## WRITTEN COMPLAINT FOR REGISTRATION OF FIR

To: The Station House Officer, P.S. Civil Lines, Prayagraj

I, **Ramesh Gupta**, report that on the night of 12.05.2026 unknown persons broke into my shop at 14 Civil Lines and stole cash and goods worth Rs. 3,00,000. I request that an FIR under Section 380 IPC be registered.`,
  },
  LEGAL_EMAIL: {
    title: 'Email — Hearing reminder to client',
    court: 'Allahabad HC – Prayagraj', date: '15 May 2026',
    content: `To: rajesh.singh@example.com
Subject: Reminder — Hearing in Writ-A No. 4521/2026 on 22 May 2026

Dear Mr. Singh,

This is to remind you that your matter is listed for **22 May 2026**. Please reach the High Court by 9:30 AM and carry your original ID proof.

Regards,
Adv. S. P. Singh`,
  },
}

// ─── Run the actual shipping logic over every service ─────────────
const out = []
out.push('# LexForge AI — Per-Service "Copy to Clipboard" — Verification Report')
out.push('')
out.push(`Generated: ${new Date().toISOString().slice(0, 10)}`)
out.push('')
out.push('This report runs the **actual shipping code** — `lib/copy-presets.js` ' +
  'and `lib/document-fields.js` — against a representative sample draft for ' +
  'every one of the 20 document services, and shows what the **Copy** button ' +
  'places on the clipboard in each of its three formats.')
out.push('')
out.push('---')
out.push('')

let pass = 0
let fail = 0
const problems = []

DOC_FIELD_KEYS.forEach((type, idx) => {
  const preset = getCopyPreset(type)
  const sample = SAMPLES[type]
  const usedDefault = preset === DEFAULT_PRESET
  const meta = sample ? { title: sample.title, courtLabel: sample.court, dateLabel: sample.date } : {}
  const raw = sample ? sample.content : ''

  // Checks
  const checks = []
  checks.push(['has service-specific framing (not the generic default)', !usedDefault])
  checks.push(['button label is service-specific', /Copy /.test(`Copy ${preset.noun}`) && preset.noun !== 'document'])
  checks.push(['has a practical guidance tip', !!preset.tip && preset.tip.length > 20])
  checks.push(['has an intake field schema (folder/file extraction target)', Array.isArray(DOC_FIELDS[type]) && DOC_FIELDS[type].length > 0])
  checks.push(['sample draft provided', !!sample])

  const full   = buildText('full',   raw, preset, meta)
  const clean  = buildText('clean',  raw, preset, meta)
  const header = buildText('header', raw, preset, meta)

  checks.push(['"clean" strips ## / ** markdown artefacts', !/(\*\*|^#{1,6}\s)/m.test(clean)])
  checks.push(['"clean" collapses 3+ blank lines', !/\n{3,}/.test(clean)])
  checks.push(['"with header" prepends the cover block', header.startsWith(preset.docLabel.toUpperCase())])
  checks.push(['"full" preserves the draft verbatim', full === raw.replace(/\r\n/g, '\n').trim()])

  const allOk = checks.every(c => c[1])
  if (allOk) pass++; else { fail++; problems.push(type) }

  out.push(`## ${idx + 1}. ${type}  ${allOk ? '✅' : '❌'}`)
  out.push('')
  out.push(`| Aspect | Value |`)
  out.push(`| --- | --- |`)
  out.push(`| Card heading | **${preset.header}** |`)
  out.push(`| Button label | \`Copy ${preset.noun}\` |`)
  out.push(`| Guidance tip | ${preset.tip} |`)
  out.push(`| Intake fields (folder/file auto-fill target) | ${(DOC_FIELDS[type] || []).map(f => f.name).join(', ')} |`)
  out.push('')
  out.push('**Checks**')
  out.push('')
  checks.forEach(([name, ok]) => out.push(`- ${ok ? '✅' : '❌'} ${name}`))
  out.push('')
  out.push('<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>')
  out.push('')
  out.push('```')
  out.push(full)
  out.push('```')
  out.push('</details>')
  out.push('')
  out.push('<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>')
  out.push('')
  out.push('```')
  out.push(clean)
  out.push('```')
  out.push('</details>')
  out.push('')
  out.push('<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>')
  out.push('')
  out.push('```')
  out.push(header)
  out.push('```')
  out.push('</details>')
  out.push('')
  out.push('---')
  out.push('')
})

const summary = `**Result: ${pass}/${DOC_FIELD_KEYS.length} services pass all checks.**` +
  (fail ? `  Problems: ${problems.join(', ')}` : '  Every one of the 20 services produces service-specific, correctly-formatted copy output.')

// Insert summary near the top (after the intro) and also at the end.
const summaryBlock = ['## Summary', '', summary, '', '---', '']
out.splice(8, 0, ...summaryBlock)
out.push(summary)
out.push('')

const report = out.join('\n')
writeFileSync(new URL('./verify-copy-outputs-report.md', import.meta.url), report)
console.log(summary)
console.log('Report written: verify-copy-outputs-report.md')
