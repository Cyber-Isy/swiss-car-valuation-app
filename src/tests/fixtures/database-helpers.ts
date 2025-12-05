// Database test helpers for integration tests

export const mockPrismaValuation = {
  id: '123',
  brand: 'VW',
  model: 'Golf',
  variant: null,
  year: 2017,
  mileage: 150000,
  fuelType: 'Benzin',
  condition: 'Gut',
  enginePower: 110,
  transmission: 'AUTOMATIC',
  bodyType: 'Limousine',
  driveType: null,
  mfkDate: null,
  previousOwners: null,
  accidentFree: null,
  serviceHistory: null,
  exteriorColor: null,
  equipment: [],
  images: [],
  contactName: 'John Doe',
  contactEmail: 'john@example.com',
  contactPhone: '+41791234567',
  notes: null,
  status: 'PENDING',
  aiMarketValue: 10000,
  aiPriceMin: 9000,
  aiPriceMax: 11000,
  aiPurchasePrice: 8500,
  aiConfidence: 'high',
  aiListingsCount: 5,
  aiSources: ['autoscout24.ch'],
  aiReasoning: 'Test reasoning',
  finalPrice: null,
  adminNotes: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

export const createMockValuation = (overrides: Partial<typeof mockPrismaValuation> = {}) => ({
  ...mockPrismaValuation,
  ...overrides
})
