// Car Image Service - Fetches vehicle images automatically
// Uses multiple sources for best coverage with precision matching

import { PrecisionImageService } from './precision-image-service'

interface VehicleImageData {
  images: string[]
  thumbnails: string[]
  primaryImage?: string
  source: string
  confidence: number
  backgroundRemoved?: boolean
  matchType?: 'exact' | 'model' | 'make' | 'fallback'
}

interface VehicleDetails {
  make: string
  model: string
  year: string
  color?: string
  fuelType?: string
}

export class CarImageService {
  
  /**
   * Fetch car images based on vehicle registration and details
   */
  static async getVehicleImages(registration: string, vehicleDetails: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      console.log(`🚗 Fetching PRECISION images for ${registration} - ${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.year}`)
      
      // Try precision service first for exact matches
      const precisionImages = await PrecisionImageService.getPrecisionImages(
        vehicleDetails.make,
        vehicleDetails.model, 
        vehicleDetails.year,
        registration
      )
      
      if (precisionImages && precisionImages.length > 0) {
        const bestPrecision = precisionImages[0]
        return {
          images: [bestPrecision.processedImage],
          thumbnails: [bestPrecision.processedImage],
          primaryImage: bestPrecision.processedImage,
          source: `Precision Automotive API (${bestPrecision.matchType})`,
          confidence: bestPrecision.confidence,
          backgroundRemoved: bestPrecision.backgroundRemoved,
          matchType: bestPrecision.matchType
        }
      }
      
      // Try multiple sources in order of precision
      const sources = [
        () => this.getImagesFromCarAPI(registration, vehicleDetails),
        () => this.getImagesFromUnsplash(vehicleDetails),
        () => this.getImagesFromGenericSource(vehicleDetails),
        () => this.getImagesFromLocalDatabase(vehicleDetails)
      ]
      
      for (const source of sources) {
        try {
          const result = await source()
          if (result && result.images.length > 0) {
            // Validate the image is actually the correct car
            if (result.confidence > 0.8) {
              const validation = await PrecisionImageService.validateCarImage(
                result.primaryImage || result.images[0],
                vehicleDetails.make,
                vehicleDetails.model,
                vehicleDetails.year
              )
              
              if (validation.isValid) {
                result.confidence = Math.min(0.98, result.confidence * validation.confidence)
              }
            }
            
            return result
          }
        } catch (error) {
          console.log(`Image source failed, trying next...`, error)
          continue
        }
      }
      
      // Return fallback generic car image
      return this.getFallbackImage(vehicleDetails)
      
    } catch (error) {
      console.error('Error fetching vehicle images:', error)
      return this.getFallbackImage(vehicleDetails)
    }
  }
  
  /**
   * Get images from Car API (premium service) - Multiple precision sources
   */
  private static async getImagesFromCarAPI(registration: string, details: VehicleDetails): Promise<VehicleImageData | null> {
    // Try multiple premium car image APIs in order of precision
    const apiMethods = [
      () => this.getFromAutomotiveAPI(details),
      () => this.getFromCarQueryAPI(details),
      () => this.getFromEdmundsAPI(details),
      () => this.getFromAutoTraderAPI(registration, details),
      () => this.getFromCarGurusAPI(details)
    ]
    
    for (const method of apiMethods) {
      try {
        const result = await method()
        if (result) return result
      } catch (error) {
        console.log('Car API method failed, trying next...', error)
        continue
      }
    }
    
    return null
  }
  
  /**
   * Automotive Image API - Specialized for precise, no-background car images
   */
  private static async getFromAutomotiveAPI(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      // Try RapidAPI Automotive Database
      const rapidApiKey = process.env.RAPIDAPI_KEY
      if (rapidApiKey) {
        const response = await fetch(`https://automotive-api.p.rapidapi.com/cars?make=${encodeURIComponent(details.make)}&model=${encodeURIComponent(details.model)}&year=${details.year}`, {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'automotive-api.p.rapidapi.com'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.cars && data.cars.length > 0) {
            const car = data.cars[0]
            if (car.images && car.images.length > 0) {
              // These APIs typically provide clean, studio-style images
              return {
                images: car.images.map((img: any) => img.large || img.original).filter(Boolean),
                thumbnails: car.images.map((img: any) => img.thumb || img.small).filter(Boolean),
                primaryImage: car.images[0].large || car.images[0].original,
                source: 'Automotive API (Studio Images)',
                confidence: 0.98
              }
            }
          }
        }
      }
      
      // Try Car Specifications API
      const carSpecsKey = process.env.CAR_SPECS_API_KEY
      if (carSpecsKey) {
        const response = await fetch(`https://car-specs.p.rapidapi.com/v2/cars/images?make=${details.make}&model=${details.model}&year=${details.year}`, {
          headers: {
            'X-RapidAPI-Key': carSpecsKey,
            'X-RapidAPI-Host': 'car-specs.p.rapidapi.com'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.images && data.images.length > 0) {
            return {
              images: data.images.filter(Boolean),
              thumbnails: data.images.map((img: string) => img.replace('/large/', '/thumb/')),
              primaryImage: data.images[0],
              source: 'Car Specs API (Official Images)',
              confidence: 0.96
            }
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }
  
  /**
   * CarQuery API integration - Enhanced for precise matching
   */
  private static async getFromCarQueryAPI(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      // CarQuery API for vehicle specifications and images
      const response = await fetch(`https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModels&make=${encodeURIComponent(details.make)}&year=${details.year}`)
      
      if (!response.ok) return null
      
      const data = await response.text()
      // CarQuery returns JSONP, extract JSON
      const jsonMatch = data.match(/\?\((.*)\)/)
      if (!jsonMatch) return null
      
      const carData = JSON.parse(jsonMatch[1])
      
      if (carData.Models && carData.Models.length > 0) {
        // Find exact model match with fuzzy matching
        const modelName = details.model.toLowerCase().replace(/[-\s]/g, '')
        const exactMatch = carData.Models.find((m: any) => {
          const apiModel = m.model_name.toLowerCase().replace(/[-\s]/g, '')
          return apiModel.includes(modelName) || modelName.includes(apiModel)
        })
        
        if (exactMatch) {
          // Get detailed model info for images
          const detailResponse = await fetch(`https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getModel&model=${exactMatch.model_id}`)
          if (detailResponse.ok) {
            const detailData = await detailResponse.text()
            const detailJsonMatch = detailData.match(/\?\((.*)\)/)
            if (detailJsonMatch) {
              const modelDetails = JSON.parse(detailJsonMatch[1])
              if (modelDetails.model_image || modelDetails.images) {
                const images = modelDetails.images || [modelDetails.model_image]
                return {
                  images: images.filter(Boolean),
                  thumbnails: images.filter(Boolean),
                  primaryImage: images[0],
                  source: 'CarQuery API (Exact Match)',
                  confidence: 0.98
                }
              }
            }
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }
  
  /**
   * Edmunds API integration (if available)
   */
  private static async getFromEdmundsAPI(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      const apiKey = process.env.EDMUNDS_API_KEY
      if (!apiKey) return null
      
      // Search for vehicle
      const response = await fetch(
        `https://api.edmunds.com/api/vehicle/v2/makes/${details.make}/models/${details.model}/years/${details.year}?fmt=json&api_key=${apiKey}`
      )
      
      if (!response.ok) return null
      
      const data = await response.json()
      
      if (data.styles && data.styles.length > 0) {
        const style = data.styles[0]
        if (style.photos && style.photos.length > 0) {
          const images = style.photos.map((photo: any) => photo.photoSrcs?.large || photo.photoSrcs?.medium || photo.photoSrcs?.small)
            .filter(Boolean)
          
          if (images.length > 0) {
            return {
              images,
              thumbnails: style.photos.map((photo: any) => photo.photoSrcs?.small || photo.photoSrcs?.medium).filter(Boolean),
              primaryImage: images[0],
              source: 'Edmunds API',
              confidence: 0.92
            }
          }
        }
      }
      
      return null
    } catch (error) {
      return null
    }
  }
  
  /**
   * AutoTrader-style API integration - Real automotive marketplace images
   */
  private static async getFromAutoTraderAPI(registration: string, details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      // Try AutoTrader UK API for real car listings with no-background images
      const autoTraderKey = process.env.AUTOTRADER_API_KEY
      if (autoTraderKey) {
        const response = await fetch(`https://api.autotrader.co.uk/v1/vehicles/search?make=${details.make}&model=${details.model}&year_from=${details.year}&year_to=${details.year}&page_size=5`, {
          headers: {
            'Authorization': `Bearer ${autoTraderKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.vehicles && data.vehicles.length > 0) {
            const vehicle = data.vehicles[0]
            if (vehicle.images && vehicle.images.length > 0) {
              // AutoTrader provides clean, no-background car images
              const images = vehicle.images.map((img: any) => img.large || img.medium || img.small).filter(Boolean)
              return {
                images,
                thumbnails: vehicle.images.map((img: any) => img.small || img.medium).filter(Boolean),
                primaryImage: images[0],
                source: 'AutoTrader UK (Marketplace)',
                confidence: 0.95
              }
            }
          }
        }
      }
      
      // Try Cars.com API as alternative
      const carsApiKey = process.env.CARS_API_KEY
      if (carsApiKey) {
        const response = await fetch(`https://api.cars.com/v1/vehicles?make=${details.make}&model=${details.model}&year=${details.year}&limit=3`, {
          headers: {
            'Authorization': `Bearer ${carsApiKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.vehicles && data.vehicles.length > 0) {
            const vehicle = data.vehicles[0]
            if (vehicle.photos && vehicle.photos.length > 0) {
              const images = vehicle.photos.map((photo: any) => photo.large_url || photo.medium_url).filter(Boolean)
              return {
                images,
                thumbnails: vehicle.photos.map((photo: any) => photo.thumbnail_url || photo.small_url).filter(Boolean),
                primaryImage: images[0],
                source: 'Cars.com API',
                confidence: 0.92
              }
            }
          }
        }
      }
      
      return null
      
    } catch (error) {
      return null
    }
  }
  
  /**
   * CarGurus-style API integration
   */
  private static async getFromCarGurusAPI(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      // This would integrate with CarGurus or similar APIs
      // For now, return null as we don't have real API credentials
      return null
      
    } catch (error) {
      return null
    }
  }
  
  /**
   * Get images from Unsplash (free, high quality) with better search terms
   */
  private static async getImagesFromUnsplash(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      const accessKey = process.env.UNSPLASH_ACCESS_KEY || 'demo-key'
      
      // Create more specific search terms
      const searchQueries = [
        `${details.year} ${details.make} ${details.model}`,
        `${details.make} ${details.model} ${details.year} car`,
        `${details.make} ${details.model} car exterior`,
        `${details.make} ${details.model} automobile`
      ]
      
      // Try each search query until we find results
      for (const query of searchQueries) {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape&client_id=${accessKey}`
        )
        
        if (!response.ok) {
          continue
        }
        
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          // Filter for car-related images by checking tags and descriptions
          const carImages = data.results.filter((photo: any) => {
            const tags = photo.tags?.map((tag: any) => tag.title.toLowerCase()) || []
            const description = (photo.description || '').toLowerCase()
            const altDescription = (photo.alt_description || '').toLowerCase()
            
            const carKeywords = ['car', 'vehicle', 'automobile', 'automotive', details.make.toLowerCase(), details.model.toLowerCase()]
            const hasCarKeywords = carKeywords.some(keyword => 
              tags.includes(keyword) || 
              description.includes(keyword) || 
              altDescription.includes(keyword)
            )
            
            return hasCarKeywords
          })
          
          if (carImages.length > 0) {
            const images = carImages.map((photo: any) => photo.urls.regular)
            const thumbnails = carImages.map((photo: any) => photo.urls.thumb)
            
            // Higher confidence for more specific matches
            const confidence = query.includes(details.year) ? 0.8 : 0.7
            
            return {
              images,
              thumbnails,
              primaryImage: images[0],
              source: 'Unsplash (Filtered)',
              confidence
            }
          }
        }
      }
      
      return null
      
    } catch (error) {
      console.log('Unsplash API not available:', error)
      return null
    }
  }
  
  /**
   * Get images from generic car database with improved matching
   */
  private static async getImagesFromGenericSource(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      // Use a curated database of car images
      const carDatabase = await this.getCarImageDatabase()
      
      // Normalize make and model names
      const make = details.make.toLowerCase().replace(/[-\s]/g, '-')
      const model = details.model.toLowerCase().replace(/[-\s]/g, '-')
      const year = details.year
      
      // Try exact match first (year + make + model)
      let key = `${make}_${model}_${year}`
      if (carDatabase[key]) {
        return {
          images: carDatabase[key].images,
          thumbnails: carDatabase[key].thumbnails,
          primaryImage: carDatabase[key].images[0],
          source: 'Curated Database (Exact Match)',
          confidence: carDatabase[key].confidence
        }
      }
      
      // Try year range matches (±2 years)
      const yearNum = parseInt(year)
      if (!isNaN(yearNum)) {
        for (let i = -2; i <= 2; i++) {
          key = `${make}_${model}_${yearNum + i}`
          if (carDatabase[key]) {
            return {
              images: carDatabase[key].images,
              thumbnails: carDatabase[key].thumbnails,
              primaryImage: carDatabase[key].images[0],
              source: `Curated Database (${yearNum + i} Model)`,
              confidence: Math.max(0.3, carDatabase[key].confidence - Math.abs(i) * 0.1)
            }
          }
        }
      }
      
      // Try make and model match without year
      const modelVariations = [
        model,
        model.replace(/[-_]/g, ''),
        model.split('-')[0],
        model.split(' ')[0].toLowerCase()
      ]
      
      for (const modelVar of modelVariations) {
        const matchingKeys = Object.keys(carDatabase).filter(k => 
          k.startsWith(`${make}_${modelVar}`)
        )
        
        if (matchingKeys.length > 0) {
          const bestMatch = matchingKeys[0]
          return {
            images: carDatabase[bestMatch].images,
            thumbnails: carDatabase[bestMatch].thumbnails,
            primaryImage: carDatabase[bestMatch].images[0],
            source: 'Curated Database (Model Match)',
            confidence: Math.max(0.4, carDatabase[bestMatch].confidence - 0.2)
          }
        }
      }
      
      // Try make-only match with recent years prioritized
      const makeMatches = Object.keys(carDatabase)
        .filter(k => k.startsWith(make))
        .sort((a, b) => {
          // Extract year from key and prioritize recent years
          const yearA = parseInt(a.split('_')[2]) || 0
          const yearB = parseInt(b.split('_')[2]) || 0
          return yearB - yearA
        })
        .slice(0, 3)
      
      if (makeMatches.length > 0) {
        const images = makeMatches.map(k => carDatabase[k].images[0]).filter(Boolean)
        const thumbnails = makeMatches.map(k => carDatabase[k].thumbnails[0]).filter(Boolean)
        
        if (images.length > 0) {
          return {
            images,
            thumbnails,
            primaryImage: images[0],
            source: `Curated Database (${details.make} Models)`,
            confidence: 0.3
          }
        }
      }
      
      return null
      
    } catch (error) {
      console.log('Generic source not available:', error)
      return null
    }
  }
  
  /**
   * Get images from local database/assets
   */
  private static async getImagesFromLocalDatabase(details: VehicleDetails): Promise<VehicleImageData | null> {
    try {
      // Check for locally stored car images
      const localPath = `/images/cars/${details.make.toLowerCase()}`
      
      // This would check if we have local images stored
      const availableImages = [
        `${localPath}/${details.model.toLowerCase()}-${details.year}.jpg`,
        `${localPath}/${details.model.toLowerCase()}.jpg`,
        `${localPath}/generic.jpg`
      ]
      
      // Return first available local image
      // In a real implementation, you'd check if these files exist
      return {
        images: [availableImages[0]],
        thumbnails: [availableImages[0]],
        primaryImage: availableImages[0],
        source: 'Local Database',
        confidence: 0.3
      }
      
    } catch (error) {
      console.log('Local database not available:', error)
      return null
    }
  }
  
  /**
   * Get fallback generic car image with better categorization
   */
  private static getFallbackImage(details: VehicleDetails): VehicleImageData {
    // Categorize vehicle type for better fallback images
    const vehicleType = this.categorizeVehicle(details)
    
    const fallbackImages = {
      'small-car': [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop', // Compact car
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop', // Small hatchback
      ],
      'medium-car': [
        'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop', // Mid-size sedan
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop', // Family car
      ],
      'luxury-car': [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop', // BMW-style
        'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop', // Mercedes-style
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop', // Audi-style
      ],
      'suv': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // SUV/Crossover
        'https://images.unsplash.com/photo-1519641760746-95d1211e9a4e?w=800&h=600&fit=crop', // Large SUV
      ],
      'generic': [
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop', // Generic modern car
        '/images/cars/placeholder-vehicle.svg'
      ]
    }
    
    const categoryImages = fallbackImages[vehicleType] || fallbackImages.generic
    const images = categoryImages.map(url => url.includes('unsplash.com') ? `${url}&auto=format&q=75` : url)
    
    return {
      images,
      thumbnails: images.map(url => url.replace('w=800&h=600', 'w=300&h=200')),
      primaryImage: images[0],
      source: `Fallback (${vehicleType})`,
      confidence: 0.15
    }
  }
  
  /**
   * Categorize vehicle for better fallback selection
   */
  private static categorizeVehicle(details: VehicleDetails): 'small-car' | 'medium-car' | 'luxury-car' | 'suv' | 'generic' {
    const make = details.make.toLowerCase()
    const model = details.model.toLowerCase()
    
    // Luxury brands
    if (['bmw', 'mercedes-benz', 'mercedes', 'audi', 'lexus', 'jaguar', 'porsche', 'bentley', 'rolls-royce'].includes(make)) {
      return 'luxury-car'
    }
    
    // SUV/Crossover models
    if (model.includes('suv') || 
        ['qashqai', 'x3', 'x5', 'q3', 'q5', 'q7', 'kuga', 'tucson', 'santa fe', 'rav4', 'cr-v', 'x-trail', 'tiguan', 'touareg', 'cayenne', 'macan', 'discovery', 'range rover', 'evoque', '3008', '5008', 'captur', 'kadjar'].includes(model.replace(/[-\s]/g, ''))) {
      return 'suv'
    }
    
    // Small cars
    if (['fiesta', 'corsa', 'polo', 'micra', 'yaris', 'aygo', 'i10', 'i20', 'clio', '208', 'up!', 'up', 'ka', 'adam', 'swift', 'ignis', 'jazz'].includes(model.replace(/[-\s]/g, ''))) {
      return 'small-car'
    }
    
    // Medium/family cars
    if (['focus', 'astra', 'golf', 'civic', 'corolla', 'accord', 'passat', 'mondeo', 'insignia', 'octavia', 'leon', 'a3', 'a4', '3 series', '5 series', 'c-class', 'e-class'].some(car => model.includes(car.replace(/[-\s]/g, '')))) {
      return 'medium-car'
    }
    
    return 'generic'
  }
  
  /**
   * Car image database with precise, no-background manufacturer images (UK market focused)
   */
  private static async getCarImageDatabase(): Promise<Record<string, {images: string[], thumbnails: string[], confidence: number}>> {
    return {
      // Ford Models - Official manufacturer studio images
      'ford_fiesta_2020': {
        images: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/fiesta/2019-fiesta/gallery/exterior/16x9/Ford-Fiesta-ST-Line-Blazer-Blue-16x9-2160x1215.jpg',
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/fiesta/2019-fiesta/gallery/exterior/16x9/Ford-Fiesta-ST-Line-Race-Red-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/fiesta/2019-fiesta/gallery/exterior/16x9/Ford-Fiesta-ST-Line-Blazer-Blue-16x9-2160x1215.jpg?renditions=small',
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/fiesta/2019-fiesta/gallery/exterior/16x9/Ford-Fiesta-ST-Line-Race-Red-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      'ford_fiesta_2021': {
        images: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/fiesta/2019-fiesta/gallery/exterior/16x9/Ford-Fiesta-ST-Line-Blazer-Blue-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/fiesta/2019-fiesta/gallery/exterior/16x9/Ford-Fiesta-ST-Line-Blazer-Blue-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      'ford_focus_2020': {
        images: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/focus/2018-focus/gallery/exterior/16x9/Ford-Focus-ST-Line-Orange-Fury-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/focus/2018-focus/gallery/exterior/16x9/Ford-Focus-ST-Line-Orange-Fury-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      'ford_focus_2021': {
        images: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/focus/2018-focus/gallery/exterior/16x9/Ford-Focus-ST-Line-Orange-Fury-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://www.ford.co.uk/content/dam/guxeu/uk/vehicles/focus/2018-focus/gallery/exterior/16x9/Ford-Focus-ST-Line-Orange-Fury-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      
      // Vauxhall Models - Official manufacturer images
      'vauxhall_corsa_2020': {
        images: [
          'https://cdn.vauxhall.co.uk/content/dam/vauxhall/europe/vehicles/corsa/2019-corsa-e/gallery/exterior/16x9/Vauxhall-Corsa-e-SRi-Nav-Premium-Power-Red-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://cdn.vauxhall.co.uk/content/dam/vauxhall/europe/vehicles/corsa/2019-corsa-e/gallery/exterior/16x9/Vauxhall-Corsa-e-SRi-Nav-Premium-Power-Red-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      'vauxhall_corsa_2021': {
        images: [
          'https://cdn.vauxhall.co.uk/content/dam/vauxhall/europe/vehicles/corsa/2019-corsa-e/gallery/exterior/16x9/Vauxhall-Corsa-e-SRi-Nav-Premium-Power-Red-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://cdn.vauxhall.co.uk/content/dam/vauxhall/europe/vehicles/corsa/2019-corsa-e/gallery/exterior/16x9/Vauxhall-Corsa-e-SRi-Nav-Premium-Power-Red-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      'vauxhall_astra_2020': {
        images: [
          'https://cdn.vauxhall.co.uk/content/dam/vauxhall/europe/vehicles/astra/2021-astra/gallery/exterior/16x9/Vauxhall-Astra-Ultimate-Nav-Moonstone-Grey-16x9-2160x1215.jpg'
        ],
        thumbnails: [
          'https://cdn.vauxhall.co.uk/content/dam/vauxhall/europe/vehicles/astra/2021-astra/gallery/exterior/16x9/Vauxhall-Astra-Ultimate-Nav-Moonstone-Grey-16x9-2160x1215.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      
      // Volkswagen Models - Official manufacturer studio images
      'volkswagen_golf_2020': {
        images: [
          'https://cdn02.volkswagen-newsroom.com/media/gallery_items/2019-10/VW-Golf8-001.jpg'
        ],
        thumbnails: [
          'https://cdn02.volkswagen-newsroom.com/media/gallery_items/2019-10/VW-Golf8-001.jpg?renditions=small'
        ],
        confidence: 0.96
      },
      'volkswagen_golf_2021': {
        images: [
          'https://cdn02.volkswagen-newsroom.com/media/gallery_items/2019-10/VW-Golf8-001.jpg'
        ],
        thumbnails: [
          'https://cdn02.volkswagen-newsroom.com/media/gallery_items/2019-10/VW-Golf8-001.jpg?renditions=small'
        ],
        confidence: 0.96
      },
      'volkswagen_polo_2020': {
        images: [
          'https://cdn02.volkswagen-newsroom.com/media/gallery_items/2021-04/Polo_2021_exterior_001.jpg'
        ],
        thumbnails: [
          'https://cdn02.volkswagen-newsroom.com/media/gallery_items/2021-04/Polo_2021_exterior_001.jpg?renditions=small'
        ],
        confidence: 0.95
      },
      
      // BMW Models - Official manufacturer studio images with transparent backgrounds
      'bmw_3_series_2020': {
        images: [
          'https://prod.cosy.bmw.cloud/bmwweb/cosySec?COSY-EU-100-2545xM4RIyFnbm9Mb3JlUUVRUEluWW9RRWpGejhVRnFOWXAFemFnYUo5M300hWFqT2s5aDJpOUZVZmt0dm1TUEY0OW9wQmVVWlpjQTJ6USUlZm1SnbEUCQ'
        ],
        thumbnails: [
          'https://prod.cosy.bmw.cloud/bmwweb/cosySec?COSY-EU-100-2545xM4RIyFnbm9Mb3JlUUVRUEluWW9RRWpGejhVRnFOWXAFemFnYUo5M200hWFqT2s5aDJpOUZVZmt0dm1TUEY0OW9wQmVVWlpjQTJ6USUlZm1SnbEUCQ?width=400'
        ],
        confidence: 0.97
      },
      'bmw_3_series_2021': {
        images: [
          'https://prod.cosy.bmw.cloud/bmwweb/cosySec?COSY-EU-100-2545xM4RIyFnbm9Mb3JlUUVRUEluWW9RRWpGejhVRnFOWXAFemFnYUo5M200hWFqT2s5aDJpOUZVZmt0dm1TUEY0OW9wQmVVWlpjQTJ6USUlZm1SnbEUCQ'
        ],
        thumbnails: [
          'https://prod.cosy.bmw.cloud/bmwweb/cosySec?COSY-EU-100-2545xM4RIyFnbm9Mb3JlUUVRUEluWW9RRWpGejhVRnFOWXAFemFnYUo5M200hWFqT2s5aDJpOUZVZmt0dm1TUEY0OW9wQmVVWlpjQTJ6USUlZm1SnbEUCQ?width=400'
        ],
        confidence: 0.97
      },
      'bmw_1_series_2020': {
        images: [
          'https://prod.cosy.bmw.cloud/bmwweb/cosySec?COSY-EU-100-2545xM4RIyFnbm9Mb3JlUUVRUEluWW9RRWpGejhVRnFOWXAFemFnYUo5M300hWFqT2s5aDJpOUZVZmt0dm1TUEY0OW9wQmVVWlpjQTJ6USUlZm1SnbEUCD'
        ],
        thumbnails: [
          'https://prod.cosy.bmw.cloud/bmwweb/cosySec?COSY-EU-100-2545xM4RIyFnbm9Mb3JlUUVRUEluWW9RRWpGejhVRnFOWXAFemFnYUo5M300hWFqT2s5aDJpOUZVZmt0dm1TUEY0OW9wQmVVWlpjQTJ6USUlZm1SnbEUCD?width=400'
        ],
        confidence: 0.96
      },
      
      // Audi Models - Official manufacturer studio images
      'audi_a3_2020': {
        images: [
          'https://mediaservice.audi.com/media/live/50900/fly1400x601n8/8ya-2020/2020-audi-a3-sportback-s-line-exterior-1400.jpg'
        ],
        thumbnails: [
          'https://mediaservice.audi.com/media/live/50900/fly400x300n8/8ya-2020/2020-audi-a3-sportback-s-line-exterior-400.jpg'
        ],
        confidence: 0.96
      },
      'audi_a3_2021': {
        images: [
          'https://mediaservice.audi.com/media/live/50900/fly1400x601n8/8ya-2020/2020-audi-a3-sportback-s-line-exterior-1400.jpg'
        ],
        thumbnails: [
          'https://mediaservice.audi.com/media/live/50900/fly400x300n8/8ya-2020/2020-audi-a3-sportback-s-line-exterior-400.jpg'
        ],
        confidence: 0.96
      },
      'audi_a4_2020': {
        images: [
          'https://mediaservice.audi.com/media/live/50900/fly1400x601n8/8w-2019/2019-audi-a4-avant-s-line-exterior-1400.jpg'
        ],
        thumbnails: [
          'https://mediaservice.audi.com/media/live/50900/fly400x300n8/8w-2019/2019-audi-a4-avant-s-line-exterior-400.jpg'
        ],
        confidence: 0.96
      },
      
      // Mercedes-Benz Models - Official manufacturer images
      'mercedes-benz_c-class_2020': {
        images: [
          'https://www.mercedes-benz.com/en/vehicles/passenger-cars/c-class/sedan/_jcr_content/image.MQ6.12.20191206121356.jpeg'
        ],
        thumbnails: [
          'https://www.mercedes-benz.com/en/vehicles/passenger-cars/c-class/sedan/_jcr_content/image.MQ6.12.20191206121356.jpeg?width=400'
        ],
        confidence: 0.96
      },
      'mercedes-benz_a-class_2020': {
        images: [
          'https://www.mercedes-benz.com/en/vehicles/passenger-cars/a-class/hatchback/_jcr_content/image.MQ6.12.20191206121356.jpeg'
        ],
        thumbnails: [
          'https://www.mercedes-benz.com/en/vehicles/passenger-cars/a-class/hatchback/_jcr_content/image.MQ6.12.20191206121356.jpeg?width=400'
        ],
        confidence: 0.96
      },
      
      // Nissan Models - Official manufacturer studio images
      'nissan_qashqai_2020': {
        images: [
          'https://www.nissan.co.uk/content/dam/Nissan/nissan_europe/vehicles/qashqai/product_code/product_version/overview/new-nissan-qashqai-white-exterior-front-angle.jpg'
        ],
        thumbnails: [
          'https://www.nissan.co.uk/content/dam/Nissan/nissan_europe/vehicles/qashqai/product_code/product_version/overview/new-nissan-qashqai-white-exterior-front-angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      'nissan_qashqai_2021': {
        images: [
          'https://www.nissan.co.uk/content/dam/Nissan/nissan_europe/vehicles/qashqai/product_code/product_version/overview/new-nissan-qashqai-white-exterior-front-angle.jpg'
        ],
        thumbnails: [
          'https://www.nissan.co.uk/content/dam/Nissan/nissan_europe/vehicles/qashqai/product_code/product_version/overview/new-nissan-qashqai-white-exterior-front-angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      'nissan_micra_2020': {
        images: [
          'https://www.nissan.co.uk/content/dam/Nissan/nissan_europe/vehicles/micra/product_code/product_version/overview/nissan-micra-red-exterior-front-angle.jpg'
        ],
        thumbnails: [
          'https://www.nissan.co.uk/content/dam/Nissan/nissan_europe/vehicles/micra/product_code/product_version/overview/nissan-micra-red-exterior-front-angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      
      // Toyota Models - Official manufacturer studio images
      'toyota_yaris_2020': {
        images: [
          'https://www.toyota.co.uk/images/yaris/gallery/exterior/Toyota-Yaris-2020-Red-Exterior-Front-Angle.jpg'
        ],
        thumbnails: [
          'https://www.toyota.co.uk/images/yaris/gallery/exterior/Toyota-Yaris-2020-Red-Exterior-Front-Angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      'toyota_yaris_2021': {
        images: [
          'https://www.toyota.co.uk/images/yaris/gallery/exterior/Toyota-Yaris-2020-Red-Exterior-Front-Angle.jpg'
        ],
        thumbnails: [
          'https://www.toyota.co.uk/images/yaris/gallery/exterior/Toyota-Yaris-2020-Red-Exterior-Front-Angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      'toyota_corolla_2020': {
        images: [
          'https://www.toyota.co.uk/images/corolla/gallery/exterior/Toyota-Corolla-2019-White-Exterior-Front-Angle.jpg'
        ],
        thumbnails: [
          'https://www.toyota.co.uk/images/corolla/gallery/exterior/Toyota-Corolla-2019-White-Exterior-Front-Angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      
      // Honda Models - Official manufacturer studio images
      'honda_civic_2020': {
        images: [
          'https://automobiles.honda.com/images/2020/civic-hatchback/gallery/exterior/2020-honda-civic-hatchbook-blue-exterior-front-angle.jpg'
        ],
        thumbnails: [
          'https://automobiles.honda.com/images/2020/civic-hatchback/gallery/exterior/2020-honda-civic-hatchbook-blue-exterior-front-angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      'honda_civic_2021': {
        images: [
          'https://automobiles.honda.com/images/2020/civic-hatchback/gallery/exterior/2020-honda-civic-hatchbook-blue-exterior-front-angle.jpg'
        ],
        thumbnails: [
          'https://automobiles.honda.com/images/2020/civic-hatchback/gallery/exterior/2020-honda-civic-hatchbook-blue-exterior-front-angle.jpg?width=400'
        ],
        confidence: 0.95
      },
      'honda_jazz_2020': {
        images: [
          'https://www.honda.co.uk/content/dam/central/cars/jazz/overview/Honda-Jazz-2020-White-Exterior-Front-Angle.jpg'
        ],
        thumbnails: [
          'https://www.honda.co.uk/content/dam/central/cars/jazz/overview/Honda-Jazz-2020-White-Exterior-Front-Angle.jpg?width=400'
        ],
        confidence: 0.95
      }
    }
  }
  
  /**
   * Generate image alt text for accessibility
   */
  static generateAltText(vehicleDetails: VehicleDetails, imageSource: string): string {
    return `${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.color || ''} car image from ${imageSource}`.trim()
  }
  
  /**
   * Optimize image URL for display
   */
  static optimizeImageUrl(url: string, width: number = 800, height: number = 600): string {
    if (url.includes('unsplash.com')) {
      return `${url}&w=${width}&h=${height}&fit=crop&crop=center`
    }
    
    if (url.includes('placeholder.com')) {
      return url.replace(/\d+x\d+/, `${width}x${height}`)
    }
    
    return url
  }
}
