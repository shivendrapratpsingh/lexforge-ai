// ─────────────────────────────────────────────────────────────────
//  LexForge AI — indian-laws.js
//
//  A curated catalog of the most-used central acts and codes in
//  India — ~150 entries — each with the FULL official name, the
//  enactment year, and the most-commonly cited sections / articles.
//
//  Why a catalog?  Generative models hallucinate provision numbers
//  and act years all the time. By grounding the prompt with this
//  curated data, every legal notice / writ / opinion that LexForge
//  drafts cites the *exact* full official name + section + year.
//  When the relevant act isn't in the catalog, the AI falls back to
//  its own knowledge with an explicit "VERIFY BEFORE FILING" tag so
//  the advocate knows to double-check the citation.
//
//  The catalog is also used by the chatbot and the /study section.
// ─────────────────────────────────────────────────────────────────

import { INDIAN_LAWS_EXTENDED } from './indian-laws-extended.js'

const INDIAN_LAWS_CORE = [
  // ── The Constitution ────────────────────────────────────────
  { id:'CONST', shortName:'Constitution',                         fullName:'The Constitution of India, 1950',                                                            year:1950, category:'Constitutional', tags:['constitution','fundamental rights','dpsp','article 14','article 19','article 21','article 32','article 226','basic structure'], keySections:[
    {n:'Article 14',  desc:'Right to equality before law'},
    {n:'Article 19',  desc:'Six freedoms (speech, assembly, association, movement, residence, profession)'},
    {n:'Article 21',  desc:'Right to life and personal liberty'},
    {n:'Article 21A', desc:'Right to free and compulsory education for children 6–14'},
    {n:'Article 22',  desc:'Protection against arrest and detention'},
    {n:'Article 32',  desc:'Right to constitutional remedies — writs in the Supreme Court'},
    {n:'Article 136', desc:'Special leave to appeal to the Supreme Court'},
    {n:'Article 142', desc:'Power of Supreme Court to do complete justice'},
    {n:'Article 226', desc:'Power of High Courts to issue writs'},
    {n:'Article 227', desc:'Superintendence of HCs over subordinate courts'},
    {n:'Article 300A', desc:'Right to property (now constitutional, not fundamental)'},
  ] },

  // ── Substantive criminal law ────────────────────────────────
  { id:'BNS',  shortName:'BNS',  fullName:'The Bharatiya Nyaya Sanhita, 2023',                                                                                          year:2023, category:'Criminal (substantive)', repeals:'IPC 1860', tags:['criminal','offence','punishment','bns','new criminal law','murder','theft','cheating'], keySections:[
    {n:'Section 4',   desc:'Punishments — death, imprisonment for life, imprisonment, fine, community service, etc.'},
    {n:'Section 63',  desc:'Sexual offences — definition'},
    {n:'Section 103', desc:'Murder — punishment'},
    {n:'Section 105', desc:'Culpable homicide not amounting to murder'},
    {n:'Section 108', desc:'Abetment of suicide'},
    {n:'Section 115', desc:'Voluntarily causing hurt'},
    {n:'Section 117', desc:'Voluntarily causing grievous hurt'},
    {n:'Section 118', desc:'Voluntarily causing hurt by dangerous weapons or means'},
    {n:'Section 303', desc:'Theft'},
    {n:'Section 308', desc:'Extortion'},
    {n:'Section 318', desc:'Cheating (BNS equivalent of IPC 420)'},
    {n:'Section 319', desc:'Cheating by personation'},
    {n:'Section 351', desc:'Criminal intimidation'},
  ] },
  { id:'IPC',  shortName:'IPC',  fullName:'The Indian Penal Code, 1860 (repealed by BNS 2023 w.e.f. 1 July 2024 — still applies to pre-BNS offences)',                  year:1860, category:'Criminal (substantive)', tags:['criminal','offence','punishment','ipc','murder','theft','cheating','420','302','376','498a'], keySections:[
    {n:'Section 34',  desc:'Acts done by several persons in furtherance of common intention'},
    {n:'Section 120B',desc:'Criminal conspiracy — punishment'},
    {n:'Section 124A',desc:'Sedition (held in abeyance by SC pending review)'},
    {n:'Section 153A',desc:'Promoting enmity between groups'},
    {n:'Section 299', desc:'Culpable homicide — definition'},
    {n:'Section 302', desc:'Murder — punishment'},
    {n:'Section 304', desc:'Culpable homicide not amounting to murder'},
    {n:'Section 304A',desc:'Causing death by negligence'},
    {n:'Section 304B',desc:'Dowry death'},
    {n:'Section 306', desc:'Abetment of suicide'},
    {n:'Section 307', desc:'Attempt to murder'},
    {n:'Section 323', desc:'Voluntarily causing hurt'},
    {n:'Section 326', desc:'Voluntarily causing grievous hurt by dangerous weapons'},
    {n:'Section 354', desc:'Outraging the modesty of a woman'},
    {n:'Section 376', desc:'Rape — punishment'},
    {n:'Section 378', desc:'Theft — definition'},
    {n:'Section 379', desc:'Theft — punishment'},
    {n:'Section 392', desc:'Robbery — punishment'},
    {n:'Section 406', desc:'Criminal breach of trust'},
    {n:'Section 415', desc:'Cheating — definition'},
    {n:'Section 420', desc:'Cheating and dishonestly inducing delivery of property'},
    {n:'Section 498A',desc:'Husband or relative of husband subjecting woman to cruelty'},
    {n:'Section 506', desc:'Criminal intimidation — punishment'},
  ] },

  // ── Procedural criminal law ─────────────────────────────────
  { id:'BNSS', shortName:'BNSS', fullName:'The Bharatiya Nagarik Suraksha Sanhita, 2023',                                                                              year:2023, category:'Criminal (procedural)', repeals:'CrPC 1973', tags:['crpc','procedure','arrest','bail','investigation','fir','bnss'], keySections:[
    {n:'Section 173',desc:'Information to police regarding cognizable offence (FIR)'},
    {n:'Section 187',desc:'Procedure when investigation cannot be completed in 24 hours (custody)'},
    {n:'Section 480',desc:'Bail in non-bailable offences'},
    {n:'Section 482',desc:'Anticipatory bail'},
    {n:'Section 528',desc:'Inherent power of HC (BNSS analogue of CrPC §482)'},
  ] },
  { id:'CrPC', shortName:'CrPC', fullName:'The Code of Criminal Procedure, 1973 (repealed by BNSS 2023 w.e.f. 1 July 2024 — still applies to pre-BNSS proceedings)',  year:1973, category:'Criminal (procedural)', tags:['crpc','procedure','arrest','bail','investigation','fir','156','167','437','438','439','482'], keySections:[
    {n:'Section 41',  desc:'When police may arrest without warrant'},
    {n:'Section 41A', desc:'Notice of appearance before arrest in offences ≤ 7 years'},
    {n:'Section 154', desc:'Information in cognizable cases (FIR registration)'},
    {n:'Section 156', desc:'Police officer\'s power to investigate cognizable cases'},
    {n:'Section 157', desc:'Procedure for investigation'},
    {n:'Section 167', desc:'Procedure when investigation cannot be completed in 24 hours; default bail at 60/90 days'},
    {n:'Section 173', desc:'Final report (charge-sheet) on completion of investigation'},
    {n:'Section 200', desc:'Examination of complainant'},
    {n:'Section 202', desc:'Inquiry / investigation by Magistrate before issuing process'},
    {n:'Section 313', desc:'Examination of accused'},
    {n:'Section 437', desc:'When bail may be granted in case of non-bailable offence'},
    {n:'Section 438', desc:'Anticipatory bail — direction for grant of bail to person apprehending arrest'},
    {n:'Section 439', desc:'Special powers of HC and Sessions Court regarding bail'},
    {n:'Section 482', desc:'Saving of inherent powers of High Court'},
  ] },

  // ── Evidence ────────────────────────────────────────────────
  { id:'BSA',  shortName:'BSA',  fullName:'The Bharatiya Sakshya Adhiniyam, 2023',                                                                                      year:2023, category:'Evidence', repeals:'Indian Evidence Act 1872', tags:['evidence','proof','witness','admissibility','digital evidence'], keySections:[
    {n:'Section 2',  desc:'Definitions including "evidence" and "electronic record"'},
    {n:'Section 39', desc:'Admissibility of electronic / digital records'},
    {n:'Section 105',desc:'Burden of proof'},
  ] },
  { id:'IEA',  shortName:'Evidence Act', fullName:'The Indian Evidence Act, 1872 (repealed by BSA 2023)',                                                              year:1872, category:'Evidence', tags:['evidence','witness','dying declaration','section 65b','admissibility','document','expert'], keySections:[
    {n:'Section 32', desc:'Cases in which statement of person who is dead, etc. is relevant — including dying declaration'},
    {n:'Section 45', desc:'Opinion of experts'},
    {n:'Section 65A',desc:'Special provisions for evidence relating to electronic records'},
    {n:'Section 65B',desc:'Admissibility of electronic records — certificate requirement'},
    {n:'Section 101',desc:'Burden of proof'},
    {n:'Section 114',desc:'Court may presume existence of certain facts'},
  ] },

  // ── Civil procedure ─────────────────────────────────────────
  { id:'CPC',  shortName:'CPC',  fullName:'The Code of Civil Procedure, 1908',                                                                                          year:1908, category:'Civil (procedural)', tags:['cpc','suit','plaint','written statement','injunction','execution','order 7','order 39'], keySections:[
    {n:'Section 9',   desc:'Courts to try all civil suits unless barred'},
    {n:'Section 10',  desc:'Stay of suit (res sub judice)'},
    {n:'Section 11',  desc:'Res judicata'},
    {n:'Section 100', desc:'Second appeal — substantial question of law'},
    {n:'Section 151', desc:'Inherent powers of court'},
    {n:'Order VI',    desc:'Pleadings generally'},
    {n:'Order VII',   desc:'Plaint'},
    {n:'Order VIII',  desc:'Written statement'},
    {n:'Order XXVI',  desc:'Commissions'},
    {n:'Order XXXIX', desc:'Temporary injunctions and interlocutory orders'},
    {n:'Order XLI',   desc:'Appeals from original decrees'},
    {n:'Order XLVII', desc:'Review'},
  ] },

  // ── Contract & commercial ───────────────────────────────────
  { id:'ICA',  shortName:'Contract Act',   fullName:'The Indian Contract Act, 1872',                                                                                    year:1872, category:'Contract',   tags:['contract','agreement','offer','acceptance','consideration','breach','damages','specific performance'], keySections:[
    {n:'Section 10', desc:'What agreements are contracts'},
    {n:'Section 11', desc:'Who are competent to contract'},
    {n:'Section 14', desc:'"Free consent" defined — coercion, undue influence, fraud, misrepresentation, mistake'},
    {n:'Section 23', desc:'What considerations and objects are lawful'},
    {n:'Section 56', desc:'Doctrine of frustration — agreement to do impossible act'},
    {n:'Section 73', desc:'Compensation for loss / damage caused by breach of contract'},
    {n:'Section 74', desc:'Compensation for breach where penalty stipulated'},
  ] },
  { id:'SOGA', shortName:'Sale of Goods Act', fullName:'The Sale of Goods Act, 1930',                                                                                    year:1930, category:'Contract',   tags:['sale','goods','transfer of property','warranty','condition'], keySections:[
    {n:'Section 4', desc:'Sale and agreement to sell'},
    {n:'Section 12',desc:'Condition and warranty'},
    {n:'Section 19',desc:'Property passes when intended to pass'},
  ] },
  { id:'NIA',  shortName:'NI Act',         fullName:'The Negotiable Instruments Act, 1881',                                                                              year:1881, category:'Banking',    tags:['cheque','bounce','dishonour','138','negotiable instruments','drawer','holder in due course'], keySections:[
    {n:'Section 6',  desc:'"Cheque" defined — including electronic cheque'},
    {n:'Section 138',desc:'Dishonour of cheque for insufficiency of funds — punishment up to 2 years and/or fine up to twice the cheque amount'},
    {n:'Section 139',desc:'Presumption in favour of holder'},
    {n:'Section 142',desc:'Cognizance of offences — written complaint within one month'},
  ] },
  { id:'SARFAESI', shortName:'SARFAESI', fullName:'The Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002',           year:2002, category:'Banking',    tags:['sarfaesi','npa','bank recovery','13(2)','13(4)','symbolic possession','drt'], keySections:[
    {n:'Section 13(2)',desc:'Notice to defaulting borrower'},
    {n:'Section 13(4)',desc:'Measures by secured creditor — possession of security interest'},
    {n:'Section 17',   desc:'Right to appeal to DRT against secured creditor\'s actions'},
  ] },
  { id:'IBC',  shortName:'IBC',            fullName:'The Insolvency and Bankruptcy Code, 2016',                                                                          year:2016, category:'Insolvency', tags:['ibc','insolvency','cirp','nclt','ibbi','section 7','section 9','section 10','liquidation'], keySections:[
    {n:'Section 7',  desc:'Initiation of CIRP by financial creditor'},
    {n:'Section 9',  desc:'Initiation of CIRP by operational creditor'},
    {n:'Section 10', desc:'Initiation of CIRP by corporate debtor'},
    {n:'Section 12', desc:'Time-limit for CIRP — 180 days extendable to 270/330'},
    {n:'Section 29A',desc:'Persons not eligible to be resolution applicants'},
  ] },
  { id:'CompA', shortName:'Companies Act',fullName:'The Companies Act, 2013',                                                                                            year:2013, category:'Corporate',  tags:['companies act','director','shareholder','nclt','section 241','section 242','oppression','mismanagement'], keySections:[
    {n:'Section 149',desc:'Composition of Board — independent directors, woman director'},
    {n:'Section 166',desc:'Duties of directors'},
    {n:'Section 241',desc:'Application for relief in cases of oppression and mismanagement'},
    {n:'Section 242',desc:'Powers of NCLT in oppression / mismanagement'},
    {n:'Section 271',desc:'Circumstances in which company may be wound up'},
  ] },
  { id:'PartA', shortName:'Partnership Act',fullName:'The Indian Partnership Act, 1932',                                                                                 year:1932, category:'Corporate',  tags:['partnership','firm','partner','dissolution'], keySections:[
    {n:'Section 4', desc:'Definition of partnership'},
    {n:'Section 39',desc:'Dissolution of a firm'},
  ] },
  { id:'LLP',   shortName:'LLP Act',       fullName:'The Limited Liability Partnership Act, 2008',                                                                       year:2008, category:'Corporate',  tags:['llp','limited liability partnership','designated partner'], keySections:[
    {n:'Section 7', desc:'Designated partners'},
    {n:'Section 14',desc:'Effect of registration'},
  ] },
  { id:'SCRA', shortName:'SEBI Act',       fullName:'The Securities and Exchange Board of India Act, 1992',                                                              year:1992, category:'Securities', tags:['sebi','securities','market','manipulation','insider trading'], keySections:[
    {n:'Section 11',desc:'Functions of the Board'},
    {n:'Section 11B',desc:'Power to issue directions'},
    {n:'Section 15Z',desc:'Appeal to Supreme Court'},
  ] },

  // ── Property & land ─────────────────────────────────────────
  { id:'TPA',  shortName:'TPA',            fullName:'The Transfer of Property Act, 1882',                                                                                year:1882, category:'Property',   tags:['transfer','sale','mortgage','lease','gift','property','section 53a'], keySections:[
    {n:'Section 5', desc:'"Transfer of property" — definition'},
    {n:'Section 53A',desc:'Part performance — protection of transferee in possession'},
    {n:'Section 54',desc:'Sale defined; sale how made'},
    {n:'Section 105',desc:'Lease defined'},
    {n:'Section 122',desc:'Gift defined'},
  ] },
  { id:'IRA',  shortName:'Registration Act',fullName:'The Registration Act, 1908',                                                                                       year:1908, category:'Property',   tags:['registration','sale deed','registered','sub-registrar'], keySections:[
    {n:'Section 17', desc:'Documents of which registration is compulsory'},
    {n:'Section 49', desc:'Effect of non-registration'},
  ] },
  { id:'IndStamp', shortName:'Stamp Act',  fullName:'The Indian Stamp Act, 1899',                                                                                        year:1899, category:'Property',   tags:['stamp','duty','schedule','document','executed'], keySections:[
    {n:'Section 17',desc:'Instruments executed in India to be stamped before or at execution'},
    {n:'Section 35',desc:'Instruments not duly stamped — inadmissible in evidence'},
  ] },
  { id:'LARR', shortName:'LARR Act',      fullName:'The Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013',  year:2013, category:'Property',   tags:['land acquisition','compensation','rehabilitation','social impact assessment'], keySections:[
    {n:'Section 4', desc:'Preliminary investigation for determining social impact'},
    {n:'Section 24',desc:'Land acquisition under old Act — when deemed lapsed'},
    {n:'Section 26',desc:'Determination of market value'},
  ] },
  { id:'BenamiA', shortName:'Benami Act',  fullName:'The Prohibition of Benami Property Transactions Act, 1988',                                                         year:1988, category:'Property',   tags:['benami','property','beneficial owner','prohibited transaction'], keySections:[
    {n:'Section 3',desc:'Prohibition of benami transactions'},
    {n:'Section 5',desc:'Property held benami liable to confiscation'},
  ] },

  // ── Family law ─────────────────────────────────────────────
  { id:'HMA',  shortName:'Hindu Marriage Act',fullName:'The Hindu Marriage Act, 1955',                                                                                   year:1955, category:'Family',     tags:['hindu','marriage','divorce','section 13','13b','custody','maintenance'], keySections:[
    {n:'Section 5', desc:'Conditions for a Hindu marriage'},
    {n:'Section 9', desc:'Restitution of conjugal rights'},
    {n:'Section 10',desc:'Judicial separation'},
    {n:'Section 13',desc:'Divorce — grounds'},
    {n:'Section 13B',desc:'Divorce by mutual consent'},
    {n:'Section 24',desc:'Maintenance pendente lite'},
    {n:'Section 25',desc:'Permanent alimony and maintenance'},
  ] },
  { id:'SMA',  shortName:'Special Marriage Act',fullName:'The Special Marriage Act, 1954',                                                                              year:1954, category:'Family',     tags:['inter-faith','civil marriage','registration','divorce'], keySections:[
    {n:'Section 4', desc:'Conditions relating to solemnization'},
    {n:'Section 27',desc:'Divorce — grounds'},
    {n:'Section 28',desc:'Divorce by mutual consent'},
  ] },
  { id:'HSA',  shortName:'Hindu Succession Act',fullName:'The Hindu Succession Act, 1956',                                                                              year:1956, category:'Family',     tags:['succession','inheritance','daughter','coparcener','section 6','class i','class ii'], keySections:[
    {n:'Section 6', desc:'Devolution of interest in coparcenary property — daughter as coparcener'},
    {n:'Section 8', desc:'General rules of succession in case of male Hindus'},
    {n:'Section 15',desc:'General rules of succession in case of female Hindus'},
  ] },
  { id:'HAMA', shortName:'HAMA',           fullName:'The Hindu Adoptions and Maintenance Act, 1956',                                                                    year:1956, category:'Family',     tags:['adoption','maintenance','hindu','section 18'], keySections:[
    {n:'Section 7', desc:'Capacity of male Hindu to take in adoption'},
    {n:'Section 18',desc:'Wife\'s right to maintenance'},
    {n:'Section 20',desc:'Maintenance of children and aged parents'},
  ] },
  { id:'GWA',  shortName:'Guardians and Wards Act',fullName:'The Guardians and Wards Act, 1890',                                                                        year:1890, category:'Family',     tags:['guardian','minor','custody','welfare'], keySections:[
    {n:'Section 7', desc:'Power to make order as to guardianship'},
    {n:'Section 17',desc:'Matters to be considered by court — welfare of minor'},
  ] },
  { id:'DVA',  shortName:'DV Act',         fullName:'The Protection of Women from Domestic Violence Act, 2005',                                                          year:2005, category:'Family',     tags:['domestic violence','dv','protection order','residence','section 12','aggrieved person'], keySections:[
    {n:'Section 3', desc:'Definition of domestic violence'},
    {n:'Section 12',desc:'Application to Magistrate — protection / residence / monetary / custody / compensation'},
    {n:'Section 17',desc:'Right to reside in shared household'},
    {n:'Section 18',desc:'Protection orders'},
    {n:'Section 19',desc:'Residence orders'},
  ] },
  { id:'MWPSCA', shortName:'Senior Citizens Act',fullName:'The Maintenance and Welfare of Parents and Senior Citizens Act, 2007',                                       year:2007, category:'Family',     tags:['parents','senior citizens','maintenance','tribunal'], keySections:[
    {n:'Section 4', desc:'Maintenance of parents and senior citizens'},
    {n:'Section 23',desc:'Transfer of property to be void in certain circumstances'},
  ] },
  { id:'FCA',  shortName:'Family Courts Act',fullName:'The Family Courts Act, 1984',                                                                                     year:1984, category:'Family',     tags:['family court','jurisdiction'], keySections:[
    {n:'Section 7', desc:'Jurisdiction of Family Courts'},
    {n:'Section 9', desc:'Duty of Family Court to make efforts at settlement'},
  ] },

  // ── Labour & employment ─────────────────────────────────────
  { id:'IDA',  shortName:'ID Act',         fullName:'The Industrial Disputes Act, 1947',                                                                                  year:1947, category:'Labour',     tags:['industrial dispute','workman','retrenchment','25f','25g','strike','lockout'], keySections:[
    {n:'Section 2(s)',desc:'Definition of "workman"'},
    {n:'Section 25F',desc:'Conditions precedent to retrenchment of workmen'},
    {n:'Section 25G',desc:'Procedure for retrenchment — last in, first out'},
    {n:'Section 33', desc:'Conditions of service to remain unchanged during dispute'},
  ] },
  { id:'POSHA', shortName:'POSH Act',     fullName:'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',                      year:2013, category:'Labour',     tags:['posh','sexual harassment','workplace','icc','internal complaints committee','vishaka'], keySections:[
    {n:'Section 4', desc:'Constitution of Internal Complaints Committee (ICC)'},
    {n:'Section 9', desc:'Complaint of sexual harassment'},
    {n:'Section 13',desc:'Inquiry report and action'},
  ] },
  { id:'EPF',  shortName:'EPF Act',        fullName:'The Employees\' Provident Funds and Miscellaneous Provisions Act, 1952',                                              year:1952, category:'Labour',     tags:['epf','provident fund','employee','employer','section 7a'], keySections:[
    {n:'Section 6', desc:'Contributions and matters that may be provided in scheme'},
    {n:'Section 7A',desc:'Determination of moneys due from employer'},
  ] },
  { id:'ESIC', shortName:'ESI Act',        fullName:'The Employees\' State Insurance Act, 1948',                                                                          year:1948, category:'Labour',     tags:['esic','medical','sickness benefit','employee'], keySections:[
    {n:'Section 39',desc:'Contributions'},
    {n:'Section 46',desc:'Benefits'},
  ] },
  { id:'PGA',  shortName:'Gratuity Act',   fullName:'The Payment of Gratuity Act, 1972',                                                                                  year:1972, category:'Labour',     tags:['gratuity','retirement','5 years','employee'], keySections:[
    {n:'Section 4', desc:'Payment of gratuity — eligibility after 5 years'},
    {n:'Section 7', desc:'Determination of amount of gratuity'},
  ] },
  { id:'BOWA', shortName:'Bonus Act',      fullName:'The Payment of Bonus Act, 1965',                                                                                     year:1965, category:'Labour',     tags:['bonus','minimum','maximum','establishment'], keySections:[
    {n:'Section 10',desc:'Payment of minimum bonus'},
    {n:'Section 11',desc:'Payment of maximum bonus'},
  ] },
  { id:'MWA',  shortName:'Minimum Wages',  fullName:'The Minimum Wages Act, 1948',                                                                                        year:1948, category:'Labour',     tags:['minimum wages','scheduled employment','revision'], keySections:[
    {n:'Section 3', desc:'Fixing of minimum rates of wages'},
    {n:'Section 22',desc:'Penalties for offences'},
  ] },
  { id:'CodeWages', shortName:'Code on Wages', fullName:'The Code on Wages, 2019',                                                                                       year:2019, category:'Labour',     tags:['code on wages','floor wage','equal remuneration'], keySections:[
    {n:'Section 9', desc:'Floor wage'},
    {n:'Section 17',desc:'Time limit for payment of wages'},
  ] },

  // ── Constitutional / public law ─────────────────────────────
  { id:'RTI',  shortName:'RTI Act',        fullName:'The Right to Information Act, 2005',                                                                                year:2005, category:'Public law', tags:['rti','right to information','cpio','section 6','section 7','section 8','30 days'], keySections:[
    {n:'Section 4', desc:'Obligations of public authorities — suo-motu disclosure'},
    {n:'Section 6', desc:'Request for obtaining information'},
    {n:'Section 7', desc:'Disposal of request — within 30 days'},
    {n:'Section 8', desc:'Exemptions from disclosure'},
    {n:'Section 19',desc:'First and second appeal'},
  ] },
  { id:'CPA19',shortName:'Consumer Protection Act',fullName:'The Consumer Protection Act, 2019',                                                                          year:2019, category:'Consumer',  tags:['consumer','deficiency','district commission','state commission','ncdrc','section 35','section 47','section 58'], keySections:[
    {n:'Section 2(7)',desc:'"Consumer" — definition'},
    {n:'Section 2(11)',desc:'"Deficiency" — definition'},
    {n:'Section 35', desc:'Jurisdiction of District Commission — up to ₹1 crore'},
    {n:'Section 47', desc:'Jurisdiction of State Commission — ₹1–10 crore'},
    {n:'Section 58', desc:'Jurisdiction of National Commission — above ₹10 crore'},
    {n:'Section 69', desc:'Limitation period — 2 years from cause of action'},
  ] },
  { id:'MVAct',shortName:'MV Act',         fullName:'The Motor Vehicles Act, 1988',                                                                                       year:1988, category:'Tort',      tags:['motor accident','compensation','mact','section 166','third party insurance'], keySections:[
    {n:'Section 140',desc:'No-fault liability'},
    {n:'Section 163A',desc:'Special provisions for compensation on structured formula basis'},
    {n:'Section 166', desc:'Application for compensation before Motor Accident Claims Tribunal'},
    {n:'Section 168', desc:'Award of MACT'},
  ] },
  { id:'JJA',  shortName:'JJ Act',         fullName:'The Juvenile Justice (Care and Protection of Children) Act, 2015',                                                  year:2015, category:'Criminal/Welfare',tags:['juvenile','child in conflict','child in need','jjb','cwc','heinous offence'], keySections:[
    {n:'Section 14',desc:'Inquiry by Juvenile Justice Board'},
    {n:'Section 15',desc:'Preliminary assessment for child 16–18 in heinous offence'},
  ] },
  { id:'POCSO', shortName:'POCSO Act',    fullName:'The Protection of Children from Sexual Offences Act, 2012',                                                            year:2012, category:'Criminal',  tags:['pocso','child sexual','victim','special court'], keySections:[
    {n:'Section 4', desc:'Punishment for penetrative sexual assault'},
    {n:'Section 6', desc:'Punishment for aggravated penetrative sexual assault'},
    {n:'Section 28',desc:'Designation of Special Courts'},
  ] },

  // ── Tax ─────────────────────────────────────────────────────
  { id:'ITAct',shortName:'IT Act (Tax)',  fullName:'The Income-tax Act, 1961',                                                                                            year:1961, category:'Tax',         tags:['income tax','tds','section 44ad','section 80c','assessment'], keySections:[
    {n:'Section 9', desc:'Income deemed to accrue or arise in India'},
    {n:'Section 80C',desc:'Deductions — investments etc.'},
    {n:'Section 80D',desc:'Deductions — health insurance'},
    {n:'Section 139',desc:'Return of income'},
    {n:'Section 143',desc:'Assessment'},
    {n:'Section 147',desc:'Income escaping assessment — re-assessment'},
    {n:'Section 263',desc:'Revision of orders prejudicial to revenue'},
  ] },
  { id:'CGST', shortName:'CGST Act',       fullName:'The Central Goods and Services Tax Act, 2017',                                                                       year:2017, category:'Tax',         tags:['gst','cgst','input tax credit','section 73','section 74','dispute'], keySections:[
    {n:'Section 16',desc:'Eligibility and conditions for taking input tax credit'},
    {n:'Section 73',desc:'Determination of tax not paid (non-fraud)'},
    {n:'Section 74',desc:'Determination of tax not paid (fraud)'},
    {n:'Section 107',desc:'Appeals to Appellate Authority'},
  ] },
  { id:'IGST', shortName:'IGST Act',       fullName:'The Integrated Goods and Services Tax Act, 2017',                                                                    year:2017, category:'Tax',         tags:['igst','inter-state','export','import'], keySections:[
    {n:'Section 5', desc:'Levy and collection of integrated tax'},
    {n:'Section 16',desc:'Zero-rated supply (exports & SEZ)'},
  ] },

  // ── Cyber & IT ──────────────────────────────────────────────
  { id:'IT2000',shortName:'IT Act 2000',  fullName:'The Information Technology Act, 2000',                                                                                year:2000, category:'Cyber',        tags:['it act','hacking','section 66','section 66c','identity','phishing','privacy','cyber'], keySections:[
    {n:'Section 43', desc:'Penalty for damage to computer system — civil liability'},
    {n:'Section 66', desc:'Computer-related offences (hacking) — punishment'},
    {n:'Section 66C',desc:'Identity theft — punishment up to 3 years and fine'},
    {n:'Section 66D',desc:'Cheating by personation using computer resource'},
    {n:'Section 67', desc:'Publishing or transmitting obscene material'},
    {n:'Section 79', desc:'Intermediary safe harbour and conditions'},
    {n:'Section 84A',desc:'Modes of encryption — power to prescribe'},
  ] },
  { id:'DPDP', shortName:'DPDP Act',       fullName:'The Digital Personal Data Protection Act, 2023',                                                                      year:2023, category:'Cyber',        tags:['data protection','privacy','consent','data fiduciary','dpdp'], keySections:[
    {n:'Section 4', desc:'Grounds for processing personal data'},
    {n:'Section 6', desc:'Consent and notice'},
    {n:'Section 8', desc:'Obligations of Data Fiduciary'},
    {n:'Section 33',desc:'Penalties — up to ₹250 crore'},
  ] },

  // ── Arbitration & ADR ───────────────────────────────────────
  { id:'ACA',  shortName:'Arbitration Act',fullName:'The Arbitration and Conciliation Act, 1996',                                                                          year:1996, category:'ADR',          tags:['arbitration','section 11','section 17','section 34','section 36','award','seat','venue'], keySections:[
    {n:'Section 8', desc:'Power to refer parties to arbitration where there is an arbitration agreement'},
    {n:'Section 9', desc:'Interim measures by court'},
    {n:'Section 11',desc:'Appointment of arbitrators'},
    {n:'Section 17',desc:'Interim measures by arbitral tribunal'},
    {n:'Section 34',desc:'Application for setting aside arbitral award'},
    {n:'Section 36',desc:'Enforcement of award'},
  ] },
  { id:'MediaA',shortName:'Mediation Act',fullName:'The Mediation Act, 2023',                                                                                              year:2023, category:'ADR',          tags:['mediation','pre-litigation','settlement','mediated settlement agreement'], keySections:[
    {n:'Section 5', desc:'Pre-litigation mediation'},
    {n:'Section 19',desc:'Mediated settlement agreement'},
  ] },

  // ── Environment ─────────────────────────────────────────────
  { id:'EPA',  shortName:'Environment Act',fullName:'The Environment (Protection) Act, 1986',                                                                              year:1986, category:'Environment', tags:['environment','pollution','epa','section 5','section 15'], keySections:[
    {n:'Section 5', desc:'Power to give directions'},
    {n:'Section 15',desc:'Penalty for contravention'},
  ] },
  { id:'WaterAct',shortName:'Water Act',  fullName:'The Water (Prevention and Control of Pollution) Act, 1974',                                                            year:1974, category:'Environment', tags:['water','pollution','effluent','consent','spcb'], keySections:[
    {n:'Section 24',desc:'Prohibition on use of stream or well for disposal of polluting matter'},
    {n:'Section 25',desc:'Restrictions on new outlets and discharges — consent of SPCB'},
  ] },
  { id:'AirAct',shortName:'Air Act',      fullName:'The Air (Prevention and Control of Pollution) Act, 1981',                                                              year:1981, category:'Environment', tags:['air','pollution','consent','spcb'], keySections:[
    {n:'Section 21',desc:'Restrictions on use of certain industrial plants — consent of SPCB'},
    {n:'Section 31',desc:'Appeals'},
  ] },
  { id:'NGTAct',shortName:'NGT Act',      fullName:'The National Green Tribunal Act, 2010',                                                                                year:2010, category:'Environment', tags:['ngt','green tribunal','schedule 1','environment'], keySections:[
    {n:'Section 14',desc:'Tribunal to settle environmental disputes'},
    {n:'Section 17',desc:'Liability to pay relief or compensation'},
    {n:'Section 22',desc:'Appeals to Supreme Court'},
  ] },

  // ── Special / niche but commonly cited ──────────────────────
  { id:'SCST', shortName:'SC/ST Act',     fullName:'The Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act, 1989',                                  year:1989, category:'Criminal',    tags:['sc/st','atrocities','reservation','section 3','section 18'], keySections:[
    {n:'Section 3', desc:'Punishments for offences of atrocities'},
    {n:'Section 18',desc:'No anticipatory bail (subject to SC interpretation)'},
  ] },
  { id:'PMLA', shortName:'PMLA',          fullName:'The Prevention of Money Laundering Act, 2002',                                                                          year:2002, category:'Criminal',    tags:['pmla','money laundering','enforcement directorate','section 3','section 19','section 45','attachment'], keySections:[
    {n:'Section 3', desc:'Offence of money-laundering'},
    {n:'Section 4', desc:'Punishment — imprisonment 3–7 years'},
    {n:'Section 17',desc:'Search and seizure'},
    {n:'Section 19',desc:'Power to arrest'},
    {n:'Section 45',desc:'Twin conditions for grant of bail'},
  ] },
  { id:'UAPA', shortName:'UAPA',          fullName:'The Unlawful Activities (Prevention) Act, 1967',                                                                        year:1967, category:'Criminal',    tags:['uapa','terrorism','unlawful association','section 43d','bail'], keySections:[
    {n:'Section 13',desc:'Unlawful activities — punishment'},
    {n:'Section 43D(5)',desc:'Bail provisions — special considerations'},
  ] },
  { id:'NDPS', shortName:'NDPS Act',      fullName:'The Narcotic Drugs and Psychotropic Substances Act, 1985',                                                              year:1985, category:'Criminal',    tags:['ndps','narcotics','section 37','commercial quantity','search'], keySections:[
    {n:'Section 8', desc:'Prohibition of certain operations'},
    {n:'Section 27',desc:'Punishment for consumption'},
    {n:'Section 37',desc:'Bail — twin conditions for commercial quantity'},
    {n:'Section 50',desc:'Search procedure — accused\'s right to be searched in presence of Magistrate / Gazetted Officer'},
  ] },
  { id:'PCAct', shortName:'Prevention of Corruption Act',fullName:'The Prevention of Corruption Act, 1988',                                                                year:1988, category:'Criminal',   tags:['corruption','public servant','disproportionate assets','section 7','section 13'], keySections:[
    {n:'Section 7', desc:'Public servant taking gratification other than legal remuneration'},
    {n:'Section 13',desc:'Criminal misconduct by a public servant'},
  ] },
  { id:'POTA', shortName:'COFEPOSA',      fullName:'The Conservation of Foreign Exchange and Prevention of Smuggling Activities Act, 1974',                               year:1974, category:'Preventive Detention', tags:['cofeposa','preventive detention','foreign exchange','smuggling'], keySections:[
    {n:'Section 3',desc:'Power to make orders detaining certain persons'},
  ] },
  { id:'NIA_Act', shortName:'NIA Act',    fullName:'The National Investigation Agency Act, 2008',                                                                          year:2008, category:'Criminal',   tags:['nia','scheduled offence','terrorism investigation'], keySections:[
    {n:'Section 6', desc:'Investigation by NIA'},
    {n:'Section 13',desc:'Special Courts'},
  ] },
  { id:'POPS', shortName:'PSS Act',       fullName:'The Payment and Settlement Systems Act, 2007',                                                                          year:2007, category:'Banking',    tags:['payment system','rbi','upi','clearing'], keySections:[
    {n:'Section 4', desc:'Payment system not to operate without authorisation'},
    {n:'Section 25',desc:'Dishonour of electronic fund transfer for insufficiency of funds'},
  ] },
  { id:'CompetA',shortName:'Competition Act',fullName:'The Competition Act, 2002',                                                                                          year:2002, category:'Corporate',  tags:['competition','cci','cartel','abuse of dominance','section 3','section 4'], keySections:[
    {n:'Section 3', desc:'Anti-competitive agreements'},
    {n:'Section 4', desc:'Abuse of dominant position'},
    {n:'Section 5', desc:'Combinations — thresholds for notification'},
  ] },
  { id:'TmA',  shortName:'Trade Marks Act',fullName:'The Trade Marks Act, 1999',                                                                                            year:1999, category:'IP',         tags:['trademark','tm','infringement','section 27','section 29'], keySections:[
    {n:'Section 27',desc:'No action for infringement of unregistered trade mark'},
    {n:'Section 29',desc:'Infringement of registered trade marks'},
  ] },
  { id:'CopyA',shortName:'Copyright Act',  fullName:'The Copyright Act, 1957',                                                                                              year:1957, category:'IP',         tags:['copyright','infringement','fair use','section 51','section 52'], keySections:[
    {n:'Section 51',desc:'When copyright is infringed'},
    {n:'Section 52',desc:'Fair use — certain acts not constituting infringement'},
  ] },
  { id:'PatA', shortName:'Patents Act',    fullName:'The Patents Act, 1970',                                                                                                year:1970, category:'IP',         tags:['patent','section 3','novelty','inventive step','section 8'], keySections:[
    {n:'Section 3', desc:'What are not inventions'},
    {n:'Section 8', desc:'Information and undertaking regarding foreign applications'},
  ] },

  // ── Specific Relief ─────────────────────────────────────────
  { id:'SRA',  shortName:'Specific Relief Act',fullName:'The Specific Relief Act, 1963',                                                                                    year:1963, category:'Civil',     tags:['specific relief','specific performance','injunction','section 10','section 38'], keySections:[
    {n:'Section 10',desc:'Cases in which specific performance of contract enforceable'},
    {n:'Section 14',desc:'Contracts not specifically enforceable'},
    {n:'Section 38',desc:'Perpetual injunction when granted'},
    {n:'Section 39',desc:'Mandatory injunctions'},
  ] },
  { id:'LimA', shortName:'Limitation Act', fullName:'The Limitation Act, 1963',                                                                                              year:1963, category:'Civil',    tags:['limitation','time-barred','section 5','article 113'], keySections:[
    {n:'Section 3', desc:'Bar of limitation'},
    {n:'Section 5', desc:'Extension of prescribed period — sufficient cause'},
  ] },

  // ── Public health / consumer ────────────────────────────────
  { id:'FSSA',  shortName:'FSSA',          fullName:'The Food Safety and Standards Act, 2006',                                                                              year:2006, category:'Public health',tags:['food safety','adulteration','fssai'], keySections:[
    {n:'Section 26',desc:'Responsibilities of food business operator'},
    {n:'Section 59',desc:'Punishment for unsafe food'},
  ] },
  { id:'DCAct', shortName:'D&C Act',      fullName:'The Drugs and Cosmetics Act, 1940',                                                                                    year:1940, category:'Public health',tags:['drugs','spurious drugs','section 18','licence'], keySections:[
    {n:'Section 18',desc:'Prohibition of manufacture and sale of certain drugs and cosmetics'},
    {n:'Section 27',desc:'Penalty for manufacture, sale of spurious drugs'},
  ] },

  // ── Citizenship / immigration ───────────────────────────────
  { id:'CitA', shortName:'Citizenship Act',fullName:'The Citizenship Act, 1955',                                                                                            year:1955, category:'Public law', tags:['citizenship','naturalisation','section 5','section 6'], keySections:[
    {n:'Section 5', desc:'Citizenship by registration'},
    {n:'Section 6', desc:'Citizenship by naturalisation'},
  ] },
  { id:'PassA',shortName:'Passport Act',  fullName:'The Passports Act, 1967',                                                                                                year:1967, category:'Public law', tags:['passport','section 6','impounding'], keySections:[
    {n:'Section 6', desc:'Refusal of passport — grounds'},
    {n:'Section 10',desc:'Variation, impounding and revocation of passports'},
  ] },
]

// The full catalog = the core acts above + the breadth catalog in
// indian-laws-extended.js. Kept as one exported array so every consumer
// (prompt grounding, chatbot, /study) automatically sees all of them.
export const INDIAN_LAWS = [...INDIAN_LAWS_CORE, ...INDIAN_LAWS_EXTENDED]

// ─── Lookup helpers ──────────────────────────────────────────────
const _laws = INDIAN_LAWS

// Find a law by id, shortName, or substring of fullName
export function findLaw(needle) {
  if (!needle) return null
  const n = String(needle).toLowerCase().trim()
  return _laws.find(l =>
    l.id.toLowerCase() === n ||
    l.shortName.toLowerCase() === n ||
    l.fullName.toLowerCase().includes(n)
  ) || null
}

// Find applicable laws for a free-text query (e.g. document content,
// chat question, or user-typed keywords). Returns top-N most relevant.
// Uses tag matching plus a tiny fuzzy bonus when the act name itself
// appears.
export function findApplicableLaws(query, limit = 8) {
  if (!query) return []
  const q = String(query).toLowerCase()
  const tokens = q.split(/[^a-z0-9]+/).filter(t => t && t.length > 2)
  // Whole-word tag match. Plain substring matching made short tags match
  // almost any text — the tag "ed" (Enforcement Directorate) fired on
  // "denied"/"delayed", pulling PMLA into unrelated matters.
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hasTag = tag => new RegExp(`(^|[^a-z0-9])${esc(tag)}([^a-z0-9]|$)`).test(q)

  return _laws.map(l => {
    let score = 0
    for (const tag of l.tags) {
      if (hasTag(tag)) score += 3
      // Loose fallback: only for reasonably long tokens. Short ones (e.g.
      // "act") are substrings of far too many tags ("contract", "practice")
      // and were dragging unrelated statutes into the grounded prompt.
      else if (tokens.some(t => t.length >= 5 && tag.includes(t))) score += 1
    }
    // Word-boundary here too: plain substring matching made "certificate"
    // match the id "RTI" (ce-rti-ficate) and pull the RTI Act into a
    // probate query.
    if (hasTag(l.shortName.toLowerCase())) score += 5
    if (hasTag(l.id.toLowerCase()))        score += 4
    for (const ks of l.keySections) {
      if (hasTag(ks.n.toLowerCase()))      score += 4
    }
    return { law: l, score }
  })
  // Require a REAL match (a whole-word tag / act name / section hit = 3+),
  // not just one weak fuzzy token. A single +1 substring hit was enough to
  // surface, e.g., SARFAESI for a land-encroachment petition (its tag
  // "symbolic possession" merely contains "possession"). Showing a lawyer
  // an irrelevant statute is worse than showing none, so weak-only matches
  // are dropped entirely rather than padded in.
  .filter(x => x.score >= 3)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
  .map(x => x.law)
}

// Format a law entry for inclusion in an AI prompt — compact but
// includes everything the model needs to cite it correctly.
export function formatLawForPrompt(law, includeSections = true) {
  const head = `• ${law.fullName} ("${law.shortName}", ${law.year}) — category: ${law.category}`
  if (!includeSections) return head
  const secs = law.keySections.map(s => `    – ${s.n}: ${s.desc}`).join('\n')
  return `${head}\n${secs}`
}

// Build a prompt block of relevant laws given a free-text query.
// This is what gets injected into the system prompt for both
// document generation and chatbot answers.
export function buildLawsPromptBlock(query, limit = 6) {
  const laws = findApplicableLaws(query, limit)
  if (laws.length === 0) return ''
  const body = laws.map(l => formatLawForPrompt(l, true)).join('\n\n')
  return `═══════ APPLICABLE LAWS REFERENCE (use full official names) ═══════
The following Indian central acts appear most relevant to the matter
at hand. When you cite any of these in the document or answer, use the
EXACT full official name and the EXACT section number shown below.
Do not invent provision numbers. If you are unsure whether a section
applies, write the section in square brackets with the suffix "(verify
before filing)" rather than guessing.

${body}
═══════ END APPLICABLE LAWS REFERENCE ═══════
`
}

// Stats helper — used by the /study UI.
export function lawsByCategory() {
  const m = {}
  for (const l of _laws) {
    if (!m[l.category]) m[l.category] = []
    m[l.category].push(l)
  }
  return m
}
