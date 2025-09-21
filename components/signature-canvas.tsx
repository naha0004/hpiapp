import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Pen, Eraser, RotateCcw, Check, Download } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureComplete: (signatureData: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

interface SignaturePadProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureComplete: (signatureData: string) => void;
  title?: string;
  description?: string;
}

export function SignatureCanvas({ onSignatureComplete, width = 400, height = 200, className = "" }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setContext(ctx);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!context) return;
    
    context.closePath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!context || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!canvasRef.current || !hasSignature) return;
    
    const signatureData = canvasRef.current.toDataURL('image/png');
    onSignatureComplete(signatureData);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !context) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
    setHasSignature(true);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  return (
    <div className={`signature-canvas ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </Button>
        
        <Button
          onClick={saveSignature}
          disabled={!hasSignature}
          size="sm"
          className="flex items-center gap-1"
        >
          <Check className="w-4 h-4" />
          Save Signature
        </Button>
      </div>
    </div>
  );
}

export function SignaturePad({ isOpen, onOpenChange, onSignatureComplete, title = "Digital Signature", description }: SignaturePadProps) {
  const [signatureData, setSignatureData] = useState<string>("");

  const handleSignatureComplete = (data: string) => {
    setSignatureData(data);
    onSignatureComplete(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="w-5 h-5" />
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <Label className="text-sm font-medium">
              Please sign below using your mouse, trackpad, or finger (on mobile)
            </Label>
          </div>
          
          <div className="flex justify-center">
            <SignatureCanvas
              onSignatureComplete={handleSignatureComplete}
              width={400}
              height={150}
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Your signature will be saved as a digital image</p>
            <p>• This signature will be embedded in your TE7/TE9 PDF forms</p>
            <p>• For legal documents, consider also providing wet signature on printed forms</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Signature display component for showing saved signatures
export function SignatureDisplay({ signatureData, className = "" }: { signatureData: string; className?: string }) {
  if (!signatureData) {
    return (
      <div className={`flex items-center justify-center h-20 border border-dashed border-gray-300 rounded-lg bg-gray-50 ${className}`}>
        <span className="text-sm text-gray-500">No signature available</span>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-2 bg-white ${className}`}>
      <img 
        src={signatureData} 
        alt="Digital Signature" 
        className="max-w-full h-auto"
        style={{ maxHeight: '80px' }}
      />
    </div>
  );
}

// Hook for managing signatures in forms
export function useSignature() {
  const [signatures, setSignatures] = useState<{
    te7?: string;
    te9?: string;
    witness?: string;
  }>({});

  const addSignature = (type: 'te7' | 'te9' | 'pe2' | 'pe3' | 'n244' | 'witness', signatureData: string) => {
    setSignatures(prev => ({
      ...prev,
      [type]: signatureData
    }));
  };

  const removeSignature = (type: 'te7' | 'te9' | 'witness') => {
    setSignatures(prev => {
      const updated = { ...prev };
      delete updated[type];
      return updated;
    });
  };

  const hasSignature = (type: 'te7' | 'te9' | 'witness') => {
    return Boolean(signatures[type]);
  };

  const getSignature = (type: 'te7' | 'te9' | 'witness') => {
    return signatures[type];
  };

  const clearAllSignatures = () => {
    setSignatures({});
  };

  return {
    signatures,
    addSignature,
    removeSignature,
    hasSignature,
    getSignature,
    clearAllSignatures
  };
}

// TE7 Signature Form Component
export function TE7SignatureForm({ onSignatureComplete }: { onSignatureComplete: (signatures: { applicant?: string; witness?: string }) => void }) {
  const [showApplicantSignature, setShowApplicantSignature] = useState(false);
  const [showWitnessSignature, setShowWitnessSignature] = useState(false);
  const [applicantSignature, setApplicantSignature] = useState<string>("");
  const [witnessSignature, setWitnessSignature] = useState<string>("");

  const handleApplicantSignature = (data: string) => {
    setApplicantSignature(data);
    updateSignatures(data, witnessSignature);
  };

  const handleWitnessSignature = (data: string) => {
    setWitnessSignature(data);
    updateSignatures(applicantSignature, data);
  };

  const updateSignatures = (applicant: string, witness: string) => {
    onSignatureComplete({
      applicant: applicant || undefined,
      witness: witness || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          TE7 Form Signatures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Applicant Signature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Applicant Signature (Required)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApplicantSignature(true)}
              className="flex items-center gap-1"
            >
              <Pen className="w-4 h-4" />
              {applicantSignature ? 'Update' : 'Add'} Signature
            </Button>
          </div>
          
          <SignatureDisplay signatureData={applicantSignature} />
          
          <SignaturePad
            isOpen={showApplicantSignature}
            onOpenChange={setShowApplicantSignature}
            onSignatureComplete={handleApplicantSignature}
            title="Applicant Signature - TE7 Form"
            description="This signature confirms your application for more time to challenge the court order."
          />
        </div>

        {/* Witness Signature (Optional) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Witness Signature (Optional)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWitnessSignature(true)}
              className="flex items-center gap-1"
            >
              <Pen className="w-4 h-4" />
              {witnessSignature ? 'Update' : 'Add'} Signature
            </Button>
          </div>
          
          <SignatureDisplay signatureData={witnessSignature} />
          
          <SignaturePad
            isOpen={showWitnessSignature}
            onOpenChange={setShowWitnessSignature}
            onSignatureComplete={handleWitnessSignature}
            title="Witness Signature - TE7 Form"
            description="Optional witness signature for additional verification."
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Legal Note:</strong> Digital signatures are accepted for initial submission, but you may need to provide wet signatures on printed copies for final court submission. Check with the Traffic Enforcement Centre for specific requirements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// TE9 Signature Form Component
export function TE9SignatureForm({ onSignatureComplete }: { onSignatureComplete: (signatures: { declarant?: string; witness?: string }) => void }) {
  const [showDeclarantSignature, setShowDeclarantSignature] = useState(false);
  const [showWitnessSignature, setShowWitnessSignature] = useState(false);
  const [declarantSignature, setDeclarantSignature] = useState<string>("");
  const [witnessSignature, setWitnessSignature] = useState<string>("");

  const handleDeclarantSignature = (data: string) => {
    setDeclarantSignature(data);
    updateSignatures(data, witnessSignature);
  };

  const handleWitnessSignature = (data: string) => {
    setWitnessSignature(data);
    updateSignatures(declarantSignature, data);
  };

  const updateSignatures = (declarant: string, witness: string) => {
    onSignatureComplete({
      declarant: declarant || undefined,
      witness: witness || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="w-5 h-5" />
          TE9 Form Signatures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Declarant Signature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Declarant Signature (Required)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeclarantSignature(true)}
              className="flex items-center gap-1"
            >
              <Pen className="w-4 h-4" />
              {declarantSignature ? 'Update' : 'Add'} Signature
            </Button>
          </div>
          
          <SignatureDisplay signatureData={declarantSignature} />
          
          <SignaturePad
            isOpen={showDeclarantSignature}
            onOpenChange={setShowDeclarantSignature}
            onSignatureComplete={handleDeclarantSignature}
            title="Declarant Signature - TE9 Form"
            description="This signature confirms your witness statement for the unpaid penalty charge."
          />
        </div>

        {/* Witness Signature (Required for legal validity) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Authorized Witness Signature (Required)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWitnessSignature(true)}
              className="flex items-center gap-1"
            >
              <Pen className="w-4 h-4" />
              {witnessSignature ? 'Update' : 'Add'} Signature
            </Button>
          </div>
          
          <SignatureDisplay signatureData={witnessSignature} />
          
          <SignaturePad
            isOpen={showWitnessSignature}
            onOpenChange={setShowWitnessSignature}
            onSignatureComplete={handleWitnessSignature}
            title="Authorized Witness Signature - TE9 Form"
            description="This must be signed by a qualified solicitor, commissioner for oaths, or magistrate."
          />
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> TE9 forms require signature by a qualified witness (solicitor, commissioner for oaths, or magistrate). The digital signature feature here is for preparation - you will need to get the final document witnessed and signed in person.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default SignatureCanvas;
