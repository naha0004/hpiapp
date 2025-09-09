import { useState, useEffect } from 'react'

export interface PricingInfo {
  service: string
  name: string
  description: string
  originalAmount: number
  finalAmount: number
  discount?: {
    type: string
    amount: number
    description: string
  }
}

export function usePricing(
  serviceType?: 'HPI_CHECK' | 'SINGLE_APPEAL' | 'BULK_HPI', 
  quantity?: number, 
  promoCode?: string
) {
  const [pricing, setPricing] = useState<PricingInfo | PricingInfo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPricing = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (serviceType) params.append('type', serviceType)
      if (quantity && quantity > 1) params.append('quantity', quantity.toString())
      if (promoCode) params.append('promoCode', promoCode)
      
      const url = `/api/payments${params.toString() ? `?${params.toString()}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pricing')
      }

      setPricing(serviceType ? data : data.pricing)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing')
      setPricing(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch pricing if serviceType is provided and component is mounted
    if (serviceType) {
      fetchPricing()
    }
  }, [serviceType, quantity, promoCode]) // Re-run when any dependency changes

  return { pricing, loading, error, refetch: fetchPricing }
}

// Helper function to format price with discount
export function formatPrice(pricing: PricingInfo): {
  displayPrice: string
  hasDiscount: boolean
  savings: string
} {
  const hasDiscount = pricing.discount && pricing.finalAmount < pricing.originalAmount
  
  return {
    displayPrice: `£${pricing.finalAmount}`,
    hasDiscount: Boolean(hasDiscount),
    savings: hasDiscount ? `Save £${pricing.discount!.amount}` : ''
  }
}
