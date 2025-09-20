"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PE3Data } from '@/types/appeal'

interface PE3FormData {
  penaltyChargeNumber: string
  vehicleRegistration: string
  applicantName: string
  applicantAddress: string
  applicantPostcode: string
  locationOfContravention: string
  dateOfContravention: string
  respondentName: string
  respondentAddress: string
  didNotReceiveNotice: boolean
  madeRepresentationsNoResponse: boolean
  appealedNoResponse: boolean
  reasonForDeclaration: string
  declarationLocation?: string
  witnessType?: string
  witnessName?: string
  witnessAddress?: string
  applicantSignature?: string
  signatureDate?: string
}

interface PE3DataCollectionFormProps {
  onDataComplete: (data: PE3FormData) => void
  initialData?: Partial<PE3FormData>
}

export function PE3DataCollectionForm({ onDataComplete, initialData }: PE3DataCollectionFormProps) {
  const [formData, setFormData] = useState<Partial<PE3FormData>>({
    didNotReceiveNotice: false,
    madeRepresentationsNoResponse: false,
    appealedNoResponse: false,
    signatureDate: new Date().toLocaleDateString('en-GB'),
    ...initialData
  })

  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.penaltyChargeNumber?.trim()) {
      newErrors.push('Penalty Charge Number is required')
    }
    if (!formData.vehicleRegistration?.trim()) {
      newErrors.push('Vehicle Registration is required')
    }
    if (!formData.applicantName?.trim()) {
      newErrors.push('Applicant name is required')
    }
    if (!formData.applicantAddress?.trim()) {
      newErrors.push('Applicant address is required')
    }
    if (!formData.respondentName?.trim()) {
      newErrors.push('Respondent name is required')
    }
    if (!formData.respondentAddress?.trim()) {
      newErrors.push('Respondent address is required')
    }
    if (!formData.reasonForDeclaration?.trim()) {
      newErrors.push('Reason for declaration is required')
    }

    // At least one declaration checkbox must be checked
    if (!formData.didNotReceiveNotice && !formData.madeRepresentationsNoResponse && !formData.appealedNoResponse) {
      newErrors.push('Please select at least one declaration option')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      const pe3Data: PE3Data = {
        penaltyChargeNumber: formData.penaltyChargeNumber!,
        vehicleRegistration: formData.vehicleRegistration!,
        applicantName: formData.applicantName!,
        applicantAddress: formData.applicantAddress!,
        applicantPostcode: formData.applicantPostcode || '',
        locationOfContravention: formData.locationOfContravention || '',
        dateOfContravention: formData.dateOfContravention || '',
        respondentName: formData.respondentName!,
        respondentAddress: formData.respondentAddress!,
        didNotReceiveNotice: formData.didNotReceiveNotice || false,
        madeRepresentationsNoResponse: formData.madeRepresentationsNoResponse || false,
        appealedNoResponse: formData.appealedNoResponse || false,
        reasonForDeclaration: formData.reasonForDeclaration!,
        declarationLocation: formData.declarationLocation,
        witnessType: formData.witnessType,
        witnessName: formData.witnessName,
        witnessAddress: formData.witnessAddress,
        applicantSignature: formData.applicantSignature,
        signatureDate: formData.signatureDate
      }

      const response = await fetch('/api/generate-pe3-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pe3Data),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `PE3_Statutory_Declaration_${pe3Data.penaltyChargeNumber || 'form'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        onDataComplete(formData as PE3FormData)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        setErrors([errorData.error || 'Failed to generate PE3 form'])
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors(['Network error occurred. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto max-h-[70vh] overflow-y-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PE3 Statutory Declaration - Unpaid Penalty Charge
          </CardTitle>
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

          {/* Penalty Charge Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Penalty Charge Details</h3>
            
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
                <Label htmlFor="vehicleRegistration">Vehicle Registration *</Label>
                <Input
                  id="vehicleRegistration"
                  value={formData.vehicleRegistration || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                  placeholder="AB12 CDE"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfContravention">Date of Contravention</Label>
                <Input
                  id="dateOfContravention"
                  type="date"
                  value={formData.dateOfContravention || ''}
                  onChange={(e) => setFormData({ ...formData, dateOfContravention: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationOfContravention">Location of Contravention</Label>
                <Input
                  id="locationOfContravention"
                  value={formData.locationOfContravention || ''}
                  onChange={(e) => setFormData({ ...formData, locationOfContravention: e.target.value })}
                  placeholder="Street name or location"
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="applicantPostcode">Postcode</Label>
              <Input
                id="applicantPostcode"
                value={formData.applicantPostcode || ''}
                onChange={(e) => setFormData({ ...formData, applicantPostcode: e.target.value })}
                placeholder="SW1A 1AA"
              />
            </div>
          </div>

          {/* Respondent Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Respondent Details (BLOCK CAPITALS) *</h3>
            <p className="text-sm text-gray-600">
              Full name and address of the respondent including postcode. Please complete this section in BLOCK CAPITALS.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="respondentName">Respondent Full Name *</Label>
              <Input
                id="respondentName"
                value={formData.respondentName || ''}
                onChange={(e) => setFormData({ ...formData, respondentName: e.target.value.toUpperCase() })}
                placeholder="ENTER RESPONDENT NAME IN CAPITALS"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="respondentAddress">Respondent Full Address (including postcode) *</Label>
              <Textarea
                id="respondentAddress"
                value={formData.respondentAddress || ''}
                onChange={(e) => setFormData({ ...formData, respondentAddress: e.target.value.toUpperCase() })}
                rows={4}
                placeholder="ENTER FULL ADDRESS INCLUDING POSTCODE IN CAPITALS"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Declaration Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Declaration (Select all that apply) *</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="didNotReceiveNotice"
                  checked={formData.didNotReceiveNotice || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, didNotReceiveNotice: checked as boolean })}
                />
                <Label htmlFor="didNotReceiveNotice" className="text-sm leading-5">
                  I did not receive the Notice to Owner/Enforcement Notice/Penalty Charge Notice
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="madeRepresentationsNoResponse"
                  checked={formData.madeRepresentationsNoResponse || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, madeRepresentationsNoResponse: checked as boolean })}
                />
                <Label htmlFor="madeRepresentationsNoResponse" className="text-sm leading-5">
                  I made representations against the penalty charge but did not receive a rejection notice
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="appealedNoResponse"
                  checked={formData.appealedNoResponse || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, appealedNoResponse: checked as boolean })}
                />
                <Label htmlFor="appealedNoResponse" className="text-sm leading-5">
                  I appealed to the Parking/Traffic Adjudicator but have had no response to my appeal
                </Label>
              </div>
            </div>
          </div>

          {/* Reason for Declaration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Reason for Declaration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="reasonForDeclaration">Explain your circumstances *</Label>
              <Textarea
                id="reasonForDeclaration"
                value={formData.reasonForDeclaration || ''}
                onChange={(e) => setFormData({ ...formData, reasonForDeclaration: e.target.value })}
                rows={4}
                placeholder="Provide details about your circumstances and why you are making this statutory declaration"
              />
            </div>
          </div>

          {/* Declaration Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Declaration Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="declarationLocation">Place of Declaration</Label>
                <Input
                  id="declarationLocation"
                  value={formData.declarationLocation || ''}
                  onChange={(e) => setFormData({ ...formData, declarationLocation: e.target.value })}
                  placeholder="City/Town where declared"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signatureDate">Date</Label>
                <Input
                  id="signatureDate"
                  type="date"
                  value={formData.signatureDate || ''}
                  onChange={(e) => setFormData({ ...formData, signatureDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnessType">Witness Type</Label>
              <Input
                id="witnessType"
                value={formData.witnessType || ''}
                onChange={(e) => setFormData({ ...formData, witnessType: e.target.value })}
                placeholder="e.g., Commissioner for Oaths, Solicitor, Justice of the Peace"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnessName">Witness Name</Label>
              <Input
                id="witnessName"
                value={formData.witnessName || ''}
                onChange={(e) => setFormData({ ...formData, witnessName: e.target.value })}
                placeholder="Name of witness"
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

          {/* Sticky button container */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6">
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generating...' : 'Generate PE3 Form'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
