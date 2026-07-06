export type DocCategory = 'litigation' | 'family' | 'property' | 'business' | 'government' | 'practice' | 'advisory';

export type DocType = {
  id: string;
  name: string;
  mono: string; // short monogram shown in the picker card
  category: DocCategory;
  pro?: boolean;
};

export const docCategories: { key: DocCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'litigation', label: 'Litigation' },
  { key: 'family', label: 'Family & Personal' },
  { key: 'property', label: 'Property & Deeds' },
  { key: 'business', label: 'Business' },
  { key: 'government', label: 'Government' },
  { key: 'practice', label: 'Court Practice' },
  { key: 'advisory', label: 'Advisory' },
];

/** All 19 document types LexForge AI can draft. */
export const docTypes: DocType[] = [
  { id: 'legalNotice', name: 'Legal Notice', mono: 'LN', category: 'litigation' },
  { id: 'petition', name: 'Petition', mono: 'PT', category: 'litigation' },
  { id: 'writPetition', name: 'Writ Petition', mono: 'WP', category: 'litigation', pro: true },
  { id: 'bailApplication', name: 'Bail Application', mono: 'BA', category: 'litigation' },
  { id: 'firDraft', name: 'FIR Draft', mono: 'FIR', category: 'litigation' },
  { id: 'chequeBounce', name: 'Cheque Bounce Complaint', mono: 'CB', category: 'litigation' },
  { id: 'consumerComplaint', name: 'Consumer Complaint', mono: 'CC', category: 'litigation' },
  { id: 'divorcePetition', name: 'Divorce Petition', mono: 'DP', category: 'family' },
  { id: 'will', name: 'Will & Testament', mono: 'WL', category: 'family' },
  { id: 'giftDeed', name: 'Gift Deed', mono: 'GD', category: 'family' },
  { id: 'saleDeed', name: 'Sale Deed', mono: 'SD', category: 'property' },
  { id: 'rentAgreement', name: 'Rent / Lease Agreement', mono: 'RA', category: 'property' },
  { id: 'poa', name: 'Power of Attorney', mono: 'POA', category: 'property' },
  { id: 'contract', name: 'Contract / Agreement', mono: 'CT', category: 'business' },
  { id: 'partnershipDeed', name: 'Partnership Deed', mono: 'PD', category: 'business' },
  { id: 'rti', name: 'RTI Application', mono: 'RTI', category: 'government' },
  { id: 'affidavit', name: 'Affidavit', mono: 'AF', category: 'practice' },
  { id: 'vakalatnama', name: 'Vakalatnama', mono: 'VK', category: 'practice' },
  { id: 'legalOpinion', name: 'Legal Opinion', mono: 'LO', category: 'advisory', pro: true },
];
