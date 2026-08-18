// ─────────────────────────────────────────────────────────────────
//  LexForge AI — indian-laws-extra.js
//
//  Third tranche, on top of indian-laws.js (core) and
//  indian-laws-extended.js (breadth). Everything here was chosen by
//  auditing the existing 214 for gaps a practising Indian lawyer would
//  actually hit — not by padding the count.
//
//  SAME ACCURACY POLICY as indian-laws-extended.js, and it matters more
//  here because several of these are recent:
//    • Every fullName + year is a real, verifiable Act.
//    • keySections appear ONLY where the provision is well established.
//      Where a number is not certain it is omitted entirely — the model
//      is told (CITATION_MANDATE) to write "[SECTION TO BE VERIFIED]"
//      rather than invent one. A wrong section in a filing is worse
//      than no section.
//    • Statutes that have been replaced are kept and marked, because
//      pending matters are still governed by them.
//
//  The 2025 Acts at the end were read from India Code's own PDFs, so
//  their sections are verified rather than recalled.
// ─────────────────────────────────────────────────────────────────

export const INDIAN_LAWS_EXTRA = [

  // ── Preventive detention & special criminal law ──────────────
  { id:'NSA', shortName:'National Security Act', fullName:'The National Security Act, 1980', year:1980, category:'Preventive Detention', tags:['nsa','preventive detention','national security','public order','detention order'], keySections:[
    {n:'Section 3',  desc:'Power of Central/State Government to detain a person to prevent acts prejudicial to national security or public order'},
    {n:'Section 8',  desc:'Grounds of detention must be communicated to the detenu, ordinarily within five days'},
    {n:'Section 10', desc:'Reference of every detention to the Advisory Board within three weeks'},
  ] },
  { id:'MCOCA', shortName:'MCOCA', fullName:'The Maharashtra Control of Organised Crime Act, 1999', year:1999, category:'Criminal', tags:['mcoca','organised crime','syndicate','continuing unlawful activity','maharashtra'], keySections:[
    {n:'Section 3',  desc:'Punishment for organised crime, including for members of an organised crime syndicate'},
    {n:'Section 21', desc:'Modified application of bail — stringent twin conditions before release'},
  ] },
  { id:'UPGangsters', shortName:'UP Gangsters Act', fullName:'The Uttar Pradesh Gangsters and Anti-Social Activities (Prevention) Act, 1986', year:1986, category:'Criminal', tags:['gangster','gang','anti-social','uttar pradesh','up','gang chart'], keySections:[
    {n:'Section 2(b)', desc:'Definition of "gang" — a group acting in concert for anti-social activity'},
    {n:'Section 3',    desc:'Punishment for being a member of a gang'},
  ] },
  { id:'FEOA', shortName:'Fugitive Economic Offenders Act', fullName:'The Fugitive Economic Offenders Act, 2018', year:2018, category:'Criminal', tags:['fugitive','economic offender','absconder','attachment','confiscation'], keySections:[
    {n:'Section 4',  desc:'Application to the Special Court to declare a person a fugitive economic offender'},
    {n:'Section 12', desc:'Declaration and consequent confiscation of the offender’s property'},
    {n:'Section 14', desc:'Power to disallow a declared offender from putting forward or defending civil claims'},
  ] },
  { id:'AntiHijack', shortName:'Anti-Hijacking Act', fullName:'The Anti-Hijacking Act, 2016', year:2016, category:'Criminal', tags:['hijacking','aircraft','aviation security'], keySections:[
    {n:'Section 3', desc:'Definition of the offence of hijacking'},
    {n:'Section 4', desc:'Punishment for hijacking, extending to death where it causes death'},
  ] },
  { id:'PCRAct', shortName:'Protection of Civil Rights Act', fullName:'The Protection of Civil Rights Act, 1955', year:1955, category:'Criminal', tags:['untouchability','civil rights','discrimination','article 17'], keySections:[
    {n:'Section 3', desc:'Punishment for enforcing religious disabilities on the ground of untouchability'},
    {n:'Section 7', desc:'Punishment for preventing exercise of rights accruing from the abolition of untouchability'},
  ] },
  { id:'PDPPAct', shortName:'Prevention of Damage to Public Property Act', fullName:'The Prevention of Damage to Public Property Act, 1984', year:1984, category:'Criminal', tags:['public property','damage','riot','protest','mischief'], keySections:[
    {n:'Section 3', desc:'Punishment for mischief causing damage to public property'},
  ] },
  { id:'NatHonour', shortName:'National Honour Act', fullName:'The Prevention of Insults to National Honour Act, 1971', year:1971, category:'Criminal', tags:['national flag','national anthem','constitution','insult'], keySections:[
    {n:'Section 2', desc:'Punishment for insult to the Indian National Flag and the Constitution of India'},
    {n:'Section 3', desc:'Punishment for preventing the singing of the National Anthem'},
  ] },
  { id:'PublicGambling', shortName:'Public Gambling Act', fullName:'The Public Gambling Act, 1867', year:1867, category:'Criminal', tags:['gambling','gaming house','betting','wager'], keySections:[
    {n:'Section 3', desc:'Penalty for owning or keeping, or having charge of, a gaming house'},
    {n:'Section 4', desc:'Penalty for being found in a gaming house'},
  ] },
  { id:'Antiquities', shortName:'Antiquities Act', fullName:'The Antiquities and Art Treasures Act, 1972', year:1972, category:'Criminal', tags:['antiquity','art treasure','heritage','export','idol'], keySections:[
    {n:'Section 3',  desc:'Regulation of export trade in antiquities and art treasures'},
    {n:'Section 25', desc:'Penalties for contravention, including for illegal export'},
  ] },
  { id:'PCAAnimals', shortName:'Prevention of Cruelty to Animals Act', fullName:'The Prevention of Cruelty to Animals Act, 1960', year:1960, category:'Welfare', tags:['animal','cruelty','cattle','stray','veterinary'], keySections:[
    {n:'Section 11', desc:'Treating animals cruelly — the principal penal provision'},
  ] },

  // ── Family & personal law ────────────────────────────────────
  { id:'HMGA', shortName:'HMGA', fullName:'The Hindu Minority and Guardianship Act, 1956', year:1956, category:'Family', tags:['guardianship','minor','natural guardian','custody','hindu'], keySections:[
    {n:'Section 6',  desc:'Natural guardians of a Hindu minor — father, and after him the mother; for a minor below five, custody ordinarily with the mother'},
    {n:'Section 13', desc:'Welfare of the minor is the paramount consideration in appointing a guardian'},
  ] },
  { id:'MajorityAct', shortName:'Indian Majority Act', fullName:'The Indian Majority Act, 1875', year:1875, category:'Family', tags:['majority','age','minor','eighteen','competence'], keySections:[
    {n:'Section 3', desc:'Age of majority is eighteen years, and twenty-one where a guardian has been appointed by court'},
  ] },
  { id:'CharitableTrusts', shortName:'Charitable and Religious Trusts Act', fullName:'The Charitable and Religious Trusts Act, 1920', year:1920, category:'Property', tags:['charitable trust','religious trust','temple','endowment','trustee'], keySections:[] },

  // ── Civil procedure & courts ─────────────────────────────────
  { id:'SmallCause', shortName:'Small Cause Courts Act', fullName:'The Provincial Small Cause Courts Act, 1887', year:1887, category:'Civil (procedural)', tags:['small cause','summary suit','recovery','rent suit','sccj'], keySections:[
    {n:'Section 15', desc:'Suits cognizable by a Court of Small Causes'},
    {n:'Section 17', desc:'Procedure applicable — the CPC applies so far as is consistent'},
  ] },
  { id:'PublicRecords', shortName:'Public Records Act', fullName:'The Public Records Act, 1993', year:1993, category:'Public law', tags:['public records','archives','destruction of records','custody'], keySections:[] },
  { id:'OfficialLang', shortName:'Official Languages Act', fullName:'The Official Languages Act, 1963', year:1963, category:'Public law', tags:['official language','hindi','english','court language'], keySections:[
    {n:'Section 3', desc:'Continued use of English for official purposes of the Union and in Parliament'},
    {n:'Section 7', desc:'Optional use of Hindi or other official language in judgments of High Courts'},
  ] },

  // ── Commissions & public bodies ──────────────────────────────
  { id:'NCWAct', shortName:'National Commission for Women Act', fullName:'The National Commission for Women Act, 1990', year:1990, category:'Public law', tags:['ncw','women','commission','complaint','gender'], keySections:[
    {n:'Section 10', desc:'Functions of the Commission, including inquiry into complaints of deprivation of women’s rights'},
  ] },
  { id:'NCMAct', shortName:'National Commission for Minorities Act', fullName:'The National Commission for Minorities Act, 1992', year:1992, category:'Public law', tags:['minorities','commission','ncm','safeguards'], keySections:[] },
  { id:'SafaiKaramchari', shortName:'Safai Karamcharis Commission Act', fullName:'The National Commission for Safai Karamcharis Act, 1993', year:1993, category:'Welfare', tags:['safai karamchari','sanitation worker','manual scavenging','commission'], keySections:[] },
  { id:'ManualScavenging', shortName:'Manual Scavenging Act', fullName:'The Prohibition of Employment as Manual Scavengers and their Rehabilitation Act, 2013', year:2013, category:'Welfare', tags:['manual scavenging','sewer','septic tank','rehabilitation','sanitation'], keySections:[
    {n:'Section 5', desc:'Prohibition of insanitary latrines and of employment as manual scavengers'},
    {n:'Section 7', desc:'Prohibition of hazardous cleaning of sewers and septic tanks'},
  ] },

  // ── Tax & revenue ────────────────────────────────────────────
  { id:'ITAct2025', shortName:'Income-tax Act 2025', fullName:'The Income-tax Act, 2025', year:2025, category:'Tax', tags:['income tax','new income tax act','direct tax','assessment','tax year'], keySections:[] },
  { id:'CSTAct', shortName:'Central Sales Tax Act', fullName:'The Central Sales Tax Act, 1956', year:1956, category:'Tax', tags:['central sales tax','cst','inter-state sale','c form'], keySections:[
    {n:'Section 3', desc:'When a sale or purchase of goods is said to take place in the course of inter-State trade'},
    {n:'Section 6', desc:'Liability to tax on inter-State sales'},
  ] },

  // ── Banking, finance & commercial ────────────────────────────
  { id:'CreditInfo', shortName:'Credit Information Companies Act', fullName:'The Credit Information Companies (Regulation) Act, 2005', year:2005, category:'Banking', tags:['credit information','cibil','credit score','credit bureau'], keySections:[] },
  { id:'FactoringAct', shortName:'Factoring Regulation Act', fullName:'The Factoring Regulation Act, 2011', year:2011, category:'Banking', tags:['factoring','receivables','assignment of debt'], keySections:[] },
  { id:'GovtSecurities', shortName:'Government Securities Act', fullName:'The Government Securities Act, 2006', year:2006, category:'Securities', tags:['government securities','g-sec','bond','transfer'], keySections:[] },
  { id:'COGSA', shortName:'Carriage of Goods by Sea Act', fullName:'The Carriage of Goods by Sea Act, 1925', year:1925, category:'Commercial', tags:['carriage by sea','bill of lading','shipment','hague rules'], keySections:[] },
  { id:'MultimodalGoods', shortName:'Multimodal Transportation Act', fullName:'The Multimodal Transportation of Goods Act, 1993', year:1993, category:'Commercial', tags:['multimodal','transport document','consignment','freight'], keySections:[] },
  { id:'BillsOfLading', shortName:'Bills of Lading Act', fullName:'The Indian Bills of Lading Act, 1856', year:1856, category:'Commercial', tags:['bill of lading','consignee','endorsement','shipping document'], keySections:[] },
  { id:'EmblemsAct', shortName:'Emblems and Names Act', fullName:'The Emblems and Names (Prevention of Improper Use) Act, 1950', year:1950, category:'Regulatory', tags:['emblem','national symbol','improper use','ashoka','name'], keySections:[
    {n:'Section 3', desc:'Prohibition of improper use of specified emblems and names for trade or professional purposes'},
  ] },
  { id:'JanVishwas', shortName:'Jan Vishwas Act', fullName:'The Jan Vishwas (Amendment of Provisions) Act, 2023', year:2023, category:'Regulatory', tags:['decriminalisation','ease of doing business','compounding','penalty instead of imprisonment'], keySections:[] },

  // ── Professions ──────────────────────────────────────────────
  { id:'CAAct', shortName:'Chartered Accountants Act', fullName:'The Chartered Accountants Act, 1949', year:1949, category:'Legal profession', tags:['chartered accountant','icai','professional misconduct','audit'], keySections:[] },
  { id:'CSAct', shortName:'Company Secretaries Act', fullName:'The Company Secretaries Act, 1980', year:1980, category:'Legal profession', tags:['company secretary','icsi','professional misconduct'], keySections:[] },
  { id:'CWAAct', shortName:'Cost and Works Accountants Act', fullName:'The Cost and Works Accountants Act, 1959', year:1959, category:'Legal profession', tags:['cost accountant','icmai','costing'], keySections:[] },

  // ── Labour (filling gaps in the 29 already covered) ──────────
  { id:'WorkingJournalists', shortName:'Working Journalists Act', fullName:'The Working Journalists and other Newspaper Employees (Conditions of Service) and Miscellaneous Provisions Act, 1955', year:1955, category:'Labour', tags:['journalist','newspaper employee','wage board','media employment'], keySections:[] },
  { id:'SalesPromotion', shortName:'Sales Promotion Employees Act', fullName:'The Sales Promotion Employees (Conditions of Service) Act, 1976', year:1976, category:'Labour', tags:['sales promotion','medical representative','field staff'], keySections:[] },
  { id:'WeeklyHolidays', shortName:'Weekly Holidays Act', fullName:'The Weekly Holidays Act, 1942', year:1942, category:'Labour', tags:['weekly holiday','shop','establishment','rest day'], keySections:[] },
  { id:'BeediCigar', shortName:'Beedi and Cigar Workers Act', fullName:'The Beedi and Cigar Workers (Conditions of Employment) Act, 1966', year:1966, category:'Labour', tags:['beedi','cigar','home worker','industrial premises'], keySections:[] },
  { id:'DockWorkers', shortName:'Dock Workers Act', fullName:'The Dock Workers (Safety, Health and Welfare) Act, 1986', year:1986, category:'Labour', tags:['dock worker','port','safety','stevedore'], keySections:[] },
  { id:'CineWorkers', shortName:'Cine-Workers Act', fullName:'The Cine-Workers and Cinema Theatre Workers (Regulation of Employment) Act, 1981', year:1981, category:'Labour', tags:['cine worker','film','cinema theatre','entertainment employment'], keySections:[] },

  // ── Health & medicine ────────────────────────────────────────
  { id:'COTPA', shortName:'COTPA', fullName:'The Cigarettes and Other Tobacco Products (Prohibition of Advertisement and Regulation of Trade and Commerce, Production, Supply and Distribution) Act, 2003', year:2003, category:'Public health', tags:['tobacco','cigarette','smoking','public place','advertisement ban'], keySections:[
    {n:'Section 4', desc:'Prohibition of smoking in a public place'},
    {n:'Section 5', desc:'Prohibition of advertisement of cigarettes and other tobacco products'},
    {n:'Section 6', desc:'Prohibition of sale to a person below eighteen years and near educational institutions'},
  ] },
  { id:'NCISM', shortName:'NCISM Act', fullName:'The National Commission for Indian System of Medicine Act, 2020', year:2020, category:'Health', tags:['ayurveda','unani','siddha','indian medicine','ncism'], keySections:[] },
  { id:'NCHAct', shortName:'NCH Act', fullName:'The National Commission for Homoeopathy Act, 2020', year:2020, category:'Health', tags:['homoeopathy','nch','medical education'], keySections:[] },
  { id:'AlliedHealth', shortName:'Allied Healthcare Act', fullName:'The National Commission for Allied and Healthcare Professions Act, 2021', year:2021, category:'Health', tags:['allied health','paramedic','technician','healthcare professional'], keySections:[] },

  // ── Education ────────────────────────────────────────────────
  { id:'AICTEAct', shortName:'AICTE Act', fullName:'The All India Council for Technical Education Act, 1987', year:1987, category:'Education', tags:['aicte','technical education','engineering college','approval'], keySections:[] },
  { id:'NCTEAct', shortName:'NCTE Act', fullName:'The National Council for Teacher Education Act, 1993', year:1993, category:'Education', tags:['ncte','teacher education','b.ed','recognition'], keySections:[] },

  // ── Environment & energy ─────────────────────────────────────
  { id:'EnergyConservation', shortName:'Energy Conservation Act', fullName:'The Energy Conservation Act, 2001', year:2001, category:'Environment', tags:['energy conservation','bee','energy audit','carbon credit'], keySections:[] },
  { id:'CoastalAquaculture', shortName:'Coastal Aquaculture Authority Act', fullName:'The Coastal Aquaculture Authority Act, 2005', year:2005, category:'Environment', tags:['coastal aquaculture','shrimp farm','crz','coastal regulation'], keySections:[] },

  // ── Transport ────────────────────────────────────────────────
  { id:'InlandVessels', shortName:'Inland Vessels Act', fullName:'The Inland Vessels Act, 2021', year:2021, category:'Transport', tags:['inland vessel','waterway','boat','river transport','registration'], keySections:[] },
  { id:'BharatiyaVayuyan', shortName:'Bharatiya Vayuyan Adhiniyam', fullName:'The Bharatiya Vayuyan Adhiniyam, 2024 (replaces the Aircraft Act, 1934)', year:2024, category:'Transport', tags:['aircraft','aviation','dgca','vayuyan','air navigation'], keySections:[] },

  // ── Co-operatives & societies ────────────────────────────────
  { id:'MultiStateCoop', shortName:'Multi-State Co-operative Societies Act', fullName:'The Multi-State Co-operative Societies Act, 2002', year:2002, category:'Corporate', tags:['co-operative society','multi-state','credit society','member'], keySections:[] },

  // ── 2025 statutes — sections read from India Code's own PDFs ─
  { id:'OnlineGaming2025', shortName:'Online Gaming Act', fullName:'The Promotion and Regulation of Online Gaming Act, 2025', year:2025, category:'Regulatory', tags:['online gaming','online money game','e-sport','betting','real money gaming','advertisement'], keySections:[
    {n:'Section 2',  desc:'Definitions, including "online money game", "online social game" and "e-sport"'},
    {n:'Section 5',  desc:'Prohibition of online money games and online money gaming services'},
    {n:'Section 6',  desc:'Prohibition of advertisement relating to online money games'},
    {n:'Section 7',  desc:'Prohibition of transfer of funds for an online money game'},
    {n:'Section 9',  desc:'Penalty for contravention'},
    {n:'Section 14', desc:'Blocking of online money gaming services'},
  ] },
  { id:'IndianPorts2025', shortName:'Indian Ports Act 2025', fullName:'The Indian Ports Act, 2025', year:2025, category:'Transport', tags:['port','harbour','maritime','shipping','port authority'], keySections:[] },
  { id:'RepealAmend2025', shortName:'Repealing and Amending Act 2025', fullName:'The Repealing and Amending Act, 2025', year:2025, category:'Interpretation', tags:['repeal','amendment','obsolete law','statute book'], keySections:[] },
  { id:'HealthCess2025', shortName:'Health Security Cess Act', fullName:'The Health Security Se National Security Cess Act, 2025', year:2025, category:'Tax', tags:['cess','health security','levy'], keySections:[] },
]
