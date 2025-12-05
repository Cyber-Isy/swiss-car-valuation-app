// Mock Perplexity Search API responses
export const mockSearchResults = {
  success: {
    results: [
      {
        url: 'https://www.autoscout24.ch/de/d/vw-golf-2017-benzin-152000km',
        title: 'VW Golf 2017 Benzin - CHF 9\'500',
        snippet: 'VW Golf 2017, 152\'000 km, Benzin, Automatik. Preis: CHF 9\'500. Sehr gepflegt.',
        date: '2024-01-15'
      },
      {
        url: 'https://www.comparis.ch/auto/vw-golf-2017-10200',
        title: 'VW Golf VII 1.4 TSI - CHF 10\'200',
        snippet: 'Golf 2017, 145\'000 km, gepflegt, CHF 10\'200',
        date: '2024-01-14'
      },
      {
        url: 'https://www.autoscout24.ch/de/d/vw-golf-2018-benzin',
        title: 'VW Golf 2018 - CHF 11\'800',
        snippet: '2018, 130\'000 km, Benzin, CHF 11\'800',
        date: '2024-01-13'
      },
      {
        url: 'https://www.tutti.ch/de/vw-golf-2017',
        title: 'VW Golf 2017 Automatik CHF 9\'800',
        snippet: '150\'000 km, guter Zustand, 2017',
        date: '2024-01-12'
      },
      {
        url: 'https://www.comparis.ch/auto/vw-golf-2016',
        title: 'VW Golf 2016 - CHF 8\'900',
        snippet: '2016, 165\'000 km, Benzin',
        date: '2024-01-11'
      }
    ]
  },
  empty: {
    results: []
  }
}

// Mock Perplexity Analysis API responses
export const mockAnalysisResponse = {
  success: {
    choices: [{
      message: {
        content: JSON.stringify({
          listings: [
            { index: 0, price: 9500, mileage: 152000, year: 2017 },
            { index: 1, price: 10200, mileage: 145000, year: 2017 },
            { index: 2, price: 11800, mileage: 130000, year: 2018 },
            { index: 3, price: 9800, mileage: 150000, year: 2017 },
            { index: 4, price: 8900, mileage: 165000, year: 2016 }
          ],
          valid_count: 5
        })
      }
    }]
  },
  partial: {
    choices: [{
      message: {
        content: JSON.stringify({
          listings: [
            { index: 0, price: 9500, mileage: null, year: 2017 },
            { index: 1, price: 10200, mileage: 145000, year: null },
            { index: 2, price: null, mileage: 130000, year: 2018 }
          ],
          valid_count: 2
        })
      }
    }]
  },
  duplicatePrices: {
    choices: [{
      message: {
        content: JSON.stringify({
          listings: [
            { index: 0, price: 9500, mileage: 152000, year: 2017 },
            { index: 1, price: 9500, mileage: 145000, year: 2017 },
            { index: 2, price: 9500, mileage: 130000, year: 2018 }
          ],
          valid_count: 3
        })
      }
    }]
  }
}

// Mock Sonar fallback response
export const mockSonarResponse = {
  success: {
    choices: [{
      message: {
        content: JSON.stringify({
          search_type: 'exact',
          market_value: 10000,
          price_range: { min: 8900, max: 11800 },
          listings_found: 5,
          purchase_price: 8500,
          confidence: 'high',
          listings: [
            {
              url: 'https://www.autoscout24.ch/de/d/vw-golf-2017',
              title: 'VW Golf 2017',
              price: 9500,
              mileage: 152000,
              year: 2017,
              source: 'autoscout24.ch'
            }
          ],
          reasoning: 'Basierend auf 5 vergleichbaren Inseraten.'
        })
      }
    }]
  },
  noResults: {
    choices: [{
      message: {
        content: JSON.stringify({
          search_type: 'none',
          market_value: null,
          price_range: null,
          listings_found: 0,
          purchase_price: null,
          confidence: 'none',
          listings: [],
          reasoning: 'Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert.'
        })
      }
    }]
  }
}

// Sample valuation input
export const mockValuationInput = {
  brand: 'VW',
  model: 'Golf',
  variant: '',
  year: 2017,
  mileage: 150000,
  fuelType: 'Benzin',
  condition: 'Gut',
  enginePower: 110,
  transmission: 'AUTOMATIC' as const,
  bodyType: 'Limousine'
}
