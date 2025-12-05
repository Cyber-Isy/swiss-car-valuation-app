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
  mileage: number
  year: number
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
}

export async function getCarValuation(input: ValuationInput): Promise<ValuationResult> {
  console.log('🚀 Starting AI valuation for:', input.brand, input.model, input.variant)

  // Calculate acceptable ranges for filtering
  const minYear = input.year - 2
  const maxYear = input.year + 2
  const minMileage = Math.max(0, input.mileage - 30000)
  const maxMileage = input.mileage + 30000
  const minPower = input.enginePower ? Math.max(0, input.enginePower - 20) : null
  const maxPower = input.enginePower ? input.enginePower + 20 : null

  // Build vehicle description
  const vehicleDesc = [input.brand, input.model, input.variant].filter(Boolean).join(' ')

  // Format transmission for German
  const transmissionLabel = input.transmission === 'MANUAL' ? 'Manuell' : input.transmission === 'AUTOMATIC' ? 'Automatik' : null

  // Format drive type for German
  const driveTypeLabels: Record<string, string> = { FWD: 'Frontantrieb', RWD: 'Hinterradantrieb', AWD: 'Allrad' }
  const driveTypeLabel = input.driveType ? driveTypeLabels[input.driveType] || input.driveType : null

  // Format service history for German
  const serviceLabels: Record<string, string> = { FULL: 'Vollständig', PARTIAL: 'Teilweise', NONE: 'Keine' }
  const serviceLabel = input.serviceHistory ? serviceLabels[input.serviceHistory] || input.serviceHistory : null

  const prompt = `Suchen Sie aktuelle Marktpreise in der SCHWEIZ für dieses Fahrzeug:

FAHRZEUGSPEZIFIKATIONEN:
- Marke: ${input.brand}
- Modell: ${input.model}
- Variante: ${input.variant || 'Standard (keine spezielle Variante)'}
- Jahrgang: ${input.year}
- Kilometerstand: ${input.mileage.toLocaleString()} km
- Leistung: ${input.enginePower ? `${input.enginePower} PS` : 'Nicht angegeben'}
- Getriebe: ${transmissionLabel || 'Nicht angegeben'}
- Treibstoff: ${input.fuelType}
- Karosserie: ${input.bodyType || 'Nicht angegeben'}
- Antrieb: ${driveTypeLabel || 'Nicht angegeben'}
- Zustand: ${input.condition}
- MFK gültig bis: ${input.mfkDate || 'Nicht angegeben'}
- Vorbesitzer: ${input.previousOwners || 'Nicht angegeben'}
- Unfallfrei: ${input.accidentFree ? 'Ja' : 'Nicht angegeben'}
- Serviceheft: ${serviceLabel || 'Nicht angegeben'}
- Farbe: ${input.exteriorColor || 'Nicht angegeben'}
- Ausstattung: ${input.equipment?.length ? input.equipment.join(', ') : 'Keine angegeben'}

SUCHSTRATEGIE (in dieser Reihenfolge):

SCHRITT 1 - EXAKTE SUCHE:
Suchen Sie zuerst nach EXAKTEN Übereinstimmungen:
- Gleiche Marke und Modell (${vehicleDesc})
- Jahrgang zwischen ${minYear} und ${maxYear}
- Kilometerstand zwischen ${minMileage.toLocaleString()} km und ${maxMileage.toLocaleString()} km
- Gleiches Getriebe (${transmissionLabel || 'beliebig'})
${minPower && maxPower ? `- Leistung zwischen ${minPower} PS und ${maxPower} PS` : ''}
${input.bodyType ? `- Gleiche Karosserie (${input.bodyType})` : ''}

SCHRITT 2 - ÄHNLICHE SUCHE (NUR wenn KEINE exakten Treffer):
Falls keine exakten Treffer gefunden werden, suchen Sie nach ÄHNLICHEN Fahrzeugen:
- Gleiche Marke (${input.brand})
- Ähnliches Modell oder vergleichbare Klasse
- Jahrgang zwischen ${input.year - 3} und ${input.year + 3}
- Kilometerstand zwischen ${Math.max(0, input.mileage - 50000).toLocaleString()} km und ${(input.mileage + 50000).toLocaleString()} km
- Ähnliche Motorisierung

WICHTIG:
1. NUR Schweizer Marktplätze: AutoScout24.ch, Comparis.ch, tutti.ch, autolina.ch
2. KEINE deutschen Seiten (mobile.de) oder andere Länder
3. Bei "${vehicleDesc}" KEINE höherwertigen Varianten (GTI Clubsport, AMG, M-Sport, RS, etc.)

ANTWORT AUF DEUTSCH - Geben Sie NUR ein gültiges JSON-Objekt zurück:
{
  "search_type": "exact" oder "similar" oder "none",
  "market_value": <Durchschnittspreis in CHF als Ganzzahl oder null wenn keine Treffer>,
  "price_range": { "min": <tiefster Preis>, "max": <höchster Preis> } oder null,
  "listings_found": <Anzahl der gefundenen Inserate als Ganzzahl>,
  "purchase_price": <market_value mal 0.85 für 15% Marge oder null>,
  "confidence": "high" oder "medium" oder "low" oder "none",
  "listings": [
    {
      "url": "<vollständige URL zum Schweizer Inserat>",
      "title": "<Fahrzeugtitel aus dem Inserat>",
      "price": <Preis in CHF>,
      "mileage": <Kilometerstand>,
      "year": <Jahrgang>,
      "source": "<Schweizer Webseite z.B. AutoScout24.ch>"
    }
  ],
  "reasoning": "<Begründung auf Deutsch>"
}

REASONING BEISPIELE (auf formelles Deutsch):
- Wenn exakte Treffer: "Basierend auf X vergleichbaren Inseraten auf dem Schweizer Markt wurde ein durchschnittlicher Marktwert von CHF X ermittelt."
- Wenn ähnliche Treffer: "Da keine exakten Übereinstimmungen gefunden wurden, basiert die Bewertung auf X ähnlichen Fahrzeugen der gleichen Marke und Klasse."
- Wenn keine Treffer: "Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert. Unser Team wird Sie zeitnah mit einem persönlichen Angebot kontaktieren."

Bei "none" (keine Treffer): market_value, price_range und purchase_price müssen null sein.`

  // Try Search API first (raw search results)
  console.log('📡 Trying Perplexity Search API (/search endpoint)...')
  const startTime = Date.now()

  const searchQuery = `${vehicleDesc} ${input.year} ${input.mileage} km ${transmissionLabel || ''} site:autoscout24.ch OR site:comparis.ch OR site:tutti.ch OR site:autolina.ch OR site:anibis.ch OR site:car4you.ch`

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

      const analysisPrompt = `Analysiere diese ${searchData.results.length} Suchergebnisse für ${vehicleDesc} (${input.year}, ${input.mileage} km):

SUCHERGEBNISSE:
${searchData.results.map((r: any, i: number) => `
${i + 1}. ${r.title}
   URL: ${r.url}
   Snippet: ${r.snippet}
   Datum: ${r.date || r.last_updated || 'Unbekannt'}
`).join('\n')}

Extrahiere alle Preise (CHF) aus den Titeln und Snippets und berechne:
1. Durchschnittspreis (market_value)
2. Preisspanne (price_range: min und max)
3. Ankaufspreis (purchase_price = market_value * 0.85)

WICHTIG: Antworte NUR mit diesem exakten JSON-Format, ohne zusätzlichen Text:

{
  "search_type": "exact",
  "market_value": <Durchschnittspreis als Ganzzahl>,
  "price_range": {
    "min": <niedrigster Preis>,
    "max": <höchster Preis>
  },
  "listings_found": ${searchData.results.length},
  "purchase_price": <market_value mal 0.85>,
  "confidence": "high",
  "listings": [],
  "reasoning": "Basierend auf ${searchData.results.length} Suchergebnissen von Schweizer Marktplätzen (${searchData.results.map((r: any) => new URL(r.url).hostname).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ')})."
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
              content: 'Sie sind ein Experte für Fahrzeugbewertungen. Extrahieren Sie Preise aus den bereitgestellten Suchergebnissen und berechnen Sie Durchschnittswerte. Antworten Sie AUSSCHLIESSLICH mit gültigem JSON ohne zusätzlichen Text oder Erklärungen.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
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

      // Continue with existing parsing logic...
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      const listings = parsed.listings || []
      const searchType = parsed.search_type || (listings.length > 0 ? 'exact' : 'similar')

      return {
        marketValue: parsed.market_value,
        priceMin: parsed.price_range?.min || (parsed.market_value ? parsed.market_value * 0.9 : null),
        priceMax: parsed.price_range?.max || (parsed.market_value ? parsed.market_value * 1.1 : null),
        purchasePrice: parsed.purchase_price,
        listingsCount: parsed.listings_found || searchData.results.length || 0,
        sources: searchData.results.map((r: any) => new URL(r.url).hostname).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
        listings: searchData.results.slice(0, 5).map((r: any) => ({
          url: r.url,
          title: r.title,
          price: 0, // Will be extracted by analysis
          mileage: input.mileage,
          year: input.year,
          source: new URL(r.url).hostname
        })),
        confidence: listings.length > 5 ? 'high' : listings.length > 2 ? 'medium' : 'low',
        reasoning: parsed.reasoning || `Basierend auf ${searchData.results.length} Suchergebnissen von Schweizer Marktplätzen.`,
        searchType
      }
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
      temperature: 0.2,
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

    // Extract sources from listings if not provided separately
    const listings = parsed.listings || []
    const sources = parsed.sources || listings.map((l: Listing) => l.source).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
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

    console.log('✅ Valuation completed:', { marketValue: parsed.market_value, listingsCount: listings.length, confidence: parsed.confidence })
    return {
      marketValue: parsed.market_value,
      priceMin: parsed.price_range?.min || (parsed.market_value ? parsed.market_value * 0.9 : null),
      priceMax: parsed.price_range?.max || (parsed.market_value ? parsed.market_value * 1.1 : null),
      purchasePrice: parsed.purchase_price,
      listingsCount: parsed.listings_found || listings.length || 0,
      sources,
      listings,
      confidence: parsed.confidence || 'medium',
      reasoning: parsed.reasoning || 'Basierend auf aktuellen Inseraten auf dem Schweizer Markt.',
      searchType
    }
  } catch (parseError) {
    console.error('Failed to parse Perplexity response:', content)
    throw new Error('Failed to parse valuation response')
  }
}
