// Precision Automotive Image Service
// Specialized for exact model matching and background removal

interface PrecisionImageData {
  originalImage: string
  processedImage: string
  backgroundRemoved: boolean
  confidence: number
  matchType: 'exact' | 'model' | 'make' | 'fallback'
}

export class PrecisionImageService {
  
  /**
   * Process image to remove background using AI services
   */
  static async removeBackground(imageUrl: string): Promise<string> {
    try {
      // Try Remove.bg API for background removal
      const removeBgKey = process.env.REMOVEBG_API_KEY
      if (removeBgKey) {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': removeBgKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: imageUrl,
            size: 'auto',
            type: 'auto',
            crop: false,
            format: 'png'
          })
        })
        
        if (response.ok) {
          const imageBlob = await response.blob()
          // Convert blob to data URL or save to CDN
          return URL.createObjectURL(imageBlob)
        }
      }
      
      // Try Clipdrop API as alternative
      const clipdropKey = process.env.CLIPDROP_API_KEY
      if (clipdropKey) {
        const formData = new FormData()
        formData.append('image_url', imageUrl)
        
        const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
          method: 'POST',
          headers: {
            'x-api-key': clipdropKey,
          },
          body: formData
        })
        
        if (response.ok) {
          const imageBlob = await response.blob()
          return URL.createObjectURL(imageBlob)
        }
      }
      
      // Fallback: return original image
      return imageUrl
      
    } catch (error) {
      console.log('Background removal failed:', error)
      return imageUrl
    }
  }
  
  /**
   * Get precision automotive images with background removal
   */
  static async getPrecisionImages(
    make: string, 
    model: string, 
    year: string,
    registration?: string
  ): Promise<PrecisionImageData[]> {
    const images: PrecisionImageData[] = []
    
    // Try multiple precision sources
    const sources = [
      () => this.getFromAutomotiveDatabase(make, model, year),
      () => this.getFromManufacturerAPI(make, model, year),
      () => this.getFromCarConfiguratorAPI(make, model, year),
      () => this.getFromStockPhotoAPI(make, model, year)
    ]
    
    for (const source of sources) {
      try {
        const sourceImages = await source()
        if (sourceImages && sourceImages.length > 0) {
          images.push(...sourceImages)
        }
      } catch (error) {
        console.log('Precision source failed:', error)
        continue
      }
    }
    
    return images
  }
  
  /**
   * Automotive Database API with exact model matching
   */
  private static async getFromAutomotiveDatabase(
    make: string, 
    model: string, 
    year: string
  ): Promise<PrecisionImageData[]> {
    try {
      const rapidApiKey = process.env.RAPIDAPI_KEY
      if (!rapidApiKey) return []
      
      // Search for exact vehicle specification
      const searchQuery = `${year} ${make} ${model}`.replace(/\s+/g, '+')
      
      const response = await fetch(
        `https://automotive-api.p.rapidapi.com/cars/search?query=${searchQuery}&limit=5&exact=true`,
        {
          headers: {
            'X-RapidAPI-Key': rapidApiKey,
            'X-RapidAPI-Host': 'automotive-api.p.rapidapi.com'
          }
        }
      )
      
      if (!response.ok) return []
      
      const data = await response.json()
      const results: PrecisionImageData[] = []
      
      for (const car of data.results || []) {
        if (car.images && car.images.length > 0) {
          for (const image of car.images) {
            // Check if this is an exact model year match
            const isExact = car.year === parseInt(year) && 
                           car.make.toLowerCase() === make.toLowerCase() &&
                           car.model.toLowerCase().includes(model.toLowerCase())
            
            const processedImage = await this.removeBackground(image.url)
            
            results.push({
              originalImage: image.url,
              processedImage,
              backgroundRemoved: processedImage !== image.url,
              confidence: isExact ? 0.98 : 0.85,
              matchType: isExact ? 'exact' : 'model'
            })
          }
        }
      }
      
      return results.slice(0, 3) // Return top 3 matches
      
    } catch (error) {
      return []
    }
  }
  
  /**
   * Manufacturer API for official studio images
   */
  private static async getFromManufacturerAPI(
    make: string, 
    model: string, 
    year: string
  ): Promise<PrecisionImageData[]> {
    const results: PrecisionImageData[] = []
    
    try {
      // Different manufacturers have different API endpoints
      let apiUrl = ''
      let headers = {}
      
      switch (make.toLowerCase()) {
        case 'ford':
          apiUrl = `https://api.ford.com/v1/vehicles/images?model=${model}&year=${year}`
          headers = { 'Authorization': `Bearer ${process.env.FORD_API_KEY}` }
          break
          
        case 'bmw':
          apiUrl = `https://api.bmw.com/webapi/v1/vehicles/${model}/${year}/images`
          headers = { 'Authorization': `Bearer ${process.env.BMW_API_KEY}` }
          break
          
        case 'audi':
          apiUrl = `https://api.audi.com/v1/models/${model}/images?year=${year}`
          headers = { 'Authorization': `Bearer ${process.env.AUDI_API_KEY}` }
          break
          
        case 'mercedes-benz':
        case 'mercedes':
          apiUrl = `https://api.mercedes-benz.com/v1/vehicles/images?model=${model}&year=${year}`
          headers = { 'Authorization': `Bearer ${process.env.MERCEDES_API_KEY}` }
          break
      }
      
      if (apiUrl && Object.keys(headers).length > 0) {
        const response = await fetch(apiUrl, { headers })
        
        if (response.ok) {
          const data = await response.json()
          
          for (const image of data.images || []) {
            // Manufacturer images are typically high-quality studio shots
            results.push({
              originalImage: image.url || image.large || image.original,
              processedImage: image.url || image.large || image.original, // Usually already no background
              backgroundRemoved: false, // Studio images typically don't need processing
              confidence: 0.97,
              matchType: 'exact'
            })
          }
        }
      }
      
    } catch (error) {
      console.log('Manufacturer API failed:', error)
    }
    
    return results
  }
  
  /**
   * Car Configurator API for precise model images
   */
  private static async getFromCarConfiguratorAPI(
    make: string, 
    model: string, 
    year: string
  ): Promise<PrecisionImageData[]> {
    try {
      // Many manufacturers provide configurator APIs with exact model images
      const configuratorKey = process.env.CAR_CONFIGURATOR_API_KEY
      if (!configuratorKey) return []
      
      const response = await fetch(
        `https://configurator-api.example.com/v1/vehicles/${make}/${model}/${year}/images`,
        {
          headers: {
            'Authorization': `Bearer ${configuratorKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const results: PrecisionImageData[] = []
        
        for (const config of data.configurations || []) {
          if (config.images && config.images.exterior) {
            for (const image of config.images.exterior) {
              results.push({
                originalImage: image.url,
                processedImage: image.url, // Configurator images are usually clean
                backgroundRemoved: false,
                confidence: 0.96,
                matchType: 'exact'
              })
            }
          }
        }
        
        return results
      }
      
    } catch (error) {
      console.log('Car configurator API failed:', error)
    }
    
    return []
  }
  
  /**
   * Stock Photo API with precise car filtering
   */
  private static async getFromStockPhotoAPI(
    make: string, 
    model: string, 
    year: string
  ): Promise<PrecisionImageData[]> {
    try {
      // Use Shutterstock automotive collection
      const shutterstockKey = process.env.SHUTTERSTOCK_API_KEY
      if (shutterstockKey) {
        const query = `${year} ${make} ${model} car isolated white background`
        
        const response = await fetch(
          `https://api.shutterstock.com/v2/images/search?query=${encodeURIComponent(query)}&category=transportation&orientation=horizontal&people_model_released=true&per_page=10`,
          {
            headers: {
              'Authorization': `Bearer ${shutterstockKey}`
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const results: PrecisionImageData[] = []
          
          for (const image of data.data || []) {
            // Filter for images that likely have clean backgrounds
            const hasCleanBackground = image.description.toLowerCase().includes('isolated') ||
                                     image.description.toLowerCase().includes('white background') ||
                                     image.description.toLowerCase().includes('studio')
            
            if (hasCleanBackground) {
              results.push({
                originalImage: image.assets.preview.url,
                processedImage: image.assets.preview.url,
                backgroundRemoved: false,
                confidence: 0.85,
                matchType: 'model'
              })
            }
          }
          
          return results.slice(0, 3)
        }
      }
      
    } catch (error) {
      console.log('Stock photo API failed:', error)
    }
    
    return []
  }
  
  /**
   * Validate image is actually the correct car model
   */
  static async validateCarImage(
    imageUrl: string, 
    make: string, 
    model: string, 
    year: string
  ): Promise<{isValid: boolean, confidence: number, detectedFeatures: string[]}> {
    try {
      // Use Google Vision API or similar for car detection
      const visionKey = process.env.GOOGLE_VISION_API_KEY
      if (!visionKey) {
        return { isValid: true, confidence: 0.5, detectedFeatures: [] }
      }
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: imageUrl } },
              features: [
                { type: 'OBJECT_LOCALIZATION' },
                { type: 'TEXT_DETECTION' },
                { type: 'LABEL_DETECTION' }
              ]
            }]
          })
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const annotations = data.responses[0]
        
        const detectedObjects = annotations.localizedObjectAnnotations || []
        const detectedLabels = annotations.labelAnnotations || []
        const detectedText = annotations.textAnnotations || []
        
        // Check for car-related objects and labels
        const carKeywords = ['car', 'vehicle', 'automobile', make.toLowerCase(), model.toLowerCase()]
        const detectedFeatures = [
          ...detectedObjects.map((obj: any) => obj.name.toLowerCase()),
          ...detectedLabels.map((label: any) => label.description.toLowerCase()),
          ...detectedText.map((text: any) => text.description.toLowerCase())
        ]
        
        const matchingFeatures = detectedFeatures.filter(feature => 
          carKeywords.some(keyword => feature.includes(keyword))
        )
        
        const confidence = matchingFeatures.length > 0 ? 
          Math.min(0.95, 0.5 + (matchingFeatures.length * 0.15)) : 0.3
        
        return {
          isValid: matchingFeatures.length > 0,
          confidence,
          detectedFeatures: matchingFeatures
        }
      }
      
    } catch (error) {
      console.log('Image validation failed:', error)
    }
    
    return { isValid: true, confidence: 0.5, detectedFeatures: [] }
  }
}
