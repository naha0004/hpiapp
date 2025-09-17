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
