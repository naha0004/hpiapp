import { NextRequest, NextResponse } from 'next/server'
import { CarImageService } from '@/lib/car-image-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registration = searchParams.get('registration')
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const year = searchParams.get('year')
    const color = searchParams.get('color')
    const fuelType = searchParams.get('fuelType')

    if (!registration && (!make || !model)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either registration or make+model required',
          message: 'Please provide vehicle registration or make and model details'
        },
        { status: 400 }
      )
    }

    if (!make || !model || !year) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing vehicle details',
          message: 'Make, model, and year are required for image search'
        },
        { status: 400 }
      )
    }

    // Get vehicle images
    const vehicleDetails = {
      make,
      model, 
      year,
      color: color || undefined,
      fuelType: fuelType || undefined
    }

    const imageData = await CarImageService.getVehicleImages(registration || '', vehicleDetails)

    if (!imageData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No images found',
          message: 'No vehicle images could be found for the specified details'
        },
        { status: 404 }
      )
    }

    // Optimize images for different screen sizes
    const optimizedImages = {
      full: imageData.images.map(url => CarImageService.optimizeImageUrl(url, 800, 600)),
      medium: imageData.images.map(url => CarImageService.optimizeImageUrl(url, 400, 300)),
      thumbnails: imageData.thumbnails.map(url => CarImageService.optimizeImageUrl(url, 200, 150))
    }

    return NextResponse.json({
      success: true,
      data: {
        registration,
        vehicle: vehicleDetails,
        images: optimizedImages,
        primaryImage: imageData.primaryImage,
        source: imageData.source,
        confidence: imageData.confidence,
        altText: CarImageService.generateAltText(vehicleDetails, imageData.source),
        totalImages: imageData.images.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Vehicle images API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to fetch vehicle images. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registration, vehicleData } = body

    if (!vehicleData || !vehicleData.make || !vehicleData.model) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          message: 'Vehicle data with make and model is required'
        },
        { status: 400 }
      )
    }

    // Extract vehicle details from the provided data
    const vehicleDetails = {
      make: vehicleData.make || vehicleData.Make || '',
      model: vehicleData.model || vehicleData.Model || '',
      year: vehicleData.year || vehicleData.yearOfManufacture || vehicleData.Year || new Date().getFullYear().toString(),
      color: vehicleData.colour || vehicleData.color || vehicleData.Color,
      fuelType: vehicleData.fuelType || vehicleData.FuelType
    }

    const imageData = await CarImageService.getVehicleImages(registration || '', vehicleDetails)

    if (!imageData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No images found',
          message: 'No vehicle images could be found for the specified details'
        },
        { status: 404 }
      )
    }

    // Return comprehensive image data
    return NextResponse.json({
      success: true,
      data: {
        registration,
        vehicle: vehicleDetails,
        images: {
          full: imageData.images.map(url => CarImageService.optimizeImageUrl(url, 800, 600)),
          medium: imageData.images.map(url => CarImageService.optimizeImageUrl(url, 400, 300)),
          thumbnails: imageData.thumbnails.map(url => CarImageService.optimizeImageUrl(url, 200, 150))
        },
        primaryImage: CarImageService.optimizeImageUrl(imageData.primaryImage || imageData.images[0], 800, 600),
        source: imageData.source,
        confidence: imageData.confidence,
        altText: CarImageService.generateAltText(vehicleDetails, imageData.source),
        totalImages: imageData.images.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Vehicle images POST API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to process vehicle image request. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
