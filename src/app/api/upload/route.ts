import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503 }
      )
    }

    const formData = await request.formData()

    const vehicleImages = formData.getAll("vehicleImages") as File[]
    const fahrzeugausweis = formData.get("fahrzeugausweis") as File

    if (!fahrzeugausweis) {
      return NextResponse.json(
        { error: "Fahrzeugausweis is required" },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const vehicleImageUrls: string[] = []

    // Upload vehicle images
    for (let i = 0; i < vehicleImages.length; i++) {
      const file = vehicleImages[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `vehicle-${timestamp}-${i}.${fileExt}`
      const filePath = `vehicles/${fileName}`

      const buffer = await file.arrayBuffer()
      const { data, error } = await supabaseAdmin.storage
        .from("car-images")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        console.error("Upload error:", error)
        throw new Error(`Failed to upload vehicle image ${i + 1}`)
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("car-images")
        .getPublicUrl(filePath)

      vehicleImageUrls.push(urlData.publicUrl)
    }

    // Upload Fahrzeugausweis
    const fahrzeugausweisExt = fahrzeugausweis.name.split(".").pop()
    const fahrzeugausweisFileName = `fahrzeugausweis-${timestamp}.${fahrzeugausweisExt}`
    const fahrzeugausweisPath = `documents/${fahrzeugausweisFileName}`

    const fahrzeugausweisBuffer = await fahrzeugausweis.arrayBuffer()
    const { error: fahrzeugausweisError } = await supabaseAdmin.storage
      .from("car-images")
      .upload(fahrzeugausweisPath, fahrzeugausweisBuffer, {
        contentType: fahrzeugausweis.type,
        upsert: false,
      })

    if (fahrzeugausweisError) {
      console.error("Upload error:", fahrzeugausweisError)
      throw new Error("Failed to upload Fahrzeugausweis")
    }

    const { data: fahrzeugausweisUrlData } = supabaseAdmin.storage
      .from("car-images")
      .getPublicUrl(fahrzeugausweisPath)

    return NextResponse.json({
      vehicleImageUrls,
      fahrzeugausweisUrl: fahrzeugausweisUrlData.publicUrl,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    )
  }
}
