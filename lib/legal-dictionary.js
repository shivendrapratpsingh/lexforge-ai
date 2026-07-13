// ─────────────────────────────────────────────────────────────────
//  LexForge AI — legal-dictionary.js
//
//  Curated DRAFTING LEXICON for Indian court drafting. The generative
//  model tends to fall back on plain conversational English; this
//  dictionary steers every document toward the vocabulary, sentence
//  constructions and boilerplate formulae actually used by Indian
//  advocates, so the output reads like a filing — not an essay.
//
//  Design constraints:
//    • Injected into the system prompt for EVERY one of the 20
//      document services, so it must stay COMPACT (Groq free tier has
//      a ~12K tokens-per-minute budget shared with the whole prompt).
//    • Split into a CORE block (always sent) + one GROUP block chosen
//      by document type (pleading / notice / deed / opinion /
//      application / email), so each request only pays for what it
//      needs.
//    • Pure data + pure functions — no imports — so it is trivially
//      testable outside the Next.js runtime.
// ─────────────────────────────────────────────────────────────────

// ─── Core lexicon — every document type ───────────────────────────
const CORE = `SUBMISSION OPENERS: "It is respectfully submitted that"; "It is most humbly submitted that"; "It is pertinent to mention that"; "It is apposite to note that"; "At the outset, it is submitted that"; "Without prejudice to the foregoing"; "In view of the facts aforestated"; "By way of abundant caution"; "It is trite law that"; "It is no longer res integra that"; "A bare perusal of [the document] would reveal that"; "Per contra"; "In this regard, reliance is placed upon".
FORMAL EQUIVALENTS (always prefer the right-hand form): said→averred/submitted; told→communicated/intimated; asked→called upon/prayed; showed→demonstrated/evinced; got→obtained/procured; gave→tendered/furnished; broke→contravened/breached; stopped→restrained/desisted from; started→initiated/instituted; ended→culminated/stood concluded; unfair→arbitrary and capricious; wrong→illegal and unsustainable in law; about→with respect to/pertaining to; because→inasmuch as; so→consequently/accordingly; also→further/furthermore; but→however/nevertheless.
TIME AND EVENT PHRASES: "on or about"; "at the relevant point in time"; "from time to time"; "till date"; "despite repeated requests and reminders"; "within the period prescribed by law".`

// ─── Group lexicons — one is appended based on document type ──────
const GROUP_LEXICON = {
  PLEADING: `PLEADING FORMULAE: "That the present [petition/application] is being preferred by the [Petitioner/Applicant] being aggrieved by and dissatisfied with ..."; "That the [Petitioner] craves leave of this Hon'ble Court to ..."; "That no other or similar petition seeking the same or similar relief has been filed by the [Petitioner] before this Hon'ble Court or any other Court"; "That the impugned order/action is ex-facie illegal, arbitrary, perverse and unsustainable in the eyes of law"; "That the balance of convenience lies squarely in favour of the [Applicant] and irreparable loss and injury, incapable of being compensated in terms of money, shall ensue if the relief prayed for is not granted".
PRAYER OPENING: "It is, therefore, most respectfully prayed that this Hon'ble Court may graciously be pleased to:".
PRAYER CLOSING: "Pass such other and further order(s) as this Hon'ble Court may deem fit and proper in the facts and circumstances of the case and in the interest of justice." followed by "AND FOR THIS ACT OF KINDNESS, THE [PETITIONER/APPLICANT] AS IN DUTY BOUND SHALL EVER PRAY."
REPLY/DENIAL FORMULAE: "vehemently denied being false, frivolous and vexatious"; "The contents of the corresponding paragraph are a matter of record and need no reply"; "denied for want of knowledge".`,

  NOTICE: `NOTICE FORMULAE: "Under instructions from and on behalf of my client, [name and address], I do hereby serve upon you this legal notice as under:"; "call upon you to [demanded act] within [15] days of the receipt hereof"; "failing which my client shall be constrained to initiate appropriate civil and/or criminal proceedings against you before the competent court/forum of appropriate jurisdiction, entirely at your risk as to costs and consequences, which please note"; "My client reserves its right to take such further or other action as may be advised, and nothing herein shall be construed as a waiver of any right or remedy available to my client"; "A copy of this notice has been retained in my office for record and further necessary action".`,

  DEED: `DEED FORMULAE: "THIS [DEED/AGREEMENT] is made and executed at [place] on this [day] day of [month], [year] BY AND BETWEEN"; "(hereinafter referred to as 'the [ROLE]', which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include his/her/its heirs, successors, legal representatives, administrators and permitted assigns) of the ONE PART"; recitals each opening "AND WHEREAS"; operative opening "NOW THIS DEED WITNESSETH AND IT IS HEREBY AGREED BY AND BETWEEN THE PARTIES as follows:"; testimonium "IN WITNESS WHEREOF the parties hereto have set their respective hands and signatures on the day, month and year first hereinabove written, in the presence of the following attesting witnesses:".`,

  OPINION: `OPINION FORMULAE: "On the basis of the facts furnished and the documents perused, I am of the considered opinion that ..."; "The question that falls for consideration is whether ..."; "The settled position of law, as it presently stands, is that ..."; "In the considered view of the undersigned ..."; "It would, therefore, be advisable to ..."; "This opinion is confined to the facts stated and the documents furnished, and to the law as it stands on the date hereof".`,

  APPLICATION: `APPLICATION FORMULAE: "I, the undersigned, most respectfully submit as under:"; "It is, therefore, most humbly requested that ..."; "I declare that the facts stated hereinabove are true and correct to the best of my knowledge, information and belief, and nothing material has been concealed therefrom"; closing "Thanking you, / Yours faithfully," above the signature block.`,

  EMAIL: `EMAIL REGISTER: "I write on behalf of ..."; "I am instructed to state that ..."; "I would be obliged if you could ..."; "Kindly treat this matter as most urgent"; "Please acknowledge receipt of this email"; "I look forward to your response by [date]"; sign off "Yours faithfully/sincerely," or "Regards," — never casual closings.`,
}

// ─── Document type → lexicon group ────────────────────────────────
export const TYPE_GROUP = {
  PETITION:           'PLEADING',
  WRIT_PETITION:      'PLEADING',
  PIL:                'PLEADING',
  BAIL_APPLICATION:   'PLEADING',
  STAY_APPLICATION:   'PLEADING',
  CONSUMER_COMPLAINT: 'PLEADING',
  DIVORCE_PETITION:   'PLEADING',
  AFFIDAVIT:          'PLEADING',
  CASE_BRIEF:         'OPINION',
  MEMORANDUM:         'OPINION',
  LEGAL_OPINION:      'OPINION',
  LEGAL_NOTICE:       'NOTICE',
  CHEQUE_BOUNCE:      'NOTICE',
  CONTRACT:           'DEED',
  RENT_AGREEMENT:     'DEED',
  SALE_DEED:          'DEED',
  VAKALATNAMA:        'DEED',
  RTI_APPLICATION:    'APPLICATION',
  FIR_COMPLAINT:      'APPLICATION',
  LEGAL_EMAIL:        'EMAIL',
}

// Build the lexicon block for a document type. Unknown types get the
// core block plus the pleading formulae (the safest default register).
export function buildLexiconBlock(documentType) {
  const group = TYPE_GROUP[documentType] || 'PLEADING'
  return `
═══════ DRAFTING LEXICON (weave these constructions in naturally — never list or explain them) ═══════
${CORE}
${GROUP_LEXICON[group]}
═══════ END DRAFTING LEXICON ═══════
`
}

// Exported for tests / tooling.
export const LEXICON_GROUPS = Object.keys(GROUP_LEXICON)
