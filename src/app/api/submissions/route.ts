import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCarValuation } from "@/lib/perplexity"
import { submissionSchema } from "@/lib/validations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the input
    const validationResult = submissionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data
    const { vehicleImageUrls, fahrzeugausweisUrl } = body

    if (!fahrzeugausweisUrl) {
      return NextResponse.json(
        { error: "Fahrzeugausweis URL is required" },
        { status: 400 }
      )
    }

    // Parse firstRegistration to get DateTime
    let firstRegistrationDate: Date | null = null
    if (data.firstRegistration) {
      const [month, year] = data.firstRegistration.split("/")
      if (month && year) {
        firstRegistrationDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      }
    }

    // Parse mfkDate to get DateTime
    let mfkDateValue: Date | null = null
    if (data.mfkDate) {
      const [month, year] = data.mfkDate.split("/")
      if (month && year) {
        mfkDateValue = new Date(parseInt(year), parseInt(month) - 1, 1)
      }
    }

    // Create the submission first
    const submission = await prisma.submission.create({
      data: {
        // Basic info
        kontrollschild: data.kontrollschild,
        brand: data.brand,
        model: data.model,
        variant: data.variant || null,
        year: data.year,
        mileage: data.mileage,
        fuelType: data.fuelType,
        condition: data.condition,

        // Tier 1 - Critical
        firstRegistration: firstRegistrationDate,
        transmission: data.transmission,
        enginePower: data.enginePower,
        bodyType: data.bodyType,

        // Tier 2 - Swiss Market
        driveType: data.driveType || "FWD",
        mfkDate: mfkDateValue,
        previousOwners: data.previousOwners || null,
        accidentFree: data.accidentFree || false,

        // Tier 3 - Value Modifiers
        serviceHistory: data.serviceHistory || null,
        exteriorColor: data.exteriorColor || null,
        equipment: data.equipment || [],

        // Seller info
        sellerName: data.sellerName,
        sellerEmail: data.sellerEmail,
        sellerPhone: data.sellerPhone,
        sellerLocation: data.sellerLocation,
        fahrzeugausweisUrl: fahrzeugausweisUrl,
        vehicleImages: {
          create: vehicleImageUrls?.map((url: string) => ({ url })) || [],
        },
      },
    })

    // Get AI valuation (async, don't wait)
    getCarValuation({
      brand: data.brand,
      model: data.model,
      variant: data.variant,
      year: data.year,
      mileage: data.mileage,
      fuelType: data.fuelType,
      condition: data.condition,
      enginePower: data.enginePower,
      transmission: data.transmission,
      bodyType: data.bodyType,
      driveType: data.driveType,
      mfkDate: data.mfkDate,
      previousOwners: data.previousOwners,
      accidentFree: data.accidentFree,
      serviceHistory: data.serviceHistory,
      exteriorColor: data.exteriorColor,
      equipment: data.equipment,
    })
      .then(async (valuation) => {
        // Update the submission with valuation data
        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            aiMarketValue: valuation.marketValue,
            aiPriceMin: valuation.priceMin,
            aiPriceMax: valuation.priceMax,
            aiPurchasePrice: valuation.purchasePrice,
            aiListingsCount: valuation.listingsCount,
            aiSources: valuation.sources,
            aiListings: valuation.listings as any,
            aiConfidence: valuation.confidence,
            aiReasoning: valuation.reasoning,
          },
        })
      })
      .catch((error) => {
        console.error("Valuation error:", error)
        // Update submission to indicate valuation failed
        prisma.submission.update({
          where: { id: submission.id },
          data: {
            aiReasoning: "Bewertung konnte nicht erstellt werden. Unser Team wird Sie kontaktieren.",
          },
        }).catch(console.error)
      })

    return NextResponse.json({ id: submission.id })
  } catch (error) {
    console.error("Submission error:", error)
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    )
  }
}

// GET all submissions (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const submissions = await prisma.submission.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        vehicleImages: true,
      },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    )
  }
}
