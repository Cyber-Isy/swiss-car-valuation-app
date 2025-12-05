import { describe, it, expect } from 'vitest'

// Validation schemas (you can import these from your form)
const validateVehicleData = (data: any) => {
  const errors: string[] = []

  // Required fields
  if (!data.brand || data.brand.length < 2) {
    errors.push('Brand must be at least 2 characters')
  }
  if (!data.model || data.model.length < 1) {
    errors.push('Model is required')
  }
  if (!data.year || data.year < 1990 || data.year > new Date().getFullYear() + 1) {
    errors.push('Year must be between 1990 and current year + 1')
  }
  if (data.mileage === undefined || data.mileage === null || data.mileage < 0 || data.mileage > 500000) {
    errors.push('Mileage must be between 0 and 500,000 km')
  }
  if (!data.fuelType) {
    errors.push('Fuel type is required')
  }
  if (!data.condition) {
    errors.push('Condition is required')
  }

  // Contact fields
  if (!data.contactName || data.contactName.length < 2) {
    errors.push('Name must be at least 2 characters')
  }
  if (!data.contactEmail || !data.contactEmail.includes('@')) {
    errors.push('Valid email is required')
  }
  if (!data.contactPhone || data.contactPhone.length < 10) {
    errors.push('Valid phone number is required')
  }

  return { valid: errors.length === 0, errors }
}

describe('Vehicle Form Validation', () => {
  describe('Basic Vehicle Data', () => {
    it('should accept valid basic vehicle data', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        year: 2017,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing brand', () => {
      const invalidData = {
        model: 'Golf',
        year: 2017,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Brand must be at least 2 characters')
    })

    it('should reject year too old (< 1990)', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: 1989,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('1990'))).toBe(true)
    })

    it('should reject year too new (> current + 1)', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: new Date().getFullYear() + 2,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
    })

    it('should reject negative mileage', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: 2017,
        mileage: -1000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Mileage'))).toBe(true)
    })

    it('should reject excessive mileage (> 500k)', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: 2017,
        mileage: 600000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
    })
  })

  describe('Contact Information', () => {
    it('should reject invalid email', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: 2017,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'invalid-email',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('email'))).toBe(true)
    })

    it('should reject short phone number', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: 2017,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '123'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('phone'))).toBe(true)
    })

    it('should reject short name', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        year: 2017,
        mileage: 150000,
        fuelType: 'Benzin',
        condition: 'Gut',
        contactName: 'J',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Name'))).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle current year vehicles', () => {
      const currentYear = new Date().getFullYear()
      const validData = {
        brand: 'VW',
        model: 'Golf',
        year: currentYear,
        mileage: 5000,
        fuelType: 'Benzin',
        condition: 'Wie Neu',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(validData)
      expect(result.valid).toBe(true)
    })

    it('should handle zero mileage', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        year: 2024,
        mileage: 0,
        fuelType: 'Benzin',
        condition: 'Wie Neu',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(validData)
      expect(result.valid).toBe(true)
    })

    it('should handle maximum valid mileage', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        year: 1990,
        mileage: 500000,
        fuelType: 'Benzin',
        condition: 'Gebraucht',
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+41791234567'
      }

      const result = validateVehicleData(validData)
      expect(result.valid).toBe(true)
    })
  })
})

// Age and mileage business logic tests
describe('Vehicle Age and Mileage Business Rules', () => {
  const calculateVehicleAge = (year: number) => new Date().getFullYear() - year

  const isValidForPurchase = (year: number, mileage: number) => {
    const age = calculateVehicleAge(year)

    // Business rule: Max 10 years old
    if (age > 10) return { valid: false, reason: 'Vehicle too old (max 10 years)' }

    // Business rule: Max 200,000 km
    if (mileage > 200000) return { valid: false, reason: 'Mileage too high (max 200,000 km)' }

    // Business rule: Unrealistic mileage for age
    const avgKmPerYear = 15000
    const maxReasonableMileage = age * avgKmPerYear * 1.5
    if (mileage > maxReasonableMileage) {
      return { valid: false, reason: 'Mileage unrealistic for vehicle age' }
    }

    return { valid: true, reason: '' }
  }

  it('should accept vehicle within age limit', () => {
    const currentYear = new Date().getFullYear()
    const result = isValidForPurchase(currentYear - 5, 75000)
    expect(result.valid).toBe(true)
  })

  it('should reject vehicle older than 10 years', () => {
    const currentYear = new Date().getFullYear()
    const result = isValidForPurchase(currentYear - 11, 150000)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('too old')
  })

  it('should reject vehicle with mileage > 200k', () => {
    const currentYear = new Date().getFullYear()
    const result = isValidForPurchase(currentYear - 5, 250000)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Mileage too high')
  })

  it('should reject unrealistic mileage for age', () => {
    const currentYear = new Date().getFullYear()
    // 2 year old car with 200k km is unrealistic (would need 100k km/year)
    const result = isValidForPurchase(currentYear - 2, 200000)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('unrealistic')
  })

  it('should accept realistic mileage for age', () => {
    const currentYear = new Date().getFullYear()
    // 5 year old car with 75k km is realistic (~15k km/year)
    const result = isValidForPurchase(currentYear - 5, 75000)
    expect(result.valid).toBe(true)
  })
})
