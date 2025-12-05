import { containsSuspiciousPatterns } from '../input-sanitizer'
import { getCachedValuation, setCachedValuation } from '../valuation-cache'
import { buildValuationPrompt } from './prompt-builder'
import { parseValuationResponse } from './response-parser'
import type { ValuationInput, ValuationResult } from './types'

/**
 * Get car valuation using AI-powered market research
 */
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

  // Check for suspicious patterns in main fields and log warnings
  if (containsSuspiciousPatterns(input.brand) || containsSuspiciousPatterns(input.model) || (input.variant && containsSuspiciousPatterns(input.variant))) {
    console.warn('⚠️ Suspicious input detected in vehicle description:', {
      brand: input.brand,
      model: input.model,
      variant: input.variant
    })
  }

  // Build the prompt
  const prompt = buildValuationPrompt(input)

  // Use Sonar chat completions with built-in web search
  console.log('🔍 Using Sonar chat with web search to find individual car listings...')
  const startTime = Date.now()

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

  // Parse the response
  const result = parseValuationResponse(content, input)

  // Cache successful valuations for cost optimization
  if (result.marketValue !== null) {
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
  }

  return result
}
