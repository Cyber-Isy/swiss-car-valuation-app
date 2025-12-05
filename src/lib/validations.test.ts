import { describe, it, expect } from 'vitest'
import { submissionSchema } from './validations'

describe('Submission Schema - Quick Win Tests', () => {
  describe('Business Rule: Vehicle Age Limit', () => {
    it('should accept vehicles from 2004 onwards', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2004',
        year: 2004,
        mileage: 150000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject vehicles older than 2004', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '12/2003',
        year: 2003,
        mileage: 150000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message)
        expect(errors.some(e => e.includes('2004'))).toBe(true)
      }
    })

    it('should accept current year + 1 (for new vehicles)', () => {
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1

      const validData = {
        brand: 'VW',
        model: 'ID.7',
        firstRegistration: `01/${nextYear}`,
        year: nextYear,
        mileage: 100,
        fuelType: 'ELEKTRO',
        condition: 'EXCELLENT',
        transmission: 'AUTOMATIC',
        enginePower: 210,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Business Rule: Mileage Limit (180,000 km)', () => {
    it('should accept mileage at exactly 180,000 km', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2010',
        year: 2010,
        mileage: 180000,
        fuelType: 'BENZIN',
        condition: 'FAIR',
        transmission: 'MANUAL',
        enginePower: 105,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mileage above 180,000 km', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2010',
        year: 2010,
        mileage: 180001,
        fuelType: 'BENZIN',
        condition: 'FAIR',
        transmission: 'MANUAL',
        enginePower: 105,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message)
        expect(errors.some(e => e.includes('180'))).toBe(true)
      }
    })

    it('should reject negative mileage', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2020',
        year: 2020,
        mileage: -1000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message)
        expect(errors.some(e => e.includes('positiv'))).toBe(true)
      }
    })

    it('should accept zero mileage (brand new)', () => {
      const validData = {
        brand: 'Tesla',
        model: 'Model 3',
        firstRegistration: '12/2024',
        year: 2024,
        mileage: 0,
        fuelType: 'ELEKTRO',
        condition: 'EXCELLENT',
        transmission: 'AUTOMATIC',
        enginePower: 275,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Business Rule: Engine Power Range', () => {
    it('should accept engine power within valid range (1-2000 PS)', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 150,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept very low power (small car)', () => {
      const validData = {
        brand: 'Fiat',
        model: 'Panda',
        firstRegistration: '01/2015',
        year: 2015,
        mileage: 80000,
        fuelType: 'BENZIN',
        condition: 'FAIR',
        transmission: 'MANUAL',
        enginePower: 50,
        bodyType: 'KLEINWAGEN',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept very high power (supercar)', () => {
      const validData = {
        brand: 'Porsche',
        model: '911',
        variant: 'Turbo S',
        firstRegistration: '01/2022',
        year: 2022,
        mileage: 5000,
        fuelType: 'BENZIN',
        condition: 'EXCELLENT',
        transmission: 'AUTOMATIC',
        enginePower: 650,
        bodyType: 'COUPE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject zero engine power', () => {
      const invalidData = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 0,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject unrealistic high power (> 2000 PS)', () => {
      const invalidData = {
        brand: 'Bugatti',
        model: 'Chiron',
        firstRegistration: '01/2022',
        year: 2022,
        mileage: 1000,
        fuelType: 'BENZIN',
        condition: 'EXCELLENT',
        transmission: 'AUTOMATIC',
        enginePower: 2500,
        bodyType: 'COUPE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Form Validation: Email Format', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'john.doe@example.com',
        'user+tag@domain.co.uk',
        'test_user@company.ch',
        'contact@example.org'
      ]

      validEmails.forEach(email => {
        const data = {
            brand: 'VW',
          model: 'Golf',
          firstRegistration: '01/2018',
          year: 2018,
          mileage: 75000,
          fuelType: 'BENZIN',
          condition: 'GOOD',
          transmission: 'AUTOMATIC',
          enginePower: 110,
          bodyType: 'LIMOUSINE',
          sellerName: 'John Doe',
          sellerEmail: email,
          sellerPhone: '+41791234567',
          sellerLocation: '8000 Zürich'
        }

        const result = submissionSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plaintext',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user name@example.com'
      ]

      invalidEmails.forEach(email => {
        const data = {
            brand: 'VW',
          model: 'Golf',
          firstRegistration: '01/2018',
          year: 2018,
          mileage: 75000,
          fuelType: 'BENZIN',
          condition: 'GOOD',
          transmission: 'AUTOMATIC',
          enginePower: 110,
          bodyType: 'LIMOUSINE',
          sellerName: 'John Doe',
          sellerEmail: email,
          sellerPhone: '+41791234567',
          sellerLocation: '8000 Zürich'
        }

        const result = submissionSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          const errors = result.error.errors.map(e => e.message)
          expect(errors.some(e => e.includes('E-Mail'))).toBe(true)
        }
      })
    })
  })

  describe('Form Validation: Phone Number', () => {
    it('should accept valid Swiss phone numbers', () => {
      const validPhones = [
        '+41791234567',
        '+41 79 123 45 67',
        '0791234567',
        '079 123 45 67'
      ]

      validPhones.forEach(phone => {
        const data = {
            brand: 'VW',
          model: 'Golf',
          firstRegistration: '01/2018',
          year: 2018,
          mileage: 75000,
          fuelType: 'BENZIN',
          condition: 'GOOD',
          transmission: 'AUTOMATIC',
          enginePower: 110,
          bodyType: 'LIMOUSINE',
          sellerName: 'John Doe',
          sellerEmail: 'john@example.com',
          sellerPhone: phone,
          sellerLocation: '8000 Zürich'
        }

        const result = submissionSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject too short phone numbers', () => {
      const invalidPhones = ['123', '12345', '079']

      invalidPhones.forEach(phone => {
        const data = {
            brand: 'VW',
          model: 'Golf',
          firstRegistration: '01/2018',
          year: 2018,
          mileage: 75000,
          fuelType: 'BENZIN',
          condition: 'GOOD',
          transmission: 'AUTOMATIC',
          enginePower: 110,
          bodyType: 'LIMOUSINE',
          sellerName: 'John Doe',
          sellerEmail: 'john@example.com',
          sellerPhone: phone,
          sellerLocation: '8000 Zürich'
        }

        const result = submissionSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          const errors = result.error.errors.map(e => e.message)
          expect(errors.some(e => e.includes('Telefonnummer'))).toBe(true)
        }
      })
    })
  })

  describe('Form Validation: Required Fields', () => {
    it('should require brand', () => {
      const data = {
        // brand: missing
        model: 'Golf',
        firstRegistration: '01/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Check that 'brand' field has an error
        const brandError = result.error.errors.find(e => e.path.includes('brand'))
        expect(brandError).toBeDefined()
      }
    })

    it('should require model', () => {
      const data = {
        brand: 'VW',
        // model: missing
        firstRegistration: '01/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Check that 'model' field has an error
        const modelError = result.error.errors.find(e => e.path.includes('model'))
        expect(modelError).toBeDefined()
      }
    })

    it('should require seller name (min 2 chars)', () => {
      const data = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        sellerName: 'J', // Too short
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const errors = result.error.errors.map(e => e.message)
        expect(errors.some(e => e.includes('Name'))).toBe(true)
      }
    })

    it('should accept all fields when valid', () => {
      const validData = {
        brand: 'VW',
        model: 'Golf',
        variant: 'GTI',
        firstRegistration: '06/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 230,
        bodyType: 'LIMOUSINE',
        driveType: 'FWD',
        mfkDate: '12/2025',
        previousOwners: 2,
        accidentFree: true,
        serviceHistory: 'FULL',
        exteriorColor: 'Rot',
        equipment: ['NAVIGATION', 'LEATHER', 'PANORAMA'],
        sellerName: 'John Doe',
        sellerEmail: 'john.doe@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Edge Cases & Data Coercion', () => {
    it('should coerce string numbers to actual numbers', () => {
      const data = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2018',
        year: '2018', // String instead of number
        mileage: '75000', // String instead of number
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: '110', // String instead of number
        bodyType: 'LIMOUSINE',
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.year).toBe('number')
        expect(typeof result.data.mileage).toBe('number')
        expect(typeof result.data.enginePower).toBe('number')
      }
    })

    it('should use default values for optional fields', () => {
      const data = {
        brand: 'VW',
        model: 'Golf',
        firstRegistration: '01/2018',
        year: 2018,
        mileage: 75000,
        fuelType: 'BENZIN',
        condition: 'GOOD',
        transmission: 'AUTOMATIC',
        enginePower: 110,
        bodyType: 'LIMOUSINE',
        // driveType: omitted - should default to FWD
        // accidentFree: omitted - should default to false
        // equipment: omitted - should default to []
        sellerName: 'John Doe',
        sellerEmail: 'john@example.com',
        sellerPhone: '+41791234567',
        sellerLocation: '8000 Zürich'
      }

      const result = submissionSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.driveType).toBe('FWD')
        expect(result.data.accidentFree).toBe(false)
        expect(result.data.equipment).toEqual([])
      }
    })
  })
})
