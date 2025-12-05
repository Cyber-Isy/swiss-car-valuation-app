import { describe, it, expect } from 'vitest'
import {
  extractPrice,
  extractMileage,
  extractYear,
  removeOutliers,
  calculateStdDev
} from './perplexity-helpers'

describe('extractPrice', () => {
  it('should extract price with CHF prefix', () => {
    expect(extractPrice('VW Golf CHF 9\'500')).toBe(9500)
    expect(extractPrice('CHF 15\'000 VW Golf')).toBe(15000)
    expect(extractPrice('Preis: CHF 12500')).toBe(12500)
  })

  it('should extract price with Fr. prefix', () => {
    expect(extractPrice('VW Golf Fr. 9\'500')).toBe(9500)
    expect(extractPrice('Fr. 15000')).toBe(15000)
  })

  it('should extract price with CHF suffix', () => {
    expect(extractPrice('VW Golf 9\'500 CHF')).toBe(9500)
    expect(extractPrice('15\'000 CHF')).toBe(15000)
  })

  it('should handle Swiss number formatting with apostrophes', () => {
    expect(extractPrice('CHF 9\'500')).toBe(9500)
    expect(extractPrice('CHF 15\'000')).toBe(15000)
    expect(extractPrice('CHF 125\'000')).toBe(125000)
  })

  it('should reject prices below minimum (1000 CHF)', () => {
    expect(extractPrice('CHF 500')).toBeNull()
    expect(extractPrice('CHF 999')).toBeNull()
  })

  it('should reject prices above maximum (200000 CHF)', () => {
    expect(extractPrice('CHF 250\'000')).toBeNull()
    expect(extractPrice('CHF 300000')).toBeNull()
  })

  it('should return null when no price found', () => {
    expect(extractPrice('VW Golf 2017')).toBeNull()
    expect(extractPrice('150000 km')).toBeNull()
  })

  it('should handle case insensitive matching', () => {
    expect(extractPrice('chf 9\'500')).toBe(9500)
    expect(extractPrice('fr. 15\'000')).toBe(15000)
  })
})

describe('extractMileage', () => {
  it('should extract mileage with km suffix', () => {
    expect(extractMileage('150\'000 km')).toBe(150000)
    expect(extractMileage('50000 km')).toBe(50000)
    expect(extractMileage('VW Golf, 152\'000 km, 2017')).toBe(152000)
  })

  it('should handle Swiss number formatting', () => {
    expect(extractMileage('150\'000 km')).toBe(150000)
    expect(extractMileage('25\'500 km')).toBe(25500)
  })

  it('should return null when no mileage found', () => {
    expect(extractMileage('VW Golf 2017')).toBeNull()
    expect(extractMileage('CHF 9\'500')).toBeNull()
  })

  it('should handle case insensitive matching', () => {
    expect(extractMileage('150000 KM')).toBe(150000)
    expect(extractMileage('50\'000 Km')).toBe(50000)
  })
})

describe('extractYear', () => {
  it('should extract 4-digit year', () => {
    expect(extractYear('VW Golf 2017')).toBe(2017)
    expect(extractYear('2018 VW Golf')).toBe(2018)
    expect(extractYear('Golf, 2019, Benzin')).toBe(2019)
  })

  it('should only accept years between 1990 and 2025', () => {
    expect(extractYear('1990')).toBe(1990)
    expect(extractYear('2025')).toBe(2025)
    expect(extractYear('1989')).toBeNull()
    expect(extractYear('2026')).toBeNull()
  })

  it('should return null when no year found', () => {
    expect(extractYear('VW Golf Benzin')).toBeNull()
    expect(extractYear('150000 km')).toBeNull()
  })

  it('should match word boundaries to avoid false matches', () => {
    expect(extractYear('12017')).toBeNull() // Not a valid year
    expect(extractYear('VW Golf 2017 edition')).toBe(2017) // Valid year
  })
})

describe('removeOutliers', () => {
  it('should remove outliers using IQR method', () => {
    const prices = [5000, 9000, 9500, 10000, 10500, 11000, 50000] // 50000 is outlier
    const filtered = removeOutliers(prices)
    expect(filtered).not.toContain(50000)
    expect(filtered).toContain(9000)
    expect(filtered).toContain(11000)
  })

  it('should keep all prices if less than 3 data points', () => {
    const prices = [9000, 9500]
    expect(removeOutliers(prices)).toEqual(prices)
  })

  it('should handle prices with no outliers', () => {
    const prices = [9000, 9500, 10000, 10500, 11000]
    const filtered = removeOutliers(prices)
    expect(filtered.length).toBe(5)
  })

  it('should remove multiple outliers', () => {
    const prices = [1000, 9000, 9500, 10000, 10500, 11000, 50000, 60000]
    const filtered = removeOutliers(prices)
    expect(filtered).not.toContain(1000)
    expect(filtered).not.toContain(50000)
    expect(filtered).not.toContain(60000)
  })

  it('should return sorted array', () => {
    const prices = [11000, 9000, 10500, 9500, 10000]
    const filtered = removeOutliers(prices)
    expect(filtered).toEqual([9000, 9500, 10000, 10500, 11000])
  })
})

describe('calculateStdDev', () => {
  it('should calculate standard deviation correctly', () => {
    const values = [10, 12, 23, 23, 16, 23, 21, 16]
    const stdDev = calculateStdDev(values)
    expect(stdDev).toBeCloseTo(4.898, 2)
  })

  it('should return 0 for identical values', () => {
    const values = [10, 10, 10, 10]
    expect(calculateStdDev(values)).toBe(0)
  })

  it('should handle single value', () => {
    const values = [10]
    expect(calculateStdDev(values)).toBe(0)
  })

  it('should calculate stdDev for prices', () => {
    const prices = [9000, 9500, 10000, 10500, 11000]
    const stdDev = calculateStdDev(prices)
    expect(stdDev).toBeGreaterThan(0)
    expect(stdDev).toBeCloseTo(707.1, 1)
  })

  it('should calculate coefficient of variation', () => {
    const prices = [9000, 9500, 10000, 10500, 11000]
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length
    const stdDev = calculateStdDev(prices)
    const cv = stdDev / mean

    // CV should be less than 0.15 for high confidence
    expect(cv).toBeLessThan(0.15)
  })
})
