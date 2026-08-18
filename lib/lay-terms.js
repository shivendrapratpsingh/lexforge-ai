// ─────────────────────────────────────────────────────────────────
//  lib/lay-terms.js — how people actually describe their problem.
//
//  The corpus is tagged in legal vocabulary: "deficiency", "industrial
//  dispute", "domestic violence". Real users type "defective product
//  refund", "boss fired me", "husband beats me". Measured before this
//  existed: ten of fifteen everyday phrasings matched NOTHING, because
//  findApplicableLaws quite correctly refuses to guess on a weak match.
//
//  So the query is expanded before matching. Each entry adds legal
//  vocabulary alongside the user's own words — it never replaces them,
//  so a lawyer typing precise terms is unaffected, and scoring is
//  unchanged.
//
//  Kept as phrase → terms rather than word → word deliberately: "will"
//  alone is a modal verb, but "without a will" is testamentary
//  succession, and mapping the bare word would poison every query
//  containing it.
// ─────────────────────────────────────────────────────────────────

export const LAY_TERMS = [
  // ── consumer ──────────────────────────────────────────────────
  [/\b(defect|faulty|not working|stopped working)/i, 'consumer deficiency defect'],
  [/\b(refund|money back|replacement|warranty|guarantee)\b/i, 'consumer deficiency refund'],
  [/\b(overcharg|cheated by (a )?(shop|company|seller)|poor service)/i, 'consumer deficiency unfair trade practice'],

  // ── employment ────────────────────────────────────────────────
  [/\b(salary|wages?|pay) (has )?(not been |not )?(paid|given|received)\b/i, 'wages payment of wages minimum wages'],
  [/\b(unpaid|non.?payment of) (salary|wages?|dues)\b/i, 'wages payment of wages'],
  [/\b(fired|sacked|terminated|dismissed|removed from (my )?job|lost my job)\b/i, 'termination dismissal retrenchment industrial dispute workman'],
  [/\b(no notice|without notice|without enquiry|without inquiry)\b.*\b(fired|terminated|dismissed)\b/i, 'domestic enquiry principles of natural justice retrenchment'],
  [/\b(pf|provident fund|gratuity|bonus|esi)\b/i, 'provident fund gratuity bonus employees state insurance'],
  [/\b(sexual harassment|harass(ed|ment)? at work|inappropriate at (the )?office)\b/i, 'sexual harassment workplace posh internal committee'],
  [/\b(overtime|working hours|factory conditions|no leave)\b/i, 'factories working hours overtime leave'],

  // ── family ────────────────────────────────────────────────────
  [/\b(husband|wife|spouse|in.?laws?) (beats?|hits?|abus|torture|harass)/i, 'domestic violence cruelty matrimonial protection order'],
  [/\b(domestic violence|beaten at home|abused at home)\b/i, 'domestic violence protection order residence order'],
  [/\b(divorce|separate from (my )?(husband|wife)|end (my|the) marriage)\b/i, 'divorce dissolution of marriage matrimonial'],
  [/\b(maintenance|alimony|support money)\b/i, 'maintenance alimony matrimonial'],
  [/\b(custody of (my |the )?child|who gets the child|child custody)\b/i, 'custody guardianship minor welfare of the child'],
  [/\b(adopt|adoption|adopting a child)\b/i, 'adoption guardianship juvenile justice minor'],
  [/\b(dowry|demand(ed|ing)? (money|gold) (for|at) (the )?(marriage|wedding))\b/i, 'dowry cruelty matrimonial'],
  [/\b(died without a will|no will|intestate)\b/i, 'succession intestate inheritance'],
  [/\b(will|testament|inheritance|property after death|legal heir)\b/i, 'succession will probate inheritance heir'],

  // ── property ──────────────────────────────────────────────────
  [/\b(encroach|occupied my land|taken over my (land|plot|property)|illegal possession)/i, 'possession trespass injunction property title'],
  [/\b(tenant (won'?t|will not|refus)|not vacating|won'?t leave|evict)\b/i, 'lease tenancy eviction possession'],
  [/\b(landlord|rent (not )?(paid|increase)|deposit not return)\b/i, 'lease tenancy rent security deposit'],
  [/\b(builder|flat|possession delay|project delay|booked a flat)\b/i, 'real estate rera possession promoter allottee'],
  [/\b(registry|registration of (the )?(sale|deed|property)|mutation)\b/i, 'registration sale deed transfer of property stamp duty'],

  // ── money & business ──────────────────────────────────────────
  [/\b(cheque (bounce|bounced|dishonour|returned)|insufficient funds)\b/i, 'cheque dishonour negotiable instruments 138'],
  [/\b(not returning my (money|deposit)|refus(ed|ing) to (repay|return)|owes me money)\b/i, 'recovery of money debt breach of contract'],
  [/\b(loan|emi|bank (is )?harass|recovery agent|npa|auction of my (house|property))\b/i, 'debt recovery sarfaesi secured creditor loan'],
  [/\b(company (has )?not (paid|delivered)|breach of (the )?(contract|agreement))\b/i, 'breach of contract damages specific performance'],
  [/\b(partner(ship)? dispute|business partner)\b/i, 'partnership firm dissolution accounts'],
  [/\b(fraud|cheated|scam|duped|misappropriat)/i, 'cheating criminal breach of trust fraud'],

  // ── criminal & police ─────────────────────────────────────────
  // 'fir' and 'bnss' are named explicitly: without them this query scored
  // only on the word "complaint" and surfaced the Women's Commission Act
  // above the BNSS — a confidently wrong answer, which is worse than none.
  [/\b(police (refus\w*|won'?t|will not|did not|are not|not) (to )?(register|file|lodge|take)|no fir|fir not (being )?(registered|lodged)|complaint not registered)/i, 'fir bnss crpc first information report refusal magistrate investigation cognizable'],
  [/\b(arrest(ed)?|in custody|in jail|locked up|remand)\b/i, 'arrest bail custody remand'],
  [/\b(bail|get (him|her|me) out|release from jail)\b/i, 'bail anticipatory bail custody'],
  [/\b(blackmail|extort|threaten(ing|ed)? me|demanding money)/i, 'extortion criminal intimidation threat'],
  [/\b(online|internet|whatsapp|facebook|instagram|social media|hack|phish)\b.*\b(blackmail|threat|fraud|abuse|obscene|fake|morph)\b/i, 'cyber information technology electronic record obscene transmission'],
  [/\b(fake (news|profile|account)|defam|slander|libel|spoiling my (name|reputation))/i, 'defamation reputation information technology'],
  [/\b(molest|rape|sexual assault|outrag(e|ing) (the )?modesty|stalking)/i, 'sexual offence assault modesty women'],
  [/\b(child (abuse|molest)|minor (was )?(abused|assaulted))\b/i, 'pocso child sexual offence minor'],
  [/\b(caste|dalit|sc.?st|untouchab)\b/i, 'scheduled caste scheduled tribe atrocities untouchability'],
  [/\b(drug|ganja|charas|narcotic|ndps)\b/i, 'narcotic drugs psychotropic substances ndps'],

  // ── accidents, health, government ─────────────────────────────
  [/\b(accident|hit by a (car|bike|truck|bus|scooter)|road accident|ran over)\b/i, 'motor accident compensation claims tribunal negligence'],
  [/\b(insurance (claim )?(refus|reject|denied)|claim rejected)\b/i, 'insurance claim repudiation policy'],
  [/\b(doctor|hospital|treatment went wrong|medical negligen|wrong operation)\b/i, 'medical negligence consumer deficiency'],
  [/\b(government (office|department) (is )?not|no response from (the )?(government|department)|sarkari)\b/i, 'writ mandamus public authority information'],
  [/\b(information|records?|documents?) (from|of) (the )?(government|department|office)\b/i, 'right to information public authority disclosure'],
  [/\b(pension|retirement (dues|benefits)|seniority|promotion denied|transfer(red)? unfairly)\b/i, 'service matters pension seniority tribunal'],
  [/\b(licence|license|permit|sealed my (shop|premises)|demolition notice)\b/i, 'writ certiorari public authority licence'],
  [/\b(pollut|garbage|sewage|factory smoke|contaminated water)/i, 'environment pollution air water national green tribunal'],
]

/**
 * Add legal vocabulary to a lay description. Returns the original query
 * plus any matched terms — never a replacement, so precise legal input
 * is unaffected and scoring behaves exactly as before for those.
 */
export function expandLayTerms(query) {
  const q = String(query || '')
  if (!q.trim()) return q
  const extra = []
  for (const [re, terms] of LAY_TERMS) {
    if (re.test(q)) extra.push(terms)
  }
  return extra.length ? `${q} ${[...new Set(extra.join(' ').split(' '))].join(' ')}` : q
}
