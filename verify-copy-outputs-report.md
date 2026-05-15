# LexForge AI — Per-Service "Copy to Clipboard" — Verification Report

Generated: 2026-05-15

This report runs the **actual shipping code** — `lib/copy-presets.js` and `lib/document-fields.js` — against a representative sample draft for every one of the 20 document services, and shows what the **Copy** button places on the clipboard in each of its three formats.

---

## Summary

**Result: 20/20 services pass all checks.**  Every one of the 20 services produces service-specific, correctly-formatted copy output.

---

## 1. LEGAL_NOTICE  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Legal Notice** |
| Button label | `Copy legal notice` |
| Guidance tip | Paste onto your firm letterhead in Word, sign it, and dispatch by Registered Post A/D (and email). Keep the postal receipt — it proves service. |
| Intake fields (folder/file auto-fill target) | senderName, senderAddress, recipientName, recipientAddress, subject, grievance, demand, deadline, legalBasis |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## LEGAL NOTICE

To,
Sunil Traders, 14 Civil Lines, Prayagraj

Under instructions from my client **Sri Ramesh Gupta**, I hereby call upon you to pay Rs. 2,50,000/- outstanding against Invoice No. 88/2025 within **15 days** of receipt of this notice, failing which my client shall be constrained to initiate civil and criminal proceedings at your risk as to cost and consequences.



Adv. S. P. Singh
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
LEGAL NOTICE

To,
Sunil Traders, 14 Civil Lines, Prayagraj

Under instructions from my client Sri Ramesh Gupta, I hereby call upon you to pay Rs. 2,50,000/- outstanding against Invoice No. 88/2025 within 15 days of receipt of this notice, failing which my client shall be constrained to initiate civil and criminal proceedings at your risk as to cost and consequences.

Adv. S. P. Singh
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
LEGAL NOTICE
Legal Notice — Ramesh Gupta to Sunil Traders
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
LEGAL NOTICE

To,
Sunil Traders, 14 Civil Lines, Prayagraj

Under instructions from my client Sri Ramesh Gupta, I hereby call upon you to pay Rs. 2,50,000/- outstanding against Invoice No. 88/2025 within 15 days of receipt of this notice, failing which my client shall be constrained to initiate civil and criminal proceedings at your risk as to cost and consequences.

Adv. S. P. Singh
```
</details>

---

## 2. CASE_BRIEF  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Case Brief** |
| Button label | `Copy case brief` |
| Guidance tip | Paste into your case file, brief sheet or an email to a senior/junior. The IRAC structure stays intact when you use "Clean / plain". |
| Intake fields (folder/file auto-fill target) | caseName, caseNo, facts, issues, petitionerArgs, respondentArgs, applicableLaws, relief |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## CASE BRIEF

**Parties:** Ramesh Gupta (Plaintiff) v. Sunil Traders (Defendant)
**Issue:** Recovery of Rs. 2,50,000 for goods supplied.
**Rule:** Sections 73-74, Indian Contract Act, 1872.
**Application:** Invoice and delivery challans prove supply; defendant has not denied receipt.
**Conclusion:** Strong case for a decree of recovery with interest.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
CASE BRIEF

Parties: Ramesh Gupta (Plaintiff) v. Sunil Traders (Defendant)
Issue: Recovery of Rs. 2,50,000 for goods supplied.
Rule: Sections 73-74, Indian Contract Act, 1872.
Application: Invoice and delivery challans prove supply; defendant has not denied receipt.
Conclusion: Strong case for a decree of recovery with interest.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
CASE BRIEF
Case Brief — Gupta v. Sunil Traders
Court: District Court, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
CASE BRIEF

Parties: Ramesh Gupta (Plaintiff) v. Sunil Traders (Defendant)
Issue: Recovery of Rs. 2,50,000 for goods supplied.
Rule: Sections 73-74, Indian Contract Act, 1872.
Application: Invoice and delivery challans prove supply; defendant has not denied receipt.
Conclusion: Strong case for a decree of recovery with interest.
```
</details>

---

## 3. CONTRACT  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Contract** |
| Button label | `Copy contract` |
| Guidance tip | Paste into Word for execution — print on stamp paper of the correct value, then both parties sign each page before two witnesses. |
| Intake fields (folder/file auto-fill target) | partyA, partyB, purpose, terms, payment, duration, termination, arbitration |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## SERVICE AGREEMENT

This Agreement is made between **Acme Pvt. Ltd.** ("Client") and **Verma Consultants** ("Consultant").

1. Scope: Consultant shall provide monthly accounting services.
2. Fee: Rs. 40,000 per month, payable by NEFT on the 7th.
3. Term: 12 months from the date of signing.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
SERVICE AGREEMENT

This Agreement is made between Acme Pvt. Ltd. ("Client") and Verma Consultants ("Consultant").

1. Scope: Consultant shall provide monthly accounting services.
2. Fee: Rs. 40,000 per month, payable by NEFT on the 7th.
3. Term: 12 months from the date of signing.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
CONTRACT
Service Agreement — Acme Pvt Ltd & Verma Consultants
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
SERVICE AGREEMENT

This Agreement is made between Acme Pvt. Ltd. ("Client") and Verma Consultants ("Consultant").

1. Scope: Consultant shall provide monthly accounting services.
2. Fee: Rs. 40,000 per month, payable by NEFT on the 7th.
3. Term: 12 months from the date of signing.
```
</details>

---

## 4. PETITION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Petition** |
| Button label | `Copy petition` |
| Guidance tip | Paste into your court template, check the cause-title and court name, attach the affidavit and annexures, then file. |
| Intake fields (folder/file auto-fill target) | petitionerName, respondentName, jurisdiction, facts, grounds, relief, interimRelief |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## PETITION

The Petitioner **Smt. Anita Devi** most respectfully submits:

1. That the Petitioner owns House No. 22, Katra, Prayagraj.
2. That the Respondent Municipal Board issued a demolition notice dated 02.04.2026 without hearing.
3. PRAYER: that the notice be quashed and the Respondent restrained from demolition.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
PETITION

The Petitioner Smt. Anita Devi most respectfully submits:

1. That the Petitioner owns House No. 22, Katra, Prayagraj.
2. That the Respondent Municipal Board issued a demolition notice dated 02.04.2026 without hearing.
3. PRAYER: that the notice be quashed and the Respondent restrained from demolition.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
PETITION
Civil Petition — Anita Devi v. Municipal Board
Court: District Court, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
PETITION

The Petitioner Smt. Anita Devi most respectfully submits:

1. That the Petitioner owns House No. 22, Katra, Prayagraj.
2. That the Respondent Municipal Board issued a demolition notice dated 02.04.2026 without hearing.
3. PRAYER: that the notice be quashed and the Respondent restrained from demolition.
```
</details>

---

## 5. MEMORANDUM  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Memorandum** |
| Button label | `Copy memorandum` |
| Guidance tip | Paste into an internal note or email to the addressee. "With header" adds the To / From / Subject cover block. |
| Intake fields (folder/file auto-fill target) | to, from, subject, background, legalQuestion, applicableLaws, conclusion |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## LEGAL MEMORANDUM

**To:** Managing Partner   **From:** Adv. S. P. Singh   **Subject:** Tenant eviction query

The question is whether a tenant in occupation since 2009 can be evicted for bona fide need. On the facts, the landlord must strictly prove bona fide need under the U.P. Urban Buildings Act, 1972.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
LEGAL MEMORANDUM

To: Managing Partner   From: Adv. S. P. Singh   Subject: Tenant eviction query

The question is whether a tenant in occupation since 2009 can be evicted for bona fide need. On the facts, the landlord must strictly prove bona fide need under the U.P. Urban Buildings Act, 1972.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
LEGAL MEMORANDUM
Legal Memorandum — Tenancy Rights
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
LEGAL MEMORANDUM

To: Managing Partner   From: Adv. S. P. Singh   Subject: Tenant eviction query

The question is whether a tenant in occupation since 2009 can be evicted for bona fide need. On the facts, the landlord must strictly prove bona fide need under the U.P. Urban Buildings Act, 1972.
```
</details>

---

## 6. WRIT_PETITION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Writ Petition** |
| Button label | `Copy writ petition` |
| Guidance tip | Paste into your HC writ template — verify the Article 226 cause-title, array of respondents and the prayer before filing. |
| Intake fields (folder/file auto-fill target) | writType, petitionCategory, petitionerName, respondentName, impugnedOrder, impugnedDate, facts, grounds, legalProvisions, relief |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## WRIT PETITION UNDER ARTICLE 226

**Petitioner:** Rajesh Singh   **Respondent:** State of U.P. through Principal Secretary

The Petitioner seeks a writ of **mandamus** directing the Respondents to release his withheld pension. The arbitrary withholding violates Articles 14 and 21 of the Constitution of India, 1950.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
WRIT PETITION UNDER ARTICLE 226

Petitioner: Rajesh Singh   Respondent: State of U.P. through Principal Secretary

The Petitioner seeks a writ of mandamus directing the Respondents to release his withheld pension. The arbitrary withholding violates Articles 14 and 21 of the Constitution of India, 1950.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
WRIT PETITION
Writ Petition (Mandamus) — Rajesh Singh v. State of U.P.
Court: Allahabad HC – Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
WRIT PETITION UNDER ARTICLE 226

Petitioner: Rajesh Singh   Respondent: State of U.P. through Principal Secretary

The Petitioner seeks a writ of mandamus directing the Respondents to release his withheld pension. The arbitrary withholding violates Articles 14 and 21 of the Constitution of India, 1950.
```
</details>

---

## 7. VAKALATNAMA  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Vakalatnama** |
| Button label | `Copy vakalatnama` |
| Guidance tip | Paste into Word, print, and have the client sign. Affix the requisite welfare-stamp and the advocate accepts below. |
| Intake fields (folder/file auto-fill target) | advocateName, enrollmentNo, clientName, clientFather, clientAge, clientAddress, caseName, caseNo |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## VAKALATNAMA

I, **Rajesh Singh** s/o Late Mahesh Singh, do hereby appoint **Adv. S. P. Singh** (Enrolment No. UP/1234/2010) to appear, act and plead on my behalf in Writ-A No. 4521 of 2026.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
VAKALATNAMA

I, Rajesh Singh s/o Late Mahesh Singh, do hereby appoint Adv. S. P. Singh (Enrolment No. UP/1234/2010) to appear, act and plead on my behalf in Writ-A No. 4521 of 2026.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
VAKALATNAMA
Vakalatnama — Rajesh Singh
Court: Allahabad HC – Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
VAKALATNAMA

I, Rajesh Singh s/o Late Mahesh Singh, do hereby appoint Adv. S. P. Singh (Enrolment No. UP/1234/2010) to appear, act and plead on my behalf in Writ-A No. 4521 of 2026.
```
</details>

---

## 8. BAIL_APPLICATION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Bail Application** |
| Button label | `Copy bail application` |
| Guidance tip | Paste into your court e-filing template. Re-check the FIR number, sections and the police-station/district before submission. |
| Intake fields (folder/file auto-fill target) | applicantName, fatherName, applicantAge, address, firNo, offence, custodyDate, bailType, bailGrounds, suretyDetails |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## BAIL APPLICATION UNDER SECTION 439 CrPC

The applicant **Imran Khan** s/o Yusuf Khan is in custody since 01.03.2026 in connection with FIR No. 145/2026, P.S. Civil Lines, under Sections 420 and 406 IPC.

Grounds: false implication, no criminal antecedents, and the applicant is cooperating with the investigation.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
BAIL APPLICATION UNDER SECTION 439 CrPC

The applicant Imran Khan s/o Yusuf Khan is in custody since 01.03.2026 in connection with FIR No. 145/2026, P.S. Civil Lines, under Sections 420 and 406 IPC.

Grounds: false implication, no criminal antecedents, and the applicant is cooperating with the investigation.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
BAIL APPLICATION
Bail Application — State v. Imran Khan
Court: District & Sessions Court, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
BAIL APPLICATION UNDER SECTION 439 CrPC

The applicant Imran Khan s/o Yusuf Khan is in custody since 01.03.2026 in connection with FIR No. 145/2026, P.S. Civil Lines, under Sections 420 and 406 IPC.

Grounds: false implication, no criminal antecedents, and the applicant is cooperating with the investigation.
```
</details>

---

## 9. STAY_APPLICATION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Stay Application** |
| Button label | `Copy stay application` |
| Guidance tip | Paste alongside the main matter — confirm the impugned order date and that it is supported by an affidavit. |
| Intake fields (folder/file auto-fill target) | applicantName, respondentName, mainCaseNo, impugnedOrder, orderDate, irreparableHarm, balanceConvenience, primafacieCase |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## STAY APPLICATION

The applicant prays for a **stay** of operation of the demolition order dated 02.04.2026 passed in Case No. 56/2026, pending disposal of the main matter. Irreparable harm will be caused if the structure is demolished before adjudication.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
STAY APPLICATION

The applicant prays for a stay of operation of the demolition order dated 02.04.2026 passed in Case No. 56/2026, pending disposal of the main matter. Irreparable harm will be caused if the structure is demolished before adjudication.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
STAY APPLICATION
Stay Application — Anita Devi v. Municipal Board
Court: District Court, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
STAY APPLICATION

The applicant prays for a stay of operation of the demolition order dated 02.04.2026 passed in Case No. 56/2026, pending disposal of the main matter. Irreparable harm will be caused if the structure is demolished before adjudication.
```
</details>

---

## 10. AFFIDAVIT  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Affidavit** |
| Button label | `Copy affidavit` |
| Guidance tip | Paste into Word above the verification clause. The deponent signs each page; get it sworn/attested before the Oath Commissioner or Notary. |
| Intake fields (folder/file auto-fill target) | deponentName, deponentFather, deponentAge, deponentAddress, purpose, caseRef, statements |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## AFFIDAVIT

I, **Smt. Anita Devi** w/o Sri Mohan Lal, aged 47 years, r/o House No. 22, Katra, Prayagraj, do hereby solemnly affirm and state:

1. That I am the deponent and competent to swear this affidavit.
2. That the facts stated in the accompanying petition are true to my knowledge.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
AFFIDAVIT

I, Smt. Anita Devi w/o Sri Mohan Lal, aged 47 years, r/o House No. 22, Katra, Prayagraj, do hereby solemnly affirm and state:

1. That I am the deponent and competent to swear this affidavit.
2. That the facts stated in the accompanying petition are true to my knowledge.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
AFFIDAVIT
Affidavit — Anita Devi
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
AFFIDAVIT

I, Smt. Anita Devi w/o Sri Mohan Lal, aged 47 years, r/o House No. 22, Katra, Prayagraj, do hereby solemnly affirm and state:

1. That I am the deponent and competent to swear this affidavit.
2. That the facts stated in the accompanying petition are true to my knowledge.
```
</details>

---

## 11. PIL  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy PIL** |
| Button label | `Copy PIL` |
| Guidance tip | Paste into your HC template — make sure locus standi, the public-interest question and the supporting documents are in order. |
| Intake fields (folder/file auto-fill target) | petitionerName, publicIssue, affectedParties, respondents, facts, officialInaction, legalViolations, reliefSought |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## PUBLIC INTEREST LITIGATION

The Petitioner organisation **Clean Ganga Front** brings to the notice of this Hon'ble Court the unchecked discharge of untreated sewage into the river at Prayagraj, affecting over 2 lakh residents and violating the right to a clean environment under Article 21.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
PUBLIC INTEREST LITIGATION

The Petitioner organisation Clean Ganga Front brings to the notice of this Hon'ble Court the unchecked discharge of untreated sewage into the river at Prayagraj, affecting over 2 lakh residents and violating the right to a clean environment under Article 21.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
PUBLIC INTEREST LITIGATION
PIL — Clean Ganga Front
Court: Allahabad HC – Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
PUBLIC INTEREST LITIGATION

The Petitioner organisation Clean Ganga Front brings to the notice of this Hon'ble Court the unchecked discharge of untreated sewage into the river at Prayagraj, affecting over 2 lakh residents and violating the right to a clean environment under Article 21.
```
</details>

---

## 12. RTI_APPLICATION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy RTI Application** |
| Button label | `Copy RTI application` |
| Guidance tip | Paste into the prescribed form or a plain sheet, attach the ₹10 fee (IPO / court-fee stamp / DD) and address it to the CPIO / SPIO. |
| Intake fields (folder/file auto-fill target) | applicantName, applicantAddress, department, cpio, infoSought, period, purpose, mode |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005

To: The CPIO, Public Works Department, Prayagraj

The applicant **Ramesh Gupta** seeks the following information:
1. Total funds sanctioned for repair of Katra Road in FY 2024-25.
2. Copies of work orders and completion certificates.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005

To: The CPIO, Public Works Department, Prayagraj

The applicant Ramesh Gupta seeks the following information:
1. Total funds sanctioned for repair of Katra Road in FY 2024-25.
2. Copies of work orders and completion certificates.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
RTI APPLICATION
RTI Application — Road Repair Funds
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
APPLICATION UNDER THE RIGHT TO INFORMATION ACT, 2005

To: The CPIO, Public Works Department, Prayagraj

The applicant Ramesh Gupta seeks the following information:
1. Total funds sanctioned for repair of Katra Road in FY 2024-25.
2. Copies of work orders and completion certificates.
```
</details>

---

## 13. CONSUMER_COMPLAINT  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Consumer Complaint** |
| Button label | `Copy consumer complaint` |
| Guidance tip | Paste into Word — file before the District / State / National Commission with the supporting bills, the affidavit and the prescribed fee. |
| Intake fields (folder/file auto-fill target) | complainantName, complainantAddress, oppositeName, commissionType, productService, amountPaid, deficiency, complaintsGiven, reliefSought |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## CONSUMER COMPLAINT

The Complainant **Ramesh Gupta** purchased a refrigerator from QuickFix Appliances on 10.01.2026 for Rs. 38,000. The unit stopped cooling within 20 days and repeated complaints went unattended — a clear **deficiency in service**.

Relief: refund of Rs. 38,000 with compensation of Rs. 15,000.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
CONSUMER COMPLAINT

The Complainant Ramesh Gupta purchased a refrigerator from QuickFix Appliances on 10.01.2026 for Rs. 38,000. The unit stopped cooling within 20 days and repeated complaints went unattended — a clear deficiency in service.

Relief: refund of Rs. 38,000 with compensation of Rs. 15,000.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
CONSUMER COMPLAINT
Consumer Complaint — Gupta v. QuickFix Appliances
Court: District Consumer Commission, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
CONSUMER COMPLAINT

The Complainant Ramesh Gupta purchased a refrigerator from QuickFix Appliances on 10.01.2026 for Rs. 38,000. The unit stopped cooling within 20 days and repeated complaints went unattended — a clear deficiency in service.

Relief: refund of Rs. 38,000 with compensation of Rs. 15,000.
```
</details>

---

## 14. DIVORCE_PETITION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Divorce Petition** |
| Button label | `Copy divorce petition` |
| Guidance tip | Paste into your Family Court template — verify the marriage particulars, the ground and section cited, and attach the supporting affidavit. |
| Intake fields (folder/file auto-fill target) | petitionerName, respondentName, marriageDate, registrationNo, childrenDetails, separationDate, divorceGround, facts, reliefSought, applicableLaw |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## PETITION FOR DISSOLUTION OF MARRIAGE

The Petitioner **Smt. Priya Sharma** was married to the Respondent **Sri Anil Sharma** on 12.02.2018 at Prayagraj. The parties have lived separately since 05.06.2024. The Petitioner seeks a decree of divorce on the ground of cruelty under Section 13(1)(ia) of the Hindu Marriage Act, 1955.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
PETITION FOR DISSOLUTION OF MARRIAGE

The Petitioner Smt. Priya Sharma was married to the Respondent Sri Anil Sharma on 12.02.2018 at Prayagraj. The parties have lived separately since 05.06.2024. The Petitioner seeks a decree of divorce on the ground of cruelty under Section 13(1)(ia) of the Hindu Marriage Act, 1955.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
DIVORCE PETITION
Divorce Petition — Priya Sharma v. Anil Sharma
Court: Family Court, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
PETITION FOR DISSOLUTION OF MARRIAGE

The Petitioner Smt. Priya Sharma was married to the Respondent Sri Anil Sharma on 12.02.2018 at Prayagraj. The parties have lived separately since 05.06.2024. The Petitioner seeks a decree of divorce on the ground of cruelty under Section 13(1)(ia) of the Hindu Marriage Act, 1955.
```
</details>

---

## 15. RENT_AGREEMENT  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Rent Agreement** |
| Button label | `Copy rent agreement` |
| Guidance tip | Paste into Word — print on stamp paper of the value applicable in your State; landlord, tenant and two witnesses sign each page. |
| Intake fields (folder/file auto-fill target) | landlordName, tenantName, tenantAddress, propertyAddress, propertyDetails, rent, deposit, term, utilities, specialTerms |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## RENT AGREEMENT

This Agreement is between **Sri Mohan Lal** ("Landlord") and **Sri Ravi Kumar** ("Tenant") for House No. 22, Katra, Prayagraj.

Rent: Rs. 12,000 per month, due on the 5th.
Deposit: Rs. 36,000, refundable on vacation.
Term: 11 months from 01.06.2026.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
RENT AGREEMENT

This Agreement is between Sri Mohan Lal ("Landlord") and Sri Ravi Kumar ("Tenant") for House No. 22, Katra, Prayagraj.

Rent: Rs. 12,000 per month, due on the 5th.
Deposit: Rs. 36,000, refundable on vacation.
Term: 11 months from 01.06.2026.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
RENT AGREEMENT
Rent Agreement — 22 Katra, Prayagraj
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
RENT AGREEMENT

This Agreement is between Sri Mohan Lal ("Landlord") and Sri Ravi Kumar ("Tenant") for House No. 22, Katra, Prayagraj.

Rent: Rs. 12,000 per month, due on the 5th.
Deposit: Rs. 36,000, refundable on vacation.
Term: 11 months from 01.06.2026.
```
</details>

---

## 16. SALE_DEED  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Sale Deed** |
| Button label | `Copy sale deed` |
| Guidance tip | Paste into Word — execute on stamp paper of the correct value and register it at the Sub-Registrar within four months of execution. |
| Intake fields (folder/file auto-fill target) | vendorName, purchaserName, propertyDescription, boundaries, consideration, paymentMode, possession, titleHistory, encumbrance |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## SALE DEED

This Sale Deed is executed by **Sri Mohan Lal** ("Vendor") in favour of **Sri Ravi Kumar** ("Purchaser") for Plot No. 47, Naini, Prayagraj, admeasuring 1,200 sq. ft.

Sale consideration: Rs. 50,00,000 (Rupees Fifty Lakhs only), paid by RTGS.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
SALE DEED

This Sale Deed is executed by Sri Mohan Lal ("Vendor") in favour of Sri Ravi Kumar ("Purchaser") for Plot No. 47, Naini, Prayagraj, admeasuring 1,200 sq. ft.

Sale consideration: Rs. 50,00,000 (Rupees Fifty Lakhs only), paid by RTGS.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
SALE DEED
Sale Deed — Plot 47, Naini
Court: Sub-Registrar, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
SALE DEED

This Sale Deed is executed by Sri Mohan Lal ("Vendor") in favour of Sri Ravi Kumar ("Purchaser") for Plot No. 47, Naini, Prayagraj, admeasuring 1,200 sq. ft.

Sale consideration: Rs. 50,00,000 (Rupees Fifty Lakhs only), paid by RTGS.
```
</details>

---

## 17. CHEQUE_BOUNCE  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Cheque Bounce Notice** |
| Button label | `Copy cheque-bounce notice` |
| Guidance tip | Send within 30 days of the bank return memo. Paste onto your letterhead and dispatch by Registered Post A/D — preserve the receipt. |
| Intake fields (folder/file auto-fill target) | senderName, senderAddress, drawerName, drawerAddress, chequeDetails, amountWords, chequePurpose, dishonourDate, dishonourReason, bankMemoRef |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

Cheque No. 004512 dated 02.04.2026 for Rs. 1,00,000 drawn on SBI, Civil Lines, issued by **Sri Anil Sharma** in favour of my client was returned unpaid for **"Funds Insufficient"** vide memo dated 08.04.2026.

You are called upon to pay the said amount within 15 days.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

Cheque No. 004512 dated 02.04.2026 for Rs. 1,00,000 drawn on SBI, Civil Lines, issued by Sri Anil Sharma in favour of my client was returned unpaid for "Funds Insufficient" vide memo dated 08.04.2026.

You are called upon to pay the said amount within 15 days.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
CHEQUE BOUNCE NOTICE
Cheque Bounce Notice — Gupta to Anil Sharma
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

Cheque No. 004512 dated 02.04.2026 for Rs. 1,00,000 drawn on SBI, Civil Lines, issued by Sri Anil Sharma in favour of my client was returned unpaid for "Funds Insufficient" vide memo dated 08.04.2026.

You are called upon to pay the said amount within 15 days.
```
</details>

---

## 18. LEGAL_OPINION  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy Legal Opinion** |
| Button label | `Copy legal opinion` |
| Guidance tip | Paste into Word on your letterhead, or into an email to the client. "With header" adds the addressee / subject cover block. |
| Intake fields (folder/file auto-fill target) | advocateName, clientName, matterSubject, facts, documentsPerused, legalQuestion, applicableLaws, jurisdiction, riskLevel |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## LEGAL OPINION

**Addressee:** Sri Ravi Kumar   **Subject:** Marketability of title to Plot No. 47, Naini

On a perusal of the chain of title for the last 30 years and the encumbrance certificate, the title of the Vendor is found to be clear and marketable, subject to obtaining the latest mutation entry.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
LEGAL OPINION

Addressee: Sri Ravi Kumar   Subject: Marketability of title to Plot No. 47, Naini

On a perusal of the chain of title for the last 30 years and the encumbrance certificate, the title of the Vendor is found to be clear and marketable, subject to obtaining the latest mutation entry.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
LEGAL OPINION
Legal Opinion — Marketability of Plot 47, Naini
Court: Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
LEGAL OPINION

Addressee: Sri Ravi Kumar   Subject: Marketability of title to Plot No. 47, Naini

On a perusal of the chain of title for the last 30 years and the encumbrance certificate, the title of the Vendor is found to be clear and marketable, subject to obtaining the latest mutation entry.
```
</details>

---

## 19. FIR_COMPLAINT  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Copy FIR Complaint** |
| Button label | `Copy complaint` |
| Guidance tip | Paste into Word, sign it, and submit at the police station — keep an acknowledged copy. If refused, escalate under Section 154(3) CrPC / BNSS. |
| Intake fields (folder/file auto-fill target) | complainantName, complainantAddress, policeStation, incidentDate, incidentPlace, accusedDetails, incidentFacts, offenceSections, witnesses, evidence |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
## WRITTEN COMPLAINT FOR REGISTRATION OF FIR

To: The Station House Officer, P.S. Civil Lines, Prayagraj

I, **Ramesh Gupta**, report that on the night of 12.05.2026 unknown persons broke into my shop at 14 Civil Lines and stole cash and goods worth Rs. 3,00,000. I request that an FIR under Section 380 IPC be registered.
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
WRITTEN COMPLAINT FOR REGISTRATION OF FIR

To: The Station House Officer, P.S. Civil Lines, Prayagraj

I, Ramesh Gupta, report that on the night of 12.05.2026 unknown persons broke into my shop at 14 Civil Lines and stole cash and goods worth Rs. 3,00,000. I request that an FIR under Section 380 IPC be registered.
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
FIR COMPLAINT
FIR Complaint — Theft at 22 Katra
Court: P.S. Civil Lines, Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
WRITTEN COMPLAINT FOR REGISTRATION OF FIR

To: The Station House Officer, P.S. Civil Lines, Prayagraj

I, Ramesh Gupta, report that on the night of 12.05.2026 unknown persons broke into my shop at 14 Civil Lines and stole cash and goods worth Rs. 3,00,000. I request that an FIR under Section 380 IPC be registered.
```
</details>

---

## 20. LEGAL_EMAIL  ✅

| Aspect | Value |
| --- | --- |
| Card heading | **Send by Email** |
| Button label | `Copy email` |
| Guidance tip | Paste into Gmail / Outlook. The first lines (To / Cc / Subject) match the standard header fields — most clients auto-fill them if pasted at the top of a new compose window. |
| Intake fields (folder/file auto-fill target) | purpose, tone, recipientName, recipientEmail, senderName, senderDesignation, senderContact, subjectHint, caseRef, facts, ask, deadline, attachments |

**Checks**

- ✅ has service-specific framing (not the generic default)
- ✅ button label is service-specific
- ✅ has a practical guidance tip
- ✅ has an intake field schema (folder/file extraction target)
- ✅ sample draft provided
- ✅ "clean" strips ## / ** markdown artefacts
- ✅ "clean" collapses 3+ blank lines
- ✅ "with header" prepends the cover block
- ✅ "full" preserves the draft verbatim

<details><summary>Example clipboard output — <b>Document text</b> (as generated)</summary>

```
To: rajesh.singh@example.com
Subject: Reminder — Hearing in Writ-A No. 4521/2026 on 22 May 2026

Dear Mr. Singh,

This is to remind you that your matter is listed for **22 May 2026**. Please reach the High Court by 9:30 AM and carry your original ID proof.

Regards,
Adv. S. P. Singh
```
</details>

<details><summary>Example clipboard output — <b>Clean / plain</b> (tidy for Gmail / Word / e-filing)</summary>

```
To: rajesh.singh@example.com
Subject: Reminder — Hearing in Writ-A No. 4521/2026 on 22 May 2026

Dear Mr. Singh,

This is to remind you that your matter is listed for 22 May 2026. Please reach the High Court by 9:30 AM and carry your original ID proof.

Regards,
Adv. S. P. Singh
```
</details>

<details><summary>Example clipboard output — <b>With header</b> (titled cover block)</summary>

```
EMAIL DRAFT
Email — Hearing reminder to client
Court: Allahabad HC – Prayagraj
Date: 15 May 2026
────────────────────────────────────────────────
To: rajesh.singh@example.com
Subject: Reminder — Hearing in Writ-A No. 4521/2026 on 22 May 2026

Dear Mr. Singh,

This is to remind you that your matter is listed for 22 May 2026. Please reach the High Court by 9:30 AM and carry your original ID proof.

Regards,
Adv. S. P. Singh
```
</details>

---

**Result: 20/20 services pass all checks.**  Every one of the 20 services produces service-specific, correctly-formatted copy output.
