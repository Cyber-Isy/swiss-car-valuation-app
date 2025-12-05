// Valuation input and output types

export interface ValuationInput {
  brand: string
  model: string
  variant?: string
  year: number
  mileage: number
  fuelType: string
  condition: string
  // Tier 1 - Critical
  enginePower?: number
  transmission?: string
  bodyType?: string
  // Tier 2 - Swiss Market
  driveType?: string
  mfkDate?: string
  previousOwners?: number
  accidentFree?: boolean
  // Tier 3 - Value Modifiers
  serviceHistory?: string
  exteriorColor?: string
  equipment?: string[]
}

export interface Listing {
  url: string
  title: string
  price: number
  mileage: number | null
  year: number | null
  source: string
}

export interface ValuationResult {
  marketValue: number | null
  priceMin: number | null
  priceMax: number | null
  purchasePrice: number | null
  listingsCount: number
  sources: string[]
  listings: Listing[]
  confidence: 'high' | 'medium' | 'low' | 'none'
  reasoning: string
  searchType: 'exact' | 'similar' | 'none'
  metadata?: {
    totalListings: number
    extractedFields: {
      priceExtracted: number
      mileageExtracted: number
      yearExtracted: number
    }
    qualityScore: number
  }
}
