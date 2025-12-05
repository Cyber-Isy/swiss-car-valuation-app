import { extractPrice, extractMileage, extractYear, removeOutliers, calculateStdDev } from './perplexity-helpers'
import { sanitizeForPrompt, createSafeVehicleDescription, containsSuspiciousPatterns } from './input-sanitizer'
import { getCachedValuation, setCachedValuation } from './valuation-cache'

interface ValuationInput {
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

interface Listing {
  url: string
  title: string
  price: number
  mileage: number | null
  year: number | null
  source: string
}

interface ValuationResult {
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

export async function getCarValuation(input: ValuationInput): Promise<ValuationResult> {
  console.log('🚀 Starting AI valuation for:', input.brand, input.model, input.variant)

  // Check cache first to avoid unnecessary API calls
  const cachedResult = await getCachedValuation({
    brand: input.brand,
    model: input.model,
    variant: input.variant,
    year: input.year,
    mileage: input.mileage,
    fuelType: input.fuelType
  })

  if (cachedResult) {
    return {
      ...cachedResult,
      confidence: cachedResult.confidence as 'high' | 'medium' | 'low' | 'none',
      listings: [], // Don't return old listing details from cache
      searchType: 'exact' // Cached results were originally exact or similar
    }
  }

  // Sanitize all user inputs before using in prompts
  const sanitizedBrand = sanitizeForPrompt(input.brand, 50)
  const sanitizedModel = sanitizeForPrompt(input.model, 50)
  const sanitizedVariant = input.variant ? sanitizeForPrompt(input.variant, 50) : undefined
  const sanitizedFuelType = sanitizeForPrompt(input.fuelType, 30)
  const sanitizedCondition = sanitizeForPrompt(input.condition, 30)
  const sanitizedTransmission = input.transmission ? sanitizeForPrompt(input.transmission, 30) : undefined
  const sanitizedBodyType = input.bodyType ? sanitizeForPrompt(input.bodyType, 30) : undefined
  const sanitizedDriveType = input.driveType ? sanitizeForPrompt(input.driveType, 30) : undefined
  const sanitizedServiceHistory = input.serviceHistory ? sanitizeForPrompt(input.serviceHistory, 30) : undefined
  const sanitizedExteriorColor = input.exteriorColor ? sanitizeForPrompt(input.exteriorColor, 30) : undefined

  // Check for suspicious patterns in main fields and log warnings
  if (containsSuspiciousPatterns(input.brand) || containsSuspiciousPatterns(input.model) || (input.variant && containsSuspiciousPatterns(input.variant))) {
    console.warn('⚠️ Suspicious input detected in vehicle description:', {
      brand: input.brand,
      model: input.model,
      variant: input.variant
    })
  }

  // Calculate acceptable ranges for filtering
  const minYear = input.year - 2
  const maxYear = input.year + 2
  const minMileage = Math.max(0, input.mileage - 30000)
  const maxMileage = input.mileage + 30000

  // Build vehicle description with sanitized inputs
  const vehicleDesc = createSafeVehicleDescription(sanitizedBrand, sanitizedModel, sanitizedVariant)

  // Format transmission for German
  const transmissionLabel = input.transmission === 'MANUAL' ? 'Manuell' : input.transmission === 'AUTOMATIC' ? 'Automatik' : null

  // Format drive type for German
  const driveTypeLabels: Record<string, string> = { FWD: 'Frontantrieb', RWD: 'Hinterradantrieb', AWD: 'Allrad' }
  const driveTypeLabel = input.driveType ? driveTypeLabels[input.driveType] || input.driveType : null

  // Format service history for German
  const serviceLabels: Record<string, string> = { FULL: 'Vollständig', PARTIAL: 'Teilweise', NONE: 'Keine' }
  const serviceLabel = input.serviceHistory ? serviceLabels[input.serviceHistory] || input.serviceHistory : null

  // Build compact vehicle specs string with sanitized values
  const specs = [
    `${vehicleDesc}`,
    `${input.year}`,
    `${input.mileage.toLocaleString()} km`,
    input.enginePower && `${input.enginePower} PS`,
    transmissionLabel,
    sanitizedFuelType,
    sanitizedBodyType,
    driveTypeLabel,
    input.accidentFree && 'Unfallfrei',
    serviceLabel && `Service: ${serviceLabel}`
  ].filter(Boolean).join(' | ')

  // Detect if user is searching for a premium/performance variant
  const isPremiumVariant = sanitizedVariant && /GTI|AMG|M-Sport|M Sport|RS\d|ST|R-Line|Type R|Si|WRX|STI|Turbo S|GTS|Nismo|N Line/i.test(sanitizedVariant)

  // Build exclusion rule based on search intent
  let exclusionRule = ''
  if (isPremiumVariant) {
    // User wants a performance model - only exclude higher-tier variants
    exclusionRule = `NUR ${vehicleDesc} - KEINE anderen Varianten (z.B. ${sanitizedVariant} ja, aber nicht Clubsport/Performance/Plus)`
  } else {
    // User wants base model - exclude all performance variants
    exclusionRule = `KEINE Premium-Varianten (AMG, M-Sport, RS, GTI, R-Line, Type R, etc.)`
  }

  const prompt = `Suchen Sie vergleichbare Inserate auf Schweizer Marktplätzen für: ${specs}

SUCHKRITERIEN:
Exakte Suche: Jahrgang ${minYear}-${maxYear}, Km ${minMileage.toLocaleString()}-${maxMileage.toLocaleString()}
Ähnliche Suche (falls keine exakten Treffer): ±3 Jahre, ±50'000 km

NUR Schweizer Marktplätze: AutoScout24.ch, Comparis.ch, tutti.ch, autolina.ch
${exclusionRule}

Antworten Sie NUR mit JSON:
{
  "search_type": "exact"|"similar"|"none",
  "market_value": <CHF Durchschnitt oder null>,
  "price_range": {"min": <CHF>, "max": <CHF>} oder null,
  "listings_found": <Anzahl>,
  "purchase_price": <market_value * 0.85 oder null>,
  "confidence": "high"|"medium"|"low"|"none",
  "listings": [{"url": "...", "title": "...", "price": <CHF>, "mileage": <km>, "year": <Jahr>, "source": "..."}],
  "reasoning": "<Formelles Deutsch>"
}

Falls keine Treffer: "Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert. Unser Team wird Sie zeitnah mit einem persönlichen Angebot kontaktieren."`

  // Try Search API first (raw search results)
  console.log('📡 Trying Perplexity Search API (/search endpoint)...')
  const startTime = Date.now()

  // Improved search query: remove exact mileage, add fuel/body type, include "Preis CHF"
  const searchParts = [
    vehicleDesc,
    input.year.toString(),
    input.fuelType,
    input.bodyType,
    transmissionLabel,
    'Preis CHF'
  ].filter(Boolean)

  const searchQuery = `${searchParts.join(' ')} site:autoscout24.ch OR site:comparis.ch OR site:tutti.ch OR site:autolina.ch OR site:anibis.ch OR site:car4you.ch`

  const searchResponse = await fetch('https://api.perplexity.ai/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: searchQuery,
      max_results: 20,
      search_domain_filter: [
        'autoscout24.ch',
        'comparis.ch',
        'tutti.ch',
        'autolina.ch',
        'anibis.ch',
        'car4you.ch'
      ],
      search_recency_filter: 'month',
      country: 'CH'
    })
  })

  const searchElapsed = Date.now() - startTime
  console.log(`⏱️  Search API responded in ${searchElapsed}ms with status ${searchResponse.status}`)

  if (searchResponse.ok) {
    const searchData = await searchResponse.json()
    console.log(`📥 Search API returned ${searchData.results?.length || 0} results`)

    if (searchData.results && searchData.results.length > 0) {
      // Got search results! Now use Sonar to analyze them
      console.log('✅ Search results found, using Sonar to analyze...')

      // Build variant matching instruction
      const variantMatchRule = sanitizedVariant
        ? `- NUR Inserate die "${sanitizedVariant}" im Titel enthalten (z.B. "Golf GTI Performance" ja, "Golf VII GTI" ja, "Golf 1.0 TSI" nein, "Golf TDI" nein)`
        : `- Keine Premium-Varianten (GTI, AMG, RS, M-Sport, etc.)`

      const analysisPrompt = `Analysiere diese ${searchData.results.length} Inserate für ${vehicleDesc} (${input.year}):

${searchData.results.map((r: any, i: number) => `[${i}] ${r.title}
URL: ${r.url}
Text: ${r.snippet || ''}`).join('\n\n')}

AUFGABE: Extrahiere für JEDES Inserat die folgenden Daten:
1. Preis in CHF (suche nach "CHF", "Fr.", oder Zahlen im Format XX'XXX oder XX'XXX.-)
2. Kilometerstand (suche nach Zahl + "km")
3. Jahrgang (4-stellige Zahl zwischen 1990-2025)

VALIDIERUNG:
- Nur Inserate mit gültigem Preis einbeziehen
- Jahrgang muss zwischen ${minYear} und ${maxYear} liegen
- Kilometerstand muss zwischen ${minMileage.toLocaleString()} und ${maxMileage.toLocaleString()} km liegen
- Ignoriere Inserate ohne Preis oder mit unrealistischen Preisen (<1000 CHF oder >200000 CHF)
${variantMatchRule}

Antworte NUR mit diesem JSON (OHNE zusätzlichen Text):
{
  "listings": [
    {
      "index": 0,
      "price": <Preis in CHF als Ganzzahl oder null>,
      "mileage": <Kilometerstand als Ganzzahl oder null>,
      "year": <Jahrgang als Ganzzahl oder null>
    }
  ],
  "valid_count": <Anzahl Inserate mit gültigem Preis>
}`

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'Sie sind ein Experte für Fahrzeugbewertungen. Extrahieren Sie präzise Preis-, Kilometerstand- und Jahrgangsdaten aus Inseratstexten. Antworten Sie AUSSCHLIESSLICH mit gültigem JSON ohne zusätzlichen Text oder Erklärungen.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.0,
          max_tokens: 3000,
          disable_search: true
        })
      })

      const analysisElapsed = Date.now() - startTime
      console.log(`⏱️  Analysis completed in ${analysisElapsed}ms total`)

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('❌ Analysis API error:', errorBody)
        throw new Error(`Analysis API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content
      console.log('📥 Analysis response:', content?.substring(0, 200) + '...')

      if (!content) {
        throw new Error('No analysis response')
      }

      // Parse analysis response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      console.log(`📊 AI extracted ${parsed.valid_count || 0} listings with prices`)

      // Merge AI analysis with search results, with fallback price extraction
      let enrichedListings = (parsed.listings || []).map((listing: any) => {
        const searchResult = searchData.results[listing.index]
        if (!searchResult) return null

        // Combine title and snippet for better extraction
        const fullText = `${searchResult.title} ${searchResult.snippet || ''}`

        // Extract data: AI first, then regex fallback
        const extractedPrice = listing.price || extractPrice(fullText)
        const extractedMileage = listing.mileage || extractMileage(fullText)
        const extractedYear = listing.year || extractYear(fullText)

        // Only include listings where we extracted at least a price
        if (!extractedPrice) {
          console.log(`⚠️  Skipping listing ${listing.index}: No price found`)
          return null
        }

        return {
          url: searchResult.url,
          title: searchResult.title,
          price: extractedPrice,
          mileage: extractedMileage,
          year: extractedYear,
          source: new URL(searchResult.url).hostname,
          // Track what was extracted vs fallback
          hasExtractedMileage: !!extractedMileage,
          hasExtractedYear: !!extractedYear
        }
      }).filter((l: any) => l !== null)

      // Apply validation filters
      const validListings = enrichedListings.filter((l: any) => {
        // Always validate price
        if (l.price < 1000 || l.price > 200000) return false

        // Only validate year/mileage if they were actually extracted
        if (l.hasExtractedYear && (l.year < minYear || l.year > maxYear)) return false
        if (l.hasExtractedMileage && (l.mileage < minMileage || l.mileage > maxMileage)) return false

        return true
      }).map((l: any) => ({
        // Never use input as fallback - keep null if extraction failed
        url: l.url,
        title: l.title,
        price: l.price,
        mileage: l.mileage,
        year: l.year,
        source: l.source
      }))

      console.log(`✅ ${validListings.length} listings passed validation`)

      // Log price distribution for debugging
      if (validListings.length > 0) {
        const prices = validListings.map((l: any) => l.price)
        const uniquePrices = [...new Set(prices)]
        console.log(`💰 Price distribution: ${uniquePrices.length} unique prices from ${prices.length} listings`)
        if (uniquePrices.length < prices.length) {
          console.log(`⚠️  Warning: Found duplicate prices. This might indicate extraction issues.`)
        }
      }

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
      const allPrices = validListings.map((l: any) => l.price)
      const filteredPrices = removeOutliers(allPrices)
      console.log(`📉 Removed ${allPrices.length - filteredPrices.length} outliers from price data`)

      // Calculate market value and range
      const marketValue = Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length)
      const priceMin = Math.min(...filteredPrices)
      const priceMax = Math.max(...filteredPrices)
      const purchasePrice = Math.round(marketValue * 0.85)

      // Calculate confidence based on data quality
      const stdDev = calculateStdDev(filteredPrices)
      const coefficientOfVariation = stdDev / marketValue

      let confidence: 'high' | 'medium' | 'low' | 'none'
      if (filteredPrices.length >= 5 && coefficientOfVariation < 0.15) {
        confidence = 'high'
      } else if (filteredPrices.length >= 3 && coefficientOfVariation < 0.25) {
        confidence = 'medium'
      } else {
        confidence = 'low'
      }

      console.log(`📊 Confidence: ${confidence} (${filteredPrices.length} listings, CV: ${(coefficientOfVariation * 100).toFixed(1)}%)`)

      // Get unique sources
      const sources = validListings
        .map((l: any) => l.source)
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)

      // Generate reasoning
      const reasoning = `Basierend auf ${filteredPrices.length} vergleichbaren Inseraten von Schweizer Marktplätzen (${sources.join(', ')}). Durchschnittspreis: CHF ${marketValue.toLocaleString()}, Spanne: CHF ${priceMin.toLocaleString()} - ${priceMax.toLocaleString()}.`

      // Calculate extraction metadata for data quality tracking
      const priceExtracted = validListings.filter((l: any) => l.price !== null).length
      const mileageExtracted = validListings.filter((l: any) => l.mileage !== null).length
      const yearExtracted = validListings.filter((l: any) => l.year !== null).length
      const totalFields = validListings.length * 3 // price, mileage, year
      const extractedFields = priceExtracted + mileageExtracted + yearExtracted
      const qualityScore = Math.round((extractedFields / totalFields) * 100)

      const result = {
        marketValue,
        priceMin,
        priceMax,
        purchasePrice,
        listingsCount: filteredPrices.length,
        sources,
        listings: validListings.slice(0, 8),
        confidence,
        reasoning,
        searchType: 'exact' as const,
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

      // Cache successful valuations for cost optimization
      await setCachedValuation(
        {
          brand: input.brand,
          model: input.model,
          variant: input.variant,
          year: input.year,
          mileage: input.mileage,
          fuelType: input.fuelType
        },
        {
          marketValue: result.marketValue,
          priceMin: result.priceMin,
          priceMax: result.priceMax,
          purchasePrice: result.purchasePrice,
          listingsCount: result.listingsCount,
          sources: result.sources,
          confidence: result.confidence,
          reasoning: result.reasoning
        }
      )

      return result
    }
  }

  // Fallback to original Sonar chat completions if Search API fails
  console.log('⚠️  Search API returned no results, falling back to Sonar chat...')

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'Sie sind ein Schweizer Fahrzeugmarkt-Experte, spezialisiert auf präzise Fahrzeugbewertungen. Sie verwenden AUSSCHLIESSLICH Schweizer Marktplätze (AutoScout24.ch, Comparis.ch, tutti.ch, autolina.ch) und schliessen NIEMALS Inserate aus anderen Ländern ein. Sie filtern Ergebnisse streng nach den angegebenen Fahrzeugspezifikationen. Antworten Sie immer auf formelles Deutsch und nur mit gültigem JSON, ohne zusätzlichen Text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.0,
      max_tokens: 2000,
      search_domain_filter: [
        'autoscout24.ch',
        'comparis.ch',
        'tutti.ch',
        'autolina.ch',
        'anibis.ch',
        'car4you.ch'
      ],
      search_recency_filter: 'month',
      return_images: true,
      return_related_questions: false,
      enable_search_classifier: true,
      web_search_options: {
        search_context_size: 'high'
      }
    })
  })

  const elapsed = Date.now() - startTime
  console.log(`⏱️  Perplexity API responded in ${elapsed}ms with status ${response.status}`)

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('❌ Perplexity API error details:', errorBody)
    throw new Error(`Perplexity API error: ${response.status} - ${errorBody}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  console.log('📥 Perplexity raw response:', content?.substring(0, 200) + '...')

  if (!content) {
    throw new Error('No response from Perplexity API')
  }

  // Parse the JSON response
  try {
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
    const stdDev = calculateStdDev(filteredPrices)
    const coefficientOfVariation = stdDev / marketValue

    let confidence: 'high' | 'medium' | 'low' | 'none'
    if (filteredPrices.length >= 5 && coefficientOfVariation < 0.15) {
      confidence = 'high'
    } else if (filteredPrices.length >= 3 && coefficientOfVariation < 0.25) {
      confidence = 'medium'
    } else {
      confidence = 'low'
    }

    console.log(`📊 Confidence: ${confidence} (${filteredPrices.length} listings, CV: ${(coefficientOfVariation * 100).toFixed(1)}%)`)

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

    const result = {
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

    // Cache successful valuations for cost optimization
    await setCachedValuation(
      {
        brand: input.brand,
        model: input.model,
        year: input.year,
        mileage: input.mileage,
        fuelType: input.fuelType
      },
      {
        marketValue: result.marketValue,
        priceMin: result.priceMin,
        priceMax: result.priceMax,
        purchasePrice: result.purchasePrice,
        listingsCount: result.listingsCount,
        sources: result.sources,
        confidence: result.confidence,
        reasoning: result.reasoning
      }
    )

    return result
  } catch (parseError) {
    console.error('Failed to parse Perplexity response:', content)
    throw new Error('Failed to parse valuation response')
  }
}
