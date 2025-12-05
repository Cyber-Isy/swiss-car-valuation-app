import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCarValuation } from './perplexity'
import {
  mockSearchResults,
  mockAnalysisResponse,
  mockSonarResponse,
  mockValuationInput
} from '../tests/fixtures/perplexity-mocks'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('getCarValuation', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    process.env.PERPLEXITY_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Search API Success Path', () => {
    it('should successfully process search results and return valuation', async () => {
      // Mock Search API success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      // Mock Analysis API success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse.success
      })

      const result = await getCarValuation(mockValuationInput)

      expect(result.marketValue).toBeDefined()
      expect(result.marketValue).toBeGreaterThan(0)
      expect(result.priceMin).toBeDefined()
      expect(result.priceMax).toBeDefined()
      expect(result.purchasePrice).toBe(Math.round(result.marketValue! * 0.85))
      expect(result.confidence).toMatch(/high|medium|low/)
      expect(result.searchType).toBe('exact')
      expect(result.listings.length).toBeGreaterThan(0)
    })

    it('should remove outliers from price data', async () => {
      // Mock search with outlier prices
      const searchWithOutliers = {
        results: [
          ...mockSearchResults.success.results,
          {
            url: 'https://www.autoscout24.ch/outlier',
            title: 'VW Golf 2017 - CHF 50\'000', // Outlier
            snippet: 'Extremely rare edition',
            date: '2024-01-10'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => searchWithOutliers
      })

      const analysisWithOutlier = {
        choices: [{
          message: {
            content: JSON.stringify({
              listings: [
                { index: 0, price: 9500, mileage: 152000, year: 2017 },
                { index: 1, price: 10200, mileage: 145000, year: 2017 },
                { index: 5, price: 50000, mileage: 150000, year: 2017 } // Outlier
              ],
              valid_count: 3
            })
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => analysisWithOutlier
      })

      const result = await getCarValuation(mockValuationInput)

      // Market value should not be skewed by outlier
      expect(result.marketValue).toBeLessThan(15000)
      expect(result.marketValue).toBeGreaterThan(8000)
    })

    it('should calculate confidence based on data quality', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse.success
      })

      const result = await getCarValuation(mockValuationInput)

      // With 5 similar prices, should have high confidence
      expect(result.confidence).toMatch(/high|medium/)
      expect(result.listingsCount).toBeGreaterThanOrEqual(3)
    })

    it('should validate year and mileage ranges', async () => {
      const analysisWithInvalidYear = {
        choices: [{
          message: {
            content: JSON.stringify({
              listings: [
                { index: 0, price: 9500, mileage: 152000, year: 2010 }, // Too old
                { index: 1, price: 10200, mileage: 145000, year: 2017 }, // Valid
                { index: 2, price: 11800, mileage: 50000, year: 2018 }   // Mileage too low
              ],
              valid_count: 3
            })
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => analysisWithInvalidYear
      })

      const result = await getCarValuation(mockValuationInput)

      // Should filter out invalid listings
      expect(result.listingsCount).toBeGreaterThan(0)
    })

    it('should handle partial extraction with fallback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse.partial
      })

      const result = await getCarValuation(mockValuationInput)

      // Should still return valid result with extracted prices
      expect(result.marketValue).toBeDefined()
      expect(result.listings.length).toBeGreaterThan(0)
    })
  })

  describe('Search API Fallback to Sonar', () => {
    it('should fallback to Sonar when Search API returns no results', async () => {
      // Mock Search API with no results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.empty
      })

      // Mock Sonar API success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSonarResponse.success
      })

      const result = await getCarValuation(mockValuationInput)

      expect(result.marketValue).toBeDefined()
      expect(result.searchType).toMatch(/exact|similar/)
    })

    it('should handle no results from Sonar', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.empty
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSonarResponse.noResults
      })

      const result = await getCarValuation(mockValuationInput)

      expect(result.marketValue).toBeNull()
      expect(result.confidence).toBe('none')
      expect(result.searchType).toBe('none')
      expect(result.reasoning).toContain('keine vergleichbaren Fahrzeuge')
    })
  })

  describe('Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(getCarValuation(mockValuationInput)).rejects.toThrow()
    })

    it('should detect duplicate prices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse.duplicatePrices
      })

      const result = await getCarValuation(mockValuationInput)

      // Should still process but with lower confidence
      expect(result.marketValue).toBe(9500)
      expect(result.priceMin).toBe(9500)
      expect(result.priceMax).toBe(9500)
    })

    it('should return none when all listings fail validation', async () => {
      const invalidAnalysis = {
        choices: [{
          message: {
            content: JSON.stringify({
              listings: [
                { index: 0, price: 500, mileage: 152000, year: 2017 },    // Price too low
                { index: 1, price: 250000, mileage: 145000, year: 2017 }  // Price too high
              ],
              valid_count: 2
            })
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidAnalysis
      })

      const result = await getCarValuation(mockValuationInput)

      expect(result.marketValue).toBeNull()
      expect(result.confidence).toBe('none')
    })
  })

  describe('Data Quality', () => {
    it('should include source marketplaces in result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse.success
      })

      const result = await getCarValuation(mockValuationInput)

      expect(result.sources.length).toBeGreaterThan(0)
      expect(result.sources.every(s => s.includes('.ch'))).toBe(true)
    })

    it('should format reasoning in German', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults.success
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse.success
      })

      const result = await getCarValuation(mockValuationInput)

      expect(result.reasoning).toMatch(/Basierend auf|vergleichbaren|Inseraten|Marktplätzen/)
      expect(result.reasoning).toContain('CHF')
    })
  })
})
