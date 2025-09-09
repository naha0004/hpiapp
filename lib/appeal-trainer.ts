import { TrainingCase, TrainingSet, ModelMetrics, AppealTemplate } from '@/types/training';
import { TicketType, AppealDetails, AppealAnalysis, EvidenceType } from '@/types/appeal';
import { OpenAI } from 'openai';
import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TrainingDataMapper } from './training-mapper';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

export class AppealAITrainer {
  private trainingSet: TrainingSet | null = null;
  private templates: Map<TicketType, AppealTemplate> = new Map();
  
  constructor() {
    this.loadTrainingData();
  }

  private async loadTrainingData() {
    try {
      // Load training data from database
      const trainingData = await prisma.$queryRaw`
        SELECT * FROM AppealTraining WHERE active = 1
      `;

      if (Array.isArray(trainingData) && trainingData.length > 0) {
        const cases = trainingData.map(data => TrainingDataMapper.fromDbTrainingCase(data));
        this.trainingSet = this.processTrainingData(cases);
      }

      // Load templates
      const templates = await prisma.$queryRaw`
        SELECT * FROM AppealTemplate
      `;

      if (Array.isArray(templates)) {
        templates.forEach(template => {
          const mappedTemplate = TrainingDataMapper.fromDbTemplate(template);
          this.templates.set(mappedTemplate.ticketType, mappedTemplate);
        });
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  }

  private processTrainingData(cases: TrainingCase[]): TrainingSet {
    // Calculate performance metrics
    const successfulCases = cases.filter(c => c.outcome === 'Successful');
    const successRate = successfulCases.length / cases.length;
    const avgReduction = this.calculateAverageReduction(cases);
    const avgProcessing = this.calculateAverageProcessingTime(cases);
    const successfulArgs = this.findMostSuccessfulArguments(cases);

    const metrics: ModelMetrics = {
      // Core metrics
      successRate,
      averageReduction: avgReduction,
      averageProcessingTime: avgProcessing,
      mostSuccessfulArguments: successfulArgs,
      leastSuccessfulArguments: this.findLeastSuccessfulArguments(cases),
      // Extended metrics for ML tracking
      totalCases: cases.length,
      successfulAppeals: successfulCases.length,
      averageSuccessRate: successRate,
      commonSuccessFactors: successfulArgs,
      averageFineReduction: avgReduction,
      typicalProcessingTime: avgProcessing,
      confidenceScore: this.calculateConfidenceScore()
    };

    return {
      id: 'current',
      cases,
      performanceMetrics: metrics,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  private calculateAverageReduction(cases: TrainingCase[]): number {
    const reductions = cases
      .filter(c => c.fineReduction !== undefined)
      .map(c => c.fineReduction!);
    return reductions.length > 0 
      ? reductions.reduce((a, b) => a + b, 0) / reductions.length 
      : 0;
  }

  private calculateAverageProcessingTime(cases: TrainingCase[]): number {
    return cases.reduce((acc, c) => acc + c.processingTime, 0) / cases.length;
  }

  private findMostSuccessfulArguments(cases: TrainingCase[]): string[] {
    const argumentCounts = new Map<string, { total: number; successful: number }>();
    
    cases.forEach(c => {
      c.keyArguments.forEach(arg => {
        const current = argumentCounts.get(arg) || { total: 0, successful: 0 };
        current.total++;
        if (c.outcome === 'Successful') current.successful++;
        argumentCounts.set(arg, current);
      });
    });

    return Array.from(argumentCounts.entries())
      .filter(([_, stats]) => stats.total >= 5) // Minimum sample size
      .sort((a, b) => (b[1].successful / b[1].total) - (a[1].successful / a[1].total))
      .slice(0, 5)
      .map(([arg]) => arg);
  }

  private findLeastSuccessfulArguments(cases: TrainingCase[]): string[] {
    const argumentCounts = new Map<string, { total: number; successful: number }>();
    
    cases.forEach(c => {
      c.keyArguments.forEach(arg => {
        const current = argumentCounts.get(arg) || { total: 0, successful: 0 };
        current.total++;
        if (c.outcome === 'Successful') current.successful++;
        argumentCounts.set(arg, current);
      });
    });

    return Array.from(argumentCounts.entries())
      .filter(([_, stats]) => stats.total >= 5) // Minimum sample size
      .sort((a, b) => (a[1].successful / a[1].total) - (b[1].successful / b[1].total))
      .slice(0, 5)
      .map(([arg]) => arg);
  }

  private calculateConfidenceScore(): number {
    if (!this.trainingSet) return 0;

    const { cases } = this.trainingSet;
    
    // Factors affecting confidence
    const dataSize = Math.min(cases.length / 1000, 1); // Scale with data size up to 1000 cases
    const successConsistency = cases.filter(c => c.outcome === 'Successful').length / cases.length;
    const argumentEffectiveness = this.findMostSuccessfulArguments(cases).length / 10;
    
    // Weighted average
    return (dataSize * 0.4 + successConsistency * 0.4 + argumentEffectiveness * 0.2);
  }

  async trainModel(newCase: TrainingCase) {
    try {
      // Add case to training set
      if (this.trainingSet) {
        this.trainingSet.cases.push(newCase);
        this.trainingSet = this.processTrainingData(this.trainingSet.cases);
      }

      // Use OpenAI to improve templates based on successful cases
      if (newCase.outcome === 'Successful') {
        await this.improveTemplate(newCase);
      }

      // Save to database
      const dbCase = TrainingDataMapper.toDbTrainingCase(newCase);
      await prisma.$executeRaw`
        INSERT INTO AppealTraining (
          id, ticketType, circumstances, evidence, appealLetter, 
          outcome, successFactors, keyArguments, legalReferences, 
          processingTime, fineAmount, fineReduction, dateSubmitted, 
          dateResolved, active, createdAt, updatedAt
        ) VALUES (
          ${dbCase.id}, ${dbCase.ticketType}, ${dbCase.circumstances}, 
          ${dbCase.evidence}, ${dbCase.appealLetter}, ${dbCase.outcome}, 
          ${dbCase.successFactors}, ${dbCase.keyArguments}, ${dbCase.legalReferences},
          ${dbCase.processingTime}, ${dbCase.fineAmount}, ${dbCase.fineReduction},
          ${dbCase.dateSubmitted}, ${dbCase.dateResolved}, ${dbCase.active},
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;

      // Update metrics
      await this.updateModelMetrics();

    } catch (error) {
      console.error('Training error:', error);
      throw new Error('Failed to train model with new case');
    }
  }

  private async improveTemplate(successCase: TrainingCase) {
    try {
      const prompt = `Analyze this successful appeal letter and extract key components that made it effective:
      
Ticket Type: ${successCase.ticketType}
Appeal Letter:
${successCase.appealLetter}

Success Factors:
${successCase.successFactors?.join('\n')}

Create an improved template that incorporates these successful elements while maintaining adaptability for similar cases.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing and improving legal appeal templates. Focus on identifying and incorporating successful argument patterns and persuasive language structures."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Failed to generate template improvements');
      }

      // Update template in database
      const templateData = {
        ticketType: successCase.ticketType,
        template: content,
        successRate: this.calculateTemplateSuccessRate(successCase.ticketType),
        version: Date.now().toString(),
        lastUsed: new Date()
      };

      // First check if template exists
      const existingTemplate = await prisma.$queryRaw`
        SELECT id FROM AppealTemplate WHERE ticketType = ${successCase.ticketType} LIMIT 1
      `;

      if (existingTemplate && Array.isArray(existingTemplate) && existingTemplate.length > 0) {
        // Update existing template
        await prisma.$executeRaw`
          UPDATE AppealTemplate 
          SET template = ${templateData.template},
              successRate = ${templateData.successRate},
              version = ${templateData.version},
              lastUsed = ${templateData.lastUsed},
              updatedAt = CURRENT_TIMESTAMP
          WHERE ticketType = ${successCase.ticketType}
        `;
      } else {
        // Create new template
        const id = 'cuid_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        await prisma.$executeRaw`
          INSERT INTO AppealTemplate (
            id, ticketType, template, successRate, version, 
            lastUsed, createdAt, updatedAt
          ) VALUES (
            ${id}, ${successCase.ticketType}, ${templateData.template},
            1, '1.0.0', ${templateData.lastUsed}, 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;
      }

    } catch (error) {
      console.error('Template improvement error:', error);
    }
  }

  private calculateTemplateSuccessRate(ticketType: TicketType): number {
    if (!this.trainingSet) return 0;

    const relevantCases = this.trainingSet.cases.filter(c => c.ticketType === ticketType);
    const successfulCases = relevantCases.filter(c => c.outcome === 'Successful');

    return relevantCases.length > 0 ? successfulCases.length / relevantCases.length : 0;
  }

  private async updateModelMetrics() {
    if (!this.trainingSet) return;

    const metrics = TrainingDataMapper.toDbMetrics(this.trainingSet.performanceMetrics);

    const existingMetrics = await prisma.$queryRaw`
      SELECT id FROM ModelMetrics WHERE id = 'current' LIMIT 1
    `;

    if (existingMetrics && Array.isArray(existingMetrics) && existingMetrics.length > 0) {
      await prisma.$executeRaw`
        UPDATE ModelMetrics
        SET totalCases = ${metrics.totalCases},
            successfulAppeals = ${metrics.successfulAppeals},
            averageSuccessRate = ${metrics.averageSuccessRate},
            commonSuccessFactors = ${metrics.commonSuccessFactors},
            averageFineReduction = ${metrics.averageFineReduction},
            typicalProcessingTime = ${metrics.typicalProcessingTime},
            confidenceScore = ${metrics.confidenceScore},
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = 'current'
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO ModelMetrics (
          id, totalCases, successfulAppeals, averageSuccessRate,
          commonSuccessFactors, averageFineReduction, typicalProcessingTime,
          confidenceScore, createdAt, updatedAt
        ) VALUES (
          'current', ${metrics.totalCases}, ${metrics.successfulAppeals},
          ${metrics.averageSuccessRate}, ${metrics.commonSuccessFactors},
          ${metrics.averageFineReduction}, ${metrics.typicalProcessingTime},
          ${metrics.confidenceScore}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
    }
  }

  async generateAppealLetter(appeal: AppealDetails): Promise<string> {
    try {
      // Get relevant template
      const template = this.templates.get(appeal.ticketType);
      
      if (!template) {
        throw new Error('No template found for this ticket type');
      }

      // Get relevant successful cases
      const similarCases = this.findSimilarCases(appeal);

      // Use OpenAI to generate customized letter
      const prompt = `Generate an appeal letter for this traffic ticket using our template and similar successful cases:

Template:
${template.template}

Similar Successful Cases:
${similarCases.map(c => c.appealLetter).join('\n\n')}

Current Appeal Details:
Ticket Type: ${appeal.ticketType}
Circumstances: ${appeal.circumstances}
Evidence Available: ${appeal.evidenceAvailable.join(', ')}
Location: ${appeal.location}
Date: ${appeal.date}
Time: ${appeal.time}

Generate a persuasive appeal letter incorporating successful elements from similar cases while maintaining authenticity and specificity to this case.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert legal appeal writer. Generate a compelling and personalized appeal letter using our proven template and successful cases as reference."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Failed to generate appeal letter - no content received');
      }
      return content;

    } catch (error) {
      console.error('Letter generation error:', error);
      throw new Error('Failed to generate appeal letter');
    }
  }

  private findSimilarCases(appeal: AppealDetails): TrainingCase[] {
    if (!this.trainingSet) return [];

    return this.trainingSet.cases
      .filter(c => 
        c.outcome === 'Successful' &&
        c.ticketType === appeal.ticketType &&
        this.calculateSimilarity(c, appeal) > 0.7
      )
      .sort((a, b) => this.calculateSimilarity(b, appeal) - this.calculateSimilarity(a, appeal))
      .slice(0, 3);
  }

  private calculateSimilarity(case1: TrainingCase, case2: AppealDetails): number {
    const evidenceMatch = case1.evidenceProvided.filter(e => 
      case2.evidenceAvailable.includes(e as EvidenceType)
    ).length / Math.max(case1.evidenceProvided.length, case2.evidenceAvailable.length);

    const circumstancesSimilarity = this.calculateTextSimilarity(
      case1.circumstances.toLowerCase(),
      case2.circumstances.toLowerCase()
    );

    return (evidenceMatch * 0.4 + circumstancesSimilarity * 0.6);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}
