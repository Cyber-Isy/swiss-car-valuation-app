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

    // Run the valuation again with the existing vehicle data
    const valuationResult = await getCarValuation({
      brand: submission.brand,
      model: submission.model,
      variant: submission.variant,
      year: submission.year,
      mileage: submission.mileage,
      fuelType: submission.fuelType,
      condition: submission.condition,
      transmission: submission.transmission,
      bodyType: submission.bodyType,
      driveType: submission.driveType,
      enginePower: submission.enginePower,
      firstRegistration: submission.firstRegistration,
      mfkDate: submission.mfkDate,
      previousOwners: submission.previousOwners,
      accidentFree: submission.accidentFree,
      serviceHistory: submission.serviceHistory,
      exteriorColor: submission.exteriorColor,
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
