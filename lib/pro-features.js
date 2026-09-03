// ─────────────────────────────────────────────────────────────────
//  LexForge AI — pro-features.js
//  What "Pro" actually adds for each of the 19 document types.
//  UI only — tile badges, the upgrade banner, and the public pricing
//  page. (An earlier comment here claimed lib/groq.js read this list into
//  the prompt. It does not, and has not for some time.)
//
//  Everything in this file is a PROMISE MADE TO A PAYING CUSTOMER on a
//  public price list. It must describe what the product does, not what
//  would sound good — a line here that overstates is a consumer-law
//  problem, not a marketing flourish.
// ─────────────────────────────────────────────────────────────────

// Universal Pro features — apply to EVERY document type.
// Free tier gets all 19 doc types and all workflow routes, but is capped
// per month (see systemConfig.freeDocsLimit) and at ~1,200 words per draft. Pro removes both
// limits and unlocks a few Pro-exclusive features (the AI Case Assistant
// chatbot is the headline one).
export const PRO_GLOBAL_FEATURES = [
  'Unlimited drafts — the free plan has a monthly cap',
  'Longer outputs — up to ~5,000 words (Free is capped at ~1,200 words)',
  // This used to read "Full case-law citations (5+ real precedents per
  // issue)". The product deliberately cannot promise that: judgments are
  // retrieved from Indian Kanoon, and when a search finds nothing the
  // answer says so rather than inventing a case to hit a number. Selling
  // a guaranteed count of precedents would have been selling the exact
  // behaviour the citation guard exists to prevent.
  // CONDITIONAL, and it has to be.
  //
  // Judgment retrieval runs only when INDIANKANOON_TOKEN is set — see
  // app/api/drafts/route.js, where the call is gated on
  // kanoonConfigured(). With no token the gate is closed and a Pro
  // draft cites NO judgments at all: a bench test of a High Court writ
  // came back with zero. That is the citation guard behaving correctly,
  // preferring silence to invention. It is not a licence to keep
  // selling the feature.
  //
  // This file's own header says a line here is a promise made to a
  // paying customer and that overstating one is a consumer-law problem,
  // not a marketing flourish. So the line appears only when the thing
  // it describes is actually switched on.
  ...(process.env.INDIANKANOON_TOKEN
    ? ['Judgment search — real reported cases, quoted as reported, never invented']
    : []),
  'Index of Documents + Annexure list',
  'Detailed clause-by-clause verification',
  'Expanded Merits / Demerits / Risks / Recommendations analysis',
  'Stronger AI model — the larger reasoning model rather than the standard one',
  'AI Case Assistant — chatbot that suggests favorable IPC / CrPC sections',
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
export const PRO_TAGLINE = 'PRO · unlimited drafts · 4× length · AI Case Assistant · judgment search'
