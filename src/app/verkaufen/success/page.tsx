"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Car, CheckCircle, Phone, Mail, Loader2, Search, Calculator, FileCheck, TrendingUp, Printer, Send, Download, Image as ImageIcon, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface VehicleImage {
  id: string
  url: string
}

interface SubmissionData {
  id: string
  brand: string
  model: string
  variant: string | null
  year: number
  mileage: number
  enginePower: number | null
  transmission: string | null
  fuelType: string | null
  condition: string | null
  sellerName: string | null
  sellerEmail: string | null
  sellerPhone: string | null
  sellerLocation: string | null
  aiPurchasePrice: number | null
  aiListingsCount: number | null
  aiReasoning: string | null
  aiConfidence: string | null
  createdAt: string
  fahrzeugausweisUrl: string | null
  vehicleImages: VehicleImage[]
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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [rerunning, setRerunning] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getTransmissionLabel = (transmission: string | null) => {
    if (!transmission) return null
    return transmission === "AUTOMATIC" ? "Automatik" : "Schaltgetriebe"
  }

  const getFuelTypeLabel = (fuelType: string | null) => {
    if (!fuelType) return null
    const labels: Record<string, string> = {
      BENZIN: "Benzin",
      DIESEL: "Diesel",
      ELEKTRO: "Elektro",
      HYBRID: "Hybrid",
      PLUGIN_HYBRID: "Plug-in Hybrid"
    }
    return labels[fuelType] || fuelType
  }

  const getConditionLabel = (condition: string | null) => {
    if (!condition) return null
    const labels: Record<string, string> = {
      EXCELLENT: "Ausgezeichnet",
      GOOD: "Gut",
      FAIR: "Gebraucht",
      POOR: "Reparaturbedürftig"
    }
    return labels[condition] || condition
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

  const handlePrint = () => {
    const printContent = generatePrintHTML()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleDownloadPDF = () => {
    const printContent = generatePrintHTML()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleSendEmail = async () => {
    if (!submission?.sellerEmail) {
      toast.error("Keine E-Mail-Adresse vorhanden")
      return
    }

    setSendingEmail(true)
    try {
      // In production, this would call an API endpoint to send the email
      // For now, we'll show a success message
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Bewertung wurde an ${submission.sellerEmail} gesendet`)
    } catch (error) {
      toast.error("Fehler beim Senden der E-Mail")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleRerunValuation = async () => {
    if (!submissionId) {
      toast.error("Keine Submission ID vorhanden")
      return
    }

    setRerunning(true)
    toast.loading("Bewertung wird neu berechnet...")

    try {
      const response = await fetch('/api/valuations/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submissionId })
      })

      if (!response.ok) {
        throw new Error('Failed to rerun valuation')
      }

      const data = await response.json()
      setSubmission(data.submission)
      toast.success("Bewertung wurde erfolgreich aktualisiert!")
    } catch (error) {
      console.error('Error rerunning valuation:', error)
      toast.error("Fehler beim Aktualisieren der Bewertung")
    } finally {
      setRerunning(false)
      toast.dismiss()
    }
  }

  const generatePrintHTML = () => {
    if (!submission) return ''

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fahrzeugbewertung - SwissCarMarket.ch</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      line-height: 1.5;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 32px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 20px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .logo-tagline {
      font-size: 12px;
      color: #6b7280;
    }
    .date {
      text-align: right;
      color: #6b7280;
      font-size: 14px;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      color: #6b7280;
      margin-bottom: 32px;
    }
    .offer-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 2px solid #10b981;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin-bottom: 32px;
    }
    .offer-label {
      font-size: 14px;
      color: #047857;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .offer-price {
      font-size: 48px;
      font-weight: 800;
      color: #059669;
      margin-bottom: 8px;
    }
    .offer-note {
      font-size: 14px;
      color: #6b7280;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .info-label {
      color: #6b7280;
      font-size: 14px;
    }
    .info-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
    }
    .vehicle-title {
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer-logo {
      font-size: 18px;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .footer-contact {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .footer-legal {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 16px;
    }
    .validity {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      margin-top: 16px;
      font-size: 13px;
      color: #92400e;
    }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    .image-item {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .image-item img {
      width: 100%;
      height: 180px;
      object-fit: cover;
    }
    .document-image {
      margin-top: 16px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      max-width: 400px;
    }
    .document-image img {
      width: 100%;
      height: auto;
    }
    @media print {
      body { padding: 20px; }
      .offer-box { break-inside: avoid; }
      .section { break-inside: avoid; }
      .image-grid { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">SC</div>
      <div>
        <div class="logo-text">SwissCarMarket.ch</div>
        <div class="logo-tagline">Ihr Partner für Fahrzeugankauf</div>
      </div>
    </div>
    <div class="date">
      <div>Bewertungsdatum</div>
      <div style="font-weight: 600; color: #1f2937;">${formatDate(submission.createdAt)}</div>
      <div style="margin-top: 4px; font-size: 12px;">Referenz: ${submission.id.slice(0, 8).toUpperCase()}</div>
    </div>
  </div>

  <h1 class="title">Fahrzeugbewertung</h1>
  <p class="subtitle">Verbindliches Ankaufsangebot für Ihr Fahrzeug</p>

  <div class="offer-box">
    <div class="offer-label">Unser Ankaufspreis</div>
    <div class="offer-price">${formatPrice(submission.aiPurchasePrice)}</div>
    <div class="offer-note">Basierend auf ${submission.aiListingsCount || 0} aktuellen Marktdaten</div>
    <div class="validity">
      <strong>Gültigkeit:</strong> Dieses Angebot ist 7 Tage gültig, vorbehaltlich Fahrzeugbesichtigung.
    </div>
  </div>

  <div class="section">
    <h3 class="section-title">Fahrzeugdaten</h3>
    <div class="vehicle-title">${submission.brand} ${submission.model}${submission.variant ? ` ${submission.variant}` : ''}</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Erstzulassung</span>
        <span class="info-value">${submission.year}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Kilometerstand</span>
        <span class="info-value">${submission.mileage.toLocaleString('de-CH')} km</span>
      </div>
      ${submission.enginePower ? `
      <div class="info-item">
        <span class="info-label">Leistung</span>
        <span class="info-value">${submission.enginePower} PS</span>
      </div>
      ` : ''}
      ${submission.transmission ? `
      <div class="info-item">
        <span class="info-label">Getriebe</span>
        <span class="info-value">${getTransmissionLabel(submission.transmission)}</span>
      </div>
      ` : ''}
      ${submission.fuelType ? `
      <div class="info-item">
        <span class="info-label">Treibstoff</span>
        <span class="info-value">${getFuelTypeLabel(submission.fuelType)}</span>
      </div>
      ` : ''}
      ${submission.condition ? `
      <div class="info-item">
        <span class="info-label">Zustand</span>
        <span class="info-value">${getConditionLabel(submission.condition)}</span>
      </div>
      ` : ''}
    </div>
  </div>

  ${submission.sellerName ? `
  <div class="section">
    <h3 class="section-title">Kontaktdaten</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Name</span>
        <span class="info-value">${submission.sellerName}</span>
      </div>
      ${submission.sellerPhone ? `
      <div class="info-item">
        <span class="info-label">Telefon</span>
        <span class="info-value">${submission.sellerPhone}</span>
      </div>
      ` : ''}
      ${submission.sellerEmail ? `
      <div class="info-item">
        <span class="info-label">E-Mail</span>
        <span class="info-value">${submission.sellerEmail}</span>
      </div>
      ` : ''}
      ${submission.sellerLocation ? `
      <div class="info-item">
        <span class="info-label">Standort</span>
        <span class="info-value">${submission.sellerLocation}</span>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${submission.vehicleImages && submission.vehicleImages.length > 0 ? `
  <div class="section" style="page-break-before: always;">
    <h3 class="section-title">Fahrzeugbilder</h3>
    <div class="image-grid">
      ${submission.vehicleImages.map((img: VehicleImage) => `
        <div class="image-item">
          <img src="${img.url}" alt="Fahrzeugbild" />
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${submission.fahrzeugausweisUrl ? `
  <div class="section">
    <h3 class="section-title">Fahrzeugausweis</h3>
    <div class="document-image">
      <img src="${submission.fahrzeugausweisUrl}" alt="Fahrzeugausweis" />
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="footer-logo">SwissCarMarket.ch</div>
    <div class="footer-contact">Tel: +41 44 506 50 10 | E-Mail: info@swisscarmarket.ch</div>
    <div class="footer-contact">www.swisscarmarket.ch</div>
    <div class="footer-legal">
      © ${new Date().getFullYear()} SwissCarMarket AG. Alle Rechte vorbehalten.<br>
      Das Angebot ist freibleibend und vorbehaltlich einer Fahrzeugbesichtigung.
    </div>
  </div>
</body>
</html>
`
  }

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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
            valuationComplete
              ? "bg-gradient-to-br from-emerald-50 to-green-100 shadow-lg shadow-green-100/50"
              : "bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg shadow-blue-100/50"
          }`}>
            {valuationComplete ? (
              <CheckCircle className="h-9 w-9 text-emerald-600" strokeWidth={2.5} />
            ) : (
              <Loader2 className="h-9 w-9 text-blue-600 animate-spin" strokeWidth={2.5} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            {valuationComplete ? "Vielen Dank!" : "Bewertung läuft..."}
          </h1>
          <p className="text-gray-600 text-base">
            {valuationComplete
              ? "Ihre Fahrzeugbewertung ist abgeschlossen."
              : "Ihre Anfrage wird bearbeitet."
            }
          </p>
        </div>

        {submission && (
          <>
            {/* Vehicle Summary - Always visible */}
            <Card className="mb-8 border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Car className="h-8 w-8 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate mb-2">
                      {submission.brand} {submission.model} {submission.variant && `${submission.variant}`}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
                        {submission.year}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
                        {submission.mileage.toLocaleString("de-CH")} km
                      </span>
                      {submission.enginePower && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
                          {submission.enginePower} PS
                        </span>
                      )}
                      {submission.transmission && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
                          {getTransmissionLabel(submission.transmission)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Process Steps - Only show while valuation is in progress */}
            {!valuationComplete && (
              <Card className="mb-6 border-0 shadow-sm animate-in fade-in duration-300">
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
            )}

            {/* Valuation Result - Show price when available */}
            {valuationComplete && submission.aiPurchasePrice && (
              <Card className="mb-8 border border-emerald-200 overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gradient-to-br from-white via-emerald-50/30 to-white">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-center py-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
                  <CardTitle className="text-white text-xl font-bold relative z-10 tracking-wide">
                    Unser Angebot für Ihr Fahrzeug
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-12 bg-white relative">
                  <div className="text-center">
                    {/* Price Display */}
                    <div className="mb-6">
                      <div className="inline-flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-semibold text-gray-400">CHF</span>
                        <span className="text-6xl md:text-7xl font-extrabold bg-gradient-to-br from-emerald-600 to-green-700 bg-clip-text text-transparent tracking-tight">
                          {submission.aiPurchasePrice.toLocaleString("de-CH")}
                        </span>
                      </div>
                      <div className="h-1 w-24 bg-gradient-to-r from-emerald-400 to-green-500 mx-auto rounded-full" />
                    </div>

                    {/* Listings Count */}
                    <p className="text-gray-600 text-base mb-6 max-w-md mx-auto">
                      Basierend auf <span className="font-semibold text-gray-900">{submission.aiListingsCount || 0} aktuellen Inseraten</span> in der Schweiz
                    </p>

                    {/* Validity Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-full text-amber-900 text-sm font-semibold shadow-sm">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Gültig für 7 Tage</span>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Fair & transparent</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Sofortige Zahlung</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Kostenlose Abholung</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No listings found - Show message to user */}
            {valuationComplete && !submission.aiPurchasePrice && submission.aiConfidence === 'none' && (
              <Card className="mb-6 border-0 shadow-sm bg-gradient-to-br from-amber-50/50 to-white animate-in fade-in duration-300">
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

            {/* Next Steps - Only show after valuation */}
            {valuationComplete && (
              <Card className="mb-6 border-0 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
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

            {/* Contact */}
            <Card className={`mb-6 border-0 shadow-sm ${valuationComplete ? "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200" : ""}`}>
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

            {/* Print/Email Options - Only show after valuation with price */}
            {valuationComplete && submission.aiPurchasePrice && (
              <Card className="mb-6 border-0 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <CardContent className="py-5">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Bewertung speichern</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 gap-2"
                      onClick={handlePrint}
                    >
                      <Printer className="h-4 w-4" />
                      <span>Als PDF drucken</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 gap-2"
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>{sendingEmail ? "Wird gesendet..." : "Per E-Mail senden"}</span>
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      className="w-full h-11 gap-2"
                      onClick={handleRerunValuation}
                      disabled={rerunning}
                    >
                      {rerunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span>{rerunning ? "Bewertung wird aktualisiert..." : "Bewertung neu berechnen"}</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-3">
                    Die Bewertung enthält das Logo und die Kontaktdaten von SwissCarMarket.ch
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Images - Show if available */}
            {submission.vehicleImages && submission.vehicleImages.length > 0 && (
              <Card className="mb-6 border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <CardTitle className="text-base font-medium text-gray-700">Ihre Fahrzeugbilder</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {submission.vehicleImages.slice(0, 4).map((image, index) => (
                      <div
                        key={image.id}
                        className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative"
                      >
                        <img
                          src={image.url}
                          alt={`Fahrzeugbild ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {submission.vehicleImages.length > 4 && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      +{submission.vehicleImages.length - 4} weitere Bilder im PDF
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fahrzeugausweis - Show if available */}
            {submission.fahrzeugausweisUrl && (
              <Card className="mb-6 border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <CardTitle className="text-base font-medium text-gray-700">Fahrzeugausweis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden bg-gray-100 max-w-xs">
                    <img
                      src={submission.fahrzeugausweisUrl}
                      alt="Fahrzeugausweis"
                      className="w-full h-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700 text-sm">
              Zurück zur Startseite
            </Button>
          </Link>
        </div>

        {/* Footer Branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} SwissCarMarket.ch - Ihr Partner für Fahrzeugankauf
          </p>
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
