import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/valuation-cache'

/**
 * GET /api/cache/stats
 * Returns cache statistics for monitoring
 */
export async function GET() {
  try {
    const stats = await getCacheStats()

    return NextResponse.json({
      success: true,
      data: {
        totalEntries: stats.totalEntries,
        uniqueVehicles: stats.uniqueVehicles,
        oldestEntry: stats.oldestEntry,
        newestEntry: stats.newestEntry,
        cacheAge: stats.oldestEntry
          ? Math.round((Date.now() - stats.oldestEntry.getTime()) / (1000 * 60 * 60 * 24))
          : 0 // age in days
      }
    })
  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve cache statistics'
      },
      { status: 500 }
    )
  }
}
