import { sanitizeForPrompt, createSafeVehicleDescription } from '../input-sanitizer'
import type { ValuationInput } from './types'

/**
 * Build the prompt for the AI valuation API
 */
export function buildValuationPrompt(input: ValuationInput): string {
  // Sanitize all user inputs before using in prompts
  const sanitizedBrand = sanitizeForPrompt(input.brand, 50)
  const sanitizedModel = sanitizeForPrompt(input.model, 50)
  const sanitizedVariant = input.variant ? sanitizeForPrompt(input.variant, 50) : undefined
  const sanitizedFuelType = sanitizeForPrompt(input.fuelType, 30)
  const sanitizedBodyType = input.bodyType ? sanitizeForPrompt(input.bodyType, 30) : undefined

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

  return prompt
}
