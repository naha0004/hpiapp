"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ChevronRight, 
  RotateCcw, 
  Target, 
  FileText, 
  Copy,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { APPEAL_GROUNDS, getStrongestGrounds, searchAppealGrounds } from "@/lib/appeal-grounds";

interface AppealResult {
  recommendation: string;
  confidence: number;
  reasoning: string[];
  suggestedEvidence: string[];
  legalGrounds: Array<{
    id: string;
    title: string;
    legalStrength: string;
    category: string;
    evidenceRequired: string[];
  }>;
  successProbability: number;
  riskFactors: string[];
  appealLetter: string;
}

interface QuizState {
  currentQuestion: number;
  answers: Record<string, any>;
  completed: boolean;
}

const APPEAL_QUIZ = [
  {
    id: 'incident_type',
    question: 'What type of parking situation was this?',
    type: 'radio',
    options: [
      { value: 'paid_parking', label: 'I paid for parking but still got a ticket', keywords: ['payment', 'paid', 'ticket displayed'] },
      { value: 'no_payment', label: 'I forgot to pay or ran out of time', keywords: ['expired', 'forgot'] },
      { value: 'loading', label: 'I was loading/unloading goods or passengers', keywords: ['loading', 'unloading', 'delivery'] },
      { value: 'disabled', label: 'I have a disability permit/blue badge', keywords: ['disabled', 'blue badge', 'disability'] },
      { value: 'emergency', label: 'It was an emergency situation', keywords: ['emergency', 'medical', 'hospital'] },
      { value: 'signage', label: 'The parking signs were unclear/missing', keywords: ['sign', 'unclear', 'missing', 'faded'] },
      { value: 'breakdown', label: 'My vehicle broke down', keywords: ['breakdown', 'fault', 'mechanical'] },
      { value: 'other', label: 'Other circumstances', keywords: [] }
    ]
  },
  {
    id: 'payment_details',
    question: 'What happened with your parking payment?',
    type: 'radio',
    showIf: (answers: any) => answers.incident_type === 'paid_parking',
    options: [
      { value: 'valid_displayed', label: 'I had a valid ticket properly displayed', keywords: ['ticket displayed', 'valid payment'] },
      { value: 'payment_machine_fault', label: 'The payment machine was broken/not working', keywords: ['machine fault', 'payment failure'] },
      { value: 'app_payment', label: 'I paid via mobile app but it may not have registered', keywords: ['mobile payment', 'app payment'] },
      { value: 'wrong_location', label: 'I may have paid for the wrong zone/location', keywords: ['wrong zone', 'location error'] },
      { value: 'receipt_issue', label: 'I have proof of payment but ticket wasn\'t displayed properly', keywords: ['receipt', 'proof of payment'] }
    ]
  },
  {
    id: 'emergency_type',
    question: 'What type of emergency was it?',
    type: 'radio',
    showIf: (answers: any) => answers.incident_type === 'emergency',
    options: [
      { value: 'medical_emergency', label: 'Medical emergency - rushing someone to hospital', keywords: ['medical emergency', 'hospital'] },
      { value: 'personal_emergency', label: 'Personal/family emergency', keywords: ['family emergency', 'personal emergency'] },
      { value: 'emergency_services', label: 'Assisting emergency services', keywords: ['emergency services', 'police', 'ambulance'] },
      { value: 'child_emergency', label: 'Child-related emergency', keywords: ['child emergency'] }
    ]
  },
  {
    id: 'signage_issue',
    question: 'What was wrong with the parking signage?',
    type: 'radio',
    showIf: (answers: any) => answers.incident_type === 'signage',
    options: [
      { value: 'no_signs', label: 'No parking restriction signs visible', keywords: ['no signs', 'missing signs'] },
      { value: 'faded_signs', label: 'Signs were faded or illegible', keywords: ['faded', 'illegible', 'unclear'] },
      { value: 'confusing_signs', label: 'Signs were confusing or contradictory', keywords: ['confusing', 'contradictory'] },
      { value: 'obscured_signs', label: 'Signs were blocked by trees/vehicles', keywords: ['obscured', 'blocked'] }
    ]
  },
  {
    id: 'evidence_available',
    question: 'What evidence do you have? (Select all that apply)',
    type: 'checkbox',
    options: [
      { value: 'photos_scene', label: 'Photos of the parking scene' },
      { value: 'photos_ticket', label: 'Photos of displayed parking ticket' },
      { value: 'photos_signs', label: 'Photos of parking signs' },
      { value: 'payment_receipt', label: 'Payment receipt or proof' },
      { value: 'bank_statement', label: 'Bank/card statement showing payment' },
      { value: 'medical_records', label: 'Medical documentation (if emergency)' },
      { value: 'witness_details', label: 'Witness contact information' },
      { value: 'blue_badge', label: 'Disability permit/blue badge' },
      { value: 'breakdown_docs', label: 'Breakdown service documentation' },
      { value: 'other_evidence', label: 'Other supporting documents' }
    ]
  },
  {
    id: 'timing',
    question: 'When did this incident occur?',
    type: 'radio',
    options: [
      { value: 'within_14_days', label: 'Within the last 14 days' },
      { value: 'within_28_days', label: '15-28 days ago' },
      { value: 'within_56_days', label: '29-56 days ago' },
      { value: 'over_56_days', label: 'More than 56 days ago' }
    ]
  },
  {
    id: 'previous_appeals',
    question: 'Have you appealed this PCN before?',
    type: 'radio',
    options: [
      { value: 'first_appeal', label: 'No, this is my first appeal' },
      { value: 'informal_rejected', label: 'Yes, informal challenge was rejected' },
      { value: 'formal_rejected', label: 'Yes, formal appeal was rejected' },
      { value: 'tribunal_rejected', label: 'Yes, tribunal appeal was rejected' }
    ]
  }
];

const EVIDENCE_MAPPING = {
  photos_scene: 'Photographs of parking location and vehicle',
  photos_ticket: 'Photographs of displayed parking ticket',
  photos_signs: 'Photographs of parking signage',
  payment_receipt: 'Parking payment receipts',
  bank_statement: 'Bank statements showing payment',
  medical_records: 'Medical documentation',
  witness_details: 'Witness statements',
  blue_badge: 'Blue badge documentation',
  breakdown_docs: 'Breakdown service records',
  other_evidence: 'Additional supporting documentation'
};

export function AIAppeal(): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AppealResult | null>(null);
  const [activeTab, setActiveTab] = React.useState<'form' | 'quiz'>('form');
  const [quizState, setQuizState] = React.useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    completed: false
  });
  const [ticketDetails, setTicketDetails] = React.useState({
    ticketType: '',
    date: '',
    location: '',
    circumstances: '',
    evidenceAvailable: [] as string[]
  });

  const ticketTypes = [
    'Parking Violation',
    'Speeding',
    'Red Light',
    'No MOT',
    'No Insurance',
    'Other Traffic Violation'
  ];

  const evidenceTypes = [
    'Photos',
    'Video',
    'Witness Statements',
    'Receipts',
    'Medical Documents',
    'Other Documentation'
  ];

  // Quiz functions
  const handleQuizAnswer = (questionId: string, answer: any) => {
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }));
  };

  const nextQuestion = () => {
    const currentQ = APPEAL_QUIZ[quizState.currentQuestion];
    const nextIndex = quizState.currentQuestion + 1;
    
    // Skip questions based on conditions
    let actualNextIndex = nextIndex;
    while (actualNextIndex < APPEAL_QUIZ.length) {
      const nextQ = APPEAL_QUIZ[actualNextIndex];
      if (!nextQ.showIf || nextQ.showIf(quizState.answers)) {
        break;
      }
      actualNextIndex++;
    }
    
    if (actualNextIndex >= APPEAL_QUIZ.length) {
      setQuizState(prev => ({ ...prev, completed: true }));
      analyzeQuizResults();
    } else {
      setQuizState(prev => ({ ...prev, currentQuestion: actualNextIndex }));
    }
  };

  const prevQuestion = () => {
    if (quizState.currentQuestion > 0) {
      // Find the previous valid question
      let prevIndex = quizState.currentQuestion - 1;
      while (prevIndex >= 0) {
        const prevQ = APPEAL_QUIZ[prevIndex];
        if (!prevQ.showIf || prevQ.showIf(quizState.answers)) {
          break;
        }
        prevIndex--;
      }
      
      if (prevIndex >= 0) {
        setQuizState(prev => ({ ...prev, currentQuestion: prevIndex }));
      }
    }
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      answers: {},
      completed: false
    });
    setResult(null);
  };

  const analyzeQuizResults = () => {
    setLoading(true);
    try {
      const result = analyzeQuizAnswers(quizState.answers);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the quiz');
    } finally {
      setLoading(false);
    }
  };

  const analyzeQuizAnswers = (answers: Record<string, any>): AppealResult => {
    // Build search keywords based on answers
    const keywords: string[] = [];
    
    // Get keywords from selected options
    APPEAL_QUIZ.forEach(question => {
      const answer = answers[question.id];
      if (!answer) return;
      
      if (question.type === 'radio') {
        const selectedOption = question.options?.find(opt => opt.value === answer);
        if (selectedOption && 'keywords' in selectedOption && Array.isArray(selectedOption.keywords)) {
          keywords.push(...selectedOption.keywords);
        }
      }
    });
    
    // Add incident type specific keywords
    switch (answers.incident_type) {
      case 'paid_parking':
        keywords.push('payment', 'paid');
        if (answers.payment_details) {
          keywords.push(answers.payment_details.replace('_', ' '));
        }
        break;
      case 'emergency':
        keywords.push('emergency');
        if (answers.emergency_type) {
          keywords.push(answers.emergency_type.replace('_', ' '));
        }
        break;
      case 'signage':
        keywords.push('signs', 'signage');
        if (answers.signage_issue) {
          keywords.push(answers.signage_issue.replace('_', ' '));
        }
        break;
    }
    
    // Find relevant legal grounds
    const searchText = keywords.join(' ');
    const relevantGrounds = searchAppealGrounds(searchText);
    const strongestGrounds = getStrongestGrounds().filter(ground => 
      relevantGrounds.some(rg => rg.id === ground.id)
    );
    
    // Calculate success probability
    let successProbability = 0.3;
    const legalGrounds = [];
    
    // Higher probability for statutory grounds
    if (strongestGrounds.length > 0) {
      successProbability += 0.4;
      legalGrounds.push(...strongestGrounds.slice(0, 2).map(ground => ({
        id: ground.id,
        title: ground.title,
        legalStrength: ground.legalStrength,
        category: ground.category,
        evidenceRequired: ground.evidenceRequired
      })));
    } else if (relevantGrounds.length > 0) {
      successProbability += 0.2;
      legalGrounds.push(...relevantGrounds.slice(0, 2).map(ground => ({
        id: ground.id,
        title: ground.title,
        legalStrength: ground.legalStrength,
        category: ground.category,
        evidenceRequired: ground.evidenceRequired
      })));
    }
    
    // Evidence boost
    const evidenceCount = Array.isArray(answers.evidence_available) ? answers.evidence_available.length : 0;
    if (evidenceCount > 3) successProbability += 0.2;
    else if (evidenceCount > 1) successProbability += 0.1;
    
    // Timing penalty
    const timingPenalties: Record<string, number> = {
      'within_14_days': 0,
      'within_28_days': -0.05,
      'within_56_days': -0.1,
      'over_56_days': -0.2
    };
    const timingPenalty = timingPenalties[answers.timing as string] || 0;
    successProbability += timingPenalty;
    
    // Previous appeal penalty
    const appealPenalties: Record<string, number> = {
      'first_appeal': 0,
      'informal_rejected': -0.1,
      'formal_rejected': -0.2,
      'tribunal_rejected': -0.3
    };
    const appealPenalty = appealPenalties[answers.previous_appeals as string] || 0;
    successProbability += appealPenalty;
    
    successProbability = Math.min(0.95, Math.max(0.05, successProbability));
    const confidence = Math.min(0.95, successProbability + 0.1);
    
    // Generate reasoning
    const reasoning = [];
    if (legalGrounds.length > 0) {
      const primaryGround = legalGrounds[0];
      reasoning.push(`Strong legal ground identified: ${primaryGround.title}`);
      reasoning.push(`This is a ${primaryGround.category} ground with ${primaryGround.legalStrength} legal strength`);
    }
    
    if (evidenceCount > 2) {
      reasoning.push(`Good evidence collection (${evidenceCount} types of evidence)`);
    }
    
    if (answers.previous_appeals === 'first_appeal') {
      reasoning.push('First appeal attempt - no previous rejections');
    }
    
    // Risk factors
    const riskFactors = [];
    if (evidenceCount < 2) {
      riskFactors.push('Limited evidence may weaken the case');
    }
    if (answers.timing === 'over_56_days') {
      riskFactors.push('Late appeal submission may face procedural challenges');
    }
    if (answers.previous_appeals !== 'first_appeal') {
      riskFactors.push('Previous appeal rejection may reduce credibility');
    }
    
    // Get evidence list
    const selectedEvidence = Array.isArray(answers.evidence_available) ? answers.evidence_available : [];
    const suggestedEvidence = selectedEvidence.map(key => EVIDENCE_MAPPING[key as keyof typeof EVIDENCE_MAPPING] || key);
    
    // Generate appeal letter
    const appealLetter = generateQuizAppealLetter(answers, legalGrounds[0]);
    
    let recommendation = '';
    if (successProbability > 0.7) {
      recommendation = 'Strong case for appeal - high probability of success based on your circumstances';
    } else if (successProbability > 0.5) {
      recommendation = 'Moderate case for appeal - worth pursuing with the evidence you have';
    } else {
      recommendation = 'Challenging case - consider gathering additional evidence or seeking legal advice';
    }

    return {
      recommendation,
      confidence,
      reasoning,
      suggestedEvidence,
      legalGrounds,
      successProbability,
      riskFactors,
      appealLetter
    };
  };

  const generateQuizAppealLetter = (answers: Record<string, any>, primaryGround: any): string => {
    const incidentDescription = getIncidentDescription(answers);
    const evidenceList = Array.isArray(answers.evidence_available) 
      ? answers.evidence_available.map(key => EVIDENCE_MAPPING[key as keyof typeof EVIDENCE_MAPPING] || key)
      : [];
    
    if (!primaryGround) {
      return `PARKING CHARGE NOTICE APPEAL

Dear Sir/Madam,

I am writing to formally appeal the Penalty Charge Notice issued for the following reasons:

CIRCUMSTANCES:
${incidentDescription}

EVIDENCE PROVIDED:
${evidenceList.map(evidence => `• ${evidence}`).join('\n') || '• Evidence as described above'}

I believe these circumstances provide valid grounds for appeal and respectfully request that you cancel this Penalty Charge Notice.

I look forward to your response within the statutory timeframe.

Yours faithfully,
[Your Name]
[Date]`;
    }

    return `PARKING CHARGE NOTICE APPEAL

Dear Sir/Madam,

I am writing to formally appeal the Penalty Charge Notice issued for the following reasons:

PRIMARY LEGAL GROUND: ${primaryGround.title}
Legal Basis: ${primaryGround.category === 'statutory' ? 'Statutory Ground' : 'Mitigating Circumstances'}
Legal Strength: ${primaryGround.legalStrength.toUpperCase()}

CIRCUMSTANCES:
${incidentDescription}

The circumstances described constitute valid grounds for appeal under UK parking regulations. This case falls under ${primaryGround.category} grounds, which carry ${primaryGround.legalStrength} legal weight.

EVIDENCE PROVIDED:
${evidenceList.map(evidence => `• ${evidence}`).join('\n') || '• Evidence as described above'}

REQUESTED REMEDY:
I respectfully request that you cancel this Penalty Charge Notice based on the legal grounds and evidence presented above.

I look forward to your response within the statutory timeframe.

Yours faithfully,
[Your Name]
[Date]

LEGAL REFERENCE: ${primaryGround.id} - ${primaryGround.title}`;
  };

  const getIncidentDescription = (answers: Record<string, any>): string => {
    let description = '';
    
    switch (answers.incident_type) {
      case 'paid_parking':
        description = 'I had paid for parking as required. ';
        switch (answers.payment_details) {
          case 'valid_displayed':
            description += 'I had a valid parking ticket properly displayed on my dashboard, yet still received a PCN.';
            break;
          case 'payment_machine_fault':
            description += 'The payment machine was not working properly, preventing me from making payment.';
            break;
          case 'app_payment':
            description += 'I made payment via the mobile app, but this may not have registered correctly in the system.';
            break;
          case 'wrong_location':
            description += 'I may have inadvertently paid for the wrong parking zone due to unclear signage.';
            break;
          case 'receipt_issue':
            description += 'I have proof of payment but the ticket may not have been displayed properly.';
            break;
        }
        break;
        
      case 'emergency':
        switch (answers.emergency_type) {
          case 'medical_emergency':
            description = 'This was a medical emergency situation where I was rushing someone to hospital and had to park immediately.';
            break;
          case 'personal_emergency':
            description = 'This was a personal/family emergency that required immediate parking without delay.';
            break;
          case 'emergency_services':
            description = 'I was assisting emergency services and had to park in the restricted area.';
            break;
          case 'child_emergency':
            description = 'This was a child-related emergency that required immediate action.';
            break;
        }
        break;
        
      case 'signage':
        switch (answers.signage_issue) {
          case 'no_signs':
            description = 'There were no visible parking restriction signs in the area where I parked.';
            break;
          case 'faded_signs':
            description = 'The parking restriction signs were faded and illegible, making it impossible to read the restrictions.';
            break;
          case 'confusing_signs':
            description = 'The parking signs were confusing and contradictory, making it unclear what the actual restrictions were.';
            break;
          case 'obscured_signs':
            description = 'The parking signs were blocked by trees, vehicles or other obstructions.';
            break;
        }
        break;
        
      case 'loading':
        description = 'I was actively loading/unloading goods or passengers, which is typically permitted even in restricted areas.';
        break;
        
      case 'disabled':
        description = 'I have a valid disability permit/blue badge and was parked in accordance with disability parking regulations.';
        break;
        
      case 'breakdown':
        description = 'My vehicle suffered a mechanical breakdown and I was unable to move it from the restricted area.';
        break;
        
      default:
        description = 'The circumstances of this parking incident provide grounds for appeal.';
    }
    
    return description;
  };

  async function analyzeAppeal() {
    setLoading(true);
    setError(null);

    try {
      // Built-in AI analysis using legal framework
      const result = analyzeWithLegalFramework(ticketDetails);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the appeal');
    } finally {
      setLoading(false);
    }
  }

  function analyzeWithLegalFramework(details: any): AppealResult {
    const searchText = `${details.circumstances} ${details.ticketType}`;
    const relevantGrounds = searchAppealGrounds(searchText);
    const strongestGrounds = getStrongestGrounds().filter(ground => 
      relevantGrounds.some(rg => rg.id === ground.id)
    );
    
    // Calculate success probability based on legal grounds
    let successProbability = 0.3; // Base probability
    const legalGrounds = [];
    
    if (strongestGrounds.length > 0) {
      successProbability += 0.4; // Strong legal grounds boost
      legalGrounds.push(...strongestGrounds.slice(0, 2).map(ground => ({
        id: ground.id,
        title: ground.title,
        legalStrength: ground.legalStrength,
        category: ground.category,
        evidenceRequired: ground.evidenceRequired
      })));
    } else if (relevantGrounds.length > 0) {
      successProbability += 0.2; // Some legal grounds
      legalGrounds.push(...relevantGrounds.slice(0, 2).map(ground => ({
        id: ground.id,
        title: ground.title,
        legalStrength: ground.legalStrength,
        category: ground.category,
        evidenceRequired: ground.evidenceRequired
      })));
    }
    
    // Evidence quality assessment
    const evidenceCount = details.evidenceAvailable?.length || 0;
    if (evidenceCount > 2) successProbability += 0.15;
    else if (evidenceCount > 0) successProbability += 0.05;
    
    // Timing factor (mock - would use actual dates)
    successProbability += 0.1; // Assume timely submission
    
    const confidence = Math.min(0.95, successProbability + 0.1);
    
    // Generate reasoning based on legal grounds
    const reasoning = [];
    if (legalGrounds.length > 0) {
      const primaryGround = legalGrounds[0];
      reasoning.push(`Strong legal ground identified: ${primaryGround.title}`);
      reasoning.push(`This falls under ${primaryGround.category} grounds with ${primaryGround.legalStrength} legal strength`);
      if (primaryGround.evidenceRequired.length > 0) {
        reasoning.push(`Evidence required: ${primaryGround.evidenceRequired.slice(0, 2).join(', ')}`);
      }
    }
    
    if (evidenceCount > 2) {
      reasoning.push('Good evidence documentation strengthens your case');
    }
    
    // Risk factors
    const riskFactors = [];
    if (evidenceCount < 2) {
      riskFactors.push('Limited evidence may weaken the case');
    }
    if (legalGrounds.length === 0) {
      riskFactors.push('No clear legal grounds identified');
    }
    
    // Generate evidence suggestions
    const suggestedEvidence = new Set<string>();
    legalGrounds.forEach(ground => {
      ground.evidenceRequired.forEach(evidence => suggestedEvidence.add(evidence));
    });
    
    // Generate appeal letter
    const appealLetter = generateAppealLetter(details, legalGrounds[0]);
    
    // Generate recommendation
    let recommendation = '';
    if (successProbability > 0.7) {
      recommendation = 'Strong case for appeal - high probability of success';
    } else if (successProbability > 0.5) {
      recommendation = 'Moderate case for appeal - worth pursuing with proper evidence';
    } else {
      recommendation = 'Weak case for appeal - consider gathering more evidence or legal advice';
    }

    return {
      recommendation,
      confidence,
      reasoning,
      suggestedEvidence: Array.from(suggestedEvidence).slice(0, 5),
      legalGrounds,
      successProbability,
      riskFactors,
      appealLetter
    };
  }

  function generateAppealLetter(details: any, primaryGround: any): string {
    if (!primaryGround) {
      return "Unable to generate specific appeal letter without clear legal grounds.";
    }
    
    return `PARKING CHARGE NOTICE APPEAL

Dear Sir/Madam,

I am writing to formally appeal the Penalty Charge Notice issued on ${details.date || '[DATE]'} for the following reasons:

PRIMARY LEGAL GROUND: ${primaryGround.title}
Legal Basis: ${primaryGround.category === 'statutory' ? 'Statutory Ground' : 'Mitigating Circumstances'}
Legal Strength: ${primaryGround.legalStrength.toUpperCase()}

CIRCUMSTANCES:
${details.circumstances || 'Details of the incident as described above.'}

The circumstances described constitute valid grounds for appeal under UK parking regulations. This case falls under ${primaryGround.category} grounds, which carry ${primaryGround.legalStrength} legal weight.

EVIDENCE PROVIDED:
${(details.evidenceAvailable || []).map((evidence: string) => `• ${evidence}`).join('\n') || '• Evidence as attached'}

REQUESTED REMEDY:
I respectfully request that you cancel this Penalty Charge Notice based on the legal grounds and evidence presented above.

I look forward to your response within the statutory timeframe.

Yours faithfully,
[Your Name]
[Date]

LEGAL REFERENCE: ${primaryGround.id} - ${primaryGround.title}`;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Traffic Ticket Appeal Assistant</h2>
        
        {/* Tab Selection */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'form' | 'quiz')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Detailed Form</TabsTrigger>
            <TabsTrigger value="quiz">Guided Questions</TabsTrigger>
          </TabsList>

          {/* Detailed Form Tab */}
          <TabsContent value="form" className="space-y-6">
            {/* Your existing form content goes here */}
            <div className="space-y-6">
              {/* Ticket Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Ticket
                </label>
                <select
                  value={ticketDetails.ticketType}
                  onChange={(e) => setTicketDetails(prev => ({ ...prev, ticketType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select ticket type...</option>
                  {ticketTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Date and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Incident
                  </label>
                  <input
                    type="date"
                    value={ticketDetails.date}
                    onChange={(e) => setTicketDetails(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={ticketDetails.location}
                    onChange={(e) => setTicketDetails(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Circumstances */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the Circumstances
                </label>
                <textarea
                  value={ticketDetails.circumstances}
                  onChange={(e) => setTicketDetails(prev => ({ ...prev, circumstances: e.target.value }))}
                  placeholder="Please describe what happened in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Evidence Available */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Available
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {evidenceTypes.map(evidence => (
                    <label key={evidence} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticketDetails.evidenceAvailable.includes(evidence)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTicketDetails(prev => ({
                              ...prev,
                              evidenceAvailable: [...prev.evidenceAvailable, evidence]
                            }));
                          } else {
                            setTicketDetails(prev => ({
                              ...prev,
                              evidenceAvailable: prev.evidenceAvailable.filter(item => item !== evidence)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{evidence}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={analyzeAppeal}
                  disabled={loading || (!ticketDetails.ticketType || !ticketDetails.circumstances)}
                  className="px-8 py-3 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Appeal
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Guided Quiz Tab */}
          <TabsContent value="quiz">
            {!quizState.completed ? (
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">
                      Question {quizState.currentQuestion + 1} of {APPEAL_QUIZ.length}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((quizState.currentQuestion + 1) / APPEAL_QUIZ.length) * 100}%` }}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetQuiz}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const currentQuestion = APPEAL_QUIZ[quizState.currentQuestion];
                    const currentAnswer = quizState.answers[currentQuestion.id];

                    return (
                      <>
                        <h3 className="text-xl font-medium text-gray-900">
                          {currentQuestion.question}
                        </h3>

                        {currentQuestion.type === 'radio' && (
                          <RadioGroup 
                            value={currentAnswer || ''}
                            onValueChange={(value) => handleQuizAnswer(currentQuestion.id, value)}
                          >
                            <div className="space-y-3">
                              {currentQuestion.options?.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <RadioGroupItem 
                                    value={option.value} 
                                    id={option.value}
                                    className="mt-0.5"
                                  />
                                  <Label 
                                    htmlFor={option.value}
                                    className="text-sm cursor-pointer leading-relaxed"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}

                        {currentQuestion.type === 'checkbox' && (
                          <div className="space-y-3">
                            {currentQuestion.options?.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={option.value}
                                  checked={(currentAnswer as string[] || []).includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    const currentSelection = (currentAnswer as string[]) || [];
                                    if (checked) {
                                      handleQuizAnswer(currentQuestion.id, [...currentSelection, option.value]);
                                    } else {
                                      handleQuizAnswer(currentQuestion.id, currentSelection.filter(v => v !== option.value));
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor={option.value}
                                  className="text-sm cursor-pointer leading-relaxed"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between pt-6">
                          <Button
                            variant="outline"
                            onClick={prevQuestion}
                            disabled={quizState.currentQuestion === 0}
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={nextQuestion}
                            disabled={!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
                          >
                            {quizState.currentQuestion === APPEAL_QUIZ.length - 1 ? (
                              loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  Generate Appeal
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                              )
                            ) : (
                              <>
                                Next
                                <ChevronRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz Complete!</h3>
                <p className="text-gray-600 mb-6">Analyzing your responses to generate your personalized appeal...</p>
                <Button onClick={resetQuiz} variant="outline">
                  Start Over
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Analysis Results */}
        {result && (
          <div className="mt-8 space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-xl text-green-800 flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Success Probability: {result.successProbability}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Legal Grounds:</h4>
                    <div className="space-y-2">
                      {result.legalGrounds.slice(0, 3).map((ground, index: number) => (
                        <div key={ground.id} className="flex items-start space-x-3">
                          <Badge variant="secondary" className="mt-0.5">
                            {index + 1}
                          </Badge>
                          <div>
                            <h5 className="font-medium text-gray-900">{ground.title}</h5>
                            <p className="text-sm text-gray-600">{ground.category}</p>
                            <p className="text-xs text-green-600 mt-1">
                              Strength: {ground.legalStrength}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {result.suggestedEvidence.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommended Evidence:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {result.suggestedEvidence.map((evidence: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600">{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {result.appealLetter && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Your Appeal Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                      {result.appealLetter}
                    </pre>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => navigator.clipboard.writeText(result.appealLetter || '')}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
