'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useVehicleImages, useVehiclePrimaryImage } from '@/hooks/use-vehicle-images'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Car, AlertCircle, Loader2 } from 'lucide-react'

interface VehicleImageProps {
  registration?: string
  vehicleData?: any
  size?: 'small' | 'medium' | 'large' | 'full'
  showGallery?: boolean
  showMetadata?: boolean
  className?: string
  fallbackText?: string
}

interface VehicleImageGalleryProps {
  registration?: string
  vehicleData?: any
  className?: string
}

interface VehiclePrimaryImageProps {
  registration?: string
  vehicleData?: any
  size?: 'small' | 'medium' | 'large'
  className?: string
  showPlaceholder?: boolean
}

// Main VehicleImage component with all features
export function VehicleImage({ 
  registration, 
  vehicleData, 
  size = 'medium',
  showGallery = false,
  showMetadata = false,
  className = '',
  fallbackText
}: VehicleImageProps) {
  const { images, loading, error } = useVehicleImages(registration, vehicleData)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Determine dimensions based on size
  const dimensions = {
    small: { width: 200, height: 150 },
    medium: { width: 400, height: 300 },
    large: { width: 600, height: 400 },
    full: { width: 800, height: 600 }
  }

  const { width, height } = dimensions[size]

  if (loading) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading vehicle image...</span>
        </div>
      </Card>
    )
  }

  if (error || !images) {
    return (
      <Card className={`flex items-center justify-center bg-muted ${className}`} style={{ width, height }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          <span className="text-sm text-center px-4">
            {fallbackText || 'Vehicle image not available'}
          </span>
        </div>
      </Card>
    )
  }

  const currentImages = size === 'small' ? images.images.thumbnails : 
                       size === 'large' || size === 'full' ? images.images.full : 
                       images.images.medium

  const currentImage = currentImages[currentImageIndex] || images.primaryImage

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)
  }

  return (
    <div className={className}>
      <Card className="relative overflow-hidden">
        <div className="relative" style={{ width, height }}>
          <Image
            src={currentImage}
            alt={images.altText}
            fill
            className="object-cover"
            sizes={`${width}px`}
            priority={currentImageIndex === 0}
            onError={(e) => {
              // Fallback to next available image or placeholder
              if (currentImageIndex < currentImages.length - 1) {
                setCurrentImageIndex(currentImageIndex + 1)
              }
            }}
          />

          {/* Gallery navigation */}
          {showGallery && images.totalImages > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Image counter */}
              <Badge className="absolute bottom-2 right-2 text-xs">
                {currentImageIndex + 1} / {images.totalImages}
              </Badge>
            </>
          )}

          {/* Confidence badge */}
          {showMetadata && (
            <Badge 
              variant={images.confidence > 0.7 ? "default" : "secondary"}
              className="absolute top-2 left-2 text-xs"
            >
              {Math.round(images.confidence * 100)}% match
            </Badge>
          )}
        </div>

        {/* Metadata footer */}
        {showMetadata && (
          <div className="p-3 bg-muted/50">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Source: {images.source}</span>
              <span>{images.vehicle.year} {images.vehicle.make} {images.vehicle.model}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Thumbnail strip for gallery */}
      {showGallery && images.totalImages > 1 && (
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {currentImages.slice(0, 5).map((thumb, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative w-12 h-9 rounded border-2 overflow-hidden flex-shrink-0 ${
                index === currentImageIndex ? 'border-primary' : 'border-muted'
              }`}
            >
              <Image
                src={images.images.thumbnails[index] || thumb}
                alt={`${images.vehicle.make} ${images.vehicle.model} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Simplified component for just the primary image
export function VehiclePrimaryImage({ 
  registration, 
  vehicleData, 
  size = 'medium',
  className = '',
  showPlaceholder = true
}: VehiclePrimaryImageProps) {
  const imageSize = size === 'small' ? 'thumbnail' : size === 'large' ? 'full' : 'medium'
  const { imageUrl, loading, error, altText } = useVehiclePrimaryImage(registration, vehicleData, imageSize)

  const dimensions = {
    small: { width: 120, height: 90 },
    medium: { width: 200, height: 150 },
    large: { width: 300, height: 200 }
  }

  const { width, height } = dimensions[size]

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={{ width, height }}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !imageUrl) {
    if (!showPlaceholder) return null
    
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`} style={{ width, height }}>
        <Car className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={`relative rounded overflow-hidden ${className}`} style={{ width, height }}>
      <Image
        src={imageUrl}
        alt={altText || 'Vehicle image'}
        fill
        className="object-cover"
        sizes={`${width}px`}
      />
    </div>
  )
}

// Gallery component for multiple images
export function VehicleImageGallery({ 
  registration, 
  vehicleData, 
  className = '' 
}: VehicleImageGalleryProps) {
  return (
    <VehicleImage
      registration={registration}
      vehicleData={vehicleData}
      size="large"
      showGallery={true}
      showMetadata={true}
      className={className}
    />
  )
}
