"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { usePricing, formatPrice, type PricingInfo } from "@/hooks/use-pricing"
import { Loader2, CreditCard, Star, Shield, Zap, Tag } from "lucide-react"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  service: 'hpi' | 'appeal'
  onPaymentSuccess: () => void
  trialUsedFor?: string
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  service, 
  onPaymentSuccess,
  trialUsedFor 
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState<any>(null)
  const { toast } = useToast()
  
  // Fetch dynamic pricing with quantity and promo code
  const serviceType = service === 'hpi' 
    ? (quantity > 1 ? 'BULK_HPI' : 'HPI_CHECK') 
    : 'SINGLE_APPEAL'
  const { pricing, loading: pricingLoading } = usePricing(
    isOpen ? serviceType : undefined, 
    service === 'hpi' ? quantity : 1,
    promoCode || undefined
  )
  
  const pricingInfo = pricing as PricingInfo | null
  const { displayPrice, hasDiscount, savings } = pricingInfo 
    ? formatPrice(pricingInfo) 
    : { 
        displayPrice: service === 'hpi' 
          ? `£${5 * quantity}` 
          : '£5', 
        hasDiscount: false, 
        savings: '' 
      }

  const handlePayment = async (paymentType: string) => {
    // Prevent multiple simultaneous requests
    if (loading) {
      console.log('Payment already in progress, ignoring click')
      return
    }

    setLoading(true)
    setSelectedOption(paymentType)

    try {
      console.log('Starting payment for type:', paymentType)
      
      // Create checkout session
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: paymentType,
          quantity: quantity,
          promoCode: promoCode || undefined,
          description: service === 'hpi' 
            ? `${quantity > 1 ? `${quantity}x ` : ''}HPI Vehicle Check${quantity > 1 ? 's' : ''}` 
            : 'Traffic Ticket Appeal Service'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      console.log('Payment response received:', data)

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url)
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error) {
      console.error('Payment error:', error)
      
      // Better error handling based on response status
      let errorMessage = "There was a problem processing your payment. Please try again."
      
      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          errorMessage = "Please log in to continue with payment."
        } else if (error.message.includes('No checkout URL')) {
          errorMessage = "Failed to create payment session. Please try again."
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Too many payment attempts. Please wait a moment before trying again."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
      setLoading(false)
      setSelectedOption("")
    }
  }

  // Validate promo code
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoDiscount(null)
      return
    }

    setPromoLoading(true)
    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(), 
          paymentType: serviceType,
          quantity
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPromoDiscount(data.discount)
        toast({
          title: "Promo Code Applied!",
          description: `You saved ${data.discount.description}`,
          variant: "default"
        })
      } else {
        setPromoDiscount(null)
        const errorData = await response.json()
        toast({
          title: "Invalid Promo Code",
          description: errorData.error || "This promo code is not valid",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error validating promo code:', error)
      setPromoDiscount(null)
    }
    setPromoLoading(false)
  }

  // Update pricing when quantity or promo code changes
  useEffect(() => {
    // The usePricing hook will automatically refetch when dependencies change
  }, [quantity, promoCode, serviceType])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {service === 'hpi' ? 'HPI Vehicle Check' : 'Traffic Appeal Service'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {service === 'appeal' && trialUsedFor && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Trial Used:</strong> You've already used your free trial for vehicle registration <strong>{trialUsedFor}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3">
            {/* Quantity Input for HPI Checks */}
            {service === 'hpi' && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Number of HPI Checks</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  placeholder="Enter quantity"
                />
              </div>
            )}

            {/* Promo Code Input */}
            <div className="space-y-2">
              <Label htmlFor="promoCode">Promo Code (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  disabled={!promoCode.trim() || promoLoading}
                  onClick={() => validatePromoCode(promoCode)}
                >
                  {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
              {promoDiscount && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <Tag className="h-3 w-3" />
                  {promoDiscount.description} applied!
                </div>
              )}
            </div>

            {/* Single Service Payment */}
            <Card 
              className={`cursor-pointer transition-colors ${
                selectedOption === serviceType 
                  ? 'ring-2 ring-blue-500' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => !loading && !pricingLoading && handlePayment(serviceType)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {pricingInfo?.name || (service === 'hpi' ? 'HPI Check' : 'Single Appeal')}
                    </CardTitle>
                    <CardDescription>
                      {pricingInfo?.description || (service === 'hpi' 
                        ? 'Complete vehicle history report' 
                        : 'Professional appeal for one ticket')}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {hasDiscount && pricingInfo && (
                        <div className="text-sm text-gray-500 line-through">
                          £{pricingInfo.originalAmount}
                        </div>
                      )}
                      <div className="text-2xl font-bold text-blue-600">
                        {pricingLoading ? '...' : displayPrice}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">one-time</div>
                    {hasDiscount && (
                      <div className="flex items-center gap-1 mt-1">
                        <Tag className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">{savings}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full"
                  disabled={loading || pricingLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePayment(serviceType)
                  }}
                >
                  {loading && selectedOption === serviceType ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : pricingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {displayPrice}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Secure payment powered by Stripe. Cancel anytime.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
