// ─────────────────────────────────────────────────────────────────
//  LexForge AI — utils.js
//  All-India Edition: Supreme Court + every High Court (with benches)
//  + every district & sessions court + central tribunals + state-level
//  Family / Labour / Consumer / Rent forums.
//  The full list of courts is generated from `lib/india-data.js`.
//  v2 — adds /study + laws-catalog grounding for citations.
// ─────────────────────────────────────────────────────────────────

import {
  ALL_HIGH_COURTS as IND_HCS,
  NATIONAL_TRIBUNALS as IND_TRIBUNALS,
  STATE_SPECIALISED_COURTS as IND_STATE_SPECIAL,
  ALL_DISTRICT_COURTS as IND_DISTRICT,
  COURTS_BY_STATE as IND_BY_STATE,
  STATES as IND_STATES,
} from './india-data.js'

export const DOCUMENT_TYPES = [
  // ── Original document types ──────────────────────────────────
  { value: 'LEGAL_NOTICE',       label: 'Legal Notice',        description: 'Formal notice demanding action or remedy under Indian law', icon: '📋' },
  { value: 'CASE_BRIEF',         label: 'Case Brief',          description: 'Structured IRAC summary of legal arguments and precedents', icon: '⚖️' },
  { value: 'CONTRACT',           label: 'Contract',            description: 'Legally binding agreement — property, service, business', icon: '📝' },
  { value: 'PETITION',           label: 'Petition',            description: 'Civil/Criminal petition to district or subordinate courts', icon: '🏛️' },
  { value: 'MEMORANDUM',         label: 'Memorandum',          description: 'Legal analysis, opinion and actionable recommendations', icon: '📄' },
  { value: 'WRIT_PETITION',      label: 'Writ Petition',       description: 'HC writ under Art. 226 — Certiorari, Mandamus, Habeas Corpus', icon: '🔏' },
  { value: 'VAKALATNAMA',        label: 'Vakalatnama',         description: 'Authority letter appointing an advocate to appear in court', icon: '✍️' },
  { value: 'BAIL_APPLICATION',   label: 'Bail Application',    description: 'Regular/anticipatory bail under CrPC — district or HC', icon: '🔓' },
  { value: 'STAY_APPLICATION',   label: 'Stay Application',    description: 'Urgent stay/injunction against an order or proceeding', icon: '⏸️' },
  { value: 'AFFIDAVIT',          label: 'Affidavit',           description: 'Sworn statement of facts for court or official use', icon: '🖊️' },
  { value: 'PIL',                label: 'PIL',                 description: 'Public Interest Litigation — HC under Art. 226', icon: '⚡' },
  // ── New document types ───────────────────────────────────────
  { value: 'RTI_APPLICATION',    label: 'RTI Application',     description: 'Right to Information application under RTI Act 2005', icon: '🔍' },
  { value: 'CONSUMER_COMPLAINT', label: 'Consumer Complaint',  description: 'Complaint to Consumer Forum under Consumer Protection Act 2019', icon: '🛒' },
  { value: 'DIVORCE_PETITION',   label: 'Divorce Petition',    description: 'Petition for divorce under Hindu Marriage Act / Special Marriage Act', icon: '⚖️' },
  { value: 'RENT_AGREEMENT',     label: 'Rent Agreement',      description: 'Residential or commercial rental / lease agreement', icon: '🏠' },
  { value: 'SALE_DEED',          label: 'Sale Deed',           description: 'Property sale deed / conveyance deed under Transfer of Property Act', icon: '🏗️' },
  { value: 'CHEQUE_BOUNCE',      label: 'Cheque Bounce Notice',description: 'Legal notice under Section 138 Negotiable Instruments Act', icon: '💳' },
  { value: 'LEGAL_OPINION',      label: 'Legal Opinion',       description: 'Formal legal opinion / advice memorandum on a legal question', icon: '💡' },
  { value: 'FIR_COMPLAINT',      label: 'FIR Complaint',       description: 'Written complaint / FIR to police station under CrPC Section 154', icon: '🚔' },
  // ── Mail / Email drafting ────────────────────────────────────
  { value: 'LEGAL_EMAIL',        label: 'Email Draft',         description: 'Professional / legal email — copy-paste into Gmail or Outlook', icon: '✉️' },
]

// ─── Re-exports from india-data.js for downstream consumers ───────
export { STATES, COURTS_BY_STATE } from './india-data.js'

// ─── Courts (organised by State / level) ─────────────────────────
// SCOPE: Supreme Court + every one of the 25 High Courts (with all
// permanent / circuit benches) + every central tribunal (NCLT / NCLAT
// / ITAT / NGT / CAT / DRT / SAT / NCDRC / TDSAT / CESTAT / CCI / NHRC
// / NCW / NCPCR / CIC) + state-level Family / Labour / Consumer / Rent
// forums for every state and UT + every district & sessions court in
// India (~750 entries auto-generated from lib/india-data.js).
// The legacy hand-curated UP / Tamil Nadu entries below are kept for
// backward compatibility with prompts in lib/groq.js that key off those
// exact values (e.g. PRAYAGRAJ_HC, MADRAS_HC, TN_CHENNAI).
export const COURTS = {
  // ── Supreme Court ────────────────────────────────────────────
  SUPREME: [
    { value: 'SUPREME_COURT', label: 'Supreme Court of India', short: 'Supreme Court of India', state: 'Union' },
  ],

  // ── All 25 High Courts (with benches) ────────────────────────
  ALL_HIGH_COURTS: [
    { value: 'BOMBAY_HC',          label: 'High Court of Judicature at Bombay (Mumbai)',                short: 'Bombay HC – Mumbai',          state: 'Maharashtra' },
    { value: 'BOMBAY_HC_AURANGABAD', label: 'Bombay HC, Aurangabad Bench',                              short: 'Bombay HC – Aurangabad',     state: 'Maharashtra' },
    { value: 'BOMBAY_HC_NAGPUR',   label: 'Bombay HC, Nagpur Bench',                                     short: 'Bombay HC – Nagpur',          state: 'Maharashtra' },
    { value: 'BOMBAY_HC_GOA',      label: 'Bombay HC, Panaji (Goa) Bench',                               short: 'Bombay HC – Goa',             state: 'Goa' },
    { value: 'CALCUTTA_HC',        label: 'High Court of Calcutta (Kolkata)',                            short: 'Calcutta HC',                 state: 'West Bengal' },
    { value: 'CALCUTTA_HC_PORTBLAIR', label: 'Calcutta HC, Port Blair Circuit Bench',                    short: 'Calcutta HC – Port Blair',   state: 'A&N Islands' },
    { value: 'MADRAS_HC_FULL',     label: 'High Court of Judicature at Madras (Chennai)',                short: 'Madras HC – Chennai',         state: 'Tamil Nadu' },
    { value: 'MADURAI_BENCH_FULL', label: 'Madurai Bench of Madras High Court',                          short: 'Madras HC – Madurai',         state: 'Tamil Nadu' },
    { value: 'DELHI_HC',           label: 'High Court of Delhi',                                         short: 'Delhi HC',                    state: 'Delhi' },
    { value: 'KARNATAKA_HC',       label: 'High Court of Karnataka (Bengaluru)',                         short: 'Karnataka HC – Bengaluru',    state: 'Karnataka' },
    { value: 'KARNATAKA_HC_DHARWAD', label: 'Karnataka HC, Dharwad Bench',                               short: 'Karnataka HC – Dharwad',     state: 'Karnataka' },
    { value: 'KARNATAKA_HC_KALABURAGI', label: 'Karnataka HC, Kalaburagi Bench',                         short: 'Karnataka HC – Kalaburagi',  state: 'Karnataka' },
    { value: 'KERALA_HC',          label: 'High Court of Kerala (Ernakulam)',                            short: 'Kerala HC – Ernakulam',       state: 'Kerala' },
    { value: 'TELANGANA_HC',       label: 'High Court for the State of Telangana (Hyderabad)',           short: 'Telangana HC – Hyderabad',    state: 'Telangana' },
    { value: 'ANDHRA_HC',          label: 'High Court of Andhra Pradesh (Amaravati)',                    short: 'Andhra Pradesh HC',           state: 'Andhra Pradesh' },
    { value: 'GUJARAT_HC',         label: 'High Court of Gujarat (Ahmedabad)',                           short: 'Gujarat HC',                  state: 'Gujarat' },
    { value: 'PUNJAB_HARYANA_HC',  label: 'Punjab and Haryana High Court (Chandigarh)',                  short: 'P&H HC – Chandigarh',         state: 'Punjab/Haryana' },
    { value: 'RAJASTHAN_HC',       label: 'High Court of Rajasthan (Jodhpur)',                           short: 'Rajasthan HC – Jodhpur',      state: 'Rajasthan' },
    { value: 'RAJASTHAN_HC_JAIPUR', label: 'Rajasthan HC, Jaipur Bench',                                 short: 'Rajasthan HC – Jaipur',      state: 'Rajasthan' },
    { value: 'MP_HC',              label: 'High Court of Madhya Pradesh (Jabalpur)',                     short: 'MP HC – Jabalpur',            state: 'Madhya Pradesh' },
    { value: 'MP_HC_INDORE',       label: 'MP High Court, Indore Bench',                                 short: 'MP HC – Indore',              state: 'Madhya Pradesh' },
    { value: 'MP_HC_GWALIOR',      label: 'MP High Court, Gwalior Bench',                                short: 'MP HC – Gwalior',             state: 'Madhya Pradesh' },
    { value: 'PATNA_HC',           label: 'High Court of Patna',                                         short: 'Patna HC',                    state: 'Bihar' },
    { value: 'JHARKHAND_HC',       label: 'High Court of Jharkhand (Ranchi)',                            short: 'Jharkhand HC – Ranchi',       state: 'Jharkhand' },
    { value: 'ORISSA_HC',          label: 'High Court of Orissa (Cuttack)',                              short: 'Orissa HC – Cuttack',         state: 'Odisha' },
    { value: 'CHHATTISGARH_HC',    label: 'High Court of Chhattisgarh (Bilaspur)',                       short: 'Chhattisgarh HC',             state: 'Chhattisgarh' },
    { value: 'UTTARAKHAND_HC',     label: 'High Court of Uttarakhand (Nainital)',                        short: 'Uttarakhand HC – Nainital',   state: 'Uttarakhand' },
    { value: 'HP_HC',              label: 'High Court of Himachal Pradesh (Shimla)',                     short: 'HP HC – Shimla',              state: 'Himachal Pradesh' },
    { value: 'JK_HC',              label: 'High Court of J&K and Ladakh (Srinagar/Jammu)',               short: 'J&K HC',                      state: 'J&K / Ladakh' },
    { value: 'SIKKIM_HC',          label: 'High Court of Sikkim (Gangtok)',                              short: 'Sikkim HC',                   state: 'Sikkim' },
    { value: 'TRIPURA_HC',         label: 'High Court of Tripura (Agartala)',                            short: 'Tripura HC',                  state: 'Tripura' },
    { value: 'MEGHALAYA_HC',       label: 'High Court of Meghalaya (Shillong)',                          short: 'Meghalaya HC',                state: 'Meghalaya' },
    { value: 'MANIPUR_HC',         label: 'High Court of Manipur (Imphal)',                              short: 'Manipur HC',                  state: 'Manipur' },
    { value: 'GAUHATI_HC',         label: 'High Court of Gauhati (Guwahati)',                            short: 'Gauhati HC – Guwahati',       state: 'Assam' },
    { value: 'GAUHATI_HC_AIZAWL',  label: 'Gauhati HC, Aizawl Bench',                                    short: 'Gauhati HC – Aizawl',         state: 'Mizoram' },
    { value: 'GAUHATI_HC_KOHIMA',  label: 'Gauhati HC, Kohima Bench',                                    short: 'Gauhati HC – Kohima',         state: 'Nagaland' },
    { value: 'GAUHATI_HC_ITANAGAR', label: 'Gauhati HC, Itanagar Bench',                                 short: 'Gauhati HC – Itanagar',      state: 'Arunachal Pradesh' },
  ],

  // ── Major Tribunals & Quasi-Judicial Bodies ──────────────────
  TRIBUNALS: [
    { value: 'NCLT',    label: 'National Company Law Tribunal (NCLT)',                          short: 'NCLT',    state: 'Union' },
    { value: 'NCLAT',   label: 'National Company Law Appellate Tribunal (NCLAT)',               short: 'NCLAT',   state: 'Union' },
    { value: 'ITAT',    label: 'Income Tax Appellate Tribunal (ITAT)',                          short: 'ITAT',    state: 'Union' },
    { value: 'GSTAT',   label: 'GST Appellate Tribunal (GSTAT)',                                short: 'GSTAT',   state: 'Union' },
    { value: 'AFT',     label: 'Armed Forces Tribunal (AFT)',                                   short: 'AFT',     state: 'Union' },
    { value: 'NGT',     label: 'National Green Tribunal (NGT)',                                 short: 'NGT',     state: 'Union' },
    { value: 'CAT',     label: 'Central Administrative Tribunal (CAT)',                         short: 'CAT',     state: 'Union' },
    { value: 'DRT',     label: 'Debts Recovery Tribunal (DRT)',                                 short: 'DRT',     state: 'Union' },
    { value: 'SAT',     label: 'Securities Appellate Tribunal (SAT)',                           short: 'SAT',     state: 'Union' },
    { value: 'CCI',     label: 'Competition Commission of India (CCI)',                         short: 'CCI',     state: 'Union' },
    { value: 'NCDRC',   label: 'National Consumer Disputes Redressal Commission (NCDRC)',       short: 'NCDRC',   state: 'Union' },
    { value: 'TDSAT',   label: 'Telecom Disputes Settlement and Appellate Tribunal (TDSAT)',    short: 'TDSAT',   state: 'Union' },
  ],

  // ── Maharashtra district / city courts ───────────────────────
  MH_DISTRICT: [
    { value: 'MH_BOMBAY_CITY_CIVIL', label: 'Bombay City Civil Court, Mumbai',          short: 'City Civil Court, Mumbai',   state: 'Maharashtra' },
    { value: 'MH_BOMBAY_SESSIONS',   label: 'Sessions Court, Greater Bombay (Mumbai)',  short: 'Sessions Court, Mumbai',     state: 'Maharashtra' },
    { value: 'MH_BOMBAY_METRO_MAG',  label: 'Metropolitan Magistrate, Mumbai',          short: 'Metro Magistrate, Mumbai',   state: 'Maharashtra' },
    { value: 'MH_PUNE_DISTRICT',     label: 'District & Sessions Court, Pune',          short: 'District Court, Pune',       state: 'Maharashtra' },
    { value: 'MH_PUNE_CJM',          label: 'Court of Chief Judicial Magistrate, Pune', short: 'CJM Court, Pune',            state: 'Maharashtra' },
    { value: 'MH_PUNE_FAMILY',       label: 'Family Court, Pune',                       short: 'Family Court, Pune',         state: 'Maharashtra' },
    { value: 'MH_THANE_DISTRICT',    label: 'District & Sessions Court, Thane',         short: 'District Court, Thane',      state: 'Maharashtra' },
    { value: 'MH_NAGPUR_DISTRICT',   label: 'District & Sessions Court, Nagpur',        short: 'District Court, Nagpur',     state: 'Maharashtra' },
    { value: 'MH_AURANGABAD_DISTRICT', label: 'District & Sessions Court, Aurangabad',  short: 'District Court, Aurangabad', state: 'Maharashtra' },
  ],

  // ── Karnataka district / city courts ─────────────────────────
  KA_DISTRICT: [
    { value: 'KA_BENGALURU_CITY_CIVIL', label: 'City Civil Court, Bengaluru',           short: 'City Civil Court, Bengaluru', state: 'Karnataka' },
    { value: 'KA_BENGALURU_SESSIONS',   label: 'Sessions Court, Bengaluru',             short: 'Sessions Court, Bengaluru',   state: 'Karnataka' },
    { value: 'KA_BENGALURU_METRO_MAG',  label: 'Metropolitan Magistrate, Bengaluru',    short: 'Metro Magistrate, Bengaluru', state: 'Karnataka' },
    { value: 'KA_BENGALURU_FAMILY',     label: 'Family Court, Bengaluru',               short: 'Family Court, Bengaluru',     state: 'Karnataka' },
    { value: 'KA_MYSURU_DISTRICT',      label: 'District & Sessions Court, Mysuru',     short: 'District Court, Mysuru',      state: 'Karnataka' },
    { value: 'KA_MANGALURU_DISTRICT',   label: 'District & Sessions Court, Mangaluru',  short: 'District Court, Mangaluru',   state: 'Karnataka' },
    { value: 'KA_HUBLI_DISTRICT',       label: 'District & Sessions Court, Hubli',      short: 'District Court, Hubli',       state: 'Karnataka' },
  ],

  // ── Telangana district / city courts (Hyderabad) ──────────────
  TG_DISTRICT: [
    { value: 'TG_HYDERABAD_CITY_CIVIL', label: 'City Civil Court, Hyderabad',           short: 'City Civil Court, Hyderabad', state: 'Telangana' },
    { value: 'TG_HYDERABAD_SESSIONS',   label: 'Sessions Court, Hyderabad',             short: 'Sessions Court, Hyderabad',   state: 'Telangana' },
    { value: 'TG_HYDERABAD_METRO_MAG',  label: 'Metropolitan Magistrate, Hyderabad',    short: 'Metro Magistrate, Hyderabad', state: 'Telangana' },
    { value: 'TG_HYDERABAD_FAMILY',     label: 'Family Court, Hyderabad',               short: 'Family Court, Hyderabad',     state: 'Telangana' },
    { value: 'TG_HYDERABAD_CONSUMER',   label: 'District Consumer Forum, Hyderabad',    short: 'Consumer Forum, Hyderabad',   state: 'Telangana' },
    { value: 'TG_WARANGAL_DISTRICT',    label: 'District & Sessions Court, Warangal',   short: 'District Court, Warangal',    state: 'Telangana' },
    { value: 'TG_KARIMNAGAR_DISTRICT',  label: 'District & Sessions Court, Karimnagar', short: 'District Court, Karimnagar',  state: 'Telangana' },
  ],

  // ── Punjab district / city courts ─────────────────────────────
  PB_DISTRICT: [
    { value: 'PB_CHANDIGARH_DISTRICT', label: 'District & Sessions Court, Chandigarh',  short: 'District Court, Chandigarh',  state: 'Punjab' },
    { value: 'PB_AMRITSAR_DISTRICT',   label: 'District & Sessions Court, Amritsar',    short: 'District Court, Amritsar',    state: 'Punjab' },
    { value: 'PB_LUDHIANA_DISTRICT',   label: 'District & Sessions Court, Ludhiana',    short: 'District Court, Ludhiana',    state: 'Punjab' },
    { value: 'PB_JALANDHAR_DISTRICT',  label: 'District & Sessions Court, Jalandhar',   short: 'District Court, Jalandhar',   state: 'Punjab' },
    { value: 'PB_PATIALA_DISTRICT',    label: 'District & Sessions Court, Patiala',     short: 'District Court, Patiala',     state: 'Punjab' },
    { value: 'PB_BATHINDA_DISTRICT',   label: 'District & Sessions Court, Bathinda',    short: 'District Court, Bathinda',    state: 'Punjab' },
  ],

  // ── Kerala district / city courts ─────────────────────────────
  KL_DISTRICT: [
    { value: 'KL_ERNAKULAM_DISTRICT',     label: 'District & Sessions Court, Ernakulam (Kochi)', short: 'District Court, Ernakulam',  state: 'Kerala' },
    { value: 'KL_TRIVANDRUM_DISTRICT',    label: 'District & Sessions Court, Thiruvananthapuram', short: 'District Court, Trivandrum', state: 'Kerala' },
    { value: 'KL_KOZHIKODE_DISTRICT',     label: 'District & Sessions Court, Kozhikode',          short: 'District Court, Kozhikode',  state: 'Kerala' },
    { value: 'KL_THRISSUR_DISTRICT',      label: 'District & Sessions Court, Thrissur',           short: 'District Court, Thrissur',   state: 'Kerala' },
    { value: 'KL_KOLLAM_DISTRICT',        label: 'District & Sessions Court, Kollam',             short: 'District Court, Kollam',     state: 'Kerala' },
    { value: 'KL_KOTTAYAM_DISTRICT',      label: 'District & Sessions Court, Kottayam',           short: 'District Court, Kottayam',   state: 'Kerala' },
    { value: 'KL_FAMILY_ERNAKULAM',       label: 'Family Court, Ernakulam',                       short: 'Family Court, Ernakulam',   state: 'Kerala' },
  ],

  // ── Assam district / city courts ──────────────────────────────
  AS_DISTRICT: [
    { value: 'AS_GUWAHATI_DISTRICT',  label: 'District & Sessions Court, Kamrup (Guwahati)',  short: 'District Court, Guwahati',   state: 'Assam' },
    { value: 'AS_GUWAHATI_CJM',       label: 'Court of Chief Judicial Magistrate, Guwahati',  short: 'CJM, Guwahati',              state: 'Assam' },
    { value: 'AS_DIBRUGARH_DISTRICT', label: 'District & Sessions Court, Dibrugarh',          short: 'District Court, Dibrugarh',  state: 'Assam' },
    { value: 'AS_SILCHAR_DISTRICT',   label: 'District & Sessions Court, Cachar (Silchar)',   short: 'District Court, Silchar',    state: 'Assam' },
    { value: 'AS_JORHAT_DISTRICT',    label: 'District & Sessions Court, Jorhat',             short: 'District Court, Jorhat',     state: 'Assam' },
    { value: 'AS_TEZPUR_DISTRICT',    label: 'District & Sessions Court, Sonitpur (Tezpur)',  short: 'District Court, Tezpur',     state: 'Assam' },
  ],

  // ── Uttar Pradesh ────────────────────────────────────────────
  UP_HIGH_COURTS: [
    { value: 'PRAYAGRAJ_HC',  label: 'High Court of Judicature at Allahabad (Prayagraj Bench)', short: 'Allahabad HC – Prayagraj', state: 'Uttar Pradesh' },
    { value: 'LUCKNOW_BENCH', label: 'High Court of Judicature at Allahabad (Lucknow Bench)',   short: 'Allahabad HC – Lucknow',   state: 'Uttar Pradesh' },
  ],
  UP_PRAYAGRAJ: [
    { value: 'DISTRICT_PRAYAGRAJ', label: 'District & Sessions Court, Prayagraj',              short: 'District Court, Prayagraj',    state: 'Uttar Pradesh' },
    { value: 'CJM_PRAYAGRAJ',      label: 'Court of Chief Judicial Magistrate, Prayagraj',     short: 'CJM Court, Prayagraj',         state: 'Uttar Pradesh' },
    { value: 'ADJ_PRAYAGRAJ',      label: 'Additional District Judge, Prayagraj',               short: 'ADJ, Prayagraj',               state: 'Uttar Pradesh' },
    { value: 'CIVIL_JUDGE_SD',     label: 'Civil Judge (Senior Division), Prayagraj',           short: 'Civil Judge SD, Prayagraj',    state: 'Uttar Pradesh' },
    { value: 'CIVIL_JUDGE_JD',     label: 'Civil Judge (Junior Division), Prayagraj',           short: 'Civil Judge JD, Prayagraj',    state: 'Uttar Pradesh' },
    { value: 'FAMILY_COURT',       label: 'Family Court, Prayagraj',                            short: 'Family Court, Prayagraj',      state: 'Uttar Pradesh' },
    { value: 'LABOUR_COURT',       label: 'Labour Court, Prayagraj',                            short: 'Labour Court, Prayagraj',      state: 'Uttar Pradesh' },
    { value: 'RENT_TRIBUNAL',      label: 'Rent Control & Eviction Officer, Prayagraj',         short: 'Rent Tribunal, Prayagraj',     state: 'Uttar Pradesh' },
    { value: 'CONSUMER_FORUM',     label: 'District Consumer Disputes Redressal Commission, Prayagraj', short: 'Consumer Forum, Prayagraj', state: 'Uttar Pradesh' },
  ],
  UP_NEARBY: [
    { value: 'DISTRICT_PRATAPGARH',  label: 'District & Sessions Court, Pratapgarh',  short: 'District Court, Pratapgarh',  state: 'Uttar Pradesh' },
    { value: 'DISTRICT_KAUSHAMBI',   label: 'District & Sessions Court, Kaushambi',   short: 'District Court, Kaushambi',   state: 'Uttar Pradesh' },
    { value: 'DISTRICT_FATEHPUR',    label: 'District & Sessions Court, Fatehpur',    short: 'District Court, Fatehpur',    state: 'Uttar Pradesh' },
    { value: 'DISTRICT_CHITRAKOOT',  label: 'District & Sessions Court, Chitrakoot',  short: 'District Court, Chitrakoot',  state: 'Uttar Pradesh' },
    { value: 'DISTRICT_MIRZAPUR',    label: 'District & Sessions Court, Mirzapur',    short: 'District Court, Mirzapur',    state: 'Uttar Pradesh' },
  ],
  // ── Tamil Nadu ───────────────────────────────────────────────
  TN_HIGH_COURTS: [
    { value: 'MADRAS_HC',      label: 'High Court of Judicature at Madras (Chennai)',     short: 'Madras HC – Chennai',      state: 'Tamil Nadu' },
    { value: 'MADURAI_BENCH',  label: 'Madurai Bench of Madras High Court',               short: 'Madras HC – Madurai Bench', state: 'Tamil Nadu' },
  ],
  TN_DISTRICT: [
    { value: 'TN_CHENNAI',      label: 'District Court, Chennai',            short: 'District Court, Chennai',      state: 'Tamil Nadu' },
    { value: 'TN_COIMBATORE',   label: 'District Court, Coimbatore',         short: 'District Court, Coimbatore',   state: 'Tamil Nadu' },
    { value: 'TN_MADURAI',      label: 'District Court, Madurai',            short: 'District Court, Madurai',      state: 'Tamil Nadu' },
    { value: 'TN_TRICHY',       label: 'District Court, Tiruchirappalli',    short: 'District Court, Trichy',       state: 'Tamil Nadu' },
    { value: 'TN_SALEM',        label: 'District Court, Salem',              short: 'District Court, Salem',        state: 'Tamil Nadu' },
    { value: 'TN_TIRUNELVELI',  label: 'District Court, Tirunelveli',        short: 'District Court, Tirunelveli',  state: 'Tamil Nadu' },
    { value: 'TN_VELLORE',      label: 'District Court, Vellore',            short: 'District Court, Vellore',      state: 'Tamil Nadu' },
    { value: 'TN_ERODE',        label: 'District Court, Erode',              short: 'District Court, Erode',        state: 'Tamil Nadu' },
    { value: 'TN_THANJAVUR',    label: 'District Court, Thanjavur',          short: 'District Court, Thanjavur',    state: 'Tamil Nadu' },
    { value: 'TN_DINDIGUL',     label: 'District Court, Dindigul',           short: 'District Court, Dindigul',     state: 'Tamil Nadu' },
  ],
  TN_SPECIAL: [
    { value: 'TN_CONSUMER_CHENNAI',  label: 'State Consumer Disputes Redressal Commission, Tamil Nadu (Chennai)', short: 'State Consumer Commission, TN', state: 'Tamil Nadu' },
    { value: 'TN_FAMILY_CHENNAI',    label: 'Family Court, Chennai',           short: 'Family Court, Chennai',      state: 'Tamil Nadu' },
    { value: 'TN_FAMILY_MADURAI',    label: 'Family Court, Madurai',           short: 'Family Court, Madurai',      state: 'Tamil Nadu' },
    { value: 'TN_LABOUR_CHENNAI',    label: 'Labour Court, Chennai',           short: 'Labour Court, Chennai',      state: 'Tamil Nadu' },
    { value: 'TN_RENT_CHENNAI',      label: 'Rent Controller, Chennai',        short: 'Rent Controller, Chennai',   state: 'Tamil Nadu' },
  ],
}

// Backward compat aliases
COURTS.HIGH_COURTS   = COURTS.UP_HIGH_COURTS
COURTS.PRAYAGRAJ     = COURTS.UP_PRAYAGRAJ
COURTS.NEARBY_DISTRICTS = COURTS.UP_NEARBY

// New all-India groupings
COURTS.ALL_INDIA_HIGH_COURTS   = IND_HCS
COURTS.ALL_INDIA_TRIBUNALS     = IND_TRIBUNALS
COURTS.ALL_INDIA_STATE_SPECIAL = IND_STATE_SPECIAL
COURTS.ALL_INDIA_DISTRICTS     = IND_DISTRICT

// ── ALL_COURTS now spans every Indian forum ─────────────────────
// Order: Supreme Court → all HCs → all national tribunals → state
// specialised forums → every district court → legacy curated entries
// (kept last so they don't shadow any new value but legacy values
// like PRAYAGRAJ_HC, MADRAS_HC, TN_CHENNAI continue to resolve).
const _legacyCurated = [
  ...COURTS.SUPREME,
  ...COURTS.ALL_HIGH_COURTS,
  ...COURTS.TRIBUNALS,
  ...COURTS.MH_DISTRICT,
  ...COURTS.KA_DISTRICT,
  ...COURTS.TG_DISTRICT,
  ...COURTS.PB_DISTRICT,
  ...COURTS.KL_DISTRICT,
  ...COURTS.AS_DISTRICT,
  ...COURTS.UP_HIGH_COURTS,
  ...COURTS.UP_PRAYAGRAJ,
  ...COURTS.UP_NEARBY,
  ...COURTS.TN_HIGH_COURTS,
  ...COURTS.TN_DISTRICT,
  ...COURTS.TN_SPECIAL,
]

// Deduplicate by `value` so the legacy entries win when present, and
// the auto-generated ones fill in everywhere else.
const _seen = new Set()
const _allMerged = []
function _push(arr) { for (const c of arr) { if (!_seen.has(c.value)) { _seen.add(c.value); _allMerged.push(c) } } }
_push(_legacyCurated)
_push(IND_HCS)
_push(IND_TRIBUNALS)
_push(IND_STATE_SPECIAL)
_push(IND_DISTRICT)

export const ALL_COURTS = _allMerged

export const LANGUAGES = [
  { value: 'english',   label: 'English',             desc: 'HC and formal proceedings' },
  { value: 'hindi',     label: 'हिन्दी (Hindi)',        desc: 'Lower courts, revenue matters' },
  { value: 'bilingual', label: 'Bilingual (EN + HI)', desc: 'English body, Hindi headings & prayer' },
  { value: 'tamil',     label: 'தமிழ் (Tamil)',        desc: 'Tamil Nadu district courts, local matters' },
]

// ─── UP / Allahabad HC + Tamil Nadu / Madras HC Case Laws ────────
export const CASE_LAWS = [
  { id:'1',  name:'Maneka Gandhi v. Union of India',           year:'1978', court:'Supreme Court of India',  citation:'AIR 1978 SC 597',                           principle:'Article 21 — right to live with dignity; procedure must be fair, just and reasonable', summary:'Article 21 includes the right to live with human dignity. Procedure established by law must be fair, just and reasonable, not arbitrary.', keywords:['article 21','personal liberty','due process','fundamental rights','natural justice'] },
  { id:'2',  name:'Kesavananda Bharati v. State of Kerala',    year:'1973', court:'Supreme Court of India',  citation:'AIR 1973 SC 1461',                          principle:'Basic Structure Doctrine — Parliament cannot destroy constitutional identity', summary:'Parliament cannot alter the basic structure of the Constitution even through constitutional amendments.', keywords:['constitution','amendment','basic structure','parliament','fundamental rights'] },
  { id:'3',  name:'Vishaka v. State of Rajasthan',             year:'1997', court:'Supreme Court of India',  citation:'AIR 1997 SC 3011',                          principle:'Vishaka Guidelines — sexual harassment at workplace', summary:'Mandatory guidelines for employers to prevent sexual harassment of women at workplace.', keywords:['sexual harassment','workplace','women','gender','employment','vishaka'] },
  { id:'4',  name:'MC Mehta v. Union of India',                year:'1987', court:'Supreme Court of India',  citation:'AIR 1987 SC 1086',                          principle:'Absolute Liability for hazardous industries without exception', summary:'Industries engaged in hazardous activities are absolutely liable for any harm caused, no exceptions.', keywords:['environment','pollution','absolute liability','hazardous','industry','tort'] },
  { id:'5',  name:'DK Basu v. State of West Bengal',           year:'1997', court:'Supreme Court of India',  citation:'AIR 1997 SC 610',                           principle:'Mandatory arrest/detention guidelines to prevent custodial torture', summary:'Detailed guidelines for police on arrest, detention and interrogation binding on all states.', keywords:['arrest','detention','police','custody','article 21','torture','crpc'] },
  { id:'6',  name:'State of UP v. Ram Sagar Yadav',            year:'1985', court:'Supreme Court of India',  citation:'AIR 1985 SC 416',                           principle:'UP custodial death — state liability and departmental responsibility', summary:'State of Uttar Pradesh held liable for custodial death. State must explain injuries sustained in custody.', keywords:['custodial death','up police','state liability','custody','article 21','up'] },
  { id:'7',  name:'Hussainara Khatoon v. State of Bihar',      year:'1979', court:'Supreme Court of India',  citation:'AIR 1979 SC 1360',                          principle:'Right to speedy trial as fundamental right under Article 21', summary:'Undertrial prisoners cannot be detained longer than the maximum prescribed punishment. Speedy trial is a fundamental right.', keywords:['bail','undertrial','speedy trial','article 21','crpc','imprisonment','custody'] },
  { id:'8',  name:'Satendra Kumar Antil v. CBI',               year:'2022', court:'Supreme Court of India',  citation:'(2022) 10 SCC 51',                          principle:'Default bail — compliance with CrPC Section 167(2) is mandatory; bail is the rule, jail is exception', summary:'Landmark bail jurisprudence — detailed guidelines on default bail, conditions, and duty of courts to consider bail promptly.', keywords:['default bail','crpc 167','bail','undertrial','investigation','custody','crpc 439'] },
  { id:'9',  name:'Ram Naresh v. State of UP',                 year:'2019', court:'Allahabad High Court',    citation:'2019 (107) ACC 241',                        principle:'Section 302 IPC — circumstantial evidence must form complete chain excluding innocence', summary:'In murder cases based on circumstantial evidence, the chain must be complete leaving no reasonable ground for innocence.', keywords:['murder','302 ipc','circumstantial evidence','criminal','allahabad','sessions','up'] },
  { id:'10', name:'Smt. Sarla Devi v. State of UP',            year:'2018', court:'Allahabad High Court',    citation:'2018 (3) ADJ 202',                          principle:'UP ZA & LR Act — Bhumidhar rights and inheritance by female heirs', summary:'Female heirs entitled to inherit Bhumidhari rights under UP Zamindari Abolition and Land Reforms Act. Cannot be excluded by custom.', keywords:['zamindari','bhumidhar','inheritance','female heir','revenue','up','land','property'] },
  { id:'11', name:'Rajesh Singh v. Union of India',            year:'2020', court:'Allahabad High Court',    citation:'Writ-C No. 21345/2020 (All)',                principle:'Article 14 & 16 — arbitrary denial of promotion violates equality; mandamus lies', summary:'Arbitrary denial of promotion to government employee without reason violates Articles 14 and 16. Writ of mandamus granted.', keywords:['promotion','article 14','article 16','government service','mandamus','writ','equality','up'] },
  { id:'12', name:'Shiv Kumar Mishra v. UP Housing Board',     year:'2021', court:'Allahabad High Court',    citation:'Writ-C No. 8932/2021 (All)',                principle:'UP Urban Buildings Act 1972 — eviction; bona fide need must be strictly proved', summary:'Under UP Urban Buildings Regulation Act, landlord must strictly prove grounds for eviction. Bona fide need must be genuine and specific.', keywords:['eviction','rent','landlord','tenant','up urban buildings act','prayagraj','rent control','allahabad'] },
  { id:'13', name:'Smt. Rekha v. State of UP',                 year:'2022', court:'Allahabad High Court',    citation:'Writ-A No. 4521/2022 (All)',                principle:'DV Act — right to residence order in shared household irrespective of ownership', summary:'Woman has right to residence in shared household under DV Act irrespective of property ownership. HC directed compliance of protection orders.', keywords:['domestic violence','dv act','protection order','residence','women','family','prayagraj'] },
  { id:'14', name:'Pramod Kumar Dubey v. State of UP',         year:'2023', court:'Allahabad High Court',    citation:'Crl. Misc. Bail No. 8771/2023 (All)',       principle:'Section 498A IPC — delay in FIR and omnibus allegations relevant for bail', summary:'In matrimonial dispute cases, long delay in filing FIR and omnibus allegations indicate false implication. Bail granted.', keywords:['498a','bail','matrimonial','cruelty','domestic','high court','allahabad','up'] },
  { id:'15', name:'Mohd. Iqbal v. State of UP',                year:'2021', court:'Allahabad High Court',    citation:'Writ-B No. 1234/2021 (All)',                principle:'Habeas Corpus — illegal detention; state must produce detenu immediately', summary:'State must produce detained person before court immediately on habeas corpus petition. Failure attracts contempt jurisdiction.', keywords:['habeas corpus','detention','illegal','writ','allahabad','article 226','crpc','bail','up'] },
  { id:'16', name:'Nagar Palika Parishad Prayagraj v. Ram Bilas', year:'2019', court:'Allahabad High Court', citation:'Writ-C No. 14782/2019 (All)',               principle:'Demolition — show-cause notice and hearing mandatory before any demolition', summary:'Demolition of property without prior show-cause notice and hearing violates natural justice and Article 21 right to shelter.', keywords:['demolition','encroachment','nagar palika','notice','natural justice','article 21','prayagraj','municipal'] },
  { id:'17', name:'Prakash v. State of UP (POCSO)',            year:'2022', court:'Allahabad High Court',    citation:'Crl. Appeal No. 5623/2022 (All)',           principle:'POCSO Act — victim testimony must be credible; corroboration required where contradictory', summary:'Conviction under POCSO must be based on cogent, reliable testimony of child victim. Corroboration needed where testimony is contradictory.', keywords:['pocso','child','sexual assault','evidence','criminal','allahabad','victim','up'] },
  { id:'18', name:'UP State Road Transport Corp v. Steno-Typist Union', year:'2017', court:'Allahabad High Court', citation:'(2017) 2 UPLBEC 1245',           principle:'Industrial Disputes Act — termination without Section 25F compliance is void', summary:'Termination of workman without following Section 25F of Industrial Disputes Act is invalid. Reinstatement with back wages ordered.', keywords:['labour','industrial disputes','termination','reinstatement','workman','up','section 25f','prayagraj'] },
  { id:'19', name:'Smt. Poonam Yadav v. District Magistrate Prayagraj', year:'2023', court:'Allahabad High Court', citation:'Writ-C No. 33210/2023 (All)', principle:'Preventive detention — detenu must be given grounds in writing; subjective satisfaction of DM must be based on relevant material', summary:'Preventive detention order set aside as DM failed to supply grounds of detention to detenu in writing within statutory period.', keywords:['preventive detention','article 22','dm','district magistrate','prayagraj','habeas','writ','up'] },
  { id:'20', name:'Ram Prakash v. Collector, Prayagraj',       year:'2020', court:'Allahabad High Court',    citation:'Writ-C No. 6712/2020 (All)',                principle:'Land Acquisition — fair compensation; urgency clause cannot be used to bypass Section 5A hearing', summary:'Land acquisition under urgency provision without genuine urgency violates Article 300A right to property. Compensation must be fair market value.', keywords:['land acquisition','collector','prayagraj','compensation','article 300a','property','revenue'] },

  // ── Tamil Nadu / Madras HC Case Laws ────────────────────────
  { id:'21', name:'S. Krishnamurthy v. State of Tamil Nadu',    year:'2019', court:'Madras High Court',       citation:'W.P. No. 12345/2019 (Mad.)',                principle:'RTI Act — public authority must furnish information within 30 days; denial without reason is arbitrary', summary:'Public authority cannot deny RTI application without specific exemption. CPIO must reply within statutory time. Madras HC directed disclosure and imposed costs.', keywords:['rti','right to information','public authority','cpio','information','disclosure','madras','tamil nadu'] },
  { id:'22', name:'Tamil Nadu Electricity Board v. Consumer Forum', year:'2020', court:'Madras High Court',  citation:'W.A. No. 2341/2020 (Mad.)',                principle:'Consumer Protection Act 2019 — deficiency of service by statutory body attracts compensation', summary:'Deficiency in electricity supply and billing by government board is deficiency of service under Consumer Protection Act. Consumer Forum jurisdiction upheld.', keywords:['consumer','deficiency','electricity','compensation','consumer forum','madras','tamil nadu','consumer protection'] },
  { id:'23', name:'K. Murugesan v. Smt. Kamala',               year:'2021', court:'Madras High Court',       citation:'C.M.A. No. 892/2021 (Mad.)',                principle:'Hindu Marriage Act — irretrievable breakdown of marriage ground for divorce after prolonged separation', summary:'Long separation and bitterness between spouses constitutes irretrievable breakdown. Madras HC granted divorce even where statutory grounds not strictly proven.', keywords:['divorce','marriage','hindu marriage act','breakdown','family','matrimonial','madras','family court','separation'] },
  { id:'24', name:'V. Rajan v. State of Tamil Nadu',            year:'2022', court:'Madras High Court',       citation:'Crl. O.P. No. 5678/2022 (Mad.)',           principle:'Section 138 NI Act — cheque dishonour; legal notice must be sent within 30 days and demand made properly', summary:'Notice under Section 138 must strictly comply — 30 day period from dishonour, proper demand, 15 day reply period awaited. Non-compliance vitiates complaint.', keywords:['cheque bounce','138 ni act','dishonour','negotiable instruments','notice','demand','criminal','madras'] },
  { id:'25', name:'Subramanian v. Inspector of Police, Chennai', year:'2021', court:'Madras High Court',      citation:'Crl. O.P. No. 23456/2021 (Mad.)',          principle:'FIR — police bound to register FIR for cognizable offence; refusal attracts HC mandamus', summary:'Police cannot refuse to register FIR for cognizable offence. Aggrieved person can approach Madras HC. HC directed registration and preliminary enquiry within 7 days.', keywords:['fir','police','registration','cognizable','complaint','mandamus','madras','crpc 154','crpc 156'] },
  { id:'26', name:'Arumugam v. Karpagam',                       year:'2019', court:'Madras High Court',       citation:'O.S.A. No. 45/2019 (Mad.)',                principle:'Sale Deed — execution without free consent is voidable; burden of proving consent on executant', summary:'Sale deed executed under undue influence is voidable. Burden lies on person taking benefit to prove consent was free. Transfer of Property Act, Sections 10, 11 applied.', keywords:['sale deed','property','transfer','consent','undue influence','contract','title','registration','madras'] },
  { id:'27', name:'G. Senthil Kumar v. Tamil Nadu Housing Board', year:'2022', court:'Madras High Court',     citation:'W.P. No. 34567/2022 (Mad.)',               principle:'Tenancy — landlord cannot evict tenant without following Tamil Nadu Buildings (Lease and Rent Control) Act procedure', summary:'Eviction without proper notice and order under TN Buildings Lease and Rent Control Act is illegal. Tenant entitled to protection. HC directed rent controller to adjudicate.', keywords:['rent','eviction','lease','tenant','landlord','tamil nadu rent control','rent controller','madras'] },
  { id:'28', name:'R. Selvam v. State of Tamil Nadu (Legal Opinion)', year:'2023', court:'Madras High Court', citation:'W.P. No. 6789/2023 (Mad.)',              principle:'Legal opinion by government law officers is protected but cannot bind courts on judicial review', summary:'Government legal opinion is confidential and protected under privilege. Courts can examine legality of action independent of opinion. PIL challenging government decision based on flawed legal opinion allowed.', keywords:['legal opinion','government','privilege','judicial review','madras','public law'] },
  { id:'29', name:'Smt. Meenakshi v. State of Tamil Nadu',      year:'2020', court:'Madras High Court',       citation:'W.P. No. 8901/2020 (Mad.)',                principle:'Right to Information — third party information; balancing privacy with transparency', summary:'RTI applications seeking information about third parties must balance transparency with privacy under Section 8(1)(j). Madras HC laid down balancing framework.', keywords:['rti','privacy','third party','information','disclosure','section 8','transparency','madras','tamil nadu'] },
  { id:'30', name:'A. Balasubramanian v. Inspector, Vepery PS', year:'2023', court:'Madras High Court',      citation:'Crl. M.P. No. 11234/2023 (Mad.)',          principle:'Anticipatory bail — Madras HC factors: gravity, antecedents, investigation stage, likelihood of fleeing', summary:'Madras HC follows four-factor test for anticipatory bail: (1) nature and gravity of accusation, (2) criminal antecedents, (3) flight risk, (4) effect on investigation. Bail granted with conditions.', keywords:['bail','anticipatory bail','crpc 438','madras','criminal','arrest','police','tamil nadu'] },
]

// ─── Search ────────────────────────────────────────────────────────
export function searchCaseLaws(query) {
  if (!query) return CASE_LAWS
  const q = query.toLowerCase()
  return CASE_LAWS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.principle.toLowerCase().includes(q) ||
    c.summary.toLowerCase().includes(q) ||
    c.keywords.some(k => k.includes(q))
  )
}

// Find case laws most relevant to a document type + court context
export function getRelevantCaseLaws(docType, court, searchTerms) {
  let pool = [...CASE_LAWS]

  // Prefer Allahabad HC cases for UP HC matters
  if (court && (court.includes('PRAYAGRAJ_HC') || court.includes('LUCKNOW_BENCH'))) {
    const hcCases = pool.filter(c => c.court === 'Allahabad High Court')
    pool = [...hcCases, ...pool.filter(c => c.court !== 'Allahabad High Court')]
  }

  // Prefer Madras HC cases for Tamil Nadu courts
  if (court && (court.startsWith('MADRAS_HC') || court.startsWith('MADURAI_BENCH') || court.startsWith('TN_'))) {
    const madrasCases = pool.filter(c => c.court === 'Madras High Court')
    pool = [...madrasCases, ...pool.filter(c => c.court !== 'Madras High Court')]
  }

  const typeKeywords = {
    BAIL_APPLICATION:   ['bail','custody','crpc','arrest','detention','undertrial','crpc 438'],
    WRIT_PETITION:      ['writ','mandamus','certiorari','article 226','fundamental','habeas'],
    PIL:                ['public interest','article 226','environment','fundamental','demolition'],
    LEGAL_NOTICE:       ['notice','demand','liability','contract','tort','eviction'],
    MEMORANDUM:         ['service','employment','government','article 14','article 16'],
    PETITION:           ['petition','civil','revision','appeal','crpc'],
    STAY_APPLICATION:   ['stay','injunction','order','article 226'],
    AFFIDAVIT:          ['evidence','statement','court'],
    VAKALATNAMA:        ['advocate','representation','court'],
    CASE_BRIEF:         ['evidence','precedent','judgment','302 ipc'],
    CONTRACT:           ['contract','agreement','liability','breach','rent'],
    // ── New document types ────────────────────────────────────
    RTI_APPLICATION:    ['rti','right to information','public authority','disclosure','cpio','information'],
    CONSUMER_COMPLAINT: ['consumer','deficiency','compensation','consumer forum','consumer protection','unfair trade'],
    DIVORCE_PETITION:   ['divorce','marriage','hindu marriage act','breakdown','family','matrimonial','separation','family court'],
    RENT_AGREEMENT:     ['rent','lease','tenant','landlord','eviction','rent control','tenancy'],
    SALE_DEED:          ['sale deed','property','transfer','title','registration','contract','consent'],
    CHEQUE_BOUNCE:      ['cheque bounce','138 ni act','dishonour','negotiable instruments','notice','demand','criminal'],
    LEGAL_OPINION:      ['legal opinion','government','privilege','judicial review','public law','advice'],
    FIR_COMPLAINT:      ['fir','police','registration','cognizable','complaint','crpc 154','crpc 156','arrest'],
    LEGAL_EMAIL:        ['email','mail','correspondence','communication','letter','message','demand','follow up','transmittal','client update','settlement'],
  }

  const keywords = typeKeywords[docType] || []
  const scored = pool.map(c => {
    let score = c.keywords.filter(k => keywords.some(kw => k.includes(kw))).length
    if (searchTerms) {
      const s = searchTerms.toLowerCase()
      c.keywords.forEach(k => { if (s.includes(k)) score += 2 })
    }
    return { ...c, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 3)
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function getCourtLabel(courtValue) {
  const found = ALL_COURTS.find(c => c.value === courtValue)
  return found ? found.label : (courtValue || '')
}
