export type DocCategory = 'litigation' | 'family' | 'property' | 'business' | 'government' | 'practice' | 'advisory';

export type DocType = {
  id: string;
  name: string;
  mono: string; // short monogram shown in the picker card
  category: DocCategory;
  pro?: boolean;
  /** The backend's Prisma `documentType` enum value this generates as. `null`
   *  means the backend has no matching document type yet — the picker disables
   *  these rather than letting a generation request fail with a 400. */
  backendType: string | null;
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
  { id: 'legalNotice', name: 'Legal Notice', mono: 'LN', category: 'litigation', backendType: 'LEGAL_NOTICE' },
  { id: 'petition', name: 'Petition', mono: 'PT', category: 'litigation', backendType: 'PETITION' },
  { id: 'writPetition', name: 'Writ Petition', mono: 'WP', category: 'litigation', pro: true, backendType: 'WRIT_PETITION' },
  { id: 'bailApplication', name: 'Bail Application', mono: 'BA', category: 'litigation', backendType: 'BAIL_APPLICATION' },
  { id: 'firDraft', name: 'FIR Draft', mono: 'FIR', category: 'litigation', backendType: 'FIR_COMPLAINT' },
  { id: 'chequeBounce', name: 'Cheque Bounce Complaint', mono: 'CB', category: 'litigation', backendType: 'CHEQUE_BOUNCE' },
  { id: 'consumerComplaint', name: 'Consumer Complaint', mono: 'CC', category: 'litigation', backendType: 'CONSUMER_COMPLAINT' },
  { id: 'divorcePetition', name: 'Divorce Petition', mono: 'DP', category: 'family', backendType: 'DIVORCE_PETITION' },
  { id: 'will', name: 'Will & Testament', mono: 'WL', category: 'family', backendType: null },
  { id: 'giftDeed', name: 'Gift Deed', mono: 'GD', category: 'family', backendType: null },
  { id: 'saleDeed', name: 'Sale Deed', mono: 'SD', category: 'property', backendType: 'SALE_DEED' },
  { id: 'rentAgreement', name: 'Rent / Lease Agreement', mono: 'RA', category: 'property', backendType: 'R