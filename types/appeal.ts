export type TicketType = 
  | 'Parking'
  | 'Speeding'
  | 'Red Light'
  | 'No MOT'
  | 'No Insurance'
  | 'Bus Lane'
  | 'Yellow Box'
  | 'Loading Zone'
  | 'Other';

export type EvidenceType = 
  | 'Photos'
  | 'Video'
  | 'Dashcam Footage'
  | 'Witness Statements'
  | 'Medical Documents'
  | 'Repair Documents'
  | 'Payment Receipts'
  | 'Other Documents';

export interface AppealDetails {
  ticketType: TicketType;
  ticketNumber: string;
  date: string;
  time: string;
  location: string;
  circumstances: string;
  evidenceAvailable: EvidenceType[];
  vehicleReg?: string;
  penaltyAmount?: number;
  appealing: boolean;
  status: 'Draft' | 'Submitted' | 'In Review' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AppealAnalysis {
  recommendation: string;
  confidence: number;
  reasoning: string[];
  suggestedEvidence: string[];
  precedentCases: {
    caseRef: string;
    summary: string;
    outcome: string;
    relevance: string;
  }[];
  legalReferences: {
    section: string;
    description: string;
    applicability: string;
  }[];
  appealTemplateText: string;
  successRate: number;
  timeEstimate: string;
  nextSteps: string[];
}

export interface AppealStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  successRate: number;
  averageProcessingTime: string;
}

// Court Form Data Types
export interface TE7Data {
  // Court details
  courtName: string;
  claimNumber: string;
  
  // Applicant details
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  applicantPhone?: string;
  applicantEmail?: string;
  
  // Case details
  caseReference: string;
  hearingDate: string;
  extensionUntil: string;
  reasonForExtension: string;
  supportingEvidence?: string;
  
  // Signature data
  applicantSignature?: string;
  witnessSignature?: string;
  signatureDate?: string;
}

export interface TE9Data {
  // Court details
  courtName: string;
  claimNumber: string;
  
  // Witness details
  witnessName: string;
  witnessAddress: string;
  witnessPostcode: string;
  witnessOccupation: string;
  
  // Statement details
  statementText: string;
  factsKnown?: 'personally' | 'from_documents' | 'from_others';
  supportingDocuments?: string;
  
  // Signature data
  declarantSignature?: string;
  witnessSignature?: string;
  witnessName_qualified?: string; // Qualified witness name (solicitor, etc.)
  witnessQualification?: string; // Solicitor, commissioner for oaths, etc.
  signatureDate?: string;
}

// PE2 Form Data - Application for Permission to Appeal
export interface PE2Data {
  // Case details
  caseNumber: string;
  courtName: string;
  
  // Applicant details
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  applicantPhone?: string;
  applicantEmail?: string;
  
  // Appeal details
  originalDecisionDate: string;
  decisionBeingAppealed: string;
  groundsForAppeal: string;
  evidenceAttached?: string;
  
  // Legal representation
  hasLegalRepresentation: boolean;
  solicitorName?: string;
  solicitorAddress?: string;
  
  // Signature data
  applicantSignature?: string;
  signatureDate?: string;
}

// PE3 Form Data - Appellant's Notice
export interface PE3Data {
  // Case details
  caseNumber: string;
  courtName: string;
  originalCourtName: string;
  
  // Appellant details
  appellantName: string;
  appellantAddress: string;
  appellantPostcode: string;
  appellantPhone?: string;
  appellantEmail?: string;
  
  // Respondent details
  respondentName: string;
  respondentAddress?: string;
  
  // Appeal details
  dateOfDecision: string;
  decisionAppealed: string;
  orderSought: string;
  groundsOfAppeal: string;
  timeExtensionSought?: boolean;
  reasonForDelay?: string;
  
  // Evidence and documents
  evidenceFiledSeparately: boolean;
  skeletonArgumentFiled: boolean;
  
  // Signature data
  appellantSignature?: string;
  signatureDate?: string;
}

// N244 Form Data - Application Notice
export interface N244Data {
  // Case details
  caseNumber: string;
  courtName: string;
  
  // Applicant details
  applicantName: string;
  applicantCapacity: 'Claimant' | 'Defendant' | 'Part 20 claimant' | 'Other';
  applicantAddress: string;
  applicantPostcode: string;
  applicantPhone?: string;
  applicantEmail?: string;
  
  // Application details
  orderSought: string;
  reasonForApplication: string;
  evidenceSupport: string;
  
  // Hearing details
  hearingRequired: boolean;
  estimatedHearingTime?: string;
  reasonsForHearing?: string;
  
  // Service details
  serviceRequiredOn: string[];
  proposedServiceMethod: string;
  
  // Fee and signature
  feeRequired: string;
  applicantSignature?: string;
  signatureDate?: string;
}
