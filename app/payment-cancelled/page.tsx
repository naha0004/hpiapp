"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentCancelledPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const paymentId = searchParams.get('payment_id')
    
    if (paymentId) {
      // Mark payment as cancelled in our database
      fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      }).catch(error => {
        console.error('Failed to cancel payment:', error)
      })
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-gray-600">
            <XCircle className="h-6 w-6" />
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => router.back()} 
              className="w-full"
            >
              Try Again
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t">
            <p>Need help? Contact our support team.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
