import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TE7FormData {
  // Personal details
  title: string;
  otherTitle?: string;
  fullName: string;
  applicantAddress: string;
  applicantPostcode: string;
  companyName?: string;
  
  // Case details
  pcnNumber: string;
  vehicleReg: string;
  
  // Application details
  applicationType: 'outside the given time' | 'for more time';
  reasons: string;
  beliefType: 'I believe' | 'The respondent believes';
  
  // Signing details
  signingCapacity: 'Respondent' | 'Person signing on behalf of the respondent';
  companyOfficer: boolean;
  firmPartner: boolean;
  litigationFriend: boolean;
  
  // Signature
  signatureDate: string;
  signatureName: string;
}

interface TE9FormData {
  // Case details
  pcnNumber: string;
  vehicleReg: string;
  applicantName: string;
  location: string;
  dateOfContravention: string;
  
  // Personal details
  title: string;
  otherTitle?: string;
  fullName: string;
  address: string;
  postcode: string;
  companyName?: string;
  
  // Statutory declaration reason
  te9Reason: 'not_received' | 'no_rejection_notice' | 'no_response' | 'not_determined' | 'determined_favour' | 'paid_in_full';
  
  // Payment details (if paid in full)
  paymentDate?: string;
  paymentMethod?: 'cash' | 'cheque' | 'debit' | 'credit';
  paidTo?: string;
  
  // Statement details
  statementType: 'i_believe' | 'witness_believes';
  signedBy: 'witness' | 'on_behalf';
  
  // Signing capacity
  companyOfficer: boolean;
  firmPartner: boolean;
  litigationFriend: boolean;
  
  // Signature details
  declarationDate: string;
  signatureName: string;
}

export function TE7DataCollectionForm({ onDataComplete }: { onDataComplete: (data: TE7FormData) => void }) {
  const [formData, setFormData] = useState<Partial<TE7FormData>>({
    applicationType: 'outside the given time',
    beliefType: 'I believe',
    signingCapacity: 'Respondent',
    companyOfficer: false,
    firmPartner: false,
    litigationFriend: false,
    signatureDate: new Date().toLocaleDateString('en-GB')
  });

  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.fullName) newErrors.push('Full name is required');
    if (!formData.applicantAddress) newErrors.push('Address is required');
    if (!formData.applicantPostcode) newErrors.push('Postcode is required');
    if (!formData.pcnNumber) newErrors.push('PCN number is required');
    if (!formData.vehicleReg) newErrors.push('Vehicle registration is required');
    if (!formData.reasons) newErrors.push('Reasons for application are required');
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onDataComplete(formData as TE7FormData);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          TE7 Application Form - Complete All Details
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

        {/* Title Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Title *</Label>
          <RadioGroup
            value={formData.title}
            onValueChange={(value) => setFormData({ ...formData, title: value })}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mr" id="mr" />
              <Label htmlFor="mr">Mr</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mrs" id="mrs" />
              <Label htmlFor="mrs">Mrs</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="miss" id="miss" />
              <Label htmlFor="miss">Miss</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ms" id="ms" />
              <Label htmlFor="ms">Ms</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
          {formData.title === 'other' && (
            <Input
              placeholder="Specify other title"
              value={formData.otherTitle || ''}
              onChange={(e) => setFormData({ ...formData, otherTitle: e.target.value })}
            />
          )}
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="applicantPostcode">Postcode *</Label>
            <Input
              id="applicantPostcode"
              value={formData.applicantPostcode || ''}
              onChange={(e) => setFormData({ ...formData, applicantPostcode: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="applicantAddress">Full Address *</Label>
          <Textarea
            id="applicantAddress"
            value={formData.applicantAddress || ''}
            onChange={(e) => setFormData({ ...formData, applicantAddress: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name (if vehicle owned by company)</Label>
          <Input
            id="companyName"
            value={formData.companyName || ''}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        {/* Case Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pcnNumber">Penalty Charge Number *</Label>
            <Input
              id="pcnNumber"
              value={formData.pcnNumber || ''}
              onChange={(e) => setFormData({ ...formData, pcnNumber: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
            <Input
              id="vehicleReg"
              value={formData.vehicleReg || ''}
              onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
            />
          </div>
        </div>

        {/* Application Type */}
        <div className="space-y-3">
          <Label>Application Type</Label>
          <Select
            value={formData.applicationType}
            onValueChange={(value: 'outside the given time' | 'for more time') => 
              setFormData({ ...formData, applicationType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outside the given time">Outside the given time</SelectItem>
              <SelectItem value="for more time">For more time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reasons */}
        <div className="space-y-2">
          <Label htmlFor="reasons">Reasons for Applying for Permission *</Label>
          <Textarea
            id="reasons"
            value={formData.reasons || ''}
            onChange={(e) => setFormData({ ...formData, reasons: e.target.value })}
            rows={4}
            placeholder="Explain why you need more time or are applying outside the time limit..."
            maxLength={500}
          />
          <p className="text-sm text-gray-500">
            {(formData.reasons || '').length}/500 characters
          </p>
        </div>

        {/* Belief Type */}
        <div className="space-y-3">
          <Label>Statement of Belief</Label>
          <Select
            value={formData.beliefType}
            onValueChange={(value: 'I believe' | 'The respondent believes') => 
              setFormData({ ...formData, beliefType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="I believe">I believe</SelectItem>
              <SelectItem value="The respondent believes">The respondent believes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Signing Capacity */}
        <div className="space-y-3">
          <Label>Signing Capacity</Label>
          <Select
            value={formData.signingCapacity}
            onValueChange={(value: 'Respondent' | 'Person signing on behalf of the respondent') => 
              setFormData({ ...formData, signingCapacity: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Respondent">Respondent</SelectItem>
              <SelectItem value="Person signing on behalf of the respondent">Person signing on behalf of the respondent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Capacity Checkboxes */}
        <div className="space-y-3">
          <Label>If signing on behalf of someone else, please indicate:</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="companyOfficer"
                checked={formData.companyOfficer}
                onCheckedChange={(checked) => setFormData({ ...formData, companyOfficer: checked === true })}
              />
              <Label htmlFor="companyOfficer">An officer of the company</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="firmPartner"
                checked={formData.firmPartner}
                onCheckedChange={(checked) => setFormData({ ...formData, firmPartner: checked === true })}
              />
              <Label htmlFor="firmPartner">A partner of the firm</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="litigationFriend"
                checked={formData.litigationFriend}
                onCheckedChange={(checked) => setFormData({ ...formData, litigationFriend: checked === true })}
              />
              <Label htmlFor="litigationFriend">Litigation friend</Label>
            </div>
          </div>
        </div>

        {/* Signature Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signatureDate">Date of Signature</Label>
            <Input
              id="signatureDate"
              type="date"
              value={formData.signatureDate || ''}
              onChange={(e) => setFormData({ ...formData, signatureDate: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="signatureName">Print Full Name</Label>
            <Input
              id="signatureName"
              value={formData.signatureName || formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Complete TE7 Form Data
        </Button>
      </CardContent>
    </Card>
  );
}

export function TE9DataCollectionForm({ onDataComplete }: { onDataComplete: (data: TE9FormData) => void }) {
  const [formData, setFormData] = useState<Partial<TE9FormData>>({
    te9Reason: 'not_received',
    statementType: 'i_believe',
    signedBy: 'witness',
    companyOfficer: false,
    firmPartner: false,
    litigationFriend: false,
    declarationDate: new Date().toLocaleDateString('en-GB')
  });

  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.pcnNumber) newErrors.push('PCN number is required');
    if (!formData.vehicleReg) newErrors.push('Vehicle registration is required');
    if (!formData.applicantName) newErrors.push('Applicant name is required');
    if (!formData.location) newErrors.push('Location is required');
    if (!formData.dateOfContravention) newErrors.push('Date of contravention is required');
    if (!formData.fullName) newErrors.push('Full name is required');
    if (!formData.address) newErrors.push('Address is required');
    if (!formData.postcode) newErrors.push('Postcode is required');
    
    // If paid in full, require payment details
    if (formData.te9Reason === 'paid_in_full') {
      if (!formData.paymentDate) newErrors.push('Payment date is required');
      if (!formData.paymentMethod) newErrors.push('Payment method is required');
      if (!formData.paidTo) newErrors.push('Who was it paid to is required');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onDataComplete(formData as TE9FormData);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          TE9 Statutory Declaration - Complete All Details
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

        {/* Case Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Case Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pcnNumber">Penalty Charge Number *</Label>
              <Input
                id="pcnNumber"
                value={formData.pcnNumber || ''}
                onChange={(e) => setFormData({ ...formData, pcnNumber: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
              <Input
                id="vehicleReg"
                value={formData.vehicleReg || ''}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantName">Applicant Name *</Label>
              <Input
                id="applicantName"
                value={formData.applicantName || ''}
                onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
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

          <div className="space-y-2">
            <Label htmlFor="location">Location of Contravention *</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        {/* Personal Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Details</h3>
          
          {/* Title Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Title *</Label>
            <RadioGroup
              value={formData.title}
              onValueChange={(value) => setFormData({ ...formData, title: value })}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mr" id="te9-mr" />
                <Label htmlFor="te9-mr">Mr</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mrs" id="te9-mrs" />
                <Label htmlFor="te9-mrs">Mrs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="miss" id="te9-miss" />
                <Label htmlFor="te9-miss">Miss</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ms" id="te9-ms" />
                <Label htmlFor="te9-ms">Ms</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="te9-other" />
                <Label htmlFor="te9-other">Other</Label>
              </div>
            </RadioGroup>
            {formData.title === 'other' && (
              <Input
                placeholder="Specify other title"
                value={formData.otherTitle || ''}
                onChange={(e) => setFormData({ ...formData, otherTitle: e.target.value })}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="te9FullName">Full Name *</Label>
              <Input
                id="te9FullName"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                value={formData.postcode || ''}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address *</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="te9CompanyName">Company Name (if vehicle owned by company)</Label>
            <Input
              id="te9CompanyName"
              value={formData.companyName || ''}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>
        </div>

        {/* Statutory Declaration Reason */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Reason for Statutory Declaration *</h3>
          <RadioGroup
            value={formData.te9Reason}
            onValueChange={(value: any) => setFormData({ ...formData, te9Reason: value })}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_received" id="not_received" />
              <Label htmlFor="not_received">I did not receive the penalty charge notice</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no_rejection_notice" id="no_rejection_notice" />
              <Label htmlFor="no_rejection_notice">I made representations but did not receive a rejection notice</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no_response" id="no_response" />
              <Label htmlFor="no_response">I appealed but received no response</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_determined" id="not_determined" />
              <Label htmlFor="not_determined">My appeal had not been determined</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="determined_favour" id="determined_favour" />
              <Label htmlFor="determined_favour">My appeal was determined in my favour</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paid_in_full" id="paid_in_full" />
              <Label htmlFor="paid_in_full">The penalty charge has been paid in full</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Details (if paid in full) */}
        {formData.te9Reason === 'paid_in_full' && (
          <div className="space-y-4">
            <h4 className="font-medium">Payment Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Date Paid in Full *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paidTo">To Whom Was It Paid *</Label>
                <Input
                  id="paidTo"
                  value={formData.paidTo || ''}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Payment Method *</Label>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cheque" id="cheque" />
                  <Label htmlFor="cheque">Cheque</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit">Debit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit">Credit Card</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Statement Type */}
        <div className="space-y-3">
          <Label>Statement of Truth</Label>
          <RadioGroup
            value={formData.statementType}
            onValueChange={(value: any) => setFormData({ ...formData, statementType: value })}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="i_believe" id="i_believe" />
              <Label htmlFor="i_believe">I believe that the facts stated in this form are true</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="witness_believes" id="witness_believes" />
              <Label htmlFor="witness_believes">The witness believes that the facts stated are true</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Signing Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Signing Details</h3>
          
          <div className="space-y-3">
            <Label>Signed By</Label>
            <RadioGroup
              value={formData.signedBy}
              onValueChange={(value: any) => setFormData({ ...formData, signedBy: value })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="witness" id="witness" />
                <Label htmlFor="witness">Signed by witness</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on_behalf" id="on_behalf" />
                <Label htmlFor="on_behalf">Signed by person on behalf of witness</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Capacity Checkboxes */}
          <div className="space-y-3">
            <Label>If signing on behalf of someone else:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="te9CompanyOfficer"
                  checked={formData.companyOfficer}
                  onCheckedChange={(checked) => setFormData({ ...formData, companyOfficer: checked === true })}
                />
                <Label htmlFor="te9CompanyOfficer">Officer of the company</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="te9FirmPartner"
                  checked={formData.firmPartner}
                  onCheckedChange={(checked) => setFormData({ ...formData, firmPartner: checked === true })}
                />
                <Label htmlFor="te9FirmPartner">Partner of the firm</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="te9LitigationFriend"
                  checked={formData.litigationFriend}
                  onCheckedChange={(checked) => setFormData({ ...formData, litigationFriend: checked === true })}
                />
                <Label htmlFor="te9LitigationFriend">Litigation friend</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="declarationDate">Date of Declaration</Label>
              <Input
                id="declarationDate"
                type="date"
                value={formData.declarationDate || ''}
                onChange={(e) => setFormData({ ...formData, declarationDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="te9SignatureName">Print Full Name</Label>
              <Input
                id="te9SignatureName"
                value={formData.signatureName || formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          Complete TE9 Form Data
        </Button>
      </CardContent>
    </Card>
  );
}
