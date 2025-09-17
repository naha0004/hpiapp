import { TicketType, EvidenceType } from './appeal';

export interface TrainingCase {
  id?: string;
  ticketType: TicketType;
  circumstances: string;
  evidenceProvided: string[];
  appealLetter: string;
  outcome: 'Successful' | 'Unsuccessful' | 'Pending';
  successFactors?: string[];
  keyArguments: string[];
  legalReferences?: string[];
  processingTime: number; // in days
  fineAmount: number;
  fineReduction?: number;
  dateSubmitted: string;
  dateResolved: string;
}

export interface TrainingSet {
  id: string;
  cases: TrainingCase[];
  performanceMetrics: ModelMetrics;
  lastUpdated: string;
  version: string;
}

export interface ModelMetrics {
  totalCases: number;
  successfulAppeals: number;
  averageSuccessRate: number;
  commonSuccessFactors: string[];
  averageFineReduction: number;
  typicalProcessingTime: number;
  confidenceScore: number;
  // Additional fields for compatibility
  successRate: number;
  averageReduction: number;
  averageProcessingTime: number;
  mostSuccessfulArguments: string[];
  leastSuccessfulArguments: string[];
}

export interface AppealTemplate {
  id: string;
  ticketType: TicketType;
  template: string;
  variables: string[];
  successRate: number;
  averageFineReduction: number;
  lastUsed: string;
  version: string;
}
