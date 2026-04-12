export const DOCUMENT_TYPES = [
  { value: 'LEGAL_NOTICE', label: 'Legal Notice', description: 'Formal notice demanding action or remedy', icon: '📋' },
  { value: 'CASE_BRIEF', label: 'Case Brief', description: 'Structured summary of legal arguments', icon: '⚖️' },
  { value: 'CONTRACT', label: 'Contract', description: 'Legally binding agreement between parties', icon: '📝' },
  { value: 'PETITION', label: 'Petition', description: 'Formal request to a court or authority', icon: '🏛️' },
  { value: 'MEMORANDUM', label: 'Memorandum', description: 'Legal analysis and recommendations', icon: '📄' },
]

export const CASE_LAWS = [
  { id:'1', name:'Maneka Gandhi v. Union of India', year:'1978', court:'Supreme Court of India', citation:'AIR 1978 SC 597', principle:'Right to Life includes right to live with dignity', summary:'Article 21 includes the right to live with human dignity. The procedure established by law must be fair, just and reasonable.', keywords:['fundamental rights','article 21','personal liberty','due process','constitution'] },
  { id:'2', name:'Kesavananda Bharati v. State of Kerala', year:'1973', court:'Supreme Court of India', citation:'AIR 1973 SC 1461', principle:'Basic Structure Doctrine', summary:'Parliament cannot alter the basic structure of the Constitution even through constitutional amendments.', keywords:['constitution','amendment','basic structure','parliament','fundamental rights'] },
  { id:'3', name:'Vishaka v. State of Rajasthan', year:'1997', court:'Supreme Court of India', citation:'AIR 1997 SC 3011', principle:'Vishaka Guidelines — Sexual harassment at workplace', summary:'Landmark judgment laying down guidelines to prevent sexual harassment of women at workplace.', keywords:['sexual harassment','workplace','women rights','gender equality','employment'] },
  { id:'4', name:'MC Mehta v. Union of India', year:'1987', court:'Supreme Court of India', citation:'AIR 1987 SC 1086', principle:'Absolute Liability for hazardous industries', summary:'Industries engaged in hazardous activities are absolutely liable for any harm caused, without exception.', keywords:['environment','pollution','liability','hazardous','industry','tort'] },
  { id:'5', name:'DK Basu v. State of West Bengal', year:'1997', court:'Supreme Court of India', citation:'AIR 1997 SC 610', principle:'Custodial rights and arrest guidelines', summary:'Mandatory guidelines for police on arrest, detention and interrogation to prevent custodial torture.', keywords:['arrest','detention','police','custody','fundamental rights','article 21'] },
  { id:'6', name:'SR Bommai v. Union of India', year:'1994', court:'Supreme Court of India', citation:'AIR 1994 SC 1918', principle:'Limitations on President\'s Rule under Article 356', summary:'President\'s Rule under Article 356 is subject to judicial review. Floor test must precede dismissal of state government.', keywords:['article 356','president rule','federalism','state government','constitution'] },
]

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

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })
}
