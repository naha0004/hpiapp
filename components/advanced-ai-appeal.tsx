'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Clock,
  FileText, 
  Copy,
  Zap,
  Target,
  Scale,
  AlertTriangle,
  Camera,
  Calendar,
  MapPin,
  Download,
  Sparkles
} from 'lucide-react';
import { APPEAL_GROUNDS } from '@/lib/appeal-grounds';

// Quick scenarios for instant appeal generation
const QUICK_SCENARIOS = [
  {
    id: 'payment_machine_broken',
    title: 'Payment Machine Not Working',
    icon: <AlertTriangle className="w-6 h-6" />,
    description: 'Machine was broken/out of order',
    urgency: 'high',
    estimatedSuccess: 92,
    groundIds: ['A3', 'A4'],
    quickQuestions: [
      { q: 'Was there an "Out of Order" sign?', type: 'yesno' },
      { q: 'Did you try alternative payment methods?', type: 'yesno' },
      { q: 'Do you have photos of the broken machine?', type: 'yesno' }
    ]
  },
  {
    id: 'valid_ticket_displayed',
    title: 'Had Valid Ticket/Permit',
    icon: <CheckCircle2 className="w-6 h-6" />,
    description: 'Valid payment was displayed',
    urgency: 'high',
    estimatedSuccess: 95,
    groundIds: ['A2'],
    quickQuestions: [
      { q: 'What type of permit/ticket?', type: 'select', options: ['Pay & Display', 'Resident Permit', 'Blue Badge', 'Business Permit'] },
      { q: 'Was it clearly visible?', type: 'yesno' },
      { q: 'Do you have photos of the displayed ticket?', type: 'yesno' }
    ]
  },
  {
    id: 'unclear_signage',
    title: 'Confusing/Missing Signs',
    icon: <AlertTriangle className="w-6 h-6" />,
    description: 'Signs were unclear or missing',
    urgency: 'high',
    estimatedSuccess: 88,
    groundIds: ['B1', 'B2'],
    quickQuestions: [
      { q: 'What was wrong with the signs?', type: 'select', options: ['No signs visible', 'Faded/illegible', 'Contradictory', 'Blocked by obstruction'] },
      { q: 'Do you have photos of the sign issues?', type: 'yesno' },
      { q: 'Were other drivers also confused?', type: 'yesno' }
    ]
  },
  {
    id: 'medical_emergency',
    title: 'Medical Emergency',
    icon: <Clock className="w-6 h-6" />,
    description: 'Emergency situation required immediate action',
    urgency: 'medium',
    estimatedSuccess: 75,
    groundIds: ['E21', 'E22'],
    quickQuestions: [
      { q: 'Type of emergency?', type: 'select', options: ['Medical emergency', 'Hospital visit', 'Assisting someone', 'Emergency services'] },
      { q: 'Do you have medical documentation?', type: 'yesno' },
      { q: 'How long were you parked?', type: 'time' }
    ]
  },
  {
    id: 'loading_unloading',
    title: 'Loading/Unloading',
    icon: <ArrowRight className="w-6 h-6" />,
    description: 'Briefly loading or unloading items',
    urgency: 'medium',
    estimatedSuccess: 70,
    groundIds: ['A5', 'E23'],
    quickQuestions: [
      { q: 'What were you loading/unloading?', type: 'text' },
      { q: 'How long did it take?', type: 'time' },
      { q: 'Were hazard lights on?', type: 'yesno' }
    ]
  },
  {
    id: 'incorrect_details',
    title: 'Wrong Vehicle Details',
    icon: <FileText className="w-6 h-6" />,
    description: 'PCN has incorrect information',
    urgency: 'high',
    estimatedSuccess: 98,
    groundIds: ['C1', 'C2'],
    quickQuestions: [
      { q: 'What details are wrong?', type: 'select', options: ['Registration number', 'Vehicle make/model', 'Time/date', 'Location'] },
      { q: 'Do you have photos proving the error?', type: 'yesno' }
    ]
  }
];

interface QuickAnswer {
  question: string;
  answer: string;
  confidence: number;
}

interface AppealData {
  scenario: string;
  answers: QuickAnswer[];
  vehicleReg: string;
  date: string;
  location: string;
  additionalInfo: string;
}

export default function AdvancedAiAppeal() {
  const [step, setStep] = useState<'scenario' | 'questions' | 'details' | 'preview' | 'result'>('scenario');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuickAnswer[]>([]);
  const [appealData, setAppealData] = useState<AppealData>({
    scenario: '',
    answers: [],
    vehicleReg: '',
    date: '',
    location: '',
    additionalInfo: ''
  });
  const [generatedAppeal, setGeneratedAppeal] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const scenario = QUICK_SCENARIOS.find(s => s.id === selectedScenario);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (step === 'questions' && scenario) {
        const question = scenario.quickQuestions[currentQuestion];
        
        if (question.type === 'yesno') {
          if (e.key === 'y' || e.key === 'Y' || e.key === '1') {
            handleAnswer('Yes');
          } else if (e.key === 'n' || e.key === 'N' || e.key === '2') {
            handleAnswer('No');
          }
        } else if (question.type === 'select' && question.options) {
          const num = parseInt(e.key);
          if (num >= 1 && num <= question.options.length) {
            handleAnswer(question.options[num - 1]);
          }
        } else if (question.type === 'time') {
          const timeOptions = ['Less than 5 minutes', '5-15 minutes', '15-30 minutes', 'More than 30 minutes'];
          const num = parseInt(e.key);
          if (num >= 1 && num <= timeOptions.length) {
            handleAnswer(timeOptions[num - 1]);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [step, currentQuestion, scenario]);

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setStep('questions');
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const handleAnswer = (answer: string, confidence: number = 90) => {
    if (!scenario) return;
    
    const question = scenario.quickQuestions[currentQuestion];
    const newAnswer: QuickAnswer = {
      question: question.q,
      answer,
      confidence
    };
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = newAnswer;
    setAnswers(newAnswers);
    
    // Add visual feedback
    const buttons = document.querySelectorAll('button[data-answer]');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-answer') === answer) {
        btn.classList.add('bg-green-600', 'text-white', 'scale-105');
      }
    });
    
    // Auto-advance to next question after short delay
    setTimeout(() => {
      if (currentQuestion < scenario.quickQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setStep('details');
      }
    }, 500);
  };

  const generateAppeal = async () => {
    if (!scenario) return;
    
    setIsGenerating(true);
    
    // Get relevant appeal grounds
    const relevantGrounds = APPEAL_GROUNDS.filter(ground => 
      scenario.groundIds.includes(ground.id)
    ).slice(0, 3);
    
    const primaryGround = relevantGrounds[0];
    
    // Generate professional appeal letter
    const template = primaryGround?.appealTemplate;
    if (template) {
      let appeal = template.opening + "\n\n";
      appeal += template.legalArgument + "\n\n";
      
      // Add specific details based on answers
      appeal += "SPECIFIC CIRCUMSTANCES:\n";
      answers.forEach((answer, index) => {
        appeal += `• ${answer.question}: ${answer.answer}\n`;
      });
      appeal += "\n";
      
      // Add evidence section
      appeal += template.evidenceSection.replace('[EVIDENCE_LIST]', 
        answers.filter(a => a.answer.toLowerCase().includes('yes') || a.answer.includes('photo'))
          .map(a => `• ${a.question} - ${a.answer}`)
          .join('\n')
      );
      appeal += "\n\n";
      
      // Add legal references
      if (primaryGround.caseReferences) {
        appeal += "LEGAL REFERENCES:\n";
        primaryGround.caseReferences.forEach(ref => {
          appeal += `• ${ref}\n`;
        });
        appeal += "\n";
      }
      
      appeal += template.conclusion;
      
      // Replace placeholders
      appeal = appeal
        .replace(/\[DATE\]/g, appealData.date || '[DATE OF PCN]')
        .replace(/\[REGISTRATION\]/g, appealData.vehicleReg || '[VEHICLE REGISTRATION]')
        .replace(/\[LOCATION\]/g, appealData.location || '[PARKING LOCATION]');
      
      setGeneratedAppeal(appeal);
    }
    
    setStep('result');
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedAppeal);
  };

  const resetProcess = () => {
    setStep('scenario');
    setSelectedScenario('');
    setCurrentQuestion(0);
    setAnswers([]);
    setAppealData({
      scenario: '',
      answers: [],
      vehicleReg: '',
      date: '',
      location: '',
      additionalInfo: ''
    });
    setGeneratedAppeal('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Advanced AI Appeal Assistant</h1>
          </div>
          <p className="text-gray-600">Quick, professional parking ticket appeals with 90%+ success rate</p>
        </div>

        {/* Step: Scenario Selection */}
        {step === 'scenario' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              What happened? Choose your situation:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {QUICK_SCENARIOS.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-500 group bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50"
                  onClick={() => handleScenarioSelect(scenario.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center mb-6 text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                      <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors duration-200">
                        {scenario.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-900">{scenario.title}</h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">{scenario.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={scenario.urgency === 'high' ? 'destructive' : 'secondary'} className="text-xs px-3 py-1">
                        {scenario.urgency} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 px-3 py-1">
                        {scenario.estimatedSuccess}% success
                      </Badge>
                    </div>
                    <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700 font-medium text-sm">
                      Click to select
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step: Quick Questions */}
        {step === 'questions' && scenario && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">{scenario.title}</h2>
                <Badge variant="outline">
                  {currentQuestion + 1} of {scenario.quickQuestions.length}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / scenario.quickQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium text-gray-900">
                    {scenario.quickQuestions[currentQuestion].q}
                  </h3>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Use keyboard: 1, 2, 3... or Y/N
                  </div>
                </div>

                {scenario.quickQuestions[currentQuestion].type === 'yesno' && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => handleAnswer('Yes')}
                      data-answer="Yes"
                      className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-green-300"
                    >
                      <CheckCircle2 className="mr-4 h-8 w-8" />
                      Yes
                      <kbd className="ml-auto px-2 py-1 bg-green-500 text-xs rounded opacity-75">Y or 1</kbd>
                    </Button>
                    <Button
                      onClick={() => handleAnswer('No')}
                      data-answer="No"
                      variant="outline"
                      className="w-full h-16 text-xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:ring-4 focus:ring-blue-300"
                    >
                      <AlertTriangle className="mr-4 h-8 w-8 text-gray-500" />
                      No
                      <kbd className="ml-auto px-2 py-1 bg-gray-200 text-xs rounded text-gray-600">N or 2</kbd>
                    </Button>
                  </div>
                )}

                {scenario.quickQuestions[currentQuestion].type === 'select' && (
                  <div className="space-y-3">
                    {scenario.quickQuestions[currentQuestion].options?.map((option, index) => (
                      <Button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        data-answer={option}
                        variant="outline"
                        className="w-full h-16 text-lg justify-start border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-6 focus:ring-4 focus:ring-blue-300"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{option}</span>
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                {scenario.quickQuestions[currentQuestion].type === 'time' && (
                  <div className="space-y-3">
                    {['Less than 5 minutes', '5-15 minutes', '15-30 minutes', 'More than 30 minutes'].map((time, index) => (
                      <Button
                        key={time}
                        onClick={() => handleAnswer(time)}
                        data-answer={time}
                        variant="outline"
                        className="w-full h-16 text-lg justify-start border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-6 focus:ring-4 focus:ring-blue-300"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Clock className="mr-4 h-6 w-6 text-blue-600" />
                            {time}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors">
                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                {scenario.quickQuestions[currentQuestion].type === 'text' && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Please provide details..."
                      className="min-h-20"
                      id="textAnswer"
                    />
                    <Button
                      onClick={() => {
                        const textarea = document.getElementById('textAnswer') as HTMLTextAreaElement;
                        handleAnswer(textarea.value || 'Not specified');
                      }}
                      className="w-full h-12"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between mt-6">
              <Button
                onClick={() => currentQuestion > 0 ? setCurrentQuestion(currentQuestion - 1) : setStep('scenario')}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep('details')}
                variant="outline"
              >
                Skip Questions
              </Button>
            </div>
          </div>
        )}

        {/* Step: Additional Details */}
        {step === 'details' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Final Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="inline w-4 h-4 mr-2" />
                    Vehicle Registration
                  </label>
                  <Input
                    value={appealData.vehicleReg}
                    onChange={(e) => setAppealData(prev => ({ ...prev, vehicleReg: e.target.value.toUpperCase() }))}
                    placeholder="AB12 CDE"
                    className="text-center font-mono text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Date of PCN
                  </label>
                  <Input
                    type="date"
                    value={appealData.date}
                    onChange={(e) => setAppealData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Location
                </label>
                <Input
                  value={appealData.location}
                  onChange={(e) => setAppealData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Street name, area, or car park name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </label>
                <Textarea
                  value={appealData.additionalInfo}
                  onChange={(e) => setAppealData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Any other relevant details..."
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <Button
                onClick={() => setStep('questions')}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={generateAppeal}
                disabled={!appealData.vehicleReg || !appealData.date}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Zap className="mr-2 h-5 w-5" />
                Generate Professional Appeal
              </Button>
            </div>
          </div>
        )}

        {/* Step: Generated Appeal */}
        {step === 'result' && (
          <div>
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Your Professional Appeal is Ready!
              </h2>
              <p className="text-gray-600">
                Based on {scenario?.estimatedSuccess}% success rate for similar cases
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Appeal Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg mb-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                    {generatedAppeal}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button onClick={copyToClipboard} className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download as PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button onClick={resetProcess} variant="outline">
                Create Another Appeal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
