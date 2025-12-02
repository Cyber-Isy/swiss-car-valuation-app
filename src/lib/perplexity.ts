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
      temperature: 0.1,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Perplexity API error details:', errorBody)
    throw new Error(`Perplexity API error: ${response.status} - ${errorBody}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

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
