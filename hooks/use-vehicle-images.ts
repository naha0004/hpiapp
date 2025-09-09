import { useState, useEffect } from 'react'

interface VehicleImageData {
  registration?: string
  vehicle: {
    make: string
    model: string
    year: string
    color?: string
    fuelType?: string
  }
  images: {
    full: string[]
    medium: string[]
    thumbnails: string[]
  }
  primaryImage: string
  source: string
  confidence: number
  altText: string
  totalImages: number
  timestamp: string
}

interface UseVehicleImagesReturn {
  images: VehicleImageData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface VehicleDetails {
  make?: string
  model?: string
  year?: string
  colour?: string
  color?: string
  fuelType?: string
  yearOfManufacture?: string
  Make?: string
  Model?: string
  Year?: string
  Color?: string
  FuelType?: string
}

export function useVehicleImages(
  registration?: string, 
  vehicleData?: VehicleDetails,
  autoFetch: boolean = true
): UseVehicleImagesReturn {
  const [images, setImages] = useState<VehicleImageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchImages = async () => {
    if (!vehicleData && !registration) {
      setError('Vehicle data or registration required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let response: Response

      if (vehicleData) {
        // Use POST method with vehicle data
        response = await fetch('/api/vehicles/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            registration,
            vehicleData
          })
        })
      } else {
        // Use GET method with URL params
        const params = new URLSearchParams()
        if (registration) params.append('registration', registration)
        
        response = await fetch(`/api/vehicles/images?${params.toString()}`)
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch vehicle images')
      }

      const result = await response.json()
      
      if (result.success) {
        setImages(result.data)
      } else {
        throw new Error(result.message || 'Unknown error occurred')
      }

    } catch (err) {
      console.error('Error fetching vehicle images:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch images')
      setImages(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && (vehicleData || registration)) {
      fetchImages()
    }
  }, [registration, vehicleData, autoFetch])

  return {
    images,
    loading,
    error,
    refetch: fetchImages
  }
}

// Helper hook for just getting a single primary image quickly
export function useVehiclePrimaryImage(
  registration?: string, 
  vehicleData?: VehicleDetails,
  size: 'full' | 'medium' | 'thumbnail' = 'medium'
): { 
  imageUrl: string | null
  loading: boolean
  error: string | null
  altText: string | null
} {
  const { images, loading, error } = useVehicleImages(registration, vehicleData)

  const imageUrl = images ? (
    size === 'full' ? images.images.full[0] :
    size === 'medium' ? images.images.medium[0] :
    images.images.thumbnails[0]
  ) || images.primaryImage : null

  return {
    imageUrl,
    loading,
    error,
    altText: images?.altText || null
  }
}
