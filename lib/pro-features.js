// ─────────────────────────────────────────────────────────────────
//  LexForge AI — pro-features.js
//  What "Pro" actually adds for each of the 19 document types.
//  Used in two places:
//    1. UI (new-draft tile badges + result-page upgrade banner)
//    2. AI prompt assembly (lib/groq.js reads PRO_GLOBAL_FEATURES)
// ─────────────────────────────────────────────────────────────────

// Universal Pro features — apply to EVERY document type.
export const PRO_GLOBAL_FEATURES = [
  '2–3× longer, court-ready output',
  'Full case-law citations (5+ real precedents per issue)',
  'Index of Documents + Annexure list',
  'Detailed verification clause',
  'Expanded Merits / Demerits / Risks / Recommendations analysis',
  'Stronger AI model (Llama 3.3 70B)',
  'Unlimited monthly drafts',
  'AI Case Assistant — chatbot that suggests favorable IPC sections',
]

// Per-doc-type extras (additive on top of PRO_GLOBAL_FEATURES).
export const PRO_FEATURES_BY_TYPE = {
  LEGAL_NOTICE: [
    'Multi-issue framing with separate counts',
    'Statutory schedule (sections quoted in full)',
    'Reservation of rights paragraph',
  ],
  CASE_BRIEF: [
    'IRAC + counter-IRAC for opposite party',
    'Case-precedent comparison table',
    'Strategic litigation roadmap',
  ],
  CONTRACT: [
    'Boilerplate clauses (force majeure, dispute resolution, severability)',
    'Indemnity + limitation-of-liability schedule',
    'Stamp-duty / registration note for the relevant State',
  ],
  PETITION: [
    'Constitutional grounds (Art. 14/19/21) with case law',
    'Interim prayer + main prayer split',
    'Affidavit verification appendix',
  ],
  MEMORANDUM: [
    'Issue-by-issue legal analysis',
    'Risk matrix (likelihood × severity)',
    'Action plan with deadlines',
  ],
  WRIT_PETITION: [
    'Article 226 grounds with full constitutional citations',
    'Alternative reliefs prayer',
    'Affidavit + verification + index of dates and events',
  ],
  VAKALATNAMA: [
    'Multi-court authority (HC + subordinate courts)',
    'Withdrawal / substitution clause',
  ],
  BAIL_APPLICATION: [
    'Triple-test analysis (flight risk / tampering / repeat offence)',
    'Comparable bail orders cited',
    'Detailed surety undertaking',
  ],
  STAY_APPLICATION: [
    'Three-fold test (prima facie / balance / irreparable harm)',
    'Status-quo prayer with timeline',
  ],
  AFFIDAVIT: [
    'Para-by-para verification on knowledge / records / belief',
    'Notarial endorsement template',
  ],
  PIL: [
    'Locus standi establishment',
    'Public interest grounds with constitutional anchoring',
    'Suggested mandamus directions',
  ],
  RTI_APPLICATION: [
    'First-appeal-ready phrasing',
    'Section 8/9 exemption pre-rebuttals',
  ],
  CONSUMER_COMPLAINT: [
    'Deficiency of service framework',
    'Compensation calculation table',
    'Limitation period analysis',
  ],
  DIVORCE_PETITION: [
    'Maintenance + custody + alimony prayer split',
    'Cruelty grounds with case law',
    'Mediation / counselling note',
  ],
  RENT_AGREEMENT: [
    'Maintenance, society dues, lock-in clauses',
    'Notice period + early-termination matrix',
    'Stamp-duty schedule for the relevant State',
  ],
  SALE_DEED: [
    'Title chain recital',
    'Encumbrance certificate annexure',
    'Stamp-duty + registration computation',
  ],
  CHEQUE_BOUNCE: [
    'Section 138 NI Act compliance checklist',
    'Demand-notice + 15-day window verification',
    'Quantum + interest computation',
  ],
  LEGAL_OPINION: [
    'Opinion on multiple alternative scenarios',
    'Risk-weighted recommendation',
    'Citations with paragraph references',
  ],
  FIR_COMPLAINT: [
    'IPC + special-act sections suggested',
    'Witness list + evidence schedule',
    'Magistrate-direction template (Section 156(3) CrPC)',
  ],
}

// Compose the full Pro feature list for a given doc type.
export function getProFeatureList(documentType) {
  const specific = PRO_FEATURES_BY_TYPE[documentType] || []
  return [...specific, ...PRO_GLOBAL_FEATURES]
}

// One-line summary used in tile tooltips.
export const PRO_TAGLINE = 'PRO ✨ 2× length · full citations · AI assistant · unlimited'
