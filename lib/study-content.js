// ─────────────────────────────────────────────────────────────────
//  LexForge AI — study-content.js
//
//  Curated seed content for the /study section:
//    1. LANDMARK_JUDGMENTS — 50+ Indian SC / HC cases that every law
//       student should know.
//    2. LEGAL_PRINCIPLES   — common law doctrines and constitutional
//       principles, with origin case + modern application.
//
//  Both arrays are intentionally JSON-shaped so they can be sent
//  straight to the client. The AI Tutor and Quiz endpoints use this
//  catalog to ground their answers.
// ─────────────────────────────────────────────────────────────────

export const LANDMARK_JUDGMENTS = [
  // ── Constitutional law ──────────────────────────────────────
  { id:'kesavananda-bharati', name:'Kesavananda Bharati v. State of Kerala', year:1973, citation:'AIR 1973 SC 1461; (1973) 4 SCC 225', court:'Supreme Court of India (13-judge bench)', area:'Constitutional',
    facts:'Petitioner challenged Kerala Land Reforms Acts and the 24th, 25th, 29th Constitutional Amendments which limited fundamental property rights and parliamentary power.',
    issue:'Whether Parliament has unlimited power to amend any provision of the Constitution under Article 368.',
    holding:'By a 7:6 majority, the Supreme Court held that Parliament may amend any part of the Constitution but cannot alter or destroy its "basic structure".',
    ratio:'The doctrine of Basic Structure: certain fundamental features of the Constitution (supremacy of the Constitution, republican democracy, secularism, separation of powers, federalism, etc.) are unamendable.',
    importance:'Foundational case of Indian constitutional jurisprudence. Every subsequent constitutional amendment has been tested against the basic structure doctrine. Restrains Parliament and protects democracy.' },

  { id:'maneka-gandhi', name:'Maneka Gandhi v. Union of India', year:1978, citation:'AIR 1978 SC 597; (1978) 1 SCC 248', court:'Supreme Court of India (7-judge bench)', area:'Constitutional / Fundamental Rights',
    facts:'The Government of India impounded the petitioner\'s passport without giving her a hearing or any reason, citing "in the interests of the general public" under the Passports Act, 1967.',
    issue:'Whether "procedure established by law" under Article 21 must be "fair, just and reasonable", and whether Articles 14, 19 and 21 should be read together.',
    holding:'The procedure depriving life or personal liberty must be just, fair and reasonable. Articles 14, 19 and 21 form a "golden triangle" and any law affecting one must satisfy all three.',
    ratio:'Article 21 is not a stand-alone right; it is interpreted in harmony with Articles 14 (equality) and 19 (freedoms). "Procedure established by law" requires procedural and substantive due process.',
    importance:'Massively expanded the scope of Article 21. Underlies later expansions including the right to privacy, livelihood, education, dignity, and a clean environment.' },

  { id:'puttaswamy', name:'Justice K.S. Puttaswamy (Retd.) v. Union of India', year:2017, citation:'(2017) 10 SCC 1', court:'Supreme Court of India (9-judge bench)', area:'Constitutional / Privacy',
    facts:'Retired Justice Puttaswamy challenged the Aadhaar scheme on the ground that compelling biometric collection violated the right to privacy.',
    issue:'Whether the right to privacy is a fundamental right under the Constitution.',
    holding:'Unanimously held that the right to privacy is a fundamental right protected under Articles 14, 19 and 21. Overruled M.P. Sharma (1954) and Kharak Singh (1962) on this point.',
    ratio:'Privacy includes informational, bodily, decisional and locational privacy. State action infringing privacy must satisfy: (a) legality, (b) legitimate state aim, and (c) proportionality.',
    importance:'Foundation for India\'s data protection regime (DPDP Act 2023), decriminalisation of consensual same-sex acts (Navtej), and modern jurisprudence on surveillance.' },

  { id:'minerva-mills', name:'Minerva Mills Ltd. v. Union of India', year:1980, citation:'AIR 1980 SC 1789', court:'Supreme Court of India (5-judge bench)', area:'Constitutional',
    facts:'Petitioners challenged Sections 4 and 55 of the 42nd Amendment which sought to give absolute primacy to Directive Principles over Fundamental Rights and bar judicial review of constitutional amendments.',
    issue:'Whether the 42nd Amendment\'s clauses violated the basic structure doctrine.',
    holding:'Both clauses were struck down. Limited amending power and judicial review are part of the basic structure.',
    ratio:'There must be a balance between Parts III (Fundamental Rights) and IV (Directive Principles). Neither can override the other absolutely.',
    importance:'Reinforced the basic structure doctrine and the "harmony" between fundamental rights and directive principles.' },

  { id:'sr-bommai', name:'S.R. Bommai v. Union of India', year:1994, citation:'AIR 1994 SC 1918; (1994) 3 SCC 1', court:'Supreme Court of India (9-judge bench)', area:'Constitutional / Federalism',
    facts:'Article 356 (President\'s Rule) had been used repeatedly to dismiss state governments. Six dismissals were challenged.',
    issue:'Whether the imposition of President\'s Rule under Article 356 is justiciable, and what limits apply.',
    holding:'Imposition of Article 356 is justiciable. The court can examine satisfaction of the President. State governments must be tested by floor of the House before dismissal.',
    ratio:'Federalism, secularism and democracy are part of the basic structure. Misuse of Article 356 is unconstitutional.',
    importance:'Restrained centre-state political abuse. Solidified federalism as part of the basic structure.' },

  { id:'navtej-johar', name:'Navtej Singh Johar v. Union of India', year:2018, citation:'(2018) 10 SCC 1', court:'Supreme Court of India (5-judge bench)', area:'Constitutional / LGBTQ rights',
    facts:'Petitioners challenged Section 377 IPC criminalising "carnal intercourse against the order of nature".',
    issue:'Whether Section 377 IPC, insofar as it criminalised consensual same-sex relations between adults, was constitutional.',
    holding:'Section 377 was read down. Consensual sexual conduct between adults of any gender was decriminalised.',
    ratio:'Sexual orientation is intrinsic to identity, dignity and autonomy under Articles 14, 15, 19 and 21. Constitutional morality prevails over majoritarian morality.',
    importance:'Landmark for LGBTQ+ rights in India. Recognised dignity-based equality.' },

  { id:'shayara-bano', name:'Shayara Bano v. Union of India', year:2017, citation:'(2017) 9 SCC 1', court:'Supreme Court of India (5-judge bench)', area:'Constitutional / Personal law',
    facts:'Triple Talaq (talaq-e-biddat — instant, irrevocable divorce by Muslim husband by saying "talaq" thrice) was challenged.',
    issue:'Whether triple talaq is constitutional.',
    holding:'By 3:2, triple talaq was held unconstitutional and void as it violates Articles 14, 21 and is not protected by Article 25.',
    ratio:'A practice is not protected by religion if it is arbitrary and not essential to the religion.',
    importance:'Parliament subsequently enacted the Muslim Women (Protection of Rights on Marriage) Act, 2019 criminalising triple talaq.' },

  { id:'indra-sawhney', name:'Indra Sawhney v. Union of India', year:1992, citation:'AIR 1993 SC 477', court:'Supreme Court of India (9-judge bench)', area:'Constitutional / Reservation',
    facts:'Implementation of Mandal Commission Report recommending 27% reservation for OBCs in central government jobs was challenged.',
    issue:'Whether OBC reservation is constitutional and whether there is any quantitative limit.',
    holding:'Reservation upheld. 50% ceiling on total reservations laid down. "Creamy layer" must be excluded from OBC reservation.',
    ratio:'Reservation under Article 16(4) is permissible but cannot exceed 50% (subject to extraordinary situations). Economic creamy layer must be excluded from OBC quota.',
    importance:'Definitive case on OBC reservation. The 50% ceiling has been the touchstone for every reservation case since.' },

  // ── Criminal law ────────────────────────────────────────────
  { id:'dk-basu', name:'D.K. Basu v. State of West Bengal', year:1997, citation:'AIR 1997 SC 610; (1997) 1 SCC 416', court:'Supreme Court of India', area:'Criminal / Custodial rights',
    facts:'Letter petition by D.K. Basu (Executive Chairman, Legal Aid Services WB) regarding rampant custodial deaths and torture.',
    issue:'What guidelines should regulate police arrest and detention to prevent custodial torture.',
    holding:'Issued 11 mandatory directions binding on all police personnel, including arrest memo, intimation to a relative, medical examination every 48 hours.',
    ratio:'Custodial torture violates Article 21. Failure to follow these guidelines invites contempt and disciplinary action.',
    importance:'Backbone of arrest jurisprudence — codified in Section 41B CrPC and now BNSS 2023.' },

  { id:'arnesh-kumar', name:'Arnesh Kumar v. State of Bihar', year:2014, citation:'(2014) 8 SCC 273', court:'Supreme Court of India', area:'Criminal / Arrest',
    facts:'Allegations of dowry harassment under Section 498A IPC; husband apprehended automatic arrest.',
    issue:'Whether police can arrest mechanically in cases punishable up to 7 years.',
    holding:'Police MUST examine necessity of arrest. They must record reasons. Magistrate must be satisfied with reasons before authorising further detention.',
    ratio:'Arrest is the exception, not the rule. Section 41 CrPC checklist applies to all offences punishable up to 7 years.',
    importance:'Curbed arbitrary arrest, especially in 498A cases. Often invoked alongside Section 41A CrPC notices.' },

  { id:'satender-kumar-antil', name:'Satender Kumar Antil v. CBI', year:2022, citation:'(2022) 10 SCC 51', court:'Supreme Court of India', area:'Criminal / Bail',
    facts:'CBI proceedings; comprehensive review of bail jurisprudence requested.',
    issue:'Detailed framework for default bail, regular bail and bail in special statutes.',
    holding:'Issued category-wise guidelines (A–D) for bail. Strong endorsement of "bail not jail" principle. Default bail under §167(2) is a fundamental right.',
    ratio:'Procedural compliance with bail provisions is mandatory. Courts must consider bail expeditiously and avoid mechanical denial.',
    importance:'The contemporary touchstone for bail orders across all courts.' },

  { id:'lalita-kumari', name:'Lalita Kumari v. Govt. of UP', year:2014, citation:'(2014) 2 SCC 1', court:'Supreme Court of India (5-judge bench)', area:'Criminal / FIR',
    facts:'Father of an abducted child alleged that police refused to register FIR.',
    issue:'Whether registration of FIR is mandatory for cognisable offences under §154 CrPC.',
    holding:'Registration of FIR is mandatory whenever information discloses commission of a cognisable offence. Preliminary inquiry only allowed in exceptional categories (matrimonial, commercial, medical negligence, corruption, abnormal delay).',
    ratio:'§154 CrPC uses the word "shall" — there is no discretion. Police may conduct preliminary inquiry only in narrow listed categories and must complete it within 7–14 days.',
    importance:'Citizens can compel FIR registration. Refusal is challengeable under §156(3) and Article 226.' },

  { id:'vishaka', name:'Vishaka v. State of Rajasthan', year:1997, citation:'AIR 1997 SC 3011; (1997) 6 SCC 241', court:'Supreme Court of India', area:'Criminal / Workplace',
    facts:'PIL after the gang rape of a social worker who was trying to prevent child marriage in rural Rajasthan.',
    issue:'In the absence of legislation, what guidelines should bind employers to prevent sexual harassment of women at workplace.',
    holding:'Issued the "Vishaka Guidelines": mandatory employer duties to prevent sexual harassment, complaints committee, definition of sexual harassment.',
    ratio:'Right to work with dignity is a fundamental right under Articles 14, 19(1)(g) and 21. International conventions (CEDAW) inform domestic interpretation.',
    importance:'Directly led to the POSH Act, 2013.' },

  { id:'mukesh-singh', name:'Mukesh & Anr. v. State (NCT of Delhi)', year:2017, citation:'(2017) 6 SCC 1', court:'Supreme Court of India', area:'Criminal',
    facts:'Appeal in the Nirbhaya gang-rape case (2012 Delhi).',
    issue:'Whether death sentence is justified.',
    holding:'Death sentence confirmed for the four adult convicts. The crime was held to be "rarest of rare".',
    ratio:'Brutality, callousness and depravity of the act, and the public outcry, satisfied "rarest of rare" doctrine.',
    importance:'Drove the Criminal Law (Amendment) Act, 2013 with new offences and stricter penalties.' },

  { id:'bachan-singh', name:'Bachan Singh v. State of Punjab', year:1980, citation:'AIR 1980 SC 898', court:'Supreme Court of India (5-judge bench)', area:'Criminal / Death penalty',
    facts:'Constitutionality of death penalty under §302 IPC and §354(3) CrPC challenged.',
    issue:'Whether death penalty for murder is constitutional and on what principles it should be awarded.',
    holding:'Death penalty constitutionally valid; can be awarded only in "rarest of rare" cases when alternative of life imprisonment is "unquestionably foreclosed".',
    ratio:'Court must record special reasons. Aggravating and mitigating circumstances must be balanced.',
    importance:'Foundational test for capital punishment in India. Used in every death-sentence appeal since.' },

  // ── Personal liberty ────────────────────────────────────────
  { id:'adm-jabalpur', name:'ADM Jabalpur v. Shivkant Shukla (Habeas Corpus case)', year:1976, citation:'AIR 1976 SC 1207', court:'Supreme Court of India (5-judge bench)', area:'Constitutional / Emergency',
    facts:'During the Emergency (1975–77), High Courts entertained habeas corpus petitions challenging detentions under MISA. Government argued that Article 21 was suspended.',
    issue:'Whether habeas corpus is maintainable when fundamental rights are suspended during Emergency.',
    holding:'By 4:1 majority, held that habeas corpus is NOT maintainable. (Justice H.R. Khanna\'s sole dissent — that Article 21 cannot be suspended — is celebrated as the conscience of the court.)',
    ratio:'Now repudiated. The Puttaswamy court (2017) explicitly overruled ADM Jabalpur on this point.',
    importance:'Cautionary tale of judicial deference. Fed the 44th Amendment (1978) which made Articles 20 and 21 non-suspendable even during Emergency.' },

  { id:'hussainara', name:'Hussainara Khatoon v. State of Bihar', year:1979, citation:'AIR 1979 SC 1369', court:'Supreme Court of India', area:'Criminal / Speedy trial',
    facts:'PIL on behalf of undertrial prisoners languishing in Bihar jails for years.',
    issue:'Whether right to speedy trial is part of Article 21.',
    holding:'Held that speedy trial is a fundamental right under Article 21. Undertrials cannot be detained for periods exceeding the maximum punishment.',
    ratio:'No procedure that does not ensure a reasonably quick trial can be considered "fair, just and reasonable".',
    importance:'First case to recognise speedy trial as a fundamental right. Foundation of subsequent §436A CrPC and BNSS provisions.' },

  // ── Environment ─────────────────────────────────────────────
  { id:'mc-mehta', name:'M.C. Mehta v. Union of India (Oleum Gas Leak)', year:1987, citation:'AIR 1987 SC 1086; (1987) 1 SCC 395', court:'Supreme Court of India (5-judge bench)', area:'Tort / Environment',
    facts:'Oleum gas leaked from Shriram Foods and Fertilizers in Delhi, killing one and affecting many.',
    issue:'What is the standard of liability for hazardous industries?',
    holding:'Established the doctrine of ABSOLUTE LIABILITY: hazardous industries are absolutely (not merely strictly) liable for any harm caused, with no exceptions.',
    ratio:'Indian conditions demand a stricter rule than Rylands v. Fletcher. Public interest in safety overrides commercial enterprise.',
    importance:'Foundation of Indian environmental tort law. Reflected in the Public Liability Insurance Act, 1991.' },

  { id:'subhash-kumar', name:'Subhash Kumar v. State of Bihar', year:1991, citation:'AIR 1991 SC 420', court:'Supreme Court of India', area:'Environment',
    facts:'PIL alleging that effluents from Tata Iron and Steel Co. were polluting the Bokaro river.',
    issue:'Whether right to clean water and pollution-free environment is part of Article 21.',
    holding:'Right to enjoyment of pollution-free water and air is part of the right to life under Article 21.',
    ratio:'Locus standi for environmental PILs is liberalised — any concerned citizen may approach the court.',
    importance:'Constitutionalised environmental protection.' },

  // ── Family / Personal ──────────────────────────────────────
  { id:'shah-bano', name:'Mohd. Ahmed Khan v. Shah Bano Begum', year:1985, citation:'AIR 1985 SC 945', court:'Supreme Court of India (5-judge bench)', area:'Family / Maintenance',
    facts:'Divorced Muslim woman claimed maintenance under §125 CrPC after her husband stopped payments.',
    issue:'Whether §125 CrPC applies to Muslim women after divorce.',
    holding:'Held that §125 CrPC applies regardless of religion. Husband must maintain a divorced wife who cannot maintain herself.',
    ratio:'Section 125 is secular and applies to all citizens.',
    importance:'Sparked Parliament to pass the Muslim Women (Protection of Rights on Divorce) Act, 1986. Reaffirmed in Daniel Latifi (2001) which read down the 1986 Act.' },

  { id:'arnab-goswami', name:'Arnab Goswami v. State of Maharashtra', year:2020, citation:'(2021) 2 SCC 427', court:'Supreme Court of India', area:'Criminal / Liberty',
    facts:'Journalist arrested in connection with a 2018 abetment-of-suicide case. Bombay HC denied bail.',
    issue:'Whether HC erred in denying interim bail in light of liberty considerations.',
    holding:'Granted interim bail. Reaffirmed that personal liberty is non-negotiable and HCs and SC must intervene if liberty is compromised.',
    ratio:'Courts must be vigilant in safeguarding personal liberty under Article 21. "Bail is the rule, jail is the exception" applies.',
    importance:'Strong reaffirmation of liberty jurisprudence in modern times.' },

  // ── Fundamental rights / Liberty / Free speech ───────────────
  { id:'shreya-singhal', name:'Shreya Singhal v. Union of India', year:2015, citation:'(2015) 5 SCC 1', court:'Supreme Court of India', area:'Constitutional / Free speech',
    facts:'Section 66A of the IT Act, 2000 criminalised sending "grossly offensive" messages by computer. Two Mumbai college students were arrested for a Facebook post about a Shiv Sena leader\'s funeral.',
    issue:'Whether §66A IT Act is unconstitutional.',
    holding:'§66A struck down as unconstitutional for being vague, overbroad and chilling free speech.',
    ratio:'Article 19(1)(a) — restrictions must satisfy 19(2) and not be vague. Test of "clear and present danger" applied.',
    importance:'Crucial protection for online speech in India.' },

  { id:'romesh-thappar', name:'Romesh Thappar v. State of Madras', year:1950, citation:'AIR 1950 SC 124', court:'Supreme Court of India', area:'Constitutional / Free speech',
    facts:'Banned weekly journal "Cross Roads" challenged ban under Madras Maintenance of Public Order Act.',
    issue:'Whether the ban violates Article 19(1)(a).',
    holding:'Ban struck down. Restrictions on free speech must fall strictly within Article 19(2).',
    ratio:'"Public order" is narrower than "security of the state" and similar wide grounds. Article 19(1)(a) is broad and restrictions must be carefully narrow.',
    importance:'First major free-speech case in independent India. Led to the First Constitutional Amendment (1951) modifying 19(2).' },

  // ── PIL / Access to justice ─────────────────────────────────
  { id:'bandhua-mukti', name:'Bandhua Mukti Morcha v. Union of India', year:1984, citation:'AIR 1984 SC 802', court:'Supreme Court of India', area:'Public Interest Litigation',
    facts:'PIL by NGO concerning bonded labour in stone quarries near Delhi.',
    issue:'Procedural standards for PIL and right against bonded labour.',
    holding:'Court relaxed locus standi rules. Bonded labour violates Article 23 (forced labour). Issued comprehensive directions for rehabilitation.',
    ratio:'In PILs, court can act on letters and reports by social activists. Strict procedural rules don\'t apply where fundamental rights of marginalised are at stake.',
    importance:'Cemented the PIL jurisdiction.' },

  { id:'sp-gupta', name:'S.P. Gupta v. Union of India (Judges Transfer)', year:1981, citation:'AIR 1982 SC 149', court:'Supreme Court of India (7-judge bench)', area:'Constitutional / Judicial appointments',
    facts:'PIL concerning transfer and appointment of judges.',
    issue:'Locus standi in PIL and meaning of "consultation" with CJI in judicial appointments.',
    holding:'Liberalised locus standi for PIL. Held "consultation" with CJI does not mean concurrence.',
    ratio:'Any public-spirited citizen with bona fide interest can move PIL.',
    importance:'Foundation of modern PIL. Later overruled on "consultation" in the Second and Third Judges cases — Collegium system.' },

  // ── Modern landmark cases ───────────────────────────────────
  { id:'electoral-bonds', name:'Association for Democratic Reforms v. Union of India (Electoral Bonds)', year:2024, citation:'(2024) 5 SCC 1', court:'Supreme Court of India (5-judge bench)', area:'Constitutional / Election',
    facts:'PIL challenging the Electoral Bonds Scheme, 2018 which allowed anonymous corporate political donations.',
    issue:'Whether anonymous political funding through electoral bonds is constitutional.',
    holding:'Scheme struck down. Anonymous political funding violates voters\' right to information under Article 19(1)(a).',
    ratio:'Voters\' right to information about funding sources of political parties is fundamental. Restrictions on political contributions must be reasonable and proportionate.',
    importance:'Major transparency victory. Forced the SBI to disclose all donor and recipient details.' },

  { id:'aadhaar', name:'K.S. Puttaswamy v. Union of India (Aadhaar)', year:2018, citation:'(2019) 1 SCC 1', court:'Supreme Court of India (5-judge bench)', area:'Constitutional / Privacy',
    facts:'Final challenge to mandatory Aadhaar linking with bank accounts, PAN, mobile, school admission, etc.',
    issue:'Whether the Aadhaar Act is constitutional and whether mandatory linking violates privacy.',
    holding:'Aadhaar Act largely upheld. Mandatory linking with bank accounts and mobile numbers struck down. Section 57 (private use) struck down. Section 7 (welfare benefits) upheld with conditions.',
    ratio:'Proportionality test applied. Aadhaar is justified for welfare benefits but cannot be made mandatory in private transactions.',
    importance:'Set the proportionality standard for state surveillance and digital identity.' },

  { id:'sabarimala', name:'Indian Young Lawyers Assoc. v. State of Kerala (Sabarimala)', year:2018, citation:'(2019) 11 SCC 1', court:'Supreme Court of India (5-judge bench)', area:'Constitutional / Religion',
    facts:'Centuries-old practice barred women aged 10–50 from entering the Sabarimala Ayyappa Temple.',
    issue:'Whether such exclusion is constitutional under Articles 14, 15, 17, 21 and 25.',
    holding:'4:1 majority held the exclusion unconstitutional. Practice not "essential" to Hindu religion. Rule 3(b) of Kerala Hindu Places of Public Worship (Authorisation of Entry) Rules, 1965 struck down.',
    ratio:'Constitutional morality prevails over religious customs that violate fundamental rights.',
    importance:'Reinforced gender equality and constitutional morality. (Review pending in larger bench.)' },
]

export const LEGAL_PRINCIPLES = [
  // ── Constitutional doctrines ────────────────────────────────
  { id:'basic-structure', name:'Basic Structure Doctrine', area:'Constitutional', originCase:'Kesavananda Bharati (1973)',
    definition:'Parliament has wide power to amend the Constitution under Article 368, but cannot alter or destroy its "basic structure" — that is, certain fundamental and unalterable features.',
    elements:[
      'Supremacy of the Constitution',
      'Republican and democratic form of government',
      'Secular character',
      'Separation of powers',
      'Federal character',
      'Unity and integrity of the nation',
      'Independence of judiciary',
      'Rule of law',
    ],
    application:'Every constitutional amendment is tested against this doctrine. Used to strike down or read down Amendments (e.g. parts of the 42nd, 99th NJAC).',
    pitfalls:'No exhaustive list — basic structure is identified case by case by the Supreme Court.' },

  { id:'separation-powers', name:'Separation of Powers', area:'Constitutional', originCase:'Indira Nehru Gandhi v. Raj Narain (1975); part of basic structure',
    definition:'The legislative, executive and judicial branches must operate within their respective spheres without one branch usurping the functions of another.',
    elements:[
      'Legislative makes the law',
      'Executive enforces the law',
      'Judicial interprets the law',
    ],
    application:'Used to strike down judicial appointments by the executive (NJAC), curb executive overreach (e.g. fixed-term ordinances), and ensure judicial review of legislative action.',
    pitfalls:'In India the separation is "functional" rather than "rigid"; some overlap is constitutional (e.g. delegated legislation, judicial activism).' },

  { id:'rule-of-law', name:'Rule of Law', area:'Constitutional', originCase:'A.V. Dicey\'s formulation; Indian application: Ram Jawaya v. State of Punjab (1955)',
    definition:'Government must function under and according to law; no person is above the law; equality before the law for all.',
    elements:[
      'Supremacy of law over arbitrary power',
      'Equality before the law',
      'Legal protection of fundamental rights',
    ],
    application:'Foundation for Articles 14, 19, 21. Restrains arbitrariness in executive action — e.g. Maneka Gandhi (1978).',
    pitfalls:'Distinguished from "rule by law" — the form must coexist with substantive justice.' },

  { id:'natural-justice', name:'Principles of Natural Justice', area:'Administrative law', originCase:'Cooper v. Wandsworth (1863); A.K. Kraipak v. UoI (1969)',
    definition:'Two pillars: (1) Audi Alteram Partem — both sides must be heard; (2) Nemo Judex In Causa Sua — no one can be a judge in their own cause.',
    elements:[
      'Right to notice of charges',
      'Right to a fair hearing',
      'Right to cross-examine adverse witnesses (where applicable)',
      'Reasoned order',
      'Absence of bias (actual, apparent, or institutional)',
    ],
    application:'Applies to all quasi-judicial and many administrative actions. Violation is a ground for judicial review and writ of certiorari/mandamus.',
    pitfalls:'Doctrine of "useless formality" — natural justice may be excused where it would have made no difference.' },

  { id:'doctrine-pleasure', name:'Doctrine of Pleasure', area:'Constitutional / Service', originCase:'B.P. Singhal v. UoI (2010)',
    definition:'Government servants hold office during the pleasure of the President / Governor (Articles 310–311), but this pleasure is not absolute and is regulated by the Constitution and service rules.',
    elements:[
      'No removal without inquiry where Article 311(2) protections apply',
      'Subject to natural justice',
      'Cannot be exercised arbitrarily or mala fide',
    ],
    application:'Applies to civil servants. Articles 311(2) safeguards (notice, inquiry, opportunity to defend) cannot be bypassed by invoking pleasure.',
    pitfalls:'Limited to specific officeholders; Constitutional positions like Governors covered separately.' },

  { id:'res-judicata', name:'Res Judicata', area:'Civil procedure', originCase:'§11 CPC; Daryao v. State of UP (1962)',
    definition:'A matter that has been judicially decided cannot be re-agitated by the same parties. The cause of action is "exhausted".',
    elements:[
      'Same matter directly and substantially in issue',
      'Same parties or persons litigating under the same title',
      'Earlier court of competent jurisdiction',
      'Earlier matter decided on merits',
      'Issue heard and finally decided',
    ],
    application:'Bars repetitive litigation. Applies to writs (Daryao) but not to PIL on questions affecting public interest.',
    pitfalls:'Distinguished from issue estoppel and constructive res judicata under Explanation IV.' },

  { id:'audi-alteram-partem', name:'Audi Alteram Partem', area:'Administrative law', originCase:'Latin maxim — applied in Maneka Gandhi (1978)',
    definition:'"Hear the other side". No one should be condemned unheard.',
    elements:[
      'Notice of the charge / proposed action',
      'Disclosure of materials being relied upon',
      'Opportunity to make written / oral representations',
      'Reasoned decision',
    ],
    application:'Mandatory for all quasi-judicial decisions and most administrative decisions affecting rights or legitimate expectations.',
    pitfalls:'Excused in cases of urgent public interest, statutory exclusion, or where compliance would be a useless formality.' },

  { id:'doctrine-severability', name:'Doctrine of Severability', area:'Constitutional', originCase:'R.M.D.C. v. UoI (1957)',
    definition:'When part of a statute is unconstitutional, only that part is struck down if it can be severed from the rest, leaving the valid portion intact.',
    elements:[
      'Invalid portion is separable in form',
      'Invalid portion is not so intertwined that severance defeats purpose',
      'Surviving statute remains workable',
    ],
    application:'Used routinely to save statutes — e.g. only §66A of IT Act struck down (Shreya Singhal), rest of the Act preserved.',
    pitfalls:'If invalid portion is the heart of the statute, the entire statute may fall.' },

  { id:'doctrine-pith-substance', name:'Doctrine of Pith and Substance', area:'Constitutional / Federalism', originCase:'State of Bombay v. F.N. Balsara (1951)',
    definition:'When determining whether a law is within the legislative competence of the enacting legislature, the court looks at the "true nature and character" — the pith and substance — of the law, not its incidental encroachment.',
    application:'A central law on commerce that incidentally touches a state subject does not become invalid. Used to uphold laws that span List I and List II.',
    pitfalls:'Distinguished from "colourable legislation" where the legislature wears a disguise to enact what it cannot directly.' },

  { id:'doctrine-eclipse', name:'Doctrine of Eclipse', area:'Constitutional', originCase:'Bhikaji Narain Dhakras v. State of MP (1955)',
    definition:'A pre-Constitutional law inconsistent with fundamental rights is not void ab initio; it is "eclipsed" and becomes enforceable again if the inconsistency is removed.',
    application:'Applies only to pre-Constitutional laws (i.e., before 26 January 1950) under Article 13(1). Post-Constitutional laws inconsistent with fundamental rights are void from the start (Article 13(2)).',
    pitfalls:'Cannot be invoked for post-Constitutional laws — those are void from the start.' },

  { id:'doctrine-colourable', name:'Doctrine of Colourable Legislation', area:'Constitutional / Federalism', originCase:'K.C.G. Narayan Deo v. State of Orissa (1953)',
    definition:'"What cannot be done directly cannot be done indirectly." A legislature cannot enact a law on a subject outside its competence by disguising it as a permissible subject.',
    application:'Used to strike down laws that fraudulently encroach on the other legislature\'s domain.',
    pitfalls:'Bona fide motive of the legislature is irrelevant; only the substance of the law matters.' },

  { id:'doctrine-prospective', name:'Doctrine of Prospective Overruling', area:'Constitutional', originCase:'Golak Nath v. State of Punjab (1967)',
    definition:'When a court overrules an earlier decision, it can declare that the new ruling will apply only prospectively to avoid disturbing settled rights.',
    application:'First applied to save constitutional amendments before Golak Nath; used selectively in tax and service-law cases.',
    pitfalls:'Use sparingly — courts must balance retrospective justice against settled expectations.' },

  // ── Common-law doctrines ────────────────────────────────────
  { id:'stare-decisis', name:'Stare Decisis', area:'Common law', originCase:'Article 141 (binding precedent of SC); Bengal Immunity v. State of Bihar (1955)',
    definition:'Latin: "to stand by things decided". Courts follow established precedents when deciding similar cases.',
    elements:[
      'Vertical: lower courts bound by higher courts',
      'Horizontal: courts of coordinate strength generally follow each other unless distinguished or overruled by a larger bench',
    ],
    application:'Article 141 makes SC decisions binding on all courts. HC decisions bind lower courts in that state.',
    pitfalls:'Per incuriam decisions and decisions distinguishable on facts are not binding.' },

  { id:'doctrine-frustration', name:'Doctrine of Frustration', area:'Contract', originCase:'§56 ICA; Satyabrata Ghose v. Mugneeram Bangur (1954)',
    definition:'A contract becomes impossible or unlawful to perform after it was made, due to events beyond the control of the parties — frustration discharges the contract.',
    elements:[
      'Subsequent event after contract',
      'Event makes performance impossible or radically different',
      'Event was not foreseen / parties had not allocated risk',
      'Event is not the fault of either party',
    ],
    application:'Used in war, natural disasters, change of law, death of party. COVID-19 raised many frustration questions.',
    pitfalls:'Mere commercial difficulty / unprofitability does not amount to frustration.' },

  { id:'lifting-veil', name:'Lifting the Corporate Veil', area:'Corporate', originCase:'Salomon v. Salomon (1897); Indian application: LIC v. Escorts (1986)',
    definition:'Although a company is a separate legal person, the court may "lift the veil" to look at the individuals behind it where the corporate form is used to commit fraud or evade obligations.',
    elements:[
      'Fraud or improper conduct',
      'Sham / facade companies',
      'Tax evasion or avoidance of statutory liability',
      'Single economic enterprise / agency',
    ],
    application:'Courts and tax authorities frequently lift the veil to attribute liability to directors / shareholders.',
    pitfalls:'Salomon principle remains the default; veil-piercing is exceptional.' },

  { id:'doctrine-ratio', name:'Ratio Decidendi vs. Obiter Dicta', area:'Common law', originCase:'Conceptual',
    definition:'Ratio decidendi = the legal reasoning that is essential to the decision and binding as precedent. Obiter dicta = passing observations not necessary to the decision; persuasive only.',
    application:'Article 141 binds the ratio of SC decisions, not obiter. Practitioners must distinguish carefully.',
    pitfalls:'Identifying ratio is contested — ratios can be narrowed or widened by later courts.' },

  { id:'estoppel', name:'Estoppel', area:'Evidence / Equity', originCase:'§115 IEA; Pickard v. Sears (1837)',
    definition:'A person who has made a representation by word or conduct, on which another has relied to their detriment, cannot resile from that representation.',
    elements:[
      'Representation of fact (or, in promissory estoppel, of intention)',
      'Reliance by the other party',
      'Detriment caused by the reliance',
    ],
    application:'Promissory estoppel against the Government is well-established in India (Motilal Padampat Sugar Mills, 1979).',
    pitfalls:'No estoppel against statute or constitutional law.' },

  { id:'doctrine-locus', name:'Locus Standi (with PIL exception)', area:'Procedural', originCase:'Traditional rule; relaxed in Mumbai Kamgar Sabha (1976) and S.P. Gupta (1981)',
    definition:'Right to move a court — traditionally only the person whose right is infringed can sue. In PIL, any public-spirited citizen with bona fide interest can move the court for fundamental rights of those who cannot themselves approach.',
    application:'Crucial gateway for PIL jurisdiction in India.',
    pitfalls:'Courts now require "credentials" of PIL petitioner to filter publicity / private-interest litigation.' },

  // ── Criminal law doctrines ──────────────────────────────────
  { id:'mens-rea', name:'Mens Rea (Actus Non Facit Reum Nisi Mens Sit Rea)', area:'Criminal', originCase:'Brend v. Wood (1946); R. Balakrishna Pillai v. State (2003)',
    definition:'"The act does not make a person guilty unless the mind is also guilty." Most crimes require both an act (actus reus) and a guilty mind (mens rea).',
    application:'Indian Penal Code uses words like "intentionally", "knowingly", "voluntarily", "fraudulently" to indicate mens rea.',
    pitfalls:'Strict-liability and absolute-liability statutes (e.g. NDPS, prohibition laws) do not require mens rea.' },

  { id:'rarest-of-rare', name:'Rarest of Rare Doctrine', area:'Criminal / Sentencing', originCase:'Bachan Singh (1980); Macchi Singh (1983)',
    definition:'Death penalty can be imposed only in the "rarest of rare" cases when alternative of life imprisonment is "unquestionably foreclosed".',
    elements:[
      'Manner of commission of crime — extreme brutality',
      'Motive for the crime — depraved or extraordinary',
      'Anti-social nature of the crime',
      'Magnitude of the crime',
      'Personality of the victim',
    ],
    application:'Mandatory consideration in every capital sentencing decision.',
    pitfalls:'Aggravating + mitigating circumstances must be balanced; courts must record special reasons.' },

  { id:'falsus-in-uno', name:'Falsus in Uno, Falsus in Omnibus', area:'Evidence', originCase:'Indian application rejected — Krishna Mochi v. State of Bihar (2002)',
    definition:'Latin: "false in one, false in all" — a witness who lies on one matter is to be disbelieved entirely.',
    application:'NOT applicable in India. Indian courts evaluate witness testimony piece by piece, accepting the truthful parts and rejecting the false.',
    pitfalls:'A common attorney misconception — Indian courts do not follow this rule.' },

  // ── Property / Tort doctrines ───────────────────────────────
  { id:'rylands-fletcher', name:'Rule in Rylands v. Fletcher', area:'Tort', originCase:'Rylands v. Fletcher (1868) — modified in M.C. Mehta (1987)',
    definition:'A person who brings a non-natural use upon land that may cause harm if it escapes, is strictly liable for the harm caused if it does escape, even without negligence.',
    application:'In India, has been replaced for hazardous industries by the doctrine of ABSOLUTE LIABILITY in M.C. Mehta — no exceptions.',
    pitfalls:'Common law exceptions (Act of God, plaintiff\'s default, statutory authority, third-party act) are abolished in absolute liability.' },

  { id:'doctrine-ulterior', name:'Doctrine of Ultra Vires', area:'Administrative / Corporate', originCase:'Ashbury Carriage Co. (1875); Indian application: Lakhmi Chand v. Reliance Carriages (1962)',
    definition:'An act done beyond the legal power of the actor is void. For companies — beyond memorandum; for statutory bodies — beyond their statutory authority.',
    application:'Companies Act 2013 has substantially relaxed the corporate ultra vires doctrine but it survives in administrative law.',
    pitfalls:'Doctrine of substantial compliance can save genuine but technically ultra vires actions.' },

  // ── Equity ──────────────────────────────────────────────────
  { id:'clean-hands', name:'He Who Comes to Equity Must Come with Clean Hands', area:'Equity', originCase:'Common law maxim',
    definition:'A claimant seeking equitable relief (injunction, specific performance, etc.) must himself have acted equitably and lawfully in the matter.',
    application:'Used to deny relief where the petitioner has been guilty of fraud, suppression of material facts, or other inequitable conduct.',
    pitfalls:'Goes only to the equitable remedy — does not erase the underlying legal right.' },
]

// Helpers
export function findJudgmentById(id) { return LANDMARK_JUDGMENTS.find(j => j.id === id) || null }
export function findPrincipleById(id) { return LEGAL_PRINCIPLES.find(p => p.id === id) || null }

export function searchJudgments(query) {
  if (!query) return LANDMARK_JUDGMENTS
  const q = query.toLowerCase()
  return LANDMARK_JUDGMENTS.filter(j =>
    j.name.toLowerCase().includes(q) ||
    j.area.toLowerCase().includes(q) ||
    j.ratio.toLowerCase().includes(q) ||
    j.holding.toLowerCase().includes(q) ||
    j.facts.toLowerCase().includes(q)
  )
}

export function searchPrinciples(query) {
  if (!query) return LEGAL_PRINCIPLES
  const q = query.toLowerCase()
  return LEGAL_PRINCIPLES.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.area.toLowerCase().includes(q) ||
    p.definition.toLowerCase().includes(q) ||
    (p.application && p.application.toLowerCase().includes(q))
  )
}
