import { removeOutliers } from './helpers'
import { calculateConfidence } from './confidence'
import type { Listing, ValuationResult, ValuationInput } from './types'

/**
 * Parse and process the AI response
 */
export function parseValuationResponse(
  content: string,
  input: ValuationInput
): ValuationResult {
  // Try to extract JSON from the response (in case there's extra text)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const parsed = JSON.parse(jsonMatch[0])

  // Extract listings from AI response
  let listings = parsed.listings || []
  const searchType = parsed.search_type || (listings.length > 0 ? 'exact' : 'none')

  // Handle no listings found scenario
  if (searchType === 'none' || listings.length === 0) {
    console.log('⚠️  No listings found. Reasoning:', parsed.reasoning)
    return {
      marketValue: null,
      priceMin: null,
      priceMax: null,
      purchasePrice: null,
      listingsCount: 0,
      sources: [],
      listings: [],
      confidence: 'none',
      reasoning: parsed.reasoning || 'Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert. Unser Team wird Sie zeitnah mit einem persönlichen Angebot kontaktieren.',
      searchType: 'none'
    }
  }

  // Calculate acceptable ranges for filtering
  const minYear = input.year - 2
  const maxYear = input.year + 2
  const minMileage = Math.max(0, input.mileage - 30000)
  const maxMileage = input.mileage + 30000

  // Apply validation filters
  const validListings = listings.filter((l: Listing) =>
    l.price > 0 &&
    l.price >= 1000 && l.price <= 200000 &&
    (l.year === null || (l.year >= minYear && l.year <= maxYear)) &&
    (l.mileage === null || (l.mileage >= minMileage && l.mileage <= maxMileage))
  )

  console.log(`✅ ${validListings.length} of ${listings.length} listings passed validation`)

  if (validListings.length === 0) {
    console.log('⚠️  No valid listings after filtering')
    return {
      marketValue: null,
      priceMin: null,
      priceMax: null,
      purchasePrice: null,
      listingsCount: 0,
      sources: [],
      listings: [],
      confidence: 'none',
      reasoning: 'Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert. Unser Team wird Sie zeitnah mit einem persönlichen Angebot kontaktieren.',
      searchType: 'none'
    }
  }

  // Extract prices and remove outliers
  const allPrices = validListings.map((l: Listing) => l.price)
  const filteredPrices = removeOutliers(allPrices)
  console.log(`📉 Removed ${allPrices.length - filteredPrices.length} outliers from price data`)

  // Calculate market value and range
  const marketValue = Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length)
  const priceMin = Math.min(...filteredPrices)
  const priceMax = Math.max(...filteredPrices)
  const purchasePrice = Math.round(marketValue * 0.85)

  // Calculate confidence based on data quality
  const confidence = calculateConfidence(filteredPrices, marketValue)

  console.log(`📊 Confidence: ${confidence} (${filteredPrices.length} listings, market value: CHF ${marketValue})`)

  // Get unique sources
  const sources = validListings
    .map((l: Listing) => l.source)
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)

  // Generate improved reasoning
  const reasoning = `Basierend auf ${filteredPrices.length} vergleichbaren Inseraten von Schweizer Marktplätzen (${sources.join(', ')}). Durchschnittspreis: CHF ${marketValue.toLocaleString()}, Spanne: CHF ${priceMin.toLocaleString()} - ${priceMax.toLocaleString()}.`

  // Calculate extraction metadata for data quality tracking
  const priceExtracted = validListings.filter((l: Listing) => l.price !== null).length
  const mileageExtracted = validListings.filter((l: Listing) => l.mileage !== null).length
  const yearExtracted = validListings.filter((l: Listing) => l.year !== null).length
  const totalFields = validListings.length * 3 // price, mileage, year
  const extractedFields = priceExtracted + mileageExtracted + yearExtracted
  const qualityScore = Math.round((extractedFields / totalFields) * 100)

  return {
    marketValue,
    priceMin,
    priceMax,
    purchasePrice,
    listingsCount: filteredPrices.length,
    sources,
    listings: validListings.slice(0, 8),
    confidence,
    reasoning,
    searchType,
    metadata: {
      totalListings: validListings.length,
      extractedFields: {
        priceExtracted,
        mileageExtracted,
        yearExtracted
      },
      qualityScore
    }
  }
}
