import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        vehicleImages: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching submission:", error)
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {
      status: body.status,
      notes: body.notes,
      finalOfferPrice: body.finalOfferPrice,
    }

    // Handle archiving
    if (typeof body.archived === "boolean") {
      updateData.archived = body.archived
      updateData.archivedAt = body.archived ? new Date() : null
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error updating submission:", error)
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.submission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting submission:", error)
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    )
  }
}
