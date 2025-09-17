import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TE7SignatureForm, TE9SignatureForm, useSignature } from '@/components/signature-canvas';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

/**
 * Example component demonstrating how to implement TE7 and TE9 signature functionality
 * This shows how to integrate digital signatures into your traffic appeal forms
 */
export function SignatureExample() {
  const { signatures, hasSignature, getSignature } = useSignature();

  const handleTE7SignatureComplete = (signatures: { applicant?: string; witness?: string }) => {
    console.log('TE7 Signature completed:', signatures);
    // Here you would typically save the signature to your database
    // or update your form state
  };

  const handleTE9SignatureComplete = (signatures: { declarant?: string; witness?: string }) => {
    console.log('TE9 Signature completed:', signatures);
    // Here you would typically save the signature to your database
    // or update your form state
  };

  const downloadTE7Form = async () => {
    try {
      const signature = getSignature('te7');
      
      const te7Data = {
        // Required fields
        courtName: 'Traffic Enforcement Centre',
        claimNumber: 'TE7-2025-001',
        applicantName: 'John Smith',
        applicantAddress: '123 Main Street, London',
        applicantPostcode: 'SW1A 1AA',
        caseReference: 'TEC-12345-2025',
        hearingDate: '15/03/2025',
        extensionUntil: '30/04/2025',
        reasonForExtension: 'Need additional time to gather evidence and prepare legal arguments',
        
        // Optional signature data
        applicantSignature: signature,
        signatureDate: new Date().toLocaleDateString('en-GB')
      };

      const response = await fetch('/api/generate-te7-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te7Data),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TE7_Application_${te7Data.claimNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        console.log('TE7 PDF downloaded successfully');
      } else {
        console.error('Failed to generate TE7 PDF');
      }
    } catch (error) {
      console.error('Error downloading TE7:', error);
    }
  };

  const downloadTE9Form = async () => {
    try {
      const signature = getSignature('te9');
      
      const te9Data = {
        // Required fields
        courtName: 'Traffic Enforcement Centre',
        claimNumber: 'TE9-2025-001',
        witnessName: 'John Smith',
        witnessAddress: '123 Main Street, London',
        witnessPostcode: 'SW1A 1AA',
        witnessOccupation: 'Software Developer',
        statementText: `I, John Smith, declare that:
        
Ground A: I did not receive the penalty charge notice
- The penalty charge notice was not received at my registered address
- No valid service was made in accordance with the regulations
- I was not made aware of the contravention until receiving the charge certificate`,
        
        // Optional signature data
        declarantSignature: signature,
        signatureDate: new Date().toLocaleDateString('en-GB')
      };

      const response = await fetch('/api/generate-te9-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(te9Data),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TE9_Witness_Statement_${te9Data.claimNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        console.log('TE9 PDF downloaded successfully');
      } else {
        console.error('Failed to generate TE9 PDF');
      }
    } catch (error) {
      console.error('Error downloading TE9:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">TE7 & TE9 Signature Demo</h1>
        <p className="text-gray-600">
          Demonstrate digital signature functionality for traffic court forms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TE7 Form Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              TE7 Application Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Application for more time to challenge court order
            </p>
            
            <TE7SignatureForm onSignatureComplete={handleTE7SignatureComplete} />
            
            <div className="flex gap-2">
              <Button
                onClick={downloadTE7Form}
                disabled={!hasSignature('te7')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download TE7
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TE9 Form Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              TE9 Witness Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Witness statement for unpaid penalty charge
            </p>
            
            <TE9SignatureForm onSignatureComplete={handleTE9SignatureComplete} />
            
            <div className="flex gap-2">
              <Button
                onClick={downloadTE9Form}
                disabled={!hasSignature('te9')}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download TE9
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Touch and mouse-compatible signature canvas</li>
              <li>Automatic PDF generation with embedded signatures</li>
              <li>Form validation and signature verification</li>
              <li>Mobile-responsive design</li>
              <li>Legal compliance for UK court forms</li>
            </ul>
          </div>
          
          <div className="text-sm space-y-2">
            <h4 className="font-medium">Usage:</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Click "Add Signature" to open the signature pad</li>
              <li>Draw your signature using mouse, trackpad, or finger</li>
              <li>Click "Save Signature" to confirm</li>
              <li>Download the PDF with your embedded signature</li>
            </ol>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-amber-800 mb-1">Legal Note:</p>
            <p className="text-amber-700">
              Digital signatures are accepted for initial submissions, but TE9 forms 
              require witnessing by a qualified person (solicitor, commissioner for oaths, 
              or magistrate) for final court submission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SignatureExample;
