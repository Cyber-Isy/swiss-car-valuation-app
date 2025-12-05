// Admin types consolidation

export interface Submission {
  id: string
  status: string
  createdAt: string
  brand: string
  model: string
  variant: string | null
  year: number
  mileage: number
  fuelType: string
  condition: string
  transmission: string | null
  enginePower: number | null
  bodyType: string | null
  driveType: string | null
  mfkDate: string | null
  previousOwners: number | null
  accidentFree: boolean
  serviceHistory: string | null
  exteriorColor: string | null
  equipment: string[]
  firstRegistration: string
  sellerName: string
  sellerEmail: string
  sellerPhone: string
  sellerLocation: string
  fahrzeugausweisUrl: string
  aiMarketValue: number | null
  aiPriceMin: number | null
  aiPriceMax: number | null
  aiPurchasePrice: number | null
  aiListingsCount: number | null
  aiSources: string[]
  aiListings: any | null
  aiConfidence: string | null
  aiReasoning: string | null
  aiListingsMetadata: any | null
  notes: string | null
  finalOfferPrice: number | null
  archived: boolean
  archivedAt: string | null
}

export interface VehicleImage {
  id: string
  submissionId: string
  url: string
  createdAt: string
}

export interface Listing {
  url: string
  title: string
  price: number
  mileage: number | null
  year: number | null
  source: string
}

export interface AdminStats {
  total: number
  new: number
  inProgress: number
  completed: number
}
