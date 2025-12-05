import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCarValuation } from "@/lib/perplexity"
import { submissionSchema } from "@/lib/validations"
import { checkIpRateLimit, checkEmailRateLimit } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check IP rate limit (100 requests/hour)
    const ipLimit = checkIpRateLimit(ip)
    if (!ipLimit.allowed) {
      const retryAfter = Math.ceil((ipLimit.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(ipLimit.resetAt).toISOString()
          }
        }
      )
    }

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

    // Check email rate limit (5 submissions/day)
    const emailLimit = checkEmailRateLimit(data.sellerEmail)
    if (!emailLimit.allowed) {
      const retryAfter = Math.ceil((emailLimit.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Sie haben das Tageslimit von 5 Einreichungen erreicht. Bitte versuchen Sie es morgen erneut.",
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(emailLimit.resetAt).toISOString()
          }
        }
      )
    }

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
            aiListingsMetadata: valuation.metadata as any,
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
