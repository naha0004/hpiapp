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

// PE2 Form Data (Application to file a Statutory Declaration Out of Time)
export interface PE2Data {
  // Court/Authority details
  courtName: string; // Traffic Enforcement Centre
  courtAddress: string;
  
  // Penalty details
  penaltyChargeNumber: string;
  vehicleRegistration: string;
  
  // Applicant details
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  
  // Contravention details
  locationOfContravention: string;
  dateOfContravention: string;
  
  // Respondent details (to be completed in BLOCK CAPITALS)
  respondentName: string;
  respondentAddress: string;
  
  // Application details
  reasonsForLateFiling: string; // Why filing the declaration out of time
  
  // Signature details
  applicantSignature?: string;
  signatureDate?: string;
  declarationLocation?: string; // Where declaration was made
  
  // Witness details (Commissioner for Oaths/Solicitor/Justice of Peace)
  witnessType?: string; // Commissioner for Oaths, Solicitor, Justice of Peace
  witnessName?: string;
  witnessAddress?: string;
}

// PE3 Form Data (Statutory Declaration – unpaid penalty charge)
export interface PE3Data {
  // Penalty details
  penaltyChargeNumber: string;
  vehicleRegistration: string;
  
  // Applicant details
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  
  // Contravention details
  locationOfContravention: string;
  dateOfContravention: string;
  
  // Respondent details (required by government form - in BLOCK CAPITALS)
  respondentName: string; // Full name of respondent
  respondentAddress: string; // Full address including postcode
  
  // Declaration checkboxes (tick which applies)
  didNotReceiveNotice: boolean; // Notice to Owner/Enforcement Notice/Penalty Charge Notice
  madeRepresentationsNoResponse: boolean; // Made representations but did not receive rejection notice
  appealedNoResponse: boolean; // Appealed to Parking/Traffic Adjudicator but no response
  
  // Reasons
  reasonForDeclaration: string; // Full reasons in text area
  
  // Signature details
  applicantSignature?: string;
  signatureDate?: string;
  declarationLocation?: string; // Where declaration was made
  
  // Witness details (Commissioner for Oaths/Solicitor/Justice of Peace)
  witnessType?: string; // Commissioner for Oaths, Solicitor, Justice of Peace
  witnessName?: string;
  witnessAddress?: string;
}

// N244 Form Data (Application notice)
export interface N244Data {
  // Court details
  courtName: string;
  claimNumber: string;
  courtAddress: string;
  
  // Applicant details
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  applicantPhone?: string;
  applicantEmail?: string;
  isClaimant: boolean;
  isDefendant: boolean;
  
  // Application details
  applicationFor: string;
  orderSought: string;
  reasonsForApplication: string;
  legalAuthorityReliedOn: string;
  
  // Hearing details
  hearingRequired: boolean;
  estimatedHearingTime: string;
  dateNotAvailable?: string;
  
  // Evidence and costs
  evidenceInSupport: string;
  costsClaimed: boolean;
  costsAmount?: string;
  
  // Declaration
  believeFactsTrue: boolean;
  understandContempt: boolean;
  
  // Signature data
  applicantSignature?: string;
  signatureDate?: string;
}
