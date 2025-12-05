import { calculateStdDev } from './helpers'

/**
 * Calculate confidence level based on data quality
 * @param prices - Array of filtered prices
 * @param marketValue - Calculated market value
 * @returns Confidence level: 'high', 'medium', 'low', or 'none'
 */
export function calculateConfidence(
  prices: number[],
  marketValue: number
): 'high' | 'medium' | 'low' | 'none' {
  if (prices.length === 0) {
    return 'none'
  }

  const stdDev = calculateStdDev(prices)
  const coefficientOfVariation = stdDev / marketValue

  if (prices.length >= 5 && coefficientOfVariation < 0.15) {
    return 'high'
  } else if (prices.length >= 3 && coefficientOfVariation < 0.25) {
    return 'medium'
  } else {
    return 'low'
  }
}
