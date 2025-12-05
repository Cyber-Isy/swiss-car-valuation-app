// Helper functions for Perplexity data extraction and processing

export const extractPrice = (text: string): number | null => {
  const patterns = [
    /CHF\s*['']?([\d']+)/i,
    /Fr\.\s*['']?([\d']+)/i,
    /([\d']+)\s*CHF/i,
    /([\d']+)\s*Fr\./i
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const price = parseInt(match[1].replace(/'/g, ''))
      if (price >= 1000 && price <= 200000) return price
    }
  }
  return null
}

export const extractMileage = (text: string): number | null => {
  const match = text.match(/([\d']+)\s*km/i)
  if (match) {
    return parseInt(match[1].replace(/'/g, ''))
  }
  return null
}

export const extractYear = (text: string): number | null => {
  const match = text.match(/\b(19\d{2}|20[0-2]\d)\b/)
  if (match) {
    const year = parseInt(match[1])
    if (year >= 1990 && year <= 2025) return year
  }
  return null
}

export const removeOutliers = (prices: number[]): number[] => {
  if (prices.length < 3) return prices
  const sorted = [...prices].sort((a, b) => a - b)

  // Calculate median
  const getMedian = (arr: number[]): number => {
    const mid = Math.floor(arr.length / 2)
    if (arr.length % 2 === 0) {
      return (arr[mid - 1] + arr[mid]) / 2
    }
    return arr[mid]
  }

  const median = getMedian(sorted)

  // Calculate MAD (Median Absolute Deviation)
  const absoluteDeviations = sorted.map(p => Math.abs(p - median)).sort((a, b) => a - b)
  const mad = getMedian(absoluteDeviations)

  // If MAD is 0, use standard deviation-based approach instead
  if (mad === 0) {
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length
    const stdDev = Math.sqrt(
      sorted.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / sorted.length
    )
    return sorted.filter(p => Math.abs(p - mean) <= 3 * stdDev)
  }

  // Modified z-score method: remove values with |modified z-score| > 3.5
  // Modified z-score = 0.6745 * (x - median) / MAD
  const threshold = 3.5
  return sorted.filter(p => {
    const modifiedZScore = Math.abs(0.6745 * (p - median) / mad)
    return modifiedZScore <= threshold
  })
}

export const calculateStdDev = (values: number[]): number => {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(v => Math.pow(v - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}
