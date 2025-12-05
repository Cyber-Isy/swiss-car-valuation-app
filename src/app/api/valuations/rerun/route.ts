import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCarValuation } from '@/lib/perplexity'

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Get the existing submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    console.log(`🔄 Rerunning valuation for submission: ${submissionId}`)

    // Helper function to format date to MM/YYYY
    const formatDateToMMYYYY = (date: Date | null): string | undefined => {
      if (!date) return undefined
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${month}/${year}`
    }

    // Run the valuation again with the existing vehicle data
    const valuationResult = await getCarValuation({
      brand: submission.brand,
      model: submission.model,
      variant: submission.variant ?? undefined,
      year: submission.year,
      mileage: submission.mileage,
      fuelType: submission.fuelType,
      condition: submission.condition,
      transmission: submission.transmission ?? undefined,
      bodyType: submission.bodyType ?? undefined,
      driveType: submission.driveType ?? undefined,
      enginePower: submission.enginePower ?? undefined,
      mfkDate: formatDateToMMYYYY(submission.mfkDate),
      previousOwners: submission.previousOwners ?? undefined,
      accidentFree: submission.accidentFree,
      serviceHistory: submission.serviceHistory ?? undefined,
      exteriorColor: submission.exteriorColor ?? undefined,
      equipment: submission.equipment as string[]
    })

    // Update the submission with new valuation results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        aiMarketValue: valuationResult.marketValue,
        aiPriceMin: valuationResult.priceMin,
        aiPriceMax: valuationResult.priceMax,
        aiPurchasePrice: valuationResult.purchasePrice,
        aiListingsCount: valuationResult.listingsCount,
        aiSources: valuationResult.sources,
        aiListings: valuationResult.listings as any,
        aiConfidence: valuationResult.confidence,
        aiReasoning: valuationResult.reasoning,
        aiListingsMetadata: valuationResult.metadata as any
      }
    })

    console.log(`✅ Valuation rerun complete for: ${submissionId}`)

    return NextResponse.json({
      success: true,
      submission: updatedSubmission
    })
  } catch (error) {
    console.error('❌ Error rerunning valuation:', error)
    return NextResponse.json(
      { error: 'Failed to rerun valuation' },
      { status: 500 }
    )
  }
}
