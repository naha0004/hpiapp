# TE7 & TE9 Digital Signature Implementation Guide

This guide explains how to implement digital signature functionality for TE7 and TE9 UK traffic court forms in your Next.js application.

## Overview

The signature system provides:
- Touch and mouse-compatible signature canvas
- Digital signature embedding in PDF forms
- TE7 (Application for more time) and TE9 (Witness statement) form support
- Legal compliance for UK court submissions

## Components

### 1. SignatureCanvas
A customizable signature drawing component with touch support.

```tsx
import { SignatureCanvas } from '@/components/signature-canvas';

<SignatureCanvas
  onSignatureComplete={(signatureData) => {
    // Handle signature completion
    console.log('Signature captured:', signatureData);
  }}
  width={400}
  height={200}
/>
```

### 2. SignaturePad
A modal dialog containing the signature canvas with controls.

```tsx
import { SignaturePad } from '@/components/signature-canvas';

const [showSignaturePad, setShowSignaturePad] = useState(false);

<SignaturePad
  isOpen={showSignaturePad}
  onOpenChange={setShowSignaturePad}
  onSignatureComplete={(signatureData) => {
    // Handle signature completion
  }}
  title="Sign Document"
  description="Please provide your digital signature"
/>
```

### 3. TE7SignatureForm
Complete form for TE7 signatures (applicant + optional witness).

```tsx
import { TE7SignatureForm } from '@/components/signature-canvas';

<TE7SignatureForm 
  onSignatureComplete={(signatures) => {
    console.log('TE7 signatures:', signatures.applicant, signatures.witness);
  }}
/>
```

### 4. TE9SignatureForm
Complete form for TE9 signatures (declarant + qualified witness).

```tsx
import { TE9SignatureForm } from '@/components/signature-canvas';

<TE9SignatureForm 
  onSignatureComplete={(signatures) => {
    console.log('TE9 signatures:', signatures.declarant, signatures.witness);
  }}
/>
```

### 5. useSignature Hook
State management for multiple signatures.

```tsx
import { useSignature } from '@/components/signature-canvas';

const { 
  signatures, 
  addSignature, 
  removeSignature, 
  hasSignature, 
  getSignature,
  clearAllSignatures 
} = useSignature();

// Add signatures
addSignature('te7', signatureDataUrl);
addSignature('te9', signatureDataUrl);

// Check if signature exists
if (hasSignature('te7')) {
  // Download PDF with signature
}

// Get signature data
const te7Signature = getSignature('te7');
```

## PDF Integration

### TE7 Form Data Structure

```tsx
interface TE7Data {
  // Court details
  courtName: string;
  claimNumber: string;
  
  // Applicant details
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  applicantPhone?: string;
  applicantEmail?: string;
  
  // Case details
  caseReference: string;
  hearingDate: string;
  extensionUntil: string;
  reasonForExtension: string;
  supportingEvidence?: string;
  
  // Signature data
  applicantSignature?: string; // Base64 image data
  witnessSignature?: string;
  signatureDate?: string;
}
```

### TE9 Form Data Structure

```tsx
interface TE9Data {
  // Court details
  courtName: string;
  claimNumber: string;
  
  // Witness details
  witnessName: string;
  witnessAddress: string;
  witnessPostcode: string;
  witnessOccupation: string;
  
  // Statement details
  statementText: string;
  factsKnown?: 'personally' | 'from_documents' | 'from_others';
  supportingDocuments?: string;
  
  // Signature data
  declarantSignature?: string; // Base64 image data
  witnessSignature?: string;
  witnessName_qualified?: string; // Qualified witness name
  witnessQualification?: string; // Solicitor, commissioner for oaths, etc.
  signatureDate?: string;
}
```

### Generating PDFs with Signatures

```tsx
// TE7 PDF Generation
const downloadTE7WithSignature = async (formData: TE7Data) => {
  const response = await fetch('/api/generate-te7-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TE7_Application_${formData.claimNumber}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// TE9 PDF Generation
const downloadTE9WithSignature = async (formData: TE9Data) => {
  const response = await fetch('/api/generate-te9-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TE9_Witness_Statement_${formData.claimNumber}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
```

## Complete Implementation Example

```tsx
import React, { useState } from 'react';
import { TE7SignatureForm, TE9SignatureForm, useSignature } from '@/components/signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TrafficAppealForm() {
  const [activeForm, setActiveForm] = useState<'te7' | 'te9' | null>(null);
  const { hasSignature, getSignature } = useSignature();

  const handleTE7Complete = async (signatures: { applicant?: string; witness?: string }) => {
    if (!signatures.applicant) return;

    const te7Data = {
      courtName: 'Traffic Enforcement Centre',
      claimNumber: 'TE7-2025-001',
      applicantName: 'John Smith',
      applicantAddress: '123 Main Street, London, SW1A 1AA',
      applicantPostcode: 'SW1A 1AA',
      caseReference: 'TEC-12345-2025',
      hearingDate: '15/03/2025',
      extensionUntil: '30/04/2025',
      reasonForExtension: 'Need additional time to gather evidence',
      applicantSignature: signatures.applicant,
      witnessSignature: signatures.witness,
      signatureDate: new Date().toLocaleDateString('en-GB')
    };

    // Download PDF
    const response = await fetch('/api/generate-te7-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(te7Data),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TE7_${te7Data.claimNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setActiveForm(null);
    }
  };

  const handleTE9Complete = async (signatures: { declarant?: string; witness?: string }) => {
    if (!signatures.declarant) return;

    const te9Data = {
      courtName: 'Traffic Enforcement Centre',
      claimNumber: 'TE9-2025-001',
      witnessName: 'John Smith',
      witnessAddress: '123 Main Street, London, SW1A 1AA',
      witnessPostcode: 'SW1A 1AA',
      witnessOccupation: 'Software Developer',
      statementText: 'I declare that I did not receive the penalty charge notice...',
      declarantSignature: signatures.declarant,
      witnessSignature: signatures.witness,
      signatureDate: new Date().toLocaleDateString('en-GB')
    };

    // Download PDF
    const response = await fetch('/api/generate-te9-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(te9Data),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TE9_${te9Data.claimNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setActiveForm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>TE7 Application Form</CardTitle>
          </CardHeader>
          <CardContent>
            {activeForm === 'te7' ? (
              <TE7SignatureForm onSignatureComplete={handleTE7Complete} />
            ) : (
              <Button onClick={() => setActiveForm('te7')} className="w-full">
                Start TE7 Application
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TE9 Witness Statement</CardTitle>
          </CardHeader>
          <CardContent>
            {activeForm === 'te9' ? (
              <TE9SignatureForm onSignatureComplete={handleTE9Complete} />
            ) : (
              <Button onClick={() => setActiveForm('te9')} className="w-full">
                Start TE9 Statement
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Legal Considerations

### Digital Signature Validity
- Digital signatures are generally accepted for initial submissions
- TE9 forms require witnessing by a qualified person for final court submission
- Keep digital copies for records and reference

### Required Witnesses for TE9
- Solicitor
- Commissioner for Oaths
- Magistrate
- Other qualified legal professionals

### Best Practices
1. Always provide clear instructions to users about signature requirements
2. Include legal disclaimers about digital vs. wet signatures
3. Offer options for both digital and print-and-sign workflows
4. Validate signatures before PDF generation
5. Store signatures securely and consider data protection requirements

## Styling and Customization

The signature components use Tailwind CSS classes and can be customized:

```tsx
// Custom signature canvas
<SignatureCanvas
  className="border-2 border-blue-500 rounded-lg"
  width={500}
  height={250}
/>

// Custom signature pad colors
<SignaturePad
  title="Custom Signature"
  description="Sign here to complete your application"
/>
```

## Troubleshooting

### Common Issues
1. **Touch events not working**: Ensure `touch-action: none` CSS is applied
2. **Signature not saving**: Check that canvas context is properly initialized
3. **PDF generation fails**: Verify signature data is valid base64 PNG
4. **Mobile rendering issues**: Test signature canvas responsiveness

### Browser Compatibility
- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- Edge: Full support

The signature functionality is fully compatible with modern browsers and provides a professional solution for UK traffic court form submissions.
