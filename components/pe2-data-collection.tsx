"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PE2Data } from '@/types/appeal'

interface PE2FormData {
  courtName: string
  courtAddress: string
  penaltyChargeNumber: string
  vehicleRegistration: string
  applicantName: string
  applicantAddress: string
  applicantPostcode: string
  locationOfContravention: string
  dateOfContravention: string
  respondentName: string
  respondentAddress: string
  reasonsForLateFiling: string
  declarationLocation?: string
  witnessType?: string
  witnessName?: string
  witnessAddress?: string
  signatureDate?: string
}

interface PE2DataCollectionFormProps {
  onDataComplete: (data: PE2FormData) => void
  initialData?: Partial<PE2FormData>
}

export function PE2DataCollectionForm({ onDataComplete, initialData }: PE2DataCollectionFormProps) {
  const [formData, setFormData] = useState<Partial<PE2FormData>>({
    courtName: 'Traffic Enforcement Centre',
    courtAddress: 'St Katharine\'s House\n21-27 St Katharine\'s Street\nNorthampton, NN1 2LH',
    signatureDate: new Date().toLocaleDateString('en-GB'),
    ...initialData
  })

  const [errors, setErrors] = useState<string[]>([])

  const validateForm = (): boolean => {
    const newErrors: string[] = []
    
    if (!formData.penaltyChargeNumber) newErrors.push('Penalty Charge Number is required')
    if (!formData.vehicleRegistration) newErrors.push('Vehicle Registration Number is required')
    if (!formData.applicantName) newErrors.push('Full name is required')
    if (!formData.applicantAddress) newErrors.push('Address is required')
    if (!formData.applicantPostcode) newErrors.push('Postcode is required')
    if (!formData.locationOfContravention) newErrors.push('Location of contravention is required')
    if (!formData.dateOfContravention) newErrors.push('Date of contravention is required')
    if (!formData.respondentName) newErrors.push('Respondent name is required')
    if (!formData.respondentAddress) newErrors.push('Respondent address is required')
    if (!formData.reasonsForLateFiling) newErrors.push('Reasons for late filing are required')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onDataComplete(formData as PE2FormData)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto max-h-[70vh] overflow-y-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PE2 Application to file a Statutory Declaration Out of Time
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete this form to apply for leave to file a statutory declaration after the deadline
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Court Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Court/Authority Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="courtName">Traffic Enforcement Centre</Label>
              <Input
                id="courtName"
                value={formData.courtName || ''}
                onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                placeholder="Traffic Enforcement Centre"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courtAddress">Court Address</Label>
              <Textarea
                id="courtAddress"
                value={formData.courtAddress || ''}
                onChange={(e) => setFormData({ ...formData, courtAddress: e.target.value })}
                rows={3}
                placeholder="St Katharine's House..."
              />
            </div>
          </div>

          {/* Penalty Charge Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Penalty Charge Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="penaltyChargeNumber">Penalty Charge Number *</Label>
                <Input
                  id="penaltyChargeNumber"
                  value={formData.penaltyChargeNumber || ''}
                  onChange={(e) => setFormData({ ...formData, penaltyChargeNumber: e.target.value })}
                  placeholder="Enter penalty charge number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleRegistration">Vehicle Registration Number *</Label>
                <Input
                  id="vehicleRegistration"
                  value={formData.vehicleRegistration || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                  placeholder="e.g. AB12 CDE"
                />
              </div>
            </div>
          </div>

          {/* Applicant Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Applicant Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="applicantName">Full Name *</Label>
              <Input
                id="applicantName"
                value={formData.applicantName || ''}
                onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                placeholder="Enter your full legal name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantAddress">Address *</Label>
              <Textarea
                id="applicantAddress"
                value={formData.applicantAddress || ''}
                onChange={(e) => setFormData({ ...formData, applicantAddress: e.target.value })}
                rows={3}
                placeholder="Enter your full address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantPostcode">Postcode *</Label>
              <Input
                id="applicantPostcode"
                value={formData.applicantPostcode || ''}
                onChange={(e) => setFormData({ ...formData, applicantPostcode: e.target.value })}
                placeholder="e.g. SW1A 1AA"
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Contravention Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Contravention Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="locationOfContravention">Location of Contravention *</Label>
              <Input
                id="locationOfContravention"
                value={formData.locationOfContravention || ''}
                onChange={(e) => setFormData({ ...formData, locationOfContravention: e.target.value })}
                placeholder="Where did the alleged contravention occur?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfContravention">Date of Contravention *</Label>
              <Input
                id="dateOfContravention"
                type="date"
                value={formData.dateOfContravention || ''}
                onChange={(e) => setFormData({ ...formData, dateOfContravention: e.target.value })}
              />
            </div>
          </div>

          {/* Respondent Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Respondent Details</h3>
            <p className="text-sm text-muted-foreground">
              Complete this section in BLOCK CAPITALS and in black ink
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="respondentName">Respondent Name *</Label>
              <Input
                id="respondentName"
                value={formData.respondentName || ''}
                onChange={(e) => setFormData({ ...formData, respondentName: e.target.value.toUpperCase() })}
                placeholder="FULL NAME OF RESPONDENT (BLOCK CAPITALS)"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="respondentAddress">Respondent Address (including postcode) *</Label>
              <Textarea
                id="respondentAddress"
                value={formData.respondentAddress || ''}
                onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value.toUpperCase() })}
                rows={3}
                placeholder="FULL ADDRESS INCLUDING POSTCODE (BLOCK CAPITALS)"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Reasons for Late Filing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Application Details</h3>
            <p className="text-sm text-muted-foreground">
              My reasons for filing the Statutory Declaration outside the given time are as follows:
              <br />
              <em>(Do not give your reasons for appeal against the original penalty charge on this form)</em>
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="reasonsForLateFiling">Reasons for Late Filing *</Label>
              <Textarea
                id="reasonsForLateFiling"
                value={formData.reasonsForLateFiling || ''}
                onChange={(e) => setFormData({ ...formData, reasonsForLateFiling: e.target.value })}
                rows={8}
                placeholder="Explain why you are filing this statutory declaration after the deadline. Include specific dates and circumstances that prevented you from filing on time..."
              />
            </div>
          </div>

          {/* Declaration Location and Witness */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Declaration Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="declarationLocation">Declared at (location)</Label>
              <Input
                id="declarationLocation"
                value={formData.declarationLocation || ''}
                onChange={(e) => setFormData({ ...formData, declarationLocation: e.target.value })}
                placeholder="e.g. London, Birmingham, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnessType">Before me (witness type)</Label>
              <Input
                id="witnessType"
                value={formData.witnessType || ''}
                onChange={(e) => setFormData({ ...formData, witnessType: e.target.value })}
                placeholder="Commissioner for Oaths/Officer of the Court/Justice of the Peace"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnessName">Witness Name</Label>
              <Input
                id="witnessName"
                value={formData.witnessName || ''}
                onChange={(e) => setFormData({ ...formData, witnessName: e.target.value })}
                placeholder="Name of Commissioner/Officer/Justice"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnessAddress">Witness Address</Label>
              <Textarea
                id="witnessAddress"
                value={formData.witnessAddress || ''}
                onChange={(e) => setFormData({ ...formData, witnessAddress: e.target.value })}
                rows={2}
                placeholder="Address of witness"
              />
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Important Notice</h4>
            <p className="text-sm text-red-700">
              <strong>Filing a false declaration knowingly and wilfully is a criminal offence under Section 5 of the Perjury Act 1911 and you may be imprisoned for up to 2 years or fined or both.</strong>
            </p>
            <p className="text-sm text-red-700 mt-2">
              I do solemnly and sincerely declare that the information given here is true.
            </p>
            <p className="text-sm text-red-700 mt-2">
              <strong>The Statutory Declaration will not be accepted without a full postal address</strong>
              <br />
              <strong>Any amendments to your forms will require them to be re-witnessed</strong>
            </p>
          </div>

          {/* Sticky button container */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6">
            <Button onClick={handleSubmit} className="w-full">
              Generate PE2 Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
