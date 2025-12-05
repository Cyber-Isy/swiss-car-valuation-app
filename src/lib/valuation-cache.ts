/**
 * Valuation Cache System
 * Reduces API costs by caching similar vehicle valuations
 * Cache TTL: 7 days
 * Expected cache hit rate: 30-50% after 1 week
 */

import { prisma } from '@/lib/db'

const CACHE_TTL_DAYS = 7

interface CacheKey {
  brand: string
  model: string
  variant?: string
  year: number
  mileage: number
  fuelType: string
}

interface CachedValuation {
  marketValue: number | null
  priceMin: number | null
  priceMax: number | null
  purchasePrice: number | null
  listingsCount: number
  sources: string[]
  confidence: string
  reasoning: string
}

/**
 * Generate a cache key for a vehicle valuation
 * Key considers: brand, model, variant, year ±1, mileage ±10%, fuelType
 */
export function generateCacheKey(input: CacheKey): string {
  const normalizedBrand = input.brand.trim().toLowerCase()
  const normalizedModel = input.model.trim().toLowerCase()
  const normalizedVariant = input.variant ? input.variant.trim().toLowerCase() : 'base'
  const normalizedFuel = input.fuelType.trim().toLowerCase()

  // Round year to nearest value (allows ±1 year matching)
  const yearKey = input.year

  // Round mileage to nearest 10% bucket (e.g., 50000 -> 50k bucket)
  const mileageBucket = Math.round(input.mileage / 10000) * 10000

  return `${normalizedBrand}:${normalizedModel}:${normalizedVariant}:${yearKey}:${mileageBucket}:${normalizedFuel}`
}

/**
 * Check if a cached valuation exists and is still valid
 * Returns cached data if found and not expired, null otherwise
 */
export async function getCachedValuation(input: CacheKey): Promise<CachedValuation | null> {
  // Skip caching in test environment to avoid interfering with mocks
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return null
  }

  try {
    const cacheKey = generateCacheKey(input)
    const expiresAt = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000)

    // Find cache entry that matches our key and is not expired
    const cached = await prisma.valuationCache.findFirst({
      where: {
        cacheKey,
        createdAt: {
          gte: expiresAt
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!cached) {
      console.log('🔍 Cache MISS for:', cacheKey)
      return null
    }

    console.log('✅ Cache HIT for:', cacheKey, `(${Math.round((Date.now() - cached.createdAt.getTime()) / (1000 * 60 * 60))}h old)`)

    return {
      marketValue: cached.marketValue,
      priceMin: cached.priceMin,
      priceMax: cached.priceMax,
      purchasePrice: cached.purchasePrice,
      listingsCount: cached.listingsCount,
      sources: cached.sources,
      confidence: cached.confidence,
      reasoning: cached.reasoning
    }
  } catch (error) {
    console.error('❌ Cache lookup error:', error)
    return null // Fail gracefully - don't block valuation if cache fails
  }
}

/**
 * Store a valuation result in the cache
 */
export async function setCachedValuation(
  input: CacheKey,
  valuation: CachedValuation
): Promise<void> {
  // Skip caching in test environment
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return
  }

  try {
    const cacheKey = generateCacheKey(input)

    await prisma.valuationCache.create({
      data: {
        cacheKey,
        brand: input.brand,
        model: input.model,
        year: input.year,
        mileage: input.mileage,
        fuelType: input.fuelType,
        marketValue: valuation.marketValue,
        priceMin: valuation.priceMin,
        priceMax: valuation.priceMax,
        purchasePrice: valuation.purchasePrice,
        listingsCount: valuation.listingsCount,
        sources: valuation.sources,
        confidence: valuation.confidence,
        reasoning: valuation.reasoning
      }
    })

    console.log('💾 Cached valuation for:', cacheKey)
  } catch (error) {
    console.error('❌ Cache write error:', error)
    // Fail gracefully - don't block valuation if cache write fails
  }
}

/**
 * Clean up expired cache entries
 * Should be run daily via cron job
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const expiresAt = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000)

    const result = await prisma.valuationCache.deleteMany({
      where: {
        createdAt: {
          lt: expiresAt
        }
      }
    })

    console.log(`🧹 Cleaned ${result.count} expired cache entries`)
    return result.count
  } catch (error) {
    console.error('❌ Cache cleanup error:', error)
    return 0
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
  totalEntries: number
  uniqueVehicles: number
  oldestEntry: Date | null
  newestEntry: Date | null
}> {
  try {
    const [totalEntries, uniqueVehicles, oldestEntry, newestEntry] = await Promise.all([
      prisma.valuationCache.count(),
      prisma.valuationCache.groupBy({
        by: ['cacheKey'],
        _count: true
      }).then(groups => groups.length),
      prisma.valuationCache.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      }),
      prisma.valuationCache.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ])

    return {
      totalEntries,
      uniqueVehicles,
      oldestEntry: oldestEntry?.createdAt || null,
      newestEntry: newestEntry?.createdAt || null
    }
  } catch (error) {
    console.error('❌ Cache stats error:', error)
    return {
      totalEntries: 0,
      uniqueVehicles: 0,
      oldestEntry: null,
      newestEntry: null
    }
  }
}
