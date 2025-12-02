"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Car, CheckCircle, Phone, Mail, Loader2, Search, Calculator, FileCheck, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SubmissionData {
  id: string
  brand: string
  model: string
  variant: string | null
  year: number
  mileage: number
  enginePower: number | null
  transmission: string | null
  aiPurchasePrice: number | null
  aiListingsCount: number | null
  aiReasoning: string | null
  aiConfidence: string | null
}

type ProcessStep = {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  status: "pending" | "active" | "completed"
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const submissionId = searchParams.get("id")
  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [valuationComplete, setValuationComplete] = useState(false)

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return null

    try {
      const res = await fetch(`/api/submissions/${submissionId}`)
      const data = await res.json()
      return data
    } catch (err) {
      console.error(err)
      return null
    }
  }, [submissionId])

  // Initial fetch and polling for valuation
  useEffect(() => {
    if (!submissionId) return

    let pollInterval: NodeJS.Timeout | null = null
    let stepInterval: NodeJS.Timeout | null = null

    // Helper to check if valuation is complete (either has price OR has "none" confidence)
    const isValuationComplete = (data: SubmissionData) => {
      return data.aiPurchasePrice !== null || data.aiConfidence === 'none'
    }

    const init = async () => {
      // First fetch
      const data = await fetchSubmission()
      if (data) {
        setSubmission(data)
        setLoading(false)

        // Check if valuation already exists (either has price or marked as "none")
        if (isValuationComplete(data)) {
          setValuationComplete(true)
          setCurrentStep(4)
        } else {
          // Start step animation
          stepInterval = setInterval(() => {
            setCurrentStep((prev) => {
              if (prev < 3) return prev + 1
              return prev
            })
          }, 2000)

          // Poll for valuation results
          pollInterval = setInterval(async () => {
            const updated = await fetchSubmission()
            if (updated && isValuationComplete(updated)) {
              setSubmission(updated)
              setValuationComplete(true)
              setCurrentStep(4)
              if (pollInterval) clearInterval(pollInterval)
              if (stepInterval) clearInterval(stepInterval)
            }
          }, 2000)
        }
      } else {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (stepInterval) clearInterval(stepInterval)
    }
  }, [submissionId, fetchSubmission])

  const formatPrice = (price: number | null) => {
    if (!price) return "—"
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const steps: ProcessStep[] = [
    {
      id: 1,
      title: "Daten empfangen",
      description: "Ihre Fahrzeugdaten werden verarbeitet",
      icon: <FileCheck className="h-5 w-5" />,
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "active" : "pending"
    },
    {
      id: 2,
      title: "Marktsuche",
      description: "Durchsuchen von AutoScout24, Comparis, tutti.ch",
      icon: <Search className="h-5 w-5" />,
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "active" : "pending"
    },
    {
      id: 3,
      title: "Preisanalyse",
      description: "Vergleich mit aktuellen Inseraten",
      icon: <Calculator className="h-5 w-5" />,
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "active" : "pending"
    },
    {
      id: 4,
      title: "Bewertung abgeschlossen",
      description: "Ihr Ankaufspreis wurde berechnet",
      icon: <TrendingUp className="h-5 w-5" />,
      status: valuationComplete ? "completed" : "pending"
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-7 w-7 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">SwissCarMarket</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Vielen Dank!</h1>
          <p className="text-gray-500 text-sm">
            Ihre Anfrage wurde erfolgreich übermittelt.
          </p>
        </div>

        {submission && (
          <>
            {/* Vehicle Summary */}
            <Card className="mb-6 border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Car className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {submission.brand} {submission.model} {submission.variant && `${submission.variant}`}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                        {submission.year}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                        {submission.mileage.toLocaleString("de-CH")} km
                      </span>
                      {submission.enginePower && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                          {submission.enginePower} PS
                        </span>
                      )}
                      {submission.transmission && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                          {submission.transmission === "AUTOMATIC" ? "Automatik" : "Manuell"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Process Steps */}
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-700">Bewertungsprozess</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      step.status === "active" ? "bg-blue-50" :
                      step.status === "completed" ? "bg-green-50/50" : ""
                    }`}>
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                        ${step.status === "completed" ? "bg-green-500 text-white" : ""}
                        ${step.status === "active" ? "bg-blue-500 text-white" : ""}
                        ${step.status === "pending" ? "bg-gray-200 text-gray-400" : ""}
                      `}>
                        {step.status === "completed" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : step.status === "active" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="text-xs font-medium">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${step.status === "pending" ? "text-gray-400" : "text-gray-900"}`}>
                          {step.title}
                        </h4>
                        <p className={`text-xs ${step.status === "pending" ? "text-gray-300" : "text-gray-500"}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Valuation Result - Show price when available */}
            {valuationComplete && submission.aiPurchasePrice && (
              <Card className="mb-6 border-2 border-green-200 overflow-hidden shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/80 text-center py-4">
                  <CardTitle className="text-green-800 text-lg font-semibold">Unser Angebot für Ihr Fahrzeug</CardTitle>
                </CardHeader>
                <CardContent className="py-10 bg-white">
                  <div className="text-center">
                    <div className="text-5xl md:text-6xl font-bold text-green-600 mb-3 tracking-tight">
                      {formatPrice(submission.aiPurchasePrice)}
                    </div>
                    <p className="text-gray-500 text-sm">
                      Basierend auf {submission.aiListingsCount || 0} aktuellen Inseraten in der Schweiz
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No listings found - Show message to user */}
            {valuationComplete && !submission.aiPurchasePrice && submission.aiConfidence === 'none' && (
              <Card className="mb-6 border-0 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
                <CardContent className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Keine vergleichbaren Inserate gefunden</h3>
                  <p className="text-gray-600 text-sm max-w-sm mx-auto">
                    Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert. Unser Team wird Sie zeitnah kontaktieren.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Waiting message when not complete */}
            {!valuationComplete && (
              <Card className="mb-6 border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                <CardContent className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Bewertung wird erstellt...</h3>
                  <p className="text-gray-500 text-sm">
                    Wir durchsuchen aktuelle Inserate in der Schweiz.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Next Steps - Only show after valuation */}
            {valuationComplete && (
              <Card className="mb-6 border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-gray-700">Was passiert als nächstes?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-semibold text-xs">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">Wir prüfen Ihre Angaben</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Unser Team überprüft die Fahrzeugdaten und Bilder.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-semibold text-xs">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">Sie erhalten unser finales Angebot</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Innerhalb von 30 Minuten kontaktieren wir Sie.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-semibold text-xs">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">Abholung & Zahlung</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Bei Annahme holen wir Ihr Auto ab und zahlen sofort.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Contact */}
        <Card className="border-0 shadow-sm">
          <CardContent className="py-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fragen? Wir sind für Sie da.</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="tel:+41445065010"
                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">+41 44 506 50 10</span>
              </a>
              <a
                href="mailto:info@swisscarmarket.ch"
                className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">info@swisscarmarket.ch</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700 text-sm">
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Laden...</p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  )
}
