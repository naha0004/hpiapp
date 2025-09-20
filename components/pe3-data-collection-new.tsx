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
  courtName: string
  courtAddress: string
  penaltyChargeNumber: string
  vehicleRegistration: string
  applicantName: string
  applicantAddress: string
  applicantPostcode: string
  locationOfContravention: string
  dateOfContravention: string
  didNotReceiveNotice: boolean
  madeRepresentationsNoResponse: boolean
  appealedNoResponse: boolean
  reasonForDeclaration: string
  declarationLocation?: string
  witnessType?: string
  witnessName?: string
  witnessAddress?: string
  signatureDate?: string
}

interface PE3DataCollectionFormProps {
  onDataComplete: (data: PE3FormData) => void
  initialData?: Partial<PE3FormData>
}

export function PE3DataCollectionForm({ onDataComplete, initialData }: PE3DataCollectionFormProps) {
  const [formData, setFormData] = useState<Partial<PE3FormData>>({
    courtName: 'Traffic Enforcement Centre',
    courtAddress: 'County Court Business Centre\nSt Katharine\'s House\n21-27 St Katharine\'s Street\nNorthampton, NN1 2LH',
    didNotReceiveNotice: false,
    madeRepresentationsNoResponse: false,
    appealedNoResponse: false,
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
    if (!formData.reasonForDeclaration) newErrors.push('Reasons for declaration are required')
    
    // At least one declaration checkbox must be selected
    if (!formData.didNotReceiveNotice && !formData.madeRepresentationsNoResponse && !formData.appealedNoResponse) {
      newErrors.push('You must select at least one declaration reason')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onDataComplete(formData as PE3FormData)
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
          <p className="text-sm text-muted-foreground">
            Complete this form if you believe you should not have to pay a penalty charge
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
                rows={4}
                placeholder="County Court Business Centre..."
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
            <h3 className="text-lg font-medium border-b pb-2">Your Details</h3>
            
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

          {/* Declaration - Tick which applies */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Declaration (Tick which applies)</h3>
            <p className="text-sm text-muted-foreground">
              Select all that apply to your situation:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="didNotReceiveNotice"
                  checked={formData.didNotReceiveNotice || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, didNotReceiveNotice: checked as boolean })}
                />
                <Label htmlFor="didNotReceiveNotice" className="text-sm leading-5">
                  I did not receive the Notice to Owner (Parking contravention) or Enforcement Notice (Bus lane contravention) or Penalty Charge Notice (Moving Traffic contravention or Congestion Charging contravention)
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="madeRepresentationsNoResponse"
                  checked={formData.madeRepresentationsNoResponse || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, madeRepresentationsNoResponse: checked as boolean })}
                />
                <Label htmlFor="madeRepresentationsNoResponse" className="text-sm leading-5">
                  I made representations about the penalty charge to the local authority concerned within 28 days of service of the Notice to Owner/Enforcement Notice/Penalty Charge Notice, but did not receive a rejection notice
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="appealedNoResponse"
                  checked={formData.appealedNoResponse || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, appealedNoResponse: checked as boolean })}
                />
                <Label htmlFor="appealedNoResponse" className="text-sm leading-5">
                  I appealed to the Parking/Traffic Adjudicator against the local authority's decision to reject my representation, within 28 days of service of the rejection notice, but have had no response to my appeal
                </Label>
              </div>
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">My Reasons</h3>
            <p className="text-sm text-muted-foreground">
              Give full details and tick the box which applies (use additional sheets if necessary):
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="reasonForDeclaration">Full Reasons for Declaration *</Label>
              <Textarea
                id="reasonForDeclaration"
                value={formData.reasonForDeclaration || ''}
                onChange={(e) => setFormData({ ...formData, reasonForDeclaration: e.target.value })}
                rows={6}
                placeholder="Explain in detail why you believe the penalty charge is not valid. Include dates, circumstances, and any relevant evidence..."
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
          </div>

          {/* Sticky button container */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6">
            <Button onClick={handleSubmit} className="w-full">
              Generate PE3 Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
