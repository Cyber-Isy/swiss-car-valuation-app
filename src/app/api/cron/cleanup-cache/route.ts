import { NextRequest, NextResponse } from 'next/server'
import { cleanExpiredCache } from '@/lib/valuation-cache'

/**
 * GET /api/cron/cleanup-cache
 * Cleans up expired cache entries (runs daily via Vercel Cron)
 *
 * For local testing: GET http://localhost:3000/api/cron/cleanup-cache
 * For production: Configured in vercel.json to run daily at 3 AM UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🧹 Starting cache cleanup cron job...')
    const deletedCount = await cleanExpiredCache()

    return NextResponse.json({
      success: true,
      message: `Cleaned ${deletedCount} expired cache entries`,
      deletedCount
    })
  } catch (error) {
    console.error('Cache cleanup cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean cache'
      },
      { status: 500 }
    )
  }
}
