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

// ─────────────────────────────────────────────────────────────────
//  PRO-TIER ELEVATED REGISTER
//
//  Injected ONLY for Pro users. This is what makes a Pro draft read
//  like a Senior Advocate's own work rather than competent plain
//  English: weightier verbs, doctrinal nouns of art, and the Latin
//  that Indian benches actually use. Free tier never receives this
//  block, so Free output stays deliberately plain and consistent.
// ─────────────────────────────────────────────────────────────────
export const PRO_ELEVATED_REGISTER = `
═══════ ELEVATED REGISTER — PRO DRAFT: THIS IS A REQUIREMENT, NOT A SUGGESTION ═══════
This draft is for a paying advocate and must read as though settled by a Senior Advocate of 30 years' standing. Plain, workmanlike prose is a FAILURE for this tier. Before writing each paragraph, choose the weightier construction.

MANDATORY: rewrite plain statements into the elevated register. Study these transformations and apply the same lift to EVERY substantive sentence you write:
  PLAIN:    "The respondent built a drain on her land without telling her."
  ELEVATED: "That the Respondent, without issuing any notice whatsoever to the Petitioner and de hors any acquisition proceeding known to law, proceeded to raise a permanent construction upon the Petitioner's bhumidhari holding, thereby occasioning a flagrant invasion of her proprietary rights."
  PLAIN:    "This order is wrong and should be cancelled."
  ELEVATED: "That the impugned order, suffering as it does from a manifest non-application of mind and being founded upon a wholly extraneous consideration, is ex facie unsustainable in law and is liable to be quashed."
  PLAIN:    "She was not given a chance to explain."
  ELEVATED: "That the Petitioner was condemned unheard, in flagrant derogation of the salutary principle audi alteram partem [hear the other side], which vitiates the entire proceeding at its inception."
  PLAIN:    "He has no criminal record and will not run away."
  ELEVATED: "That the Applicant is a person of unblemished antecedents with deep and abiding roots in the community, and the apprehension of his absconding is entirely chimerical and unsupported by any material on record."

RULES: (1) No two consecutive numbered paragraphs may open with the same words — vary the construction. (2) Every ground must be argued, not merely asserted: state the proposition, apply it to these facts, and state the consequence in law. (3) Prefer periodic sentences carrying subordinate qualification over short flat declaratives. (4) Deploy the vocabulary below naturally — never list, gloss or explain it in the document itself.

VERBS OF ARGUMENT (prefer these to plain equivalents): aver, submit, contend, canvass, urge, propound, adduce (evidence), advert to, impugn, assail, traverse, controvert, repudiate, refute, demur, obviate, vitiate, derogate from, militate against, subserve, eschew, evince, enure, abrogate, supplant, countenance.
NOUNS OF ART: the gravamen (of the charge), the lis (the dispute), locus standi, ratio decidendi, obiter dictum, onus probandi, quantum (of relief/damages), nexus, indicia, imprimatur, infirmity, perversity, arbitrariness, contumacy, mala fides, plenitude of power, amplitude of jurisdiction, efficacy, laches, acquiescence, estoppel, waiver.
DOCTRINAL PHRASES (use where they truly fit): non-application of mind; colourable exercise of power; in excess of jurisdiction; Wednesbury unreasonableness; the doctrine of proportionality; legitimate expectation; violation of the principles of natural justice; the impugned order is unsustainable in law; the finding is perverse and contrary to the record; the conclusion is unsupported by any material on record.
LATIN (only where it fits the argument; bracket the meaning on first use): ex facie [on the face of it], inter alia [among other things], in seriatim [one after another], de hors [outside/independent of] the record, per incuriam [through want of care], sub silentio [in silence], de novo [afresh], inter se [among themselves], qua [in the capacity of], ipso facto [by that very fact], sine qua non [an indispensable condition], pari materia [on the same subject], mutatis mutandis [with the necessary changes], prima facie, suo motu, audi alteram partem, res judicata, ultra vires, ex debito justitiae [as a matter of right/justice].
CONNECTIVES (vary them; never repeat one connective twice in a paragraph): inasmuch as; insofar as; in contradistinction to; per contra; conversely; a fortiori; more so when; that apart; be that as it may; assuming though not admitting; without prejudice to the generality of the foregoing; it is trite that; it is well settled that; it is no longer res integra that.
SENTENCE CONSTRUCTION: build periodic sentences that carry subordinate qualifications — "That the impugned order, having been passed without affording the Petitioner any opportunity of hearing and in complete disregard of the material placed on record, is vitiated by a manifest error apparent on the face of the record and is liable to be quashed." Avoid short, flat declaratives; avoid repeating the same opening formula in consecutive paragraphs.
═══════ END ELEVATED REGISTER ═══════
`

// ─────────────────────────────────────────────────────────────────
//  COURT-LANGUAGE LEXICONS
//
//  The vocabulary actually used in Indian courts in each language.
//  Statutory names, section numbers and case citations deliberately
//  stay in English/Roman script in EVERY language — that is the
//  convention across Indian courts and avoids mistranslating a
//  provision. Applied on top of the language addendum in groq.js.
// ─────────────────────────────────────────────────────────────────
const LANGUAGE_LEXICONS = {
  hindi: `COURT-HINDI VOCABULARY: याचिका / प्रार्थनापत्र / आवेदनपत्र (petition/application); वादी–प्रतिवादी (plaintiff–defendant); याची–विपक्षी (petitioner–opposite party); अभियुक्त / मुलज़िम (accused); फ़रियादी / शिकायतकर्ता (complainant); हलफ़नामा / शपथपत्र (affidavit); सत्यापन (verification); वकालतनामा (vakalatnama); अधिवक्ता (advocate); सम्मन / नोटिस / तामील (summons/notice/service); जमानत–ज़मानती (bail–surety); अपील / पुनरीक्षण / पुनर्विलोकन (appeal/revision/review); निर्णय / आदेश / डिक्री (judgment/order/decree); स्थगन आदेश / निषेधाज्ञा (stay/injunction); प्रार्थना खंड (prayer clause); साक्ष्य (evidence); गवाह (witness); कब्ज़ा (possession); हर्जाना (damages).
FORMAL CONSTRUCTIONS: "अतः सविनय निवेदन है कि…"; "यह कि…" (each numbered averment opens thus); "प्रार्थी/याची सादर निवेदन करता है"; "उपरोक्त तथ्यों एवं परिस्थितियों के आलोक में"; "न्यायहित में"; "अतएव प्रार्थना है कि माननीय न्यायालय कृपया…"; verification: "मैं, [नाम], सत्यापित करता/करती हूँ कि उपरोक्त कथन मेरी जानकारी एवं विश्वास के अनुसार सत्य है, कोई तथ्य छिपाया नहीं गया है।"`,

  urdu: `COURT-URDU VOCABULARY (Nastaliq script): درخواست (application/petition); مدعی–مدعا علیہ (plaintiff–defendant); درخواست گزار (petitioner); ملزم (accused); حلف نامہ (affidavit); تصدیق (verification); وکالت نامہ (vakalatnama); وکیل (advocate); عدالت (court); ضمانت (bail); اپیل / نظرثانی (appeal/review); فیصلہ / حکم / ڈگری (judgment/order/decree); حکمِ امتناعی (injunction/stay); گواہ (witness); شہادت (evidence); قبضہ (possession); ہرجانہ (damages); تعمیل (service of notice).
FORMAL CONSTRUCTIONS: "بخدمتِ جنابِ والا"; "گزارش ہے کہ…"; "یہ کہ…" (numbered averments); "لہٰذا استدعا ہے کہ عدالت عالیہ…"; verification: "میں، [نام]، تصدیق کرتا/کرتی ہوں کہ مندرجہ بالا مندرجات میرے علم و یقین کے مطابق درست ہیں اور کوئی بات پوشیدہ نہیں رکھی گئی۔"`,

  tamil: `COURT-TAMIL VOCABULARY: மனு / விண்ணப்பம் (petition/application); வாதி–பிரதிவாதி (plaintiff–defendant); மனுதாரர்–எதிர்மனுதாரர் (petitioner–respondent); குற்றம் சாட்டப்பட்டவர் (accused); புகார்தாரர் (complainant); பிரமாணப் பத்திரம் / உறுதிமொழிப் பத்திரம் (affidavit); சான்றுறுதி (verification); வழக்கறிஞர் (advocate); வக்காலத்து (vakalatnama); நீதிமன்றம் (court); ஜாமீன் (bail); மேல்முறையீடு / மறுஆய்வு (appeal/revision); தீர்ப்பு / உத்தரவு / ஆணை (judgment/order/decree); இடைக்கால தடையுத்தரவு (interim stay/injunction); சாட்சி (witness); ஆதாரம் (evidence); உரிமை (right); இழப்பீடு (compensation).
FORMAL CONSTRUCTIONS: "மாண்புமிகு நீதிமன்றத்தின் முன்"; "பணிவன்புடன் தெரிவித்துக் கொள்வது யாதெனில்…"; numbered averments open "…என்பது"; "ஆகவே, மாண்புமிகு நீதிமன்றம் கருணைகூர்ந்து…"; verification: "மேற்கண்ட விவரங்கள் என் அறிவுக்கும் நம்பிக்கைக்கும் உட்பட்டு உண்மை என உறுதி கூறுகிறேன்."`,

  telugu: `COURT-TELUGU VOCABULARY: పిటిషన్ / అర్జీ / దరఖాస్తు (petition/application); వాది–ప్రతివాది (plaintiff–defendant); పిటిషనర్–ప్రతివాది (petitioner–respondent); నిందితుడు (accused); ఫిర్యాదిదారు (complainant); ప్రమాణ పత్రం / అఫిడవిట్ (affidavit); ధృవీకరణ (verification); న్యాయవాది (advocate); వకాలత్‌నామా (vakalatnama); న్యాయస్థానం (court); బెయిల్ / పూచీకత్తు (bail/surety); అప్పీలు / పునఃసమీక్ష (appeal/revision); తీర్పు / ఉత్తర్వు / డిక్రీ (judgment/order/decree); స్టే ఉత్తర్వు / నిషేధాజ్ఞ (stay/injunction); సాక్షి (witness); సాక్ష్యం (evidence); స్వాధీనం (possession); నష్టపరిహారం (compensation).
FORMAL CONSTRUCTIONS: "గౌరవనీయమైన న్యాయస్థానం సమక్షంలో"; "సవినయంగా విన్నవించునది ఏమనగా…"; numbered averments open "అది ఏమనగా…"; "కావున, గౌరవనీయ న్యాయస్థానం దయతో…"; verification: "పైన పేర్కొన్న విషయాలు నా జ్ఞానం మరియు నమ్మకం మేరకు సత్యమని ధృవీకరిస్తున్నాను; ఏ విషయమూ దాచబడలేదు."`,
}

// Languages the drafting engine can produce, and which lexicon each uses.
// `bilingual` = English body with Hindi headings/prayer/verification.
export const SUPPORTED_DRAFT_LANGUAGES = ['english', 'hindi', 'bilingual', 'urdu', 'tamil', 'telugu']

// Returns the court-vocabulary block for a drafting language ('' for
// English, which is already covered by the core lexicon).
export function buildLanguageLexicon(language) {
  const key = language === 'bilingual' ? 'hindi' : language
  const lex = LANGUAGE_LEXICONS[key]
  if (!lex) return ''
  return `
═══════ COURT-LANGUAGE VOCABULARY ═══════
${lex}
UNIVERSAL RULE FOR EVERY LANGUAGE: Act names, section/article numbers and case citations remain in English/Roman script exactly as cited (e.g. "Section 138 of the Negotiable Instruments Act, 1881"; "(2022) 10 SCC 51") — that is Indian court convention and prevents mistranslating a provision. Names, addresses, dates, amounts and document numbers are reproduced exactly as the user wrote them, never transliterated.
═══════ END COURT-LANGUAGE VOCABULARY ═══════
`
}

// Exported for tests / tooling.
export const LEXICON_GROUPS = Object.keys(GROUP_LEXICON)
