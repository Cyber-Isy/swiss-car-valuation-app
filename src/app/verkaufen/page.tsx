"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Car, Upload, User, Loader2, X, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Settings2, Camera, FileText, Check, CheckCircle2 } from "lucide-react"
import { CarTypeIcons, bodyTypeOptions } from "@/components/car-type-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  getModelsForBrand,
  getVariantsForModel,
  fuelTypes,
  conditions,
  transmissionTypes,
  driveTypes,
  serviceHistoryOptions,
  previousOwnersOptions,
  exteriorColors,
  equipmentOptions,
  generateMonthOptions,
  generateYearOptions,
} from "@/lib/validations"

const TOTAL_STEPS = 3

export default function VerkaufenPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vehicleImages, setVehicleImages] = useState<File[]>([])
  const [fahrzeugausweis, setFahrzeugausweis] = useState<File | null>(null)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [availableVariants, setAvailableVariants] = useState<string[]>([])
  const [showCustomBrand, setShowCustomBrand] = useState(false)
  const [showCustomModel, setShowCustomModel] = useState(false)
  const [showCustomVariant, setShowCustomVariant] = useState(false)
  const [powerUnit, setPowerUnit] = useState<"PS" | "KW">("PS")
  const [damageDescription, setDamageDescription] = useState("")

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

  // Validate current step before proceeding
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof SubmissionInput)[] = []

    if (step === 1) {
      fieldsToValidate = [
        "brand",
        "model",
        "firstRegistration",
        "mileage",
        "enginePower",
        "transmission",
        "fuelType",
        "condition",
        "bodyType",
      ]
    } else if (step === 2) {
      // Check image uploads
      if (vehicleImages.length === 0) {
        toast.error("Bitte laden Sie mindestens ein Fahrzeugbild hoch")
        return false
      }
      if (!fahrzeugausweis) {
        toast.error("Bitte laden Sie den Fahrzeugausweis hoch")
        return false
      }
      return true
    } else if (step === 3) {
      fieldsToValidate = [
        "kontrollschild",
        "sellerName",
        "sellerEmail",
        "sellerPhone",
        "sellerLocation",
      ]
    }

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const goToNextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const onSubmit = async (data: SubmissionInput) => {
    // Final validation for images
    if (vehicleImages.length === 0) {
      toast.error("Bitte laden Sie mindestens ein Fahrzeugbild hoch")
      setCurrentStep(2)
      return
    }
    if (!fahrzeugausweis) {
      toast.error("Bitte laden Sie den Fahrzeugausweis hoch")
      setCurrentStep(2)
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

  // Progress steps
  const steps = [
    { label: "Fahrzeug", icon: Car, step: 1 },
    { label: "Bilder", icon: Camera, step: 2 },
    { label: "Kontakt", icon: User, step: 3 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">SwissCarMarket</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Auto verkaufen</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Schritt {currentStep} von {TOTAL_STEPS}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-0 bg-white rounded-full px-4 py-3 shadow-sm border">
            {steps.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    // Only allow going back to previous steps or current step
                    if (step.step <= currentStep) {
                      setCurrentStep(step.step)
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
                    step.step < currentStep
                      ? "cursor-pointer"
                      : step.step === currentStep
                      ? "cursor-default"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      step.step < currentStep
                        ? "bg-green-500 text-white"
                        : step.step === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.step < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      step.step === currentStep
                        ? "text-blue-600"
                        : step.step < currentStep
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-1 ${
                      step.step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Step 1: Vehicle Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card className="shadow-sm border-0 bg-white overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Car className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Fahrzeugdaten</CardTitle>
                        <CardDescription className="text-gray-500">
                          Geben Sie die Informationen zu Ihrem Fahrzeug ein
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                    <div className="space-y-6">
                      {/* Brand & Model Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Marke *</FormLabel>
                              {showCustomBrand ? (
                                <div className="space-y-2">
                                  <FormControl>
                                    <Input
                                      placeholder="Marke eingeben"
                                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={() => {
                                      setShowCustomBrand(false)
                                      field.onChange("")
                                      form.setValue("model", "")
                                      setAvailableModels([])
                                    }}
                                  >
                                    Aus Liste wählen
                                  </button>
                                </div>
                              ) : (
                                <Select
                                  onValueChange={(value) => {
                                    if (value === "Andere") {
                                      setShowCustomBrand(true)
                                      setShowCustomModel(true)
                                      setShowCustomVariant(true)
                                      field.onChange("")
                                      form.setValue("model", "")
                                      form.setValue("variant", "")
                                      setAvailableModels([])
                                      setAvailableVariants([])
                                    } else {
                                      field.onChange(value)
                                      form.setValue("model", "")
                                      form.setValue("variant", "")
                                      setAvailableModels(getModelsForBrand(value))
                                      setAvailableVariants([])
                                      setShowCustomModel(false)
                                      setShowCustomVariant(false)
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                                      <SelectValue placeholder="Marke wählen" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[300px]">
                                    {carBrands.map((brand) => (
                                      <SelectItem key={brand} value={brand}>
                                        {brand}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Modell *</FormLabel>
                              {showCustomModel || showCustomBrand ? (
                                <div className="space-y-2">
                                  <FormControl>
                                    <Input
                                      placeholder="Modell eingeben"
                                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  {!showCustomBrand && availableModels.length > 0 && (
                                    <button
                                      type="button"
                                      className="text-sm text-blue-600 hover:underline"
                                      onClick={() => {
                                        setShowCustomModel(false)
                                        field.onChange("")
                                      }}
                                    >
                                      Aus Liste wählen
                                    </button>
                                  )}
                                </div>
                              ) : availableModels.length > 0 ? (
                                <Select
                                  onValueChange={(value) => {
                                    if (value === "Anderes Modell") {
                                      setShowCustomModel(true)
                                      setShowCustomVariant(true)
                                      field.onChange("")
                                      form.setValue("variant", "")
                                      setAvailableVariants([])
                                    } else {
                                      field.onChange(value)
                                      form.setValue("variant", "")
                                      const brand = form.getValues("brand")
                                      const variants = getVariantsForModel(brand, value)
                                      setAvailableVariants(variants)
                                      setShowCustomVariant(variants.length === 0)
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                                      <SelectValue placeholder="Modell wählen" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-[300px]">
                                    {availableModels.map((model) => (
                                      <SelectItem key={model} value={model}>
                                        {model}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <FormControl>
                                  <Input
                                    placeholder="Bitte zuerst Marke wählen"
                                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                    disabled
                                    {...field}
                                  />
                                </FormControl>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Variant/Motorization */}
                      <FormField
                        control={form.control}
                        name="variant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Variante / Motorisierung
                              <span className="text-gray-400 font-normal ml-1">(optional)</span>
                            </FormLabel>
                            {showCustomVariant || showCustomBrand || showCustomModel ? (
                              <div className="space-y-2">
                                <FormControl>
                                  <Input
                                    placeholder="z.B. A 180 AMG Line, 320d xDrive, GTI"
                                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                    {...field}
                                  />
                                </FormControl>
                                {availableVariants.length > 0 && (
                                  <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={() => {
                                      setShowCustomVariant(false)
                                      field.onChange("")
                                    }}
                                  >
                                    Aus Liste wählen
                                  </button>
                                )}
                              </div>
                            ) : availableVariants.length > 0 ? (
                              <Select
                                onValueChange={(value) => {
                                  if (value === "Andere Variante") {
                                    setShowCustomVariant(true)
                                    field.onChange("")
                                  } else {
                                    field.onChange(value)
                                  }
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                                    <SelectValue placeholder="Variante wählen" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[300px]">
                                  {availableVariants.map((variant) => (
                                    <SelectItem key={variant} value={variant}>
                                      {variant}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <FormControl>
                                <Input
                                  placeholder={form.getValues("model") ? "z.B. GTI, AMG Line, M Sport" : "Bitte zuerst Modell wählen"}
                                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                  disabled={!form.getValues("model")}
                                  {...field}
                                />
                              </FormControl>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Genaue Modellbezeichnung für präzisere Bewertung
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* First Registration (Month/Year) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="firstRegistration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Erstzulassung *</FormLabel>
                              <div className="flex gap-3">
                                <Select
                                  onValueChange={(month) => {
                                    const currentValue = field.value || ""
                                    const year = currentValue.split("/")[1] || ""
                                    field.onChange(`${month}/${year}`)
                                  }}
                                  value={field.value?.split("/")[0] || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-[140px] h-11 bg-gray-50 border-gray-200 focus:bg-white">
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
                                    <SelectTrigger className="flex-1 h-11 bg-gray-50 border-gray-200 focus:bg-white">
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
                              <FormLabel className="text-gray-700">Kilometerstand *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder="z.B. 85000"
                                    className="h-11 pr-12 bg-gray-50 border-gray-200 focus:bg-white"
                                    {...field}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">km</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Engine Power & Transmission */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="enginePower"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel className="text-gray-700">Leistung *</FormLabel>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (powerUnit === "KW" && field.value) {
                                        // Convert KW to PS: 1 KW = 1.35962 PS
                                        field.onChange(Math.round(field.value * 1.35962))
                                      }
                                      setPowerUnit("PS")
                                    }}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                                      powerUnit === "PS"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                                  >
                                    PS
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (powerUnit === "PS" && field.value) {
                                        // Convert PS to KW: 1 PS = 0.7355 KW
                                        field.onChange(Math.round(field.value * 0.7355))
                                      }
                                      setPowerUnit("KW")
                                    }}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                                      powerUnit === "KW"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                                  >
                                    KW
                                  </button>
                                </div>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder={powerUnit === "PS" ? "z.B. 150" : "z.B. 110"}
                                    className="h-11 pr-12 bg-gray-50 border-gray-200 focus:bg-white"
                                    {...field}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{powerUnit}</span>
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
                              <FormLabel className="text-gray-700">Getriebe *</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-2 gap-3">
                                  {transmissionTypes.map((type) => (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => field.onChange(type.value)}
                                      className={`
                                        h-11 rounded-lg border-2 font-medium transition-all
                                        ${field.value === type.value
                                          ? "border-blue-500 bg-blue-50 text-blue-600"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                        }
                                      `}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Fuel Type */}
                      <FormField
                        control={form.control}
                        name="fuelType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Treibstoff *</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {fuelTypes.map((fuel) => (
                                  <button
                                    key={fuel.value}
                                    type="button"
                                    onClick={() => field.onChange(fuel.value)}
                                    className={`
                                      py-3 px-2 rounded-lg border-2 font-medium text-sm transition-all
                                      ${field.value === fuel.value
                                        ? "border-blue-500 bg-blue-50 text-blue-600"
                                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                      }
                                    `}
                                  >
                                    {fuel.label}
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Condition */}
                      <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Zustand *</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {conditions.map((condition) => (
                                  <button
                                    key={condition.value}
                                    type="button"
                                    onClick={() => field.onChange(condition.value)}
                                    className={`
                                      py-3 px-2 rounded-lg border-2 transition-all text-center
                                      ${field.value === condition.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                                      }
                                    `}
                                  >
                                    <div className={`font-medium text-sm ${field.value === condition.value ? "text-blue-600" : "text-gray-700"}`}>
                                      {condition.label}
                                    </div>
                                    <div className={`text-xs mt-0.5 ${field.value === condition.value ? "text-blue-500" : "text-gray-400"}`}>
                                      {condition.description}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Body Type - Visual Selector */}
                      <FormField
                        control={form.control}
                        name="bodyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Karosserie *</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                                {bodyTypeOptions.map((type) => (
                                  <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => field.onChange(type.value)}
                                    className={`
                                      flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                                      ${field.value === type.value
                                        ? "border-blue-500 bg-blue-50 text-blue-600"
                                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                                      }
                                    `}
                                  >
                                    <div className="w-12 h-8 mb-1">
                                      {CarTypeIcons[type.value as keyof typeof CarTypeIcons]}
                                    </div>
                                    <span className="text-xs font-medium">{type.label}</span>
                                  </button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Optional Details - Collapsible Section */}
                <Card className="shadow-sm border-0 bg-white overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-b"
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Settings2 className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Weitere Details</CardTitle>
                          <CardDescription className="text-gray-500">
                            Optionale Angaben für eine genauere Bewertung
                          </CardDescription>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {showOptionalFields ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {showOptionalFields && (
                    <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                      <div className="space-y-6">
                        {/* Drive Type */}
                        <FormField
                          control={form.control}
                          name="driveType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Antrieb</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-3 gap-2">
                                  {driveTypes.map((type) => (
                                    <button
                                      key={type.value}
                                      type="button"
                                      onClick={() => field.onChange(type.value)}
                                      className={`
                                        h-11 rounded-lg border-2 font-medium text-sm transition-all
                                        ${field.value === type.value
                                          ? "border-blue-500 bg-blue-50 text-blue-600"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                        }
                                      `}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* MFK Date */}
                        <FormField
                          control={form.control}
                          name="mfkDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">MFK gültig bis</FormLabel>
                              <div className="flex gap-3">
                                <Select
                                  onValueChange={(month) => {
                                    const currentValue = field.value || ""
                                    const year = currentValue.split("/")[1] || ""
                                    field.onChange(`${month}/${year}`)
                                  }}
                                  value={field.value?.split("/")[0] || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-[140px] h-11 bg-gray-50 border-gray-200 focus:bg-white">
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
                                    <SelectTrigger className="flex-1 h-11 bg-gray-50 border-gray-200 focus:bg-white">
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

                        {/* Previous Owners */}
                        <FormField
                          control={form.control}
                          name="previousOwners"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Vorbesitzer</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  {previousOwnersOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => field.onChange(option.value)}
                                      className={`
                                        w-12 h-11 rounded-lg border-2 font-medium transition-all
                                        ${field.value === option.value
                                          ? "border-blue-500 bg-blue-50 text-blue-600"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                        }
                                      `}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Service History */}
                        <FormField
                          control={form.control}
                          name="serviceHistory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Serviceheft</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-3 gap-2">
                                  {serviceHistoryOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => field.onChange(option.value)}
                                      className={`
                                        py-3 px-2 rounded-lg border-2 font-medium text-sm transition-all text-center
                                        ${field.value === option.value
                                          ? "border-blue-500 bg-blue-50 text-blue-600"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                        }
                                      `}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Exterior Color */}
                        <FormField
                          control={form.control}
                          name="exteriorColor"
                          render={({ field }) => {
                            const colorMap: Record<string, string> = {
                              SCHWARZ: "bg-gray-900",
                              WEISS: "bg-white border-gray-300",
                              SILBER: "bg-gradient-to-br from-gray-300 to-gray-400",
                              GRAU: "bg-gray-500",
                              BLAU: "bg-blue-600",
                              ROT: "bg-red-600",
                              GRUEN: "bg-green-600",
                              BRAUN: "bg-amber-800",
                              BEIGE: "bg-amber-200",
                              ANDERE: "bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500",
                            }
                            return (
                              <FormItem>
                                <FormLabel className="text-gray-700">Farbe</FormLabel>
                                <FormControl>
                                  <div className="flex flex-wrap gap-3">
                                    {exteriorColors.map((color) => (
                                      <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => field.onChange(color.value)}
                                        className={`
                                          flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                                          ${field.value === color.value
                                            ? "bg-blue-50 ring-2 ring-blue-500"
                                            : "hover:bg-gray-50"
                                          }
                                        `}
                                      >
                                        <div
                                          className={`w-8 h-8 rounded-full border-2 ${colorMap[color.value]} ${
                                            field.value === color.value ? "border-blue-500" : "border-gray-200"
                                          }`}
                                        />
                                        <span className={`text-xs font-medium ${
                                          field.value === color.value ? "text-blue-600" : "text-gray-600"
                                        }`}>
                                          {color.label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />

                        {/* Accident Free - Ja/Nein Toggle */}
                        <FormField
                          control={form.control}
                          name="accidentFree"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Unfallfrei</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(true)}
                                      className={`
                                        flex-1 h-11 rounded-lg border-2 font-medium transition-all
                                        ${field.value === true
                                          ? "border-green-500 bg-green-50 text-green-600"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                        }
                                      `}
                                    >
                                      Ja
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(false)}
                                      className={`
                                        flex-1 h-11 rounded-lg border-2 font-medium transition-all
                                        ${field.value === false
                                          ? "border-red-500 bg-red-50 text-red-600"
                                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                        }
                                      `}
                                    >
                                      Nein
                                    </button>
                                  </div>
                                  {field.value === false && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                      <Label className="text-sm text-gray-700 mb-2 block">
                                        Beschreiben Sie die Schäden
                                      </Label>
                                      <Input
                                        placeholder="z.B. Heckschaden repariert, Kratzer an Stoßstange"
                                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                        onChange={(e) => setDamageDescription(e.target.value)}
                                        value={damageDescription}
                                      />
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Equipment Selection */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Ausstattung</Label>
                          <p className="text-sm text-gray-500">
                            Wählen Sie die vorhandene Ausstattung aus
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {equipmentOptions.map((option) => (
                              <Badge
                                key={option.value}
                                variant={selectedEquipment.includes(option.value) ? "default" : "outline"}
                                className={`cursor-pointer transition-all py-2 px-3 text-sm ${
                                  selectedEquipment.includes(option.value)
                                    ? "bg-blue-500 hover:bg-blue-600 border-blue-500"
                                    : "hover:bg-gray-100 border-gray-200 text-gray-600"
                                }`}
                                onClick={() => toggleEquipment(option.value)}
                              >
                                {selectedEquipment.includes(option.value) && (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                {option.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )}

            {/* Step 2: Image Uploads */}
            {currentStep === 2 && (
              <Card className="shadow-sm border-0 bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Bilder hochladen</CardTitle>
                      <CardDescription className="text-gray-500">
                        Laden Sie Fotos Ihres Fahrzeugs und den Fahrzeugausweis hoch
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                  <div className="space-y-8">
                    {/* Vehicle Images */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium text-gray-700">Fahrzeugbilder *</Label>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Aussen- und Innenaufnahmen (max. 10 Bilder)
                          </p>
                        </div>
                        {vehicleImages.length > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {vehicleImages.length} / 10
                          </Badge>
                        )}
                      </div>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleVehicleImageUpload}
                          className="hidden"
                          id="vehicleImages"
                        />
                        <label htmlFor="vehicleImages" className="cursor-pointer">
                          <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-4 transition-colors">
                            <Upload className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <p className="text-gray-700 font-medium mb-1">
                            Klicken oder Bilder hierher ziehen
                          </p>
                          <p className="text-sm text-gray-500">
                            JPG, PNG (max. 10 MB pro Bild)
                          </p>
                        </label>
                      </div>
                      {vehicleImages.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                          {vehicleImages.map((file, index) => (
                            <div key={index} className="relative group aspect-square">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Fahrzeugbild ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeVehicleImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Fahrzeugausweis */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-base font-medium text-gray-700">Fahrzeugausweis *</Label>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Foto des Fahrzeugausweises (Vorder- und Rückseite)
                        </p>
                      </div>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFahrzeugausweisUpload}
                          className="hidden"
                          id="fahrzeugausweis"
                        />
                        <label htmlFor="fahrzeugausweis" className="cursor-pointer">
                          {fahrzeugausweis ? (
                            <div className="space-y-3">
                              <img
                                src={URL.createObjectURL(fahrzeugausweis)}
                                alt="Fahrzeugausweis"
                                className="max-h-40 mx-auto rounded-lg border border-gray-200"
                              />
                              <div className="flex items-center justify-center gap-2 text-green-600">
                                <Check className="h-4 w-4" />
                                <span className="text-sm font-medium">{fahrzeugausweis.name}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mx-auto mb-4 transition-colors">
                                <FileText className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                              <p className="text-gray-700 font-medium mb-1">
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
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <Card className="shadow-sm border-0 bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Kontaktdaten</CardTitle>
                      <CardDescription className="text-gray-500">
                        Ihre Kontaktdaten für die Angebotserstellung
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="kontrollschild"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Kontrollschild *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="z.B. ZH 123456"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                              {...field}
                            />
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
                          <FormLabel className="text-gray-700">Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Vor- und Nachname"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="sellerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">E-Mail *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="ihre@email.ch"
                                className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                {...field}
                              />
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
                            <FormLabel className="text-gray-700">Telefon *</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+41 79 123 45 67"
                                className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                {...field}
                              />
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
                          <FormLabel className="text-gray-700">PLZ / Ort *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="z.B. 8000 Zürich"
                              className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border-0 p-6 sm:p-8 mt-6">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1 h-14 text-lg font-semibold rounded-xl"
                    onClick={goToPreviousStep}
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Zurück
                  </Button>
                )}

                {currentStep < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1 h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                    onClick={goToNextStep}
                  >
                    Weiter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Wird bewertet...
                      </>
                    ) : (
                      "Jetzt kostenlose Bewertung erhalten"
                    )}
                  </Button>
                )}
              </div>

              {currentStep === TOTAL_STEPS && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Mit dem Absenden akzeptieren Sie unsere{" "}
                  <Link href="/agb" className="text-blue-600 hover:underline font-medium">
                    AGB
                  </Link>{" "}
                  und{" "}
                  <Link href="/datenschutz" className="text-blue-600 hover:underline font-medium">
                    Datenschutzerklärung
                  </Link>
                </p>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
