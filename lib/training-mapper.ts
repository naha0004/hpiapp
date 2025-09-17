import { TrainingCase, AppealTemplate, ModelMetrics } from '@/types/training';
import { Prisma } from '@prisma/client';

export class TrainingDataMapper {
  static toDbTrainingCase(trainingCase: TrainingCase): Prisma.AppealTrainingCreateInput {
    return {
      ticketType: trainingCase.ticketType,
      circumstances: trainingCase.circumstances,
      evidence: JSON.stringify(trainingCase.evidenceProvided),
      appealLetter: trainingCase.appealLetter,
      outcome: trainingCase.outcome,
      successFactors: trainingCase.successFactors ? JSON.stringify(trainingCase.successFactors) : null,
      keyArguments: JSON.stringify(trainingCase.keyArguments),
      legalReferences: trainingCase.legalReferences ? JSON.stringify(trainingCase.legalReferences) : null,
      processingTime: trainingCase.processingTime,
      fineAmount: trainingCase.fineAmount,
      fineReduction: trainingCase.fineReduction || null,
      dateSubmitted: new Date(trainingCase.dateSubmitted),
      dateResolved: new Date(trainingCase.dateResolved),
      active: true
    };
  }

  static fromDbTrainingCase(dbCase: any): TrainingCase {
    return {
      id: dbCase.id,
      ticketType: dbCase.ticketType,
      circumstances: dbCase.circumstances,
      evidenceProvided: JSON.parse(dbCase.evidence),
      appealLetter: dbCase.appealLetter,
      outcome: dbCase.outcome,
      successFactors: dbCase.successFactors ? JSON.parse(dbCase.successFactors) : undefined,
      keyArguments: JSON.parse(dbCase.keyArguments),
      legalReferences: dbCase.legalReferences ? JSON.parse(dbCase.legalReferences) : undefined,
      processingTime: dbCase.processingTime,
      fineAmount: dbCase.fineAmount,
      fineReduction: dbCase.fineReduction,
      dateSubmitted: dbCase.dateSubmitted.toISOString(),
      dateResolved: dbCase.dateResolved.toISOString()
    };
  }

  static toDbTemplate(template: AppealTemplate): Prisma.AppealTemplateCreateInput {
    return {
      ticketType: template.ticketType,
      template: template.template,
      successRate: template.successRate,
      version: template.version,
      lastUsed: new Date(template.lastUsed)
    };
  }

  static fromDbTemplate(dbTemplate: any): AppealTemplate {
    return {
      id: dbTemplate.id,
      ticketType: dbTemplate.ticketType,
      template: dbTemplate.template,
      successRate: dbTemplate.successRate,
      version: dbTemplate.version,
      lastUsed: dbTemplate.lastUsed.toISOString()
    };
  }

  static toDbMetrics(metrics: ModelMetrics): Prisma.ModelMetricsCreateInput {
    return {
      totalCases: metrics.totalCases,
      successfulAppeals: metrics.successfulAppeals,
      averageSuccessRate: metrics.averageSuccessRate,
      commonSuccessFactors: JSON.stringify(metrics.commonSuccessFactors),
      averageFineReduction: metrics.averageFineReduction,
      typicalProcessingTime: metrics.typicalProcessingTime,
      confidenceScore: metrics.confidenceScore
    };
  }

  static fromDbMetrics(dbMetrics: any): ModelMetrics {
    return {
      totalCases: dbMetrics.totalCases,
      successfulAppeals: dbMetrics.successfulAppeals,
      averageSuccessRate: dbMetrics.averageSuccessRate,
      commonSuccessFactors: JSON.parse(dbMetrics.commonSuccessFactors),
      averageFineReduction: dbMetrics.averageFineReduction,
      typicalProcessingTime: dbMetrics.typicalProcessingTime,
      confidenceScore: dbMetrics.confidenceScore
    };
  }
}
