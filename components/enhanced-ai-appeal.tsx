"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Brain, 
  Scale, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  Loader2,
  ChevronRight,
  BookOpen,
  Lightbulb
} from "lucide-react"
import { AIAppealPredictor } from "@/lib/enhanced-ai-appeal-predictor"

interface AppealAnalysis {
  successProbability: number
  confidence: number
  recommendedGrounds: Array<{
    id: string
    title: string
    section: string
    legalStrength: 'high' | 'medium' | 'low'
    category: 'statutory' | 'mitigating'
    description: string
    evidenceRequired: string[]
  }>
  keyFactors: string[]
  evidenceNeeded: string[]
  riskFactors: string[]
  legalStrategy: string
  appealLetter: string
  priorityActions: string[]
}

const evidenceOptions = [
  'Photographs of the scene',
  'Video footage',
  'Parking receipts',
  'Payment confirmations',
  'Medical records',
  'Hospital documentation',
  'Witness statements',
  'Professional correspondence',
  'Vehicle breakdown records',
  'Blue badge documentation',
  'Parking permit',
  'Delivery/loading documentation',
  'Emergency service records',
  'Timestamp evidence',
  'Bank statements'
]

const circumstanceOptions = [
  'Medical emergency',
  'Hospital visit',
  'Vehicle breakdown',
  'Accident involvement',
  'Emergency services assistance',
  'Disabled parking (blue badge)',
  'Loading/unloading',
  'Delivery requirements',
  'Sign visibility issues',
  'Payment system failure',
  'Urgent personal matter',
  'Family emergency',
  'Work emergency',
  'Traffic conditions',
  'Weather conditions'
]

const ukCouncils = [
  'Westminster',
  'Camden',
  'Islington',
  'Southwark',
  'Lambeth',
  'Hackney',
  'Tower Hamlets',
  'Greenwich',
  'Lewisham',
  'Wandsworth',
  'Hammersmith & Fulham',
  'Kensington & Chelsea',
  'Brent',
  'Ealing',
  'Other'
]

export function EnhancedAIAppeal() {
  const [formData, setFormData] = useState({
    description: '',
    circumstances: [] as string[],
    location: '',
    timeOfIncident: '',
    evidenceAvailable: [] as string[],
    previousAttempts: 0,
    pcnAmount: '',
    councilName: ''
  })

  const [analysis, setAnalysis] = useState<AppealAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('input')

  const predictor = new AIAppealPredictor()

  const handleAnalyze = useCallback(async () => {
    if (!formData.description.trim() || !formData.timeOfIncident) {
      alert('Please provide incident description and date')
      return
    }

    setLoading(true)
    try {
      const input = {
        description: formData.description,
        circumstances: formData.circumstances,
        location: formData.location,
        timeOfIncident: new Date(formData.timeOfIncident),
        evidenceAvailable: formData.evidenceAvailable,
        previousAttempts: formData.previousAttempts,
        pcnAmount: formData.pcnAmount ? parseInt(formData.pcnAmount) : undefined,
        councilName: formData.councilName || undefined
      }

      const result = predictor.predict(input)
      setAnalysis(result)
      setActiveTab('results')
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze appeal. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [formData, predictor])

  const handleEvidenceChange = (evidence: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      evidenceAvailable: checked
        ? [...prev.evidenceAvailable, evidence]
        : prev.evidenceAvailable.filter(e => e !== evidence)
    }))
  }

  const handleCircumstanceChange = (circumstance: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      circumstances: checked
        ? [...prev.circumstances, circumstance]
        : prev.circumstances.filter(c => c !== circumstance)
    }))
  }

  const getSuccessColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600'
    if (probability >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-blue-600'
    if (confidence >= 0.6) return 'text-blue-500'
    return 'text-blue-400'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Parking Appeal Assistant</h1>
        <p className="text-muted-foreground">
          Advanced legal analysis using comprehensive UK parking appeal framework
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="input">Case Details</TabsTrigger>
          <TabsTrigger value="results" disabled={!analysis}>Analysis Results</TabsTrigger>
          <TabsTrigger value="strategy" disabled={!analysis}>Legal Strategy</TabsTrigger>
          <TabsTrigger value="letter" disabled={!analysis}>Appeal Letter</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Incident Details
              </CardTitle>
              <CardDescription>
                Provide detailed information about your parking incident
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-2">Date of Incident</label>
                  <Input
                    type="datetime-local"
                    value={formData.timeOfIncident}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeOfIncident: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-2">PCN Amount (£)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 60"
                    value={formData.pcnAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, pcnAmount: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-2">Previous Appeals</label>
                  <Select 
                    value={formData.previousAttempts.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, previousAttempts: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">First attempt</SelectItem>
                      <SelectItem value="1">Second attempt</SelectItem>
                      <SelectItem value="2">Third attempt</SelectItem>
                      <SelectItem value="3">Fourth attempt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    placeholder="Street name, area, postcode..."
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Council/Authority</label>
                  <Select 
                    value={formData.councilName} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, councilName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select council..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ukCouncils.map(council => (
                        <SelectItem key={council} value={council}>{council}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Incident Description</label>
                <Textarea
                  placeholder="Describe in detail what happened - include specific times, circumstances, any relevant details that led to the parking situation..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Circumstances</CardTitle>
                <CardDescription>Select all circumstances that apply</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {circumstanceOptions.map(circumstance => (
                    <div key={circumstance} className="flex items-center space-x-2">
                      <Checkbox
                        id={circumstance}
                        checked={formData.circumstances.includes(circumstance)}
                        onCheckedChange={(checked) => 
                          handleCircumstanceChange(circumstance, checked as boolean)
                        }
                      />
                      <label htmlFor={circumstance} className="text-sm cursor-pointer">
                        {circumstance}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Evidence</CardTitle>
                <CardDescription>Select all evidence you have or can obtain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {evidenceOptions.map(evidence => (
                    <div key={evidence} className="flex items-center space-x-2">
                      <Checkbox
                        id={evidence}
                        checked={formData.evidenceAvailable.includes(evidence)}
                        onCheckedChange={(checked) => 
                          handleEvidenceChange(evidence, checked as boolean)
                        }
                      />
                      <label htmlFor={evidence} className="text-sm cursor-pointer">
                        {evidence}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <Button 
                onClick={handleAnalyze} 
                disabled={loading || !formData.description.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Case...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Analyze Appeal with AI
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {analysis && (
            <>
              {/* Success Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Success Probability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getSuccessColor(analysis.successProbability)}`}>
                      {(analysis.successProbability * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on legal grounds analysis
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      AI Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${getConfidenceColor(analysis.confidence)}`}>
                      {(analysis.confidence * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analysis reliability score
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Legal Grounds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {analysis.recommendedGrounds.length}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Identified legal arguments
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommended Legal Grounds */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recommended Legal Grounds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.recommendedGrounds.map((ground, index) => (
                      <div key={ground.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {ground.id}
                            </Badge>
                            <Badge variant={
                              ground.legalStrength === 'high' ? 'default' :
                              ground.legalStrength === 'medium' ? 'secondary' : 'outline'
                            }>
                              {ground.legalStrength.toUpperCase()}
                            </Badge>
                            <Badge variant={ground.category === 'statutory' ? 'default' : 'secondary'}>
                              {ground.category.toUpperCase()}
                            </Badge>
                          </div>
                          {index === 0 && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              PRIMARY
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-lg mb-2">{ground.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{ground.description}</p>
                        <div>
                          <p className="text-xs font-medium text-blue-600 mb-1">Required Evidence:</p>
                          <div className="flex flex-wrap gap-1">
                            {ground.evidenceRequired.map(evidence => (
                              <Badge key={evidence} variant="outline" className="text-xs">
                                {evidence}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Strengthening Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.keyFactors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Priority Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Priority Actions
                  </CardTitle>
                  <CardDescription>Complete these tasks before submitting your appeal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {analysis.priorityActions.map((action, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Legal Strategy
                </CardTitle>
                <CardDescription>Comprehensive approach for your appeal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {analysis.legalStrategy}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="letter" className="space-y-6">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Draft Appeal Letter
                </CardTitle>
                <CardDescription>
                  Professionally structured appeal letter based on your case analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {analysis.appealLetter}
                  </pre>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> This is a draft template. Please review carefully, 
                    customize with your specific details, and ensure all required evidence is attached 
                    before submission. Consider having a legal professional review complex cases.
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!analysis) return
                      // Prepare case details for PDF
                      const caseDetails = {
                        pcnNumber: formData.pcnAmount,
                        vehicleReg: '',
                        location: formData.location,
                        appealantName: '',
                        councilName: formData.councilName || ''
                      }
                      const response = await fetch('/api/generate-appeal-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          appealText: analysis.appealLetter,
                          caseDetails: caseDetails,
                          type: 'appeal-letter'
                        })
                      })
                      if (!response.ok) {
                        alert('Failed to generate PDF')
                        return
                      }
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `Appeal_Letter_${formData.pcnAmount}_${new Date().toISOString().split('T')[0]}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
