"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { N244Data } from '@/types/appeal'

interface N244FormData {
  courtName: string
  claimNumber: string
  courtAddress: string
  applicantName: string
  applicantAddress: string
  applicantPostcode: string
  applicantPhone?: string
  applicantEmail?: string
  isClaimant: boolean
  isDefendant: boolean
  applicationFor: string
  orderSought: string
  reasonsForApplication: string
  legalAuthorityReliedOn: string
  hearingRequired: boolean
  estimatedHearingTime: string
  dateNotAvailable?: string
  evidenceInSupport: string
  costsClaimed: boolean
  costsAmount?: string
  believeFactsTrue: boolean
  understandContempt: boolean
  signatureDate?: string
}

interface N244DataCollectionFormProps {
  onDataComplete: (data: N244FormData) => void
  initialData?: Partial<N244FormData>
}

export function N244DataCollectionForm({ onDataComplete, initialData }: N244DataCollectionFormProps) {
  const [formData, setFormData] = useState<Partial<N244FormData>>({
    courtName: 'Traffic Enforcement Centre',
    courtAddress: 'Northampton County Court, St Katharine\'s House, 21-27 St Katharine\'s Street, Northampton NN1 2LZ',
    isClaimant: false,
    isDefendant: true,
    hearingRequired: true,
    estimatedHearingTime: '30 minutes',
    costsClaimed: false,
    believeFactsTrue: true,
    understandContempt: true,
    signatureDate: new Date().toLocaleDateString('en-GB'),
    ...initialData
  })

  const [errors, setErrors] = useState<string[]>([])

  const validateForm = (): boolean => {
    const newErrors: string[] = []
    
    if (!formData.claimNumber) newErrors.push('Claim number is required')
    if (!formData.applicantName) newErrors.push('Applicant name is required')
    if (!formData.applicantAddress) newErrors.push('Applicant address is required')
    if (!formData.applicantPostcode) newErrors.push('Postcode is required')
    if (!formData.applicationFor) newErrors.push('Application for is required')
    if (!formData.orderSought) newErrors.push('Order sought is required')
    if (!formData.reasonsForApplication) newErrors.push('Reasons for application are required')
    if (!formData.legalAuthorityReliedOn) newErrors.push('Legal authority relied on is required')
    if (!formData.evidenceInSupport) newErrors.push('Evidence in support is required')
    if (formData.hearingRequired && !formData.estimatedHearingTime) {
      newErrors.push('Estimated hearing time is required')
    }
    if (formData.costsClaimed && !formData.costsAmount) {
      newErrors.push('Costs amount is required when claiming costs')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onDataComplete(formData as N244FormData)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          N244 Application Notice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <h3 className="text-lg font-medium">Court Details</h3>
          
          <div className="space-y-2">
            <Label htmlFor="courtName">Court Name *</Label>
            <Input
              id="courtName"
              value={formData.courtName || ''}
              onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
              placeholder="Traffic Enforcement Centre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimNumber">Claim/Case Number *</Label>
            <Input
              id="claimNumber"
              value={formData.claimNumber || ''}
              onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
              placeholder="Enter your claim or case number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courtAddress">Court Address</Label>
            <Textarea
              id="courtAddress"
              value={formData.courtAddress || ''}
              onChange={(e) => setFormData({ ...formData, courtAddress: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* Applicant Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Applicant Details</h3>
          
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantPostcode">Postcode *</Label>
              <Input
                id="applicantPostcode"
                value={formData.applicantPostcode || ''}
                onChange={(e) => setFormData({ ...formData, applicantPostcode: e.target.value })}
                placeholder="SW1A 1AA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantPhone">Phone Number</Label>
              <Input
                id="applicantPhone"
                value={formData.applicantPhone || ''}
                onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                placeholder="07123 456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantEmail">Email Address</Label>
            <Input
              id="applicantEmail"
              type="email"
              value={formData.applicantEmail || ''}
              onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
              placeholder="your.email@example.com"
            />
          </div>

          {/* Party Status */}
          <div className="space-y-3">
            <Label>Your status in this case *</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isClaimant"
                  checked={formData.isClaimant || false}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isClaimant: checked as boolean,
                    isDefendant: checked ? false : formData.isDefendant
                  })}
                />
                <Label htmlFor="isClaimant">Claimant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefendant"
                  checked={formData.isDefendant || false}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isDefendant: checked as boolean,
                    isClaimant: checked ? false : formData.isClaimant
                  })}
                />
                <Label htmlFor="isDefendant">Defendant</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Application Details</h3>
          
          <div className="space-y-2">
            <Label htmlFor="applicationFor">I am applying for *</Label>
            <Input
              id="applicationFor"
              value={formData.applicationFor || ''}
              onChange={(e) => setFormData({ ...formData, applicationFor: e.target.value })}
              placeholder="e.g., setting aside judgment, extension of time"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderSought">Order Sought *</Label>
            <Textarea
              id="orderSought"
              value={formData.orderSought || ''}
              onChange={(e) => setFormData({ ...formData, orderSought: e.target.value })}
              rows={3}
              placeholder="Describe the specific order you are seeking from the court"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonsForApplication">Reasons for Application *</Label>
            <Textarea
              id="reasonsForApplication"
              value={formData.reasonsForApplication || ''}
              onChange={(e) => setFormData({ ...formData, reasonsForApplication: e.target.value })}
              rows={4}
              placeholder="Explain your reasons for making this application"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalAuthorityReliedOn">Legal Authority Relied On *</Label>
            <Textarea
              id="legalAuthorityReliedOn"
              value={formData.legalAuthorityReliedOn || ''}
              onChange={(e) => setFormData({ ...formData, legalAuthorityReliedOn: e.target.value })}
              rows={3}
              placeholder="Cite relevant legal authorities, rules, or case law"
            />
          </div>
        </div>

        {/* Hearing Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Hearing Details</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hearingRequired"
              checked={formData.hearingRequired || false}
              onCheckedChange={(checked) => setFormData({ ...formData, hearingRequired: checked as boolean })}
            />
            <Label htmlFor="hearingRequired">Hearing required</Label>
          </div>

          {formData.hearingRequired && (
            <>
              <div className="space-y-2">
                <Label htmlFor="estimatedHearingTime">Estimated hearing time *</Label>
                <Input
                  id="estimatedHearingTime"
                  value={formData.estimatedHearingTime || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedHearingTime: e.target.value })}
                  placeholder="e.g., 30 minutes, 1 hour"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateNotAvailable">Dates not available (if any)</Label>
                <Input
                  id="dateNotAvailable"
                  value={formData.dateNotAvailable || ''}
                  onChange={(e) => setFormData({ ...formData, dateNotAvailable: e.target.value })}
                  placeholder="List any dates you are not available"
                />
              </div>
            </>
          )}
        </div>

        {/* Evidence and Costs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Evidence and Costs</h3>
          
          <div className="space-y-2">
            <Label htmlFor="evidenceInSupport">Evidence in Support *</Label>
            <Textarea
              id="evidenceInSupport"
              value={formData.evidenceInSupport || ''}
              onChange={(e) => setFormData({ ...formData, evidenceInSupport: e.target.value })}
              rows={4}
              placeholder="Describe any evidence that supports your application"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="costsClaimed"
              checked={formData.costsClaimed || false}
              onCheckedChange={(checked) => setFormData({ ...formData, costsClaimed: checked as boolean })}
            />
            <Label htmlFor="costsClaimed">I am claiming costs</Label>
          </div>

          {formData.costsClaimed && (
            <div className="space-y-2">
              <Label htmlFor="costsAmount">Amount of costs claimed *</Label>
              <Input
                id="costsAmount"
                value={formData.costsAmount || ''}
                onChange={(e) => setFormData({ ...formData, costsAmount: e.target.value })}
                placeholder="£100.00"
              />
            </div>
          )}
        </div>

        {/* Declaration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Declaration</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="believeFactsTrue"
              checked={formData.believeFactsTrue || false}
              onCheckedChange={(checked) => setFormData({ ...formData, believeFactsTrue: checked as boolean })}
            />
            <Label htmlFor="believeFactsTrue" className="text-sm">
              I believe that the facts stated in this application are true
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="understandContempt"
              checked={formData.understandContempt || false}
              onCheckedChange={(checked) => setFormData({ ...formData, understandContempt: checked as boolean })}
            />
            <Label htmlFor="understandContempt" className="text-sm">
              I understand that proceedings for contempt of court may be brought against anyone who makes a false statement without an honest belief in its truth
            </Label>
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full">
          Generate N244 Form
        </Button>
      </CardContent>
    </Card>
  )
}
