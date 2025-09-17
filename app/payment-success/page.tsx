
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const paymentId = searchParams.get('payment_id')

    if (!sessionId || !paymentId) {
      setError('Missing payment information')
      setIsProcessing(false)
      return
    }

    // Verify payment with our backend
    verifyPayment(sessionId, paymentId)
  }, [searchParams])

  const verifyPayment = async (sessionId: string, paymentId: string) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          paymentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Payment verification failed')
      }

      const data = await response.json()
      setPaymentDetails(data)
    } catch (error) {
      console.error('Payment verification error:', error)
      setError('Payment verification failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
            <p className="text-gray-600 text-center">Please wait while we confirm your payment.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full">Return to Dashboard</Button>
              </Link>
              <p className="text-xs text-gray-500">
                If you were charged, please contact support for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {paymentDetails && (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{paymentDetails.description}</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  £{paymentDetails.amount}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  One-time payment completed
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p><strong>Payment ID:</strong> {paymentDetails.id}</p>
                  <p><strong>Date:</strong> {new Date(paymentDetails.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="space-y-2">
                  {paymentDetails.type === 'HPI_CHECK' && (
                    <Link href="/hpi-checks">
                      <Button className="w-full">
                        Start HPI Check
                      </Button>
                    </Link>
                  )}
                  {(paymentDetails.type === 'SINGLE_APPEAL') && (
                    <Link href="/appeals">
                      <Button className="w-full">
                        Create Appeal
                      </Button>
                    </Link>
                  )}
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      View Dashboard
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <p>A confirmation email has been sent to your registered email address.</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
