// ─────────────────────────────────────────────────────────────────
//  lib/followup.js
//  Case Follow-Up Nudge System
//
//  For every one of the 20 document types, defines:
//    • what the logical next legal step is
//    • how many days until that step is typically due
//    • which new document type to pre-fill
//    • which fields to carry over from the current draft
//
//  Usage:
//    import { getFollowUp } from '@/lib/followup'
//    const followUp = getFollowUp(documentType, templateData, createdAt)
//    // → { title, description, deadlineDays, deadlineDate, nextDocType, prefillFields, urgency }
// ─────────────────────────────────────────────────────────────────

// Urgency levels used for UI colour coding
export const URGENCY = {
  HIGH:   'high',    // red  — action required immediately
  MEDIUM: 'medium',  // amber — action due soon
  LOW:    'low',     // blue  — informational / planning
}

// ─── Follow-up map ────────────────────────────────────────────────
// Each entry: {
//   title         — short label for the "What's Next" card
//   description   — full explanation shown to the user
//   deadlineDays  — default days from draft creation until action is due
//                   (can be overridden by a field in templateData, e.g. "deadline")
//   nextDocType   — document type value to pre-fill on "Draft Next Document" click
//   prefillKeys   — list of templateData keys to carry over to the next draft
//   urgency       — URGENCY constant
// }
const FOLLOWUP_MAP = {

  // ── 1. Legal Notice ──────────────────────────────────────────────
  // Notice gives recipient N days (user-specified "deadline" field, default 15).
  // If no response → file a civil suit or consumer complaint.
  LEGAL_NOTICE: {
    title: 'Response Deadline',
    description: 'If the recipient does not respond or comply within the notice period, you should proceed with filing a suit or complaint in the appropriate forum.',
    deadlineDays: 15,
    deadlineDaysField: 'deadline',    // override from templateData if present
    nextDocType: 'PETITION',
    prefillKeys: ['senderName', 'senderAddress', 'recipientName', 'recipientAddress', 'subject', 'grievance', 'demand'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Civil Suit / Petition',
  },

  // ── 2. Petition ──────────────────────────────────────────────────
  PETITION: {
    title: 'First Hearing',
    description: 'After filing the petition, the court will fix a date for admission hearing. Ensure you have a certified copy of the petition and all annexures ready.',
    deadlineDays: 30,
    nextDocType: 'VAKALATNAMA',
    prefillKeys: ['petitionerName', 'respondentName', 'subject', 'court'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft Vakalatnama',
  },

  // ── 3. Writ Petition ─────────────────────────────────────────────
  WRIT_PETITION: {
    title: 'First Listing & Interim Relief',
    description: 'The writ will be listed within 7–15 days. If you filed for interim relief (stay/injunction), be ready to argue it on the first date. File a caveat if the other party may approach separately.',
    deadlineDays: 15,
    nextDocType: 'STAY_APPLICATION',
    prefillKeys: ['petitionerName', 'respondentName', 'impugnedOrder', 'impugnedDate', 'relief', 'court'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Stay Application',
  },

  // ── 4. Bail Application ──────────────────────────────────────────
  BAIL_APPLICATION: {
    title: 'Bail Hearing Date',
    description: 'The bail application will be heard within 2–7 days. Keep the FIR, charge sheet (if filed), custody record, and surety details ready for the hearing.',
    deadlineDays: 7,
    nextDocType: 'AFFIDAVIT',
    prefillKeys: ['applicantName', 'fatherName', 'applicantAge', 'address', 'firNo', 'offence', 'court'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Affidavit in Support',
  },

  // ── 5. Stay Application ──────────────────────────────────────────
  STAY_APPLICATION: {
    title: 'Hearing on Stay',
    description: 'Stay applications are typically heard within 3–10 days. If stay is granted, ensure it is served on all respondents immediately.',
    deadlineDays: 10,
    nextDocType: 'WRIT_PETITION',
    prefillKeys: ['applicantName', 'respondentName', 'subject', 'court'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Writ Petition (if needed)',
  },

  // ── 6. PIL ──────────────────────────────────────────────────────
  PIL: {
    title: 'Admission Hearing',
    description: 'PILs are typically listed within 2–4 weeks. Prepare an affidavit from a reliable source establishing the facts. Have documentary evidence of the public harm ready.',
    deadlineDays: 21,
    nextDocType: 'AFFIDAVIT',
    prefillKeys: ['petitionerName', 'publicIssue', 'respondents', 'court'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft Supporting Affidavit',
  },

  // ── 7. Affidavit ────────────────────────────────────────────────
  AFFIDAVIT: {
    title: 'Notarisation & Filing',
    description: 'Have the affidavit signed before a Notary Public or Oath Commissioner before the next hearing date. File it with the court registry at least 3 days before the date.',
    deadlineDays: 7,
    nextDocType: null,
    prefillKeys: [],
    urgency: URGENCY.HIGH,
    nextLabel: null,
    actionOnly: true,   // No next document — action is procedural
    actionNote: 'Get affidavit notarised and filed with court registry',
  },

  // ── 8. Vakalatnama ───────────────────────────────────────────────
  VAKALATNAMA: {
    title: 'File with Court Registry',
    description: 'File the signed Vakalatnama with the court registry before the first hearing. The client\'s signature must be witnessed. Keep a copy for your records.',
    deadlineDays: 3,
    nextDocType: null,
    prefillKeys: [],
    urgency: URGENCY.HIGH,
    nextLabel: null,
    actionOnly: true,
    actionNote: 'File signed Vakalatnama with registry before first hearing',
  },

  // ── 9. Case Brief ────────────────────────────────────────────────
  CASE_BRIEF: {
    title: 'Review & Brief Client',
    description: 'Share the case brief with your client and take instructions. If the matter warrants a writ or petition, start preparing it now based on the brief analysis.',
    deadlineDays: 3,
    nextDocType: 'WRIT_PETITION',
    prefillKeys: ['caseName', 'facts', 'issues', 'respondents', 'court'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft Writ Petition from this Brief',
  },

  // ── 10. Contract ─────────────────────────────────────────────────
  CONTRACT: {
    title: 'Execution & Stamping',
    description: 'Both parties must sign the contract. Get it stamped as per the Stamp Act of the relevant state. For high-value contracts, registration under the Registration Act, 1908 is advisable.',
    deadlineDays: 7,
    nextDocType: 'AFFIDAVIT',
    prefillKeys: ['partyA', 'partyB', 'subject', 'contractDate'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft Affidavit of Execution',
  },

  // ── 11. Memorandum ───────────────────────────────────────────────
  MEMORANDUM: {
    title: 'Acknowledgement & Response',
    description: 'Ensure the memorandum is acknowledged in writing by the recipient. Follow up in 7 days if no response is received.',
    deadlineDays: 7,
    nextDocType: null,
    prefillKeys: [],
    urgency: URGENCY.LOW,
    nextLabel: null,
    actionOnly: true,
    actionNote: 'Follow up on acknowledgement from recipient',
  },

  // ── 12. Consumer Complaint ────────────────────────────────────────
  CONSUMER_COMPLAINT: {
    title: 'Filing Deadline',
    description: 'File the complaint at the District Consumer Commission within 2 years of the cause of action (Section 69, Consumer Protection Act, 2019). Attach the complaint, affidavit, and all evidence in duplicate.',
    deadlineDays: 14,
    nextDocType: 'AFFIDAVIT',
    prefillKeys: ['complainantName', 'complainantAddress', 'opName', 'grievance', 'reliefClaimed'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft Supporting Affidavit',
  },

  // ── 13. Divorce Petition ──────────────────────────────────────────
  DIVORCE_PETITION: {
    title: 'First Mediation / Hearing',
    description: 'Family courts typically refer matters to mediation first. The first hearing is usually within 30–60 days. Ensure the petition is served on the respondent through the court.',
    deadlineDays: 30,
    nextDocType: 'AFFIDAVIT',
    prefillKeys: ['petitionerName', 'respondentName', 'marriageDate', 'court'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft Affidavit in Support',
  },

  // ── 14. Rent Agreement ────────────────────────────────────────────
  RENT_AGREEMENT: {
    title: 'Registration & Stamping',
    description: 'Rent agreements for 12+ months must be registered under the Registration Act, 1908. Visit the Sub-Registrar\'s office within 4 months of execution with both parties and two witnesses.',
    deadlineDays: 30,
    nextDocType: null,
    prefillKeys: [],
    urgency: URGENCY.MEDIUM,
    nextLabel: null,
    actionOnly: true,
    actionNote: 'Register agreement at Sub-Registrar office if term ≥ 12 months',
  },

  // ── 15. Cheque Bounce ─────────────────────────────────────────────
  CHEQUE_BOUNCE: {
    title: '15-Day Statutory Notice Period',
    description: 'The recipient has 15 days from receiving this notice to pay. If they fail, you must file a complaint under Section 138 of the Negotiable Instruments Act, 1881 within 30 days of expiry.',
    deadlineDays: 15,
    nextDocType: 'PETITION',
    prefillKeys: ['senderName', 'senderAddress', 'recipientName', 'recipientAddress', 'chequeNo', 'chequeAmount', 'bankName', 'dishonourDate'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Section 138 NI Act Complaint',
  },

  // ── 16. FIR / Complaint ───────────────────────────────────────────
  FIR_COMPLAINT: {
    title: 'Follow Up with Police Station',
    description: 'The police must register an FIR within 24 hours. If they refuse, file a complaint before the Magistrate under Section 156(3) CrPC / Section 175(3) BNSS 2023. Follow up within 7 days.',
    deadlineDays: 7,
    nextDocType: 'PETITION',
    prefillKeys: ['complainantName', 'complainantAddress', 'accusedName', 'incidentDate', 'policeStation', 'offenceDetails'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Magistrate Complaint (if FIR refused)',
  },

  // ── 17. Sale Deed ─────────────────────────────────────────────────
  SALE_DEED: {
    title: 'Registration Deadline',
    description: 'Present the sale deed for registration at the Sub-Registrar\'s office within 4 months of execution (Section 23, Registration Act, 1908). Both parties must be present. Pay stamp duty and registration fee before the appointment.',
    deadlineDays: 30,
    nextDocType: null,
    prefillKeys: [],
    urgency: URGENCY.HIGH,
    nextLabel: null,
    actionOnly: true,
    actionNote: 'Register sale deed at Sub-Registrar within 4 months of execution',
  },

  // ── 18. RTI Application ───────────────────────────────────────────
  RTI: {
    title: '30-Day Response Window',
    description: 'The Public Information Officer must respond within 30 days (Section 7, RTI Act, 2005). If no response or unsatisfactory response, file a first appeal with the Appellate Authority within 30 days of receiving (or not receiving) the reply.',
    deadlineDays: 30,
    nextDocType: 'PETITION',
    prefillKeys: ['applicantName', 'applicantAddress', 'publicAuthority', 'infoSought'],
    urgency: URGENCY.MEDIUM,
    nextLabel: 'Draft First Appeal (if no response)',
  },

  // ── 19. Power of Attorney ─────────────────────────────────────────
  POWER_OF_ATTORNEY: {
    title: 'Notarisation / Registration',
    description: 'A General Power of Attorney must be notarised and, for immovable property transactions, registered before the Sub-Registrar. If executed abroad, it must be apostilled.',
    deadlineDays: 14,
    nextDocType: null,
    prefillKeys: [],
    urgency: URGENCY.MEDIUM,
    nextLabel: null,
    actionOnly: true,
    actionNote: 'Get POA notarised / registered before use in transactions',
  },

  // ── 20. Anticipatory Bail ─────────────────────────────────────────
  ANTICIPATORY_BAIL: {
    title: 'Urgent Hearing Required',
    description: 'Anticipatory bail applications are listed within 1–3 days given their urgent nature. If a Sessions Court application is pending and arrest is imminent, seek an urgent mention before the High Court.',
    deadlineDays: 3,
    nextDocType: 'AFFIDAVIT',
    prefillKeys: ['applicantName', 'fatherName', 'address', 'offence', 'anticipatedArrest', 'court'],
    urgency: URGENCY.HIGH,
    nextLabel: 'Draft Affidavit in Support',
  },
}

// ─── Main export ──────────────────────────────────────────────────
/**
 * Returns the follow-up action for a given draft.
 *
 * @param {string} documentType   — e.g. 'LEGAL_NOTICE'
 * @param {object} templateData   — the draft's templateData object
 * @param {Date|string} createdAt — when the draft was created
 * @returns {object|null}
 */
export function getFollowUp(documentType, templateData = {}, createdAt = new Date()) {
  const config = FOLLOWUP_MAP[documentType]
  if (!config) return null

  // Allow templateData to override the default deadline days
  // e.g. for Legal Notice, the "deadline" field holds the user-specified days
  let days = config.deadlineDays
  if (config.deadlineDaysField) {
    const raw = templateData[config.deadlineDaysField]
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed > 0) days = parsed
  }

  const created      = new Date(createdAt)
  const deadlineDate = new Date(created.getTime() + days * 24 * 60 * 60 * 1000)
  const now          = new Date()
  const daysLeft     = Math.ceil((deadlineDate - now) / (24 * 60 * 60 * 1000))
  const isOverdue    = daysLeft < 0

  // Build the pre-fill object for the next draft
  const prefill = {}
  for (const key of (config.prefillKeys || [])) {
    if (templateData[key]) prefill[key] = templateData[key]
  }

  return {
    title:          config.title,
    description:    config.description,
    deadlineDays:   days,
    deadlineDate,
    daysLeft,
    isOverdue,
    urgency:        isOverdue ? URGENCY.HIGH : config.urgency,
    nextDocType:    config.nextDocType   || null,
    nextLabel:      config.nextLabel     || null,
    actionOnly:     config.actionOnly    || false,
    actionNote:     config.actionNote    || null,
    prefill,
  }
}

/**
 * Returns all document types that have follow-up configs (all 20).
 */
export function getSupportedDocTypes() {
  return Object.keys(FOLLOWUP_MAP)
}

/**
 * Build the CourtDate record to auto-save when a draft is created.
 * Returns an object ready to pass to prisma.courtDate.create({ data: ... })
 */
export function buildFollowUpCourtDate(followUp, draftId, userId, documentType) {
  if (!followUp) return null
  return {
    userId,
    draftId,
    title:     followUp.title,
    notes:     followUp.description,
    date:      followUp.deadlineDate,
    type:      'deadline',
    completed: false,
  }
}
