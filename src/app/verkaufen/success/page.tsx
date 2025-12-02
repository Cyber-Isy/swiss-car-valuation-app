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
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold">SwissCarMarket</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Vielen Dank!</h1>
          <p className="text-gray-600">
            Ihre Anfrage wurde erfolgreich übermittelt.
          </p>
        </div>

        {submission && (
          <>
            {/* Vehicle Summary */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ihr Fahrzeug</CardTitle>
                <CardDescription className="text-base font-medium text-gray-900">
                  {submission.brand} {submission.model} {submission.variant && `(${submission.variant})`} ({submission.year})
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>{submission.mileage.toLocaleString("de-CH")} km</span>
                  {submission.enginePower && <span>{submission.enginePower} PS</span>}
                  {submission.transmission && (
                    <span>{submission.transmission === "AUTOMATIC" ? "Automatik" : "Manuell"}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Process Steps */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Bewertungsprozess</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                        ${step.status === "completed" ? "bg-green-500 text-white" : ""}
                        ${step.status === "active" ? "bg-red-500 text-white animate-pulse" : ""}
                        ${step.status === "pending" ? "bg-gray-200 text-gray-400" : ""}
                      `}>
                        {step.status === "completed" ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : step.status === "active" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className={`font-medium ${step.status === "pending" ? "text-gray-400" : "text-gray-900"}`}>
                          {step.title}
                        </h4>
                        <p className={`text-sm ${step.status === "pending" ? "text-gray-300" : "text-gray-500"}`}>
                          {step.description}
                        </p>
                      </div>
                      {step.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Valuation Result - Show price when available */}
            {valuationComplete && submission.aiPurchasePrice && (
              <Card className="mb-6 border-2 border-red-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 text-center">
                  <CardTitle className="text-red-700">Unser Angebot für Ihr Fahrzeug</CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-600 mb-4">
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
              <Card className="mb-6 border-2 border-amber-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 text-center">
                  <CardTitle className="text-amber-700">Keine vergleichbaren Inserate gefunden</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="text-center">
                    <p className="text-gray-700 mb-4">
                      Derzeit sind keine vergleichbaren Fahrzeuge auf dem Schweizer Markt inseriert.
                    </p>
                    <p className="text-gray-600 text-sm">
                      Unser Team wird Sie zeitnah mit einem persönlichen Angebot kontaktieren.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Waiting message when not complete */}
            {!valuationComplete && (
              <Card className="mb-6 border-2 border-gray-200">
                <CardContent className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Bewertung wird erstellt...</h3>
                  <p className="text-gray-500 text-sm">
                    Wir durchsuchen aktuelle Inserate in der Schweiz.
                    <br />Dies dauert normalerweise 10-30 Sekunden.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Next Steps - Only show after valuation */}
            {valuationComplete && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Was passiert als nächstes?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Wir prüfen Ihre Angaben</h4>
                      <p className="text-sm text-gray-600">
                        Unser Team überprüft die Fahrzeugdaten und Bilder.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Sie erhalten unser finales Angebot</h4>
                      <p className="text-sm text-gray-600">
                        Innerhalb von 30 Minuten kontaktieren wir Sie.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Abholung & Zahlung</h4>
                      <p className="text-sm text-gray-600">
                        Bei Annahme holen wir Ihr Auto ab und zahlen sofort.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fragen?</CardTitle>
            <CardDescription>
              Unser Team ist für Sie da
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="tel:+41445065010"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium">+41 44 506 50 10</div>
                <div className="text-sm text-gray-500">Mo-Fr 8:00-18:00</div>
              </div>
            </a>
            <a
              href="mailto:info@swisscarmarket.ch"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium">info@swisscarmarket.ch</div>
                <div className="text-sm text-gray-500">Antwort innerhalb 24h</div>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Zurück zur Startseite</Button>
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
        <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
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
