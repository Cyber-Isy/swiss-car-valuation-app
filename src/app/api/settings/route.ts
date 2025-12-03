import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - Fetch current settings
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    })

    // If settings don't exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          profitMargin: 15.0,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { profitMargin } = body

    // Validate profit margin
    if (typeof profitMargin !== "number" || profitMargin < 0 || profitMargin > 100) {
      return NextResponse.json(
        { error: "Invalid profit margin. Must be between 0 and 100." },
        { status: 400 }
      )
    }

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        profitMargin,
        updatedBy: session.user?.email || null,
      },
      create: {
        id: "default",
        profitMargin,
        updatedBy: session.user?.email || null,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
