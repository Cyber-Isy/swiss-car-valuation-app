"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Car, Upload, User, Loader2, X, ArrowLeft, ChevronDown, ChevronUp, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import {
  submissionSchema,
  type SubmissionInput,
  carBrands,
  fuelTypes,
  conditions,
  transmissionTypes,
  bodyTypes,
  driveTypes,
  serviceHistoryOptions,
  previousOwnersOptions,
  exteriorColors,
  equipmentOptions,
  generateMonthOptions,
  generateYearOptions,
} from "@/lib/validations"

export default function VerkaufenPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vehicleImages, setVehicleImages] = useState<File[]>([])
  const [fahrzeugausweis, setFahrzeugausweis] = useState<File | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])

  const monthOptions = generateMonthOptions()
  const yearOptions = generateYearOptions()

  const form = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema) as any,
    defaultValues: {
      kontrollschild: "",
      brand: "",
      model: "",
      variant: "",
      mileage: 0,
      fuelType: undefined,
      condition: undefined,
      firstRegistration: "",
      transmission: undefined,
      enginePower: 0,
      bodyType: undefined,
      driveType: "FWD",
      mfkDate: "",
      previousOwners: undefined,
      accidentFree: false,
      serviceHistory: undefined,
      exteriorColor: "",
      equipment: [],
      year: new Date().getFullYear(),
      sellerName: "",
      sellerEmail: "",
      sellerPhone: "",
      sellerLocation: "",
    },
  })

  const handleVehicleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files)
      if (vehicleImages.length + newImages.length > 10) {
        toast.error("Maximal 10 Fahrzeugbilder erlaubt")
        return
      }
      setVehicleImages((prev) => [...prev, ...newImages])
    }
  }

  const removeVehicleImage = (index: number) => {
    setVehicleImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFahrzeugausweisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFahrzeugausweis(file)
    }
  }

  const toggleEquipment = (value: string) => {
    setSelectedEquipment((prev) => {
      const newEquipment = prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
      form.setValue("equipment", newEquipment)
      return newEquipment
    })
  }

  const onSubmit = async (data: SubmissionInput) => {
    if (vehicleImages.length === 0) {
      toast.error("Bitte laden Sie mindestens ein Fahrzeugbild hoch")
      return
    }
    if (!fahrzeugausweis) {
      toast.error("Bitte laden Sie den Fahrzeugausweis hoch")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images first
      const formData = new FormData()
      vehicleImages.forEach((file) => {
        formData.append("vehicleImages", file)
      })
      formData.append("fahrzeugausweis", fahrzeugausweis)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Fehler beim Hochladen der Bilder")
      }

      const uploadData = await uploadResponse.json()

      // Submit the form with image URLs
      const submissionResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          equipment: selectedEquipment,
          vehicleImageUrls: uploadData.vehicleImageUrls,
          fahrzeugausweisUrl: uploadData.fahrzeugausweisUrl,
        }),
      })

      if (!submissionResponse.ok) {
        throw new Error("Fehler beim Absenden")
      }

      const result = await submissionResponse.json()

      // Redirect to success page with submission ID
      router.push(`/verkaufen/success?id=${result.id}`)
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold">SwissCarMarket</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Auto verkaufen</h1>
          <p className="text-gray-600">
            Füllen Sie das Formular aus und erhalten Sie sofort eine Bewertung
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Information - Required Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Fahrzeugdaten
                </CardTitle>
                <CardDescription>
                  Geben Sie die Informationen zu Ihrem Fahrzeug ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Brand & Model Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marke *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Marke wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modell *</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. A4, Golf, 3er" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variante</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. GTI, AMG, M-Sport" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* First Registration (Month/Year) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Erstzulassung *</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={(month) => {
                              const currentValue = field.value || ""
                              const year = currentValue.split("/")[1] || ""
                              field.onChange(`${month}/${year}`)
                            }}
                            value={field.value?.split("/")[0] || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Monat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {monthOptions.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            onValueChange={(year) => {
                              const currentValue = field.value || ""
                              const month = currentValue.split("/")[0] || ""
                              field.onChange(`${month}/${year}`)
                              form.setValue("year", parseInt(year))
                            }}
                            value={field.value?.split("/")[1] || ""}
                          >
                            <FormControl>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Jahr" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {yearOptions.map((year) => (
                                <SelectItem key={year.value} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilometerstand *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" placeholder="z.B. 85000" {...field} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">km</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Engine Power & Transmission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="enginePower"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leistung *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="number" placeholder="z.B. 150" {...field} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PS</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Getriebe *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Getriebe wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transmissionTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fuel Type, Body Type, Condition */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treibstoff *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fuelTypes.map((fuel) => (
                              <SelectItem key={fuel.value} value={fuel.value}>
                                {fuel.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Karosserie *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bodyTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zustand *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditions.map((condition) => (
                              <SelectItem key={condition.value} value={condition.value}>
                                {condition.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optional Details - Collapsible Section */}
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">Weitere Details (optional)</CardTitle>
                      <CardDescription>
                        Zusätzliche Angaben für eine genauere Bewertung
                      </CardDescription>
                    </div>
                  </div>
                  {showOptionalFields ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </CardHeader>
              {showOptionalFields && (
                <CardContent className="space-y-4 pt-0">
                  {/* Drive Type & MFK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="driveType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Antrieb</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Antrieb wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {driveTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mfkDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MFK gültig bis</FormLabel>
                          <div className="flex gap-2">
                            <Select
                              onValueChange={(month) => {
                                const currentValue = field.value || ""
                                const year = currentValue.split("/")[1] || ""
                                field.onChange(`${month}/${year}`)
                              }}
                              value={field.value?.split("/")[0] || ""}
                            >
                              <FormControl>
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder="Monat" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {monthOptions.map((month) => (
                                  <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              onValueChange={(year) => {
                                const currentValue = field.value || ""
                                const month = currentValue.split("/")[0] || ""
                                field.onChange(`${month}/${year}`)
                              }}
                              value={field.value?.split("/")[1] || ""}
                            >
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Jahr" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {yearOptions.map((year) => (
                                  <SelectItem key={year.value} value={year.value}>
                                    {year.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Previous Owners, Service History, Color */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="previousOwners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vorbesitzer</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(parseInt(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Anzahl" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {previousOwnersOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviceheft</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceHistoryOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exteriorColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farbe</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {exteriorColors.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  {color.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Accident Free Checkbox */}
                  <FormField
                    control={form.control}
                    name="accidentFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Unfallfrei
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            Das Fahrzeug hatte keine Unfallschäden
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Equipment Selection */}
                  <div>
                    <Label className="text-sm font-medium">Ausstattung</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Wählen Sie die vorhandene Ausstattung aus
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {equipmentOptions.map((option) => (
                        <Badge
                          key={option.value}
                          variant={selectedEquipment.includes(option.value) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedEquipment.includes(option.value)
                              ? "bg-red-600 hover:bg-red-700"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => toggleEquipment(option.value)}
                        >
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Image Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Bilder hochladen
                </CardTitle>
                <CardDescription>
                  Laden Sie Fotos Ihres Fahrzeugs und den Fahrzeugausweis hoch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Images */}
                <div>
                  <Label className="text-base font-medium">Fahrzeugbilder * (max. 10)</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Aussen- und Innenaufnahmen des Fahrzeugs
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleVehicleImageUpload}
                      className="hidden"
                      id="vehicleImages"
                    />
                    <label htmlFor="vehicleImages" className="cursor-pointer">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        Klicken oder Bilder hierher ziehen
                      </p>
                      <p className="text-sm text-gray-500">
                        JPG, PNG (max. 10 MB pro Bild)
                      </p>
                    </label>
                  </div>
                  {vehicleImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {vehicleImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Fahrzeugbild ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeVehicleImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fahrzeugausweis */}
                <div>
                  <Label className="text-base font-medium">Fahrzeugausweis *</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Foto des Fahrzeugausweises (Vorder- und Rückseite)
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFahrzeugausweisUpload}
                      className="hidden"
                      id="fahrzeugausweis"
                    />
                    <label htmlFor="fahrzeugausweis" className="cursor-pointer">
                      {fahrzeugausweis ? (
                        <div>
                          <img
                            src={URL.createObjectURL(fahrzeugausweis)}
                            alt="Fahrzeugausweis"
                            className="max-h-32 mx-auto mb-2 rounded"
                          />
                          <p className="text-sm text-green-600">{fahrzeugausweis.name}</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">
                            Fahrzeugausweis hochladen
                          </p>
                          <p className="text-sm text-gray-500">
                            JPG, PNG (max. 10 MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kontaktdaten
                </CardTitle>
                <CardDescription>
                  Ihre Kontaktdaten für die Angebotserstellung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="kontrollschild"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontrollschild *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. ZH 123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Vor- und Nachname" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sellerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ihre@email.ch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+41 79 123 45 67" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sellerLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ / Ort *</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 8000 Zürich" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird bewertet...
                  </>
                ) : (
                  "Jetzt Bewertung erhalten"
                )}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Mit dem Absenden akzeptieren Sie unsere{" "}
                <Link href="/agb" className="text-red-600 hover:underline">
                  AGB
                </Link>{" "}
                und{" "}
                <Link href="/datenschutz" className="text-red-600 hover:underline">
                  Datenschutzerklärung
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
