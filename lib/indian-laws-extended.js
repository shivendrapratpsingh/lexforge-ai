// ─────────────────────────────────────────────────────────────────
//  LexForge AI — indian-laws-extended.js
//
//  BREADTH catalog: additional Indian central statutes on top of the
//  core set in indian-laws.js, so that whatever area a lawyer or law
//  student is drafting in, the correct Act NAME and YEAR is always
//  available to the model and the chatbot.
//
//  ACCURACY POLICY (important — this is a legal product):
//    • Every `fullName` + `year` here is a real, verifiable central Act.
//    • `keySections` are listed ONLY where the provision is well
//      established. Where a section number is not certain it is simply
//      omitted — the model is instructed elsewhere (CITATION_MANDATE)
//      to write "[SECTION TO BE VERIFIED — <law name>]" rather than
//      invent one. A wrong section in a filing is worse than none.
//    • Repealed/replaced statutes are retained (and marked) because
//      pending matters are still governed by them.
//
//  Consumed by indian-laws.js, which concatenates this into the single
//  INDIAN_LAWS array used by findApplicableLaws() / the /study section.
// ─────────────────────────────────────────────────────────────────

export const INDIAN_LAWS_EXTENDED = [
  // ── Criminal law, policing & prisons ────────────────────────
  { id:'ArmsAct', shortName:'Arms Act', fullName:'The Arms Act, 1959', year:1959, category:'Criminal', tags:['arms','firearm','licence','weapon','illegal weapon'], keySections:[
    {n:'Section 3',  desc:'Licence required for acquisition and possession of firearms and ammunition'},
    {n:'Section 25', desc:'Punishment for possessing/manufacturing arms in contravention of the Act'},
  ] },
  { id:'ExpSubs', shortName:'Explosive Substances Act', fullName:'The Explosive Substances Act, 1908', year:1908, category:'Criminal', tags:['explosive','bomb','blast'], keySections:[
    {n:'Section 3', desc:'Punishment for causing explosion likely to endanger life or property'},
    {n:'Section 4', desc:'Punishment for attempt to cause explosion or making/keeping explosives'},
  ] },
  { id:'ExplAct', shortName:'Explosives Act', fullName:'The Explosives Act, 1884', year:1884, category:'Criminal', tags:['explosive','licence','manufacture'], keySections:[] },
  { id:'ProbOff', shortName:'Probation of Offenders Act', fullName:'The Probation of Offenders Act, 1958', year:1958, category:'Criminal', tags:['probation','first offender','release on admonition','good conduct'], keySections:[
    {n:'Section 3', desc:'Power of court to release certain offenders after admonition'},
    {n:'Section 4', desc:'Power of court to release certain offenders on probation of good conduct'},
    {n:'Section 6', desc:'Restriction on imprisonment of offenders under twenty-one years of age'},
  ] },
  { id:'PrisonsAct', shortName:'Prisons Act', fullName:'The Prisons Act, 1894', year:1894, category:'Criminal', tags:['prison','jail','prisoner','custody'], keySections:[] },
  { id:'CrPIdent', shortName:'Criminal Procedure (Identification) Act', fullName:'The Criminal Procedure (Identification) Act, 2022', year:2022, category:'Criminal (procedural)', tags:['measurements','biometric','identification','police custody'], keySections:[
    {n:'Section 3', desc:'Taking of measurements of convicts and other persons'},
    {n:'Section 4', desc:'NCRB to collect, store and preserve records of measurements'},
  ] },
  { id:'ITPA', shortName:'Immoral Traffic (Prevention) Act', fullName:'The Immoral Traffic (Prevention) Act, 1956', year:1956, category:'Criminal', tags:['trafficking','prostitution','brothel','exploitation'], keySections:[] },
  { id:'IndecentRep', shortName:'Indecent Representation of Women Act', fullName:'The Indecent Representation of Women (Prohibition) Act, 1986', year:1986, category:'Criminal', tags:['indecent','women','advertisement','obscenity'], keySections:[] },
  { id:'DowryAct', shortName:'Dowry Prohibition Act', fullName:'The Dowry Prohibition Act, 1961', year:1961, category:'Criminal/Family', tags:['dowry','demand','marriage','498a','dowry death'], keySections:[
    {n:'Section 3', desc:'Penalty for giving or taking dowry'},
    {n:'Section 4', desc:'Penalty for demanding dowry'},
  ] },
  { id:'OSA', shortName:'Official Secrets Act', fullName:'The Official Secrets Act, 1923', year:1923, category:'Criminal', tags:['official secrets','espionage','spying','national security'], keySections:[] },
  { id:'AFSPA', shortName:'AFSPA', fullName:'The Armed Forces (Special Powers) Act, 1958', year:1958, category:'Criminal', tags:['armed forces','disturbed area','special powers'], keySections:[] },
  { id:'DSPE', shortName:'DSPE Act', fullName:'The Delhi Special Police Establishment Act, 1946', year:1946, category:'Criminal', tags:['cbi','investigation','central agency','consent'], keySections:[
    {n:'Section 6', desc:'Consent of the State Government required for CBI to exercise powers in that State'},
  ] },
  { id:'CommInq', shortName:'Commissions of Inquiry Act', fullName:'The Commissions of Inquiry Act, 1952', year:1952, category:'Public law', tags:['commission of inquiry','public importance','fact finding'], keySections:[] },

  // ── Civil procedure, courts & the profession ────────────────
  { id:'AdvAct', shortName:'Advocates Act', fullName:'The Advocates Act, 1961', year:1961, category:'Legal profession', tags:['advocate','bar council','enrolment','professional misconduct','vakalatnama','right to practise'], keySections:[
    {n:'Section 24', desc:'Persons who may be admitted as advocates on a State roll'},
    {n:'Section 30', desc:'Right of advocates to practise'},
    {n:'Section 35', desc:'Punishment of advocates for professional or other misconduct'},
  ] },
  { id:'ContemptAct', shortName:'Contempt of Courts Act', fullName:'The Contempt of Courts Act, 1971', year:1971, category:'Civil (procedural)', tags:['contempt','civil contempt','criminal contempt','disobedience of order'], keySections:[
    {n:'Section 2(b)', desc:'"Civil contempt" — wilful disobedience of a judgment, decree, direction, order or undertaking'},
    {n:'Section 2(c)', desc:'"Criminal contempt" — scandalising the court or interfering with administration of justice'},
    {n:'Section 12', desc:'Punishment for contempt of court'},
  ] },
  { id:'CourtFees', shortName:'Court Fees Act', fullName:'The Court Fees Act, 1870', year:1870, category:'Civil (procedural)', tags:['court fee','valuation','stamp','plaint'], keySections:[] },
  { id:'SuitsVal', shortName:'Suits Valuation Act', fullName:'The Suits Valuation Act, 1887', year:1887, category:'Civil (procedural)', tags:['valuation','pecuniary jurisdiction','suit value'], keySections:[] },
  { id:'CommCourts', shortName:'Commercial Courts Act', fullName:'The Commercial Courts Act, 2015', year:2015, category:'Civil (procedural)', tags:['commercial dispute','pre-institution mediation','12a','specified value','commercial court'], keySections:[
    {n:'Section 2(1)(c)', desc:'Definition of "commercial dispute"'},
    {n:'Section 12A', desc:'Mandatory pre-institution mediation and settlement, save where urgent interim relief is sought'},
  ] },
  { id:'LSAA', shortName:'Legal Services Authorities Act', fullName:'The Legal Services Authorities Act, 1987', year:1987, category:'Public law', tags:['legal aid','lok adalat','free legal services','nalsa'], keySections:[
    {n:'Section 12', desc:'Criteria for giving legal services — entitled persons'},
    {n:'Section 19', desc:'Organisation of Lok Adalats'},
    {n:'Section 21', desc:'Award of Lok Adalat deemed to be a decree of a civil court and final'},
  ] },
  { id:'OathsAct', shortName:'Oaths Act', fullName:'The Oaths Act, 1969', year:1969, category:'Civil (procedural)', tags:['oath','affirmation','affidavit','deponent'], keySections:[] },
  { id:'NotariesAct', shortName:'Notaries Act', fullName:'The Notaries Act, 1952', year:1952, category:'Civil (procedural)', tags:['notary','notarised','attestation'], keySections:[] },
  { id:'GenClauses', shortName:'General Clauses Act', fullName:'The General Clauses Act, 1897', year:1897, category:'Interpretation', tags:['interpretation','definitions','construction of statutes','repeal'], keySections:[
    {n:'Section 6',  desc:'Effect of repeal — saving of rights and liabilities accrued'},
    {n:'Section 27', desc:'Meaning of service by post — presumption of due service'},
  ] },
  { id:'PowerAttorney', shortName:'Powers of Attorney Act', fullName:'The Powers-of-Attorney Act, 1882', year:1882, category:'Civil', tags:['power of attorney','gpa','attorney holder','authority'], keySections:[] },

  // ── Family & personal law ───────────────────────────────────
  { id:'ISA', shortName:'Indian Succession Act', fullName:'The Indian Succession Act, 1925', year:1925, category:'Family', tags:['will','probate','succession certificate','letters of administration','intestate','testamentary'], keySections:[
    {n:'Section 63',  desc:'Execution of unprivileged wills — attestation by two witnesses'},
    {n:'Section 213', desc:'Right as executor or legatee established only on grant of probate/letters of administration'},
    {n:'Section 372', desc:'Application for succession certificate'},
  ] },
  { id:'ShariatAct', shortName:'Shariat Act', fullName:'The Muslim Personal Law (Shariat) Application Act, 1937', year:1937, category:'Family', tags:['muslim personal law','shariat','succession','nikah'], keySections:[] },
  { id:'DMMA', shortName:'Dissolution of Muslim Marriages Act', fullName:'The Dissolution of Muslim Marriages Act, 1939', year:1939, category:'Family', tags:['muslim','divorce','khula','faskh','wife'], keySections:[
    {n:'Section 2', desc:'Grounds for decree for dissolution of marriage by a Muslim woman'},
  ] },
  { id:'MWPRM', shortName:'Muslim Women (Marriage) Act', fullName:'The Muslim Women (Protection of Rights on Marriage) Act, 2019', year:2019, category:'Family', tags:['triple talaq','talaq-e-biddat','muslim women'], keySections:[
    {n:'Section 3', desc:'Declaration of talaq (talaq-e-biddat) to be void and illegal'},
    {n:'Section 4', desc:'Punishment for pronouncing talaq'},
  ] },
  { id:'MWPRD', shortName:'Muslim Women (Divorce) Act', fullName:'The Muslim Women (Protection of Rights on Divorce) Act, 1986', year:1986, category:'Family', tags:['muslim women','divorce','maintenance','iddat','mahr'], keySections:[
    {n:'Section 3', desc:'Mahr and other properties of a divorced Muslim woman to be given at the time of divorce'},
  ] },
  { id:'IndDivorce', shortName:'Indian Divorce Act', fullName:'The Divorce Act, 1869', year:1869, category:'Family', tags:['christian','divorce','nullity','judicial separation'], keySections:[
    {n:'Section 10', desc:'Grounds for dissolution of marriage'},
  ] },
  { id:'ChristMarr', shortName:'Christian Marriage Act', fullName:'The Indian Christian Marriage Act, 1872', year:1872, category:'Family', tags:['christian','marriage','solemnisation','church'], keySections:[] },
  { id:'ParsiMarr', shortName:'Parsi Marriage and Divorce Act', fullName:'The Parsi Marriage and Divorce Act, 1936', year:1936, category:'Family', tags:['parsi','marriage','divorce'], keySections:[] },
  { id:'ForeignMarr', shortName:'Foreign Marriage Act', fullName:'The Foreign Marriage Act, 1969', year:1969, category:'Family', tags:['foreign marriage','nri marriage','solemnisation abroad'], keySections:[] },
  { id:'AnandMarr', shortName:'Anand Marriage Act', fullName:'The Anand Marriage Act, 1909', year:1909, category:'Family', tags:['sikh','anand karaj','marriage registration'], keySections:[] },
  { id:'PCMA', shortName:'Child Marriage Act', fullName:'The Prohibition of Child Marriage Act, 2006', year:2006, category:'Family', tags:['child marriage','minor','voidable marriage','underage'], keySections:[
    {n:'Section 3',  desc:'Child marriage voidable at the option of the contracting party who was a child'},
    {n:'Section 9',  desc:'Punishment for male adult marrying a child'},
    {n:'Section 12', desc:'Marriage of a minor child to be void in certain circumstances'},
  ] },
  { id:'MTPAct', shortName:'MTP Act', fullName:'The Medical Termination of Pregnancy Act, 1971', year:1971, category:'Health', tags:['abortion','termination of pregnancy','mtp','gestation'], keySections:[
    {n:'Section 3', desc:'When pregnancies may be terminated by registered medical practitioners'},
  ] },
  { id:'SurrogacyAct', shortName:'Surrogacy Act', fullName:'The Surrogacy (Regulation) Act, 2021', year:2021, category:'Family', tags:['surrogacy','altruistic surrogacy','intending couple'], keySections:[] },
  { id:'ARTAct', shortName:'ART Act', fullName:'The Assisted Reproductive Technology (Regulation) Act, 2021', year:2021, category:'Family', tags:['art','ivf','fertility clinic','gamete'], keySections:[] },
  { id:'PCPNDT', shortName:'PCPNDT Act', fullName:'The Pre-Conception and Pre-Natal Diagnostic Techniques (Prohibition of Sex Selection) Act, 1994', year:1994, category:'Health', tags:['sex determination','prenatal','foeticide','ultrasound'], keySections:[] },

  // ── Property, land, trusts & societies ──────────────────────
  { id:'EasementsAct', shortName:'Easements Act', fullName:'The Indian Easements Act, 1882', year:1882, category:'Property', tags:['easement','right of way','licence','prescription','servient','dominant'], keySections:[
    {n:'Section 4',  desc:'"Easement" defined'},
    {n:'Section 15', desc:'Acquisition of easement by prescription (twenty years)'},
    {n:'Section 52', desc:'"Licence" defined'},
  ] },
  { id:'PartitionAct', shortName:'Partition Act', fullName:'The Partition Act, 1893', year:1893, category:'Property', tags:['partition','co-owner','sale in lieu of partition','share'], keySections:[
    {n:'Section 2', desc:'Power of court to order sale instead of division in partition suits'},
    {n:'Section 4', desc:'Right of a member of an undivided family to buy out a stranger transferee of a dwelling house'},
  ] },
  { id:'TrustsAct', shortName:'Indian Trusts Act', fullName:'The Indian Trusts Act, 1882', year:1882, category:'Property', tags:['trust','trustee','beneficiary','settlor','breach of trust'], keySections:[
    {n:'Section 3',  desc:'Interpretation — "trust", "author of the trust", "trustee", "beneficiary"'},
    {n:'Section 6',  desc:'Creation of trust — certainty of intention, purpose, beneficiary and property'},
  ] },
  { id:'SocReg', shortName:'Societies Registration Act', fullName:'The Societies Registration Act, 1860', year:1860, category:'Corporate', tags:['society','ngo','memorandum','registration','association'], keySections:[
    {n:'Section 20', desc:'Societies to which the Act applies — charitable, literary, scientific and other purposes'},
  ] },
  { id:'WaqfAct', shortName:'Waqf Act', fullName:'The Waqf Act, 1995', year:1995, category:'Property', tags:['waqf','wakf','mutawalli','waqf board','waqf tribunal'], keySections:[
    {n:'Section 83', desc:'Constitution of Waqf Tribunals and their jurisdiction'},
    {n:'Section 85', desc:'Bar of jurisdiction of civil courts in matters within the Tribunal\'s competence'},
  ] },
  { id:'RERA', shortName:'RERA', fullName:'The Real Estate (Regulation and Development) Act, 2016', year:2016, category:'Property', tags:['rera','builder','flat buyer','possession delay','real estate project','allottee','promoter'], keySections:[
    {n:'Section 3',  desc:'Prior registration of real estate project with the Real Estate Regulatory Authority'},
    {n:'Section 12', desc:'Obligation of promoter regarding veracity of the advertisement or prospectus'},
    {n:'Section 18', desc:'Return of amount and compensation on failure to complete or give possession'},
    {n:'Section 31', desc:'Filing of complaints with the Authority or the adjudicating officer'},
  ] },
  { id:'MahaSlum', shortName:'Requisitioning Act', fullName:'The Requisitioning and Acquisition of Immovable Property Act, 1952', year:1952, category:'Property', tags:['requisition','acquisition','immovable property'], keySections:[] },

  // ── Corporate, commercial & competition ─────────────────────
  { id:'SCRA1956', shortName:'SCRA', fullName:'The Securities Contracts (Regulation) Act, 1956', year:1956, category:'Securities', tags:['securities','stock exchange','listing','contract in securities'], keySections:[] },
  { id:'Depositories', shortName:'Depositories Act', fullName:'The Depositories Act, 1996', year:1996, category:'Securities', tags:['depository','demat','beneficial owner','nsdl','cdsl'], keySections:[] },
  { id:'MSMED', shortName:'MSMED Act', fullName:'The Micro, Small and Medium Enterprises Development Act, 2006', year:2006, category:'Commercial', tags:['msme','delayed payment','facilitation council','small enterprise','interest on delayed payment'], keySections:[
    {n:'Section 15', desc:'Liability of buyer to make payment within the appointed day'},
    {n:'Section 16', desc:'Date from which and rate at which interest is payable on delayed payment'},
    {n:'Section 18', desc:'Reference to the Micro and Small Enterprises Facilitation Council'},
  ] },
  { id:'CarriersAct', shortName:'Carriage by Road Act', fullName:'The Carriage by Road Act, 2007', year:2007, category:'Commercial', tags:['goods carrier','consignment','transporter','common carrier'], keySections:[] },
  { id:'MarineIns', shortName:'Marine Insurance Act', fullName:'The Marine Insurance Act, 1963', year:1963, category:'Insurance', tags:['marine insurance','policy','cargo','maritime'], keySections:[] },
  { id:'InsuranceAct', shortName:'Insurance Act', fullName:'The Insurance Act, 1938', year:1938, category:'Insurance', tags:['insurance','policy','insurer','claim repudiation'], keySections:[
    {n:'Section 45', desc:'Policy not to be called in question on ground of misstatement after three years'},
  ] },
  { id:'IRDAI', shortName:'IRDAI Act', fullName:'The Insurance Regulatory and Development Authority Act, 1999', year:1999, category:'Insurance', tags:['irdai','insurance regulator','ombudsman'], keySections:[] },
  { id:'ChitFunds', shortName:'Chit Funds Act', fullName:'The Chit Funds Act, 1982', year:1982, category:'Banking', tags:['chit fund','foreman','subscriber','chit'], keySections:[] },
  { id:'PrizeChits', shortName:'Prize Chits Act', fullName:'The Prize Chits and Money Circulation Schemes (Banning) Act, 1978', year:1978, category:'Banking', tags:['ponzi','money circulation','prize chit','chain scheme'], keySections:[] },
  { id:'BUDS', shortName:'BUDS Act', fullName:'The Banning of Unregulated Deposit Schemes Act, 2019', year:2019, category:'Banking', tags:['unregulated deposit','ponzi','depositor','chit'], keySections:[] },

  // ── Banking, finance & foreign exchange ─────────────────────
  { id:'RBIAct', shortName:'RBI Act', fullName:'The Reserve Bank of India Act, 1934', year:1934, category:'Banking', tags:['rbi','reserve bank','nbfc','monetary'], keySections:[
    {n:'Section 45-IA', desc:'Requirement of registration and net owned fund for NBFCs'},
  ] },
  { id:'BankReg', shortName:'Banking Regulation Act', fullName:'The Banking Regulation Act, 1949', year:1949, category:'Banking', tags:['bank','banking company','rbi direction','moratorium'], keySections:[] },
  { id:'RDBAct', shortName:'RDB Act', fullName:'The Recovery of Debts and Bankruptcy Act, 1993', year:1993, category:'Banking', tags:['drt','debt recovery','bank recovery','recovery certificate'], keySections:[
    {n:'Section 19', desc:'Application to the Tribunal for recovery of debts due to banks and financial institutions'},
  ] },
  { id:'FEMA', shortName:'FEMA', fullName:'The Foreign Exchange Management Act, 1999', year:1999, category:'Banking', tags:['fema','foreign exchange','remittance','fdi','contravention','compounding'], keySections:[
    {n:'Section 3',  desc:'Dealing in foreign exchange, etc. — prohibition save as permitted'},
    {n:'Section 13', desc:'Penalties for contravention'},
  ] },
  { id:'BlackMoney', shortName:'Black Money Act', fullName:'The Black Money (Undisclosed Foreign Income and Assets) and Imposition of Tax Act, 2015', year:2015, category:'Tax', tags:['black money','undisclosed foreign asset','foreign income'], keySections:[] },

  // ── Tax & indirect tax ──────────────────────────────────────
  { id:'CustomsAct', shortName:'Customs Act', fullName:'The Customs Act, 1962', year:1962, category:'Tax', tags:['customs','import','export','duty','confiscation','smuggling'], keySections:[
    {n:'Section 110', desc:'Seizure of goods, documents and things'},
    {n:'Section 111', desc:'Confiscation of improperly imported goods'},
    {n:'Section 124', desc:'Issue of show cause notice before confiscation of goods'},
  ] },
  { id:'CentralExcise', shortName:'Central Excise Act', fullName:'The Central Excise Act, 1944', year:1944, category:'Tax', tags:['excise','manufacture','cenvat','duty'], keySections:[] },

  // ── Labour, employment & social security ────────────────────
  { id:'FactoriesAct', shortName:'Factories Act', fullName:'The Factories Act, 1948', year:1948, category:'Labour', tags:['factory','worker','safety','working hours','occupier','hazardous process'], keySections:[
    {n:'Section 2(m)', desc:'"Factory" defined — premises with ten/twenty or more workers with or without power'},
    {n:'Section 51',   desc:'Weekly hours — no adult worker to work more than forty-eight hours a week'},
    {n:'Section 59',   desc:'Extra wages for overtime — twice the ordinary rate'},
  ] },
  { id:'TradeUnions', shortName:'Trade Unions Act', fullName:'The Trade Unions Act, 1926', year:1926, category:'Labour', tags:['trade union','registration','union','collective bargaining'], keySections:[] },
  { id:'ContractLabour', shortName:'Contract Labour Act', fullName:'The Contract Labour (Regulation and Abolition) Act, 1970', year:1970, category:'Labour', tags:['contract labour','principal employer','contractor','abolition','sham contract'], keySections:[
    {n:'Section 10', desc:'Prohibition of employment of contract labour by the appropriate Government'},
  ] },
  { id:'EmpComp', shortName:'Employees Compensation Act', fullName:'The Employee\'s Compensation Act, 1923', year:1923, category:'Labour', tags:['workmen compensation','employment injury','accident','disablement','commissioner'], keySections:[
    {n:'Section 3',  desc:'Employer\'s liability for compensation for injury by accident arising out of and in the course of employment'},
    {n:'Section 4',  desc:'Amount of compensation for death and permanent disablement'},
  ] },
  { id:'MaternityBenefit', shortName:'Maternity Benefit Act', fullName:'The Maternity Benefit Act, 1961', year:1961, category:'Labour', tags:['maternity','maternity leave','pregnant woman','creche'], keySections:[
    {n:'Section 5', desc:'Right to payment of maternity benefit — twenty-six weeks for the first two children'},
    {n:'Section 12', desc:'Dismissal during absence on account of pregnancy prohibited'},
  ] },
  { id:'PaymentWages', shortName:'Payment of Wages Act', fullName:'The Payment of Wages Act, 1936', year:1936, category:'Labour', tags:['wages','deduction','delay in wages','wage period'], keySections:[] },
  { id:'EqualRemun', shortName:'Equal Remuneration Act', fullName:'The Equal Remuneration Act, 1976', year:1976, category:'Labour', tags:['equal pay','gender','discrimination','same work'], keySections:[] },
  { id:'StandingOrders', shortName:'Standing Orders Act', fullName:'The Industrial Employment (Standing Orders) Act, 1946', year:1946, category:'Labour', tags:['standing orders','misconduct','domestic enquiry','certified standing orders','disciplinary'], keySections:[] },
  { id:'BondedLabour', shortName:'Bonded Labour Act', fullName:'The Bonded Labour System (Abolition) Act, 1976', year:1976, category:'Labour', tags:['bonded labour','forced labour','article 23','rehabilitation'], keySections:[] },
  { id:'ChildLabour', shortName:'Child Labour Act', fullName:'The Child and Adolescent Labour (Prohibition and Regulation) Act, 1986', year:1986, category:'Labour', tags:['child labour','adolescent','hazardous occupation'], keySections:[] },
  { id:'InterState', shortName:'Inter-State Migrant Workmen Act', fullName:'The Inter-State Migrant Workmen (Regulation of Employment and Conditions of Service) Act, 1979', year:1979, category:'Labour', tags:['migrant workmen','displacement allowance','contractor'], keySections:[] },
  { id:'BOCW', shortName:'BOCW Act', fullName:'The Building and Other Construction Workers (Regulation of Employment and Conditions of Service) Act, 1996', year:1996, category:'Labour', tags:['construction worker','cess','welfare board','building worker'], keySections:[] },
  { id:'UnorgWorkers', shortName:'Unorganised Workers Act', fullName:'The Unorganised Workers\' Social Security Act, 2008', year:2008, category:'Labour', tags:['unorganised worker','social security','welfare scheme'], keySections:[] },
  { id:'StreetVendors', shortName:'Street Vendors Act', fullName:'The Street Vendors (Protection of Livelihood and Regulation of Street Vending) Act, 2014', year:2014, category:'Labour', tags:['street vendor','hawker','eviction','town vending committee'], keySections:[] },
  { id:'ApprenticesAct', shortName:'Apprentices Act', fullName:'The Apprentices Act, 1961', year:1961, category:'Labour', tags:['apprentice','training','stipend'], keySections:[] },
  { id:'MinesAct', shortName:'Mines Act', fullName:'The Mines Act, 1952', year:1952, category:'Labour', tags:['mine','miner','safety','underground'], keySections:[] },
  { id:'PlantationLabour', shortName:'Plantation Labour Act', fullName:'The Plantation Labour Act, 1951', year:1951, category:'Labour', tags:['plantation','tea estate','labour welfare'], keySections:[] },
  { id:'MotorTransport', shortName:'Motor Transport Workers Act', fullName:'The Motor Transport Workers Act, 1961', year:1961, category:'Labour', tags:['motor transport worker','driver','conductor'], keySections:[] },
  { id:'IRCode', shortName:'Industrial Relations Code', fullName:'The Industrial Relations Code, 2020', year:2020, category:'Labour', tags:['industrial relations code','retrenchment','strike','lay off','labour code'], keySections:[] },
  { id:'OSHCode', shortName:'OSH Code', fullName:'The Occupational Safety, Health and Working Conditions Code, 2020', year:2020, category:'Labour', tags:['osh code','safety','working conditions','labour code'], keySections:[] },
  { id:'SSCode', shortName:'Social Security Code', fullName:'The Code on Social Security, 2020', year:2020, category:'Labour', tags:['social security code','gratuity','provident fund','labour code'], keySections:[] },

  // ── Consumer, standards & regulation ────────────────────────
  { id:'CPA1986', shortName:'Consumer Protection Act 1986', fullName:'The Consumer Protection Act, 1986 (repealed and replaced by the Consumer Protection Act, 2019 — still governs complaints filed before 20 July 2020)', year:1986, category:'Consumer', tags:['consumer 1986','old consumer act','deficiency'], keySections:[] },
  { id:'LegalMetrology', shortName:'Legal Metrology Act', fullName:'The Legal Metrology Act, 2009', year:2009, category:'Consumer', tags:['weights and measures','packaged commodity','mrp','declaration'], keySections:[] },
  { id:'BIS', shortName:'BIS Act', fullName:'The Bureau of Indian Standards Act, 2016', year:2016, category:'Consumer', tags:['bis','standard mark','isi','quality'], keySections:[] },
  { id:'DrugsMagic', shortName:'Drugs and Magic Remedies Act', fullName:'The Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954', year:1954, category:'Public health', tags:['misleading advertisement','magic remedy','cure claim'], keySections:[] },
  { id:'EssComm', shortName:'Essential Commodities Act', fullName:'The Essential Commodities Act, 1955', year:1955, category:'Commercial', tags:['essential commodity','hoarding','black marketing','price control'], keySections:[
    {n:'Section 3', desc:'Powers to control production, supply and distribution of essential commodities'},
  ] },

  // ── Health, disability & welfare ────────────────────────────
  { id:'MentalHealthcare', shortName:'Mental Healthcare Act', fullName:'The Mental Healthcare Act, 2017', year:2017, category:'Health', tags:['mental health','mental illness','advance directive','decriminalisation of suicide'], keySections:[
    {n:'Section 115', desc:'Presumption of severe stress in case of attempt to commit suicide'},
  ] },
  { id:'RPwD', shortName:'RPwD Act', fullName:'The Rights of Persons with Disabilities Act, 2016', year:2016, category:'Welfare', tags:['disability','divyang','reservation','accessibility','benchmark disability'], keySections:[
    {n:'Section 3',  desc:'Equality and non-discrimination'},
    {n:'Section 34', desc:'Reservation in government establishments — four per cent'},
  ] },
  { id:'TransgenderAct', shortName:'Transgender Persons Act', fullName:'The Transgender Persons (Protection of Rights) Act, 2019', year:2019, category:'Welfare', tags:['transgender','gender identity','certificate of identity','discrimination'], keySections:[] },
  { id:'THOTA', shortName:'Organ Transplantation Act', fullName:'The Transplantation of Human Organs and Tissues Act, 1994', year:1994, category:'Health', tags:['organ transplant','donor','brain death','authorisation committee'], keySections:[] },
  { id:'ClinicalEst', shortName:'Clinical Establishments Act', fullName:'The Clinical Establishments (Registration and Regulation) Act, 2010', year:2010, category:'Health', tags:['hospital','clinic','registration','standards'], keySections:[] },
  { id:'NMC', shortName:'NMC Act', fullName:'The National Medical Commission Act, 2019', year:2019, category:'Health', tags:['medical council','nmc','doctor','medical negligence','registration'], keySections:[] },
  { id:'EpidemicAct', shortName:'Epidemic Diseases Act', fullName:'The Epidemic Diseases Act, 1897', year:1897, category:'Public health', tags:['epidemic','quarantine','outbreak','public health emergency'], keySections:[] },
  { id:'DisasterMgmt', shortName:'Disaster Management Act', fullName:'The Disaster Management Act, 2005', year:2005, category:'Public law', tags:['disaster','ndma','lockdown','relief','calamity'], keySections:[
    {n:'Section 51', desc:'Punishment for obstruction or refusal to comply with directions'},
  ] },
  { id:'NFSA', shortName:'Food Security Act', fullName:'The National Food Security Act, 2013', year:2013, category:'Welfare', tags:['ration','pds','food security','entitlement'], keySections:[] },
  { id:'MGNREGA', shortName:'MGNREGA', fullName:'The Mahatma Gandhi National Rural Employment Guarantee Act, 2005', year:2005, category:'Welfare', tags:['nrega','employment guarantee','job card','hundred days','muster roll'], keySections:[] },

  // ── Children & education ────────────────────────────────────
  { id:'RTEAct', shortName:'RTE Act', fullName:'The Right of Children to Free and Compulsory Education Act, 2009', year:2009, category:'Education', tags:['rte','school admission','article 21a','free education','25 per cent quota'], keySections:[
    {n:'Section 12(1)(c)', desc:'Private unaided schools to admit at least twenty-five per cent children from weaker sections'},
  ] },
  { id:'NCPCRAct', shortName:'CPCR Act', fullName:'The Commissions for Protection of Child Rights Act, 2005', year:2005, category:'Welfare', tags:['child rights','ncpcr','scpcr'], keySections:[] },
  { id:'UGCAct', shortName:'UGC Act', fullName:'The University Grants Commission Act, 1956', year:1956, category:'Education', tags:['ugc','university','degree','higher education'], keySections:[] },

  // ── Environment, forests & natural resources ────────────────
  { id:'WildLife', shortName:'Wild Life Act', fullName:'The Wild Life (Protection) Act, 1972', year:1972, category:'Environment', tags:['wildlife','poaching','sanctuary','national park','schedule i animal'], keySections:[
    {n:'Section 9',  desc:'Prohibition of hunting of wild animals specified in Schedules'},
    {n:'Section 51', desc:'Penalties for contravention'},
  ] },
  { id:'ForestConserv', shortName:'Forest Conservation Act', fullName:'The Van (Sanrakshan Evam Samvardhan) Adhiniyam / Forest (Conservation) Act, 1980', year:1980, category:'Environment', tags:['forest land','diversion','non-forest use','clearance'], keySections:[
    {n:'Section 2', desc:'Restriction on de-reservation of forests or use of forest land for non-forest purpose'},
  ] },
  { id:'IndianForest', shortName:'Indian Forest Act', fullName:'The Indian Forest Act, 1927', year:1927, category:'Environment', tags:['reserved forest','forest offence','timber','forest produce'], keySections:[] },
  { id:'ForestRights', shortName:'Forest Rights Act', fullName:'The Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006', year:2006, category:'Environment', tags:['forest rights','tribal','gram sabha','community forest rights'], keySections:[] },
  { id:'BioDiversity', shortName:'Biological Diversity Act', fullName:'The Biological Diversity Act, 2002', year:2002, category:'Environment', tags:['biodiversity','biological resource','access benefit sharing'], keySections:[] },
  { id:'PublicLiability', shortName:'Public Liability Insurance Act', fullName:'The Public Liability Insurance Act, 1991', year:1991, category:'Environment', tags:['hazardous substance','no fault liability','relief','industrial accident'], keySections:[] },
  { id:'MMDR', shortName:'MMDR Act', fullName:'The Mines and Minerals (Development and Regulation) Act, 1957', year:1957, category:'Environment', tags:['mining lease','illegal mining','mineral','royalty'], keySections:[
    {n:'Section 4',  desc:'Prospecting or mining operations only under a licence or lease'},
    {n:'Section 21', desc:'Penalties for illegal mining and recovery of value of minerals raised'},
  ] },
  { id:'ElectricityAct', shortName:'Electricity Act', fullName:'The Electricity Act, 2003', year:2003, category:'Regulatory', tags:['electricity','power theft','tariff','discom','regulatory commission'], keySections:[
    {n:'Section 126', desc:'Assessment for unauthorised use of electricity'},
    {n:'Section 135', desc:'Theft of electricity'},
  ] },
  { id:'PetroleumAct', shortName:'Petroleum Act', fullName:'The Petroleum Act, 1934', year:1934, category:'Regulatory', tags:['petroleum','storage','licence','inflammable'], keySections:[] },
  { id:'AtomicEnergy', shortName:'Atomic Energy Act', fullName:'The Atomic Energy Act, 1962', year:1962, category:'Regulatory', tags:['atomic energy','nuclear','radiation'], keySections:[] },

  // ── Intellectual property (additions) ───────────────────────
  { id:'DesignsAct', shortName:'Designs Act', fullName:'The Designs Act, 2000', year:2000, category:'IP', tags:['design','registered design','piracy of design','article shape'], keySections:[] },
  { id:'GIAct', shortName:'GI Act', fullName:'The Geographical Indications of Goods (Registration and Protection) Act, 1999', year:1999, category:'IP', tags:['geographical indication','gi tag','origin'], keySections:[] },
  { id:'PPVFR', shortName:'Plant Varieties Act', fullName:'The Protection of Plant Varieties and Farmers\' Rights Act, 2001', year:2001, category:'IP', tags:['plant variety','farmers rights','seed','breeder'], keySections:[] },
  { id:'SICLD', shortName:'Layout-Design Act', fullName:'The Semiconductor Integrated Circuits Layout-Design Act, 2000', year:2000, category:'IP', tags:['semiconductor','layout design','chip'], keySections:[] },

  // ── Media, technology & communications ──────────────────────
  { id:'TelegraphAct', shortName:'Telegraph Act', fullName:'The Indian Telegraph Act, 1885', year:1885, category:'Cyber', tags:['telegraph','interception','phone tapping','licence'], keySections:[
    {n:'Section 5(2)', desc:'Power to intercept messages on occurrence of public emergency or in the interest of public safety'},
  ] },
  { id:'TelecomAct', shortName:'Telecommunications Act', fullName:'The Telecommunications Act, 2023', year:2023, category:'Cyber', tags:['telecom','spectrum','authorisation','interception'], keySections:[] },
  { id:'TRAIAct', shortName:'TRAI Act', fullName:'The Telecom Regulatory Authority of India Act, 1997', year:1997, category:'Regulatory', tags:['trai','tdsat','telecom regulator','tariff'], keySections:[] },
  { id:'CableTV', shortName:'Cable TV Act', fullName:'The Cable Television Networks (Regulation) Act, 1995', year:1995, category:'Media', tags:['cable tv','programme code','broadcast'], keySections:[] },
  { id:'Cinematograph', shortName:'Cinematograph Act', fullName:'The Cinematograph Act, 1952', year:1952, category:'Media', tags:['film certification','cbfc','censor','exhibition'], keySections:[] },
  { id:'PressRegBooks', shortName:'Press and Registration Act', fullName:'The Press and Registration of Periodicals Act, 2023', year:2023, category:'Media', tags:['press registration','periodical','publisher','newspaper'], keySections:[] },
  { id:'AadhaarAct', shortName:'Aadhaar Act', fullName:'The Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016', year:2016, category:'Cyber', tags:['aadhaar','uidai','authentication','biometric','subsidy'], keySections:[
    {n:'Section 7', desc:'Proof of Aadhaar necessary for receipt of certain subsidies, benefits and services'},
  ] },

  // ── Public law, governance & elections ──────────────────────
  { id:'RPA1951', shortName:'RP Act 1951', fullName:'The Representation of the People Act, 1951', year:1951, category:'Public law', tags:['election petition','disqualification','corrupt practice','candidate','nomination'], keySections:[
    {n:'Section 8',   desc:'Disqualification on conviction for certain offences'},
    {n:'Section 80',  desc:'Election disputes to be determined only by election petition'},
    {n:'Section 123', desc:'Corrupt practices'},
  ] },
  { id:'RPA1950', shortName:'RP Act 1950', fullName:'The Representation of the People Act, 1950', year:1950, category:'Public law', tags:['electoral roll','constituency','voter registration'], keySections:[] },
  { id:'PHRA', shortName:'Human Rights Act', fullName:'The Protection of Human Rights Act, 1993', year:1993, category:'Public law', tags:['nhrc','human rights','state human rights commission','custodial violence'], keySections:[
    {n:'Section 12', desc:'Functions of the National Human Rights Commission'},
  ] },
  { id:'LokpalAct', shortName:'Lokpal Act', fullName:'The Lokpal and Lokayuktas Act, 2013', year:2013, category:'Public law', tags:['lokpal','lokayukta','corruption complaint','public servant'], keySections:[] },
  { id:'WhistleBlowers', shortName:'Whistle Blowers Act', fullName:'The Whistle Blowers Protection Act, 2014', year:2014, category:'Public law', tags:['whistleblower','public interest disclosure','protection'], keySections:[] },
  { id:'CVCAct', shortName:'CVC Act', fullName:'The Central Vigilance Commission Act, 2003', year:2003, category:'Public law', tags:['cvc','vigilance','departmental inquiry'], keySections:[] },
  { id:'ATAct', shortName:'Administrative Tribunals Act', fullName:'The Administrative Tribunals Act, 1985', year:1985, category:'Service law', tags:['cat','service matter','government servant','tribunal','recruitment dispute'], keySections:[
    {n:'Section 14', desc:'Jurisdiction, powers and authority of the Central Administrative Tribunal'},
    {n:'Section 19', desc:'Applications to Tribunals'},
    {n:'Section 20', desc:'Tribunal not to entertain application unless remedies available under service rules are exhausted'},
  ] },
  { id:'AISAct', shortName:'All India Services Act', fullName:'The All India Services Act, 1951', year:1951, category:'Service law', tags:['ias','ips','all india service','service rules','conduct rules'], keySections:[] },
  { id:'CitizenAmend', shortName:'Citizenship Amendment Act', fullName:'The Citizenship (Amendment) Act, 2019', year:2019, category:'Public law', tags:['caa','citizenship amendment','migrant'], keySections:[] },
  { id:'ForeignersAct', shortName:'Foreigners Act', fullName:'The Foreigners Act, 1946', year:1946, category:'Public law', tags:['foreigner','deportation','visa violation','illegal migrant'], keySections:[] },

  // ── Armed forces & tribunals ────────────────────────────────
  { id:'ArmyAct', shortName:'Army Act', fullName:'The Army Act, 1950', year:1950, category:'Armed forces', tags:['army','court martial','military discipline','soldier'], keySections:[] },
  { id:'NavyAct', shortName:'Navy Act', fullName:'The Navy Act, 1957', year:1957, category:'Armed forces', tags:['navy','naval discipline','court martial'], keySections:[] },
  { id:'AirForceAct', shortName:'Air Force Act', fullName:'The Air Force Act, 1950', year:1950, category:'Armed forces', tags:['air force','court martial','discipline'], keySections:[] },
  { id:'AFTAct', shortName:'AFT Act', fullName:'The Armed Forces Tribunal Act, 2007', year:2007, category:'Armed forces', tags:['armed forces tribunal','service matter','pension','court martial appeal'], keySections:[] },

  // ── Transport & infrastructure ──────────────────────────────
  { id:'RailwaysAct', shortName:'Railways Act', fullName:'The Railways Act, 1989', year:1989, category:'Transport', tags:['railway','untoward incident','claims tribunal','passenger','compensation'], keySections:[
    {n:'Section 124A', desc:'Compensation on account of untoward incident'},
  ] },
  { id:'RailwayClaims', shortName:'Railway Claims Tribunal Act', fullName:'The Railway Claims Tribunal Act, 1987', year:1987, category:'Transport', tags:['railway claims tribunal','rct','compensation claim'], keySections:[] },
  { id:'NHAct', shortName:'National Highways Act', fullName:'The National Highways Act, 1956', year:1956, category:'Transport', tags:['national highway','land acquisition for highway','arbitration compensation'], keySections:[] },
  { id:'MerchantShipping', shortName:'Merchant Shipping Act', fullName:'The Merchant Shipping Act, 1958', year:1958, category:'Transport', tags:['ship','seafarer','admiralty','vessel'], keySections:[] },
  { id:'AircraftAct', shortName:'Aircraft Act', fullName:'The Aircraft Act, 1934', year:1934, category:'Transport', tags:['aircraft','aviation','dgca'], keySections:[] },
  { id:'AdmiraltyAct', shortName:'Admiralty Act', fullName:'The Admiralty (Jurisdiction and Settlement of Maritime Claims) Act, 2017', year:2017, category:'Transport', tags:['admiralty','maritime claim','arrest of vessel'], keySections:[] },
]
