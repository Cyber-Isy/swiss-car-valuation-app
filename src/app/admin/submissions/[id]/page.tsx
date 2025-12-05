"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AdminNav } from "@/components/admin-nav"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  ExternalLink,
  Save,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface VehicleImage {
  id: string
  url: string
}

interface Listing {
  url: string
  title: string
  price?: number | null
  mileage?: number | null
  year?: number | null
  source?: string | null
}

interface Submission {
  id: string
  status: string
  createdAt: string
  brand: string
  model: string
  variant: string | null
  year: number
  mileage: number
  fuelType: string
  condition: string
  // Tier 1 - Critical
  firstRegistration: string | null
  transmission: string | null
  enginePower: number | null
  bodyType: string | null
  // Tier 2 - Swiss Market
  driveType: string
  mfkDate: string | null
  previousOwners: number | null
  accidentFree: boolean
  // Tier 3 - Value Modifiers
  serviceHistory: string | null
  exteriorColor: string | null
  equipment: string[]
  // Seller info
  sellerName: string
  sellerEmail: string
  sellerPhone: string
  sellerLocation: string
  fahrzeugausweisUrl: string
  aiMarketValue: number | null
  aiPriceMin: number | null
  aiPriceMax: number | null
  aiPurchasePrice: number | null
  aiListingsCount: number | null
  aiSources: string[]
  aiListings: Listing[] | null
  aiConfidence: string | null
  aiReasoning: string | null
  notes: string | null
  finalOfferPrice: number | null
  vehicleImages: VehicleImage[]
}

const statusLabels: Record<string, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  OFFER_SENT: "Angebot gesendet",
  ACCEPTED: "Angenommen",
  COMPLETED: "Abgeschlossen",
  REJECTED: "Abgelehnt",
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-yellow-500",
  OFFER_SENT: "bg-purple-500",
  ACCEPTED: "bg-green-500",
  COMPLETED: "bg-gray-500",
  REJECTED: "bg-red-500",
}

const fuelLabels: Record<string, string> = {
  BENZIN: "Benzin",
  DIESEL: "Diesel",
  ELEKTRO: "Elektro",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
}

const conditionLabels: Record<string, string> = {
  EXCELLENT: "Ausgezeichnet",
  GOOD: "Gut",
  FAIR: "Akzeptabel",
  POOR: "Schlecht",
}

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuell",
  AUTOMATIC: "Automatik",
}

const bodyTypeLabels: Record<string, string> = {
  LIMOUSINE: "Limousine",
  KOMBI: "Kombi",
  SUV: "SUV",
  COUPE: "Coupé",
  CABRIO: "Cabrio",
  VAN: "Van",
  KLEINWAGEN: "Kleinwagen",
}

const driveTypeLabels: Record<string, string> = {
  FWD: "Frontantrieb",
  RWD: "Hinterradantrieb",
  AWD: "Allrad (4x4)",
}

const serviceHistoryLabels: Record<string, string> = {
  FULL: "Vollständig (Markenservice)",
  PARTIAL: "Teilweise",
  NONE: "Keine",
}

const equipmentLabels: Record<string, string> = {
  NAVIGATION: "Navigation",
  LEATHER: "Lederausstattung",
  PANORAMA: "Panoramadach",
  HEATED_SEATS: "Sitzheizung",
  PARKING_SENSORS: "Einparkhilfe",
  BACKUP_CAMERA: "Rückfahrkamera",
  LED_LIGHTS: "LED-Scheinwerfer",
  SUNROOF: "Schiebedach",
  SPORT_PACKAGE: "Sportpaket",
  ADAPTIVE_CRUISE: "Tempomat adaptiv",
  KEYLESS: "Keyless Entry",
  HEATED_STEERING: "Lenkradheizung",
  VENTILATED_SEATS: "Sitzbelüftung",
  HEAD_UP_DISPLAY: "Head-Up Display",
  HARMAN_KARDON: "Premium Audio",
}

export default function SubmissionDetailPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editStatus, setEditStatus] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editOfferPrice, setEditOfferPrice] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login")
    }
  }, [authStatus, router])

  useEffect(() => {
    if (params.id) {
      fetchSubmission()
    }
  }, [params.id])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${params.id}`)
      const data = await response.json()
      setSubmission(data)
      setEditStatus(data.status)
      setEditNotes(data.notes || "")
      setEditOfferPrice(data.finalOfferPrice?.toString() || "")
    } catch (error) {
      console.error("Error fetching submission:", error)
      toast.error("Fehler beim Laden der Anfrage")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/submissions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          finalOfferPrice: editOfferPrice ? parseInt(editOfferPrice) : null,
        }),
      })

      if (response.ok) {
        toast.success("Änderungen gespeichert")
        fetchSubmission()
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "—"
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Anfrage nicht gefunden</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {submission.brand} {submission.model}
              </h1>
              <p className="text-sm text-gray-500">
                Anfrage vom {formatDate(submission.createdAt)}
              </p>
            </div>
          </div>
          <Badge className={statusColors[submission.status]}>
            {statusLabels[submission.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle>Fahrzeugdaten</CardTitle>
                <CardDescription>
                  Eingegangen am {formatDate(submission.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Marke / Modell</p>
                    <p className="font-medium">
                      {submission.brand} {submission.model}
                      {submission.variant && <span className="text-gray-600"> ({submission.variant})</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Erstzulassung</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {submission.firstRegistration
                        ? new Date(submission.firstRegistration).toLocaleDateString("de-CH", { month: "2-digit", year: "numeric" })
                        : submission.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kilometerstand</p>
                    <p className="font-medium flex items-center gap-1">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      {submission.mileage.toLocaleString("de-CH")} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Leistung</p>
                    <p className="font-medium">
                      {submission.enginePower ? `${submission.enginePower} PS` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Getriebe</p>
                    <p className="font-medium">
                      {submission.transmission ? transmissionLabels[submission.transmission] : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Treibstoff</p>
                    <p className="font-medium flex items-center gap-1">
                      <Fuel className="h-4 w-4 text-gray-400" />
                      {fuelLabels[submission.fuelType]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Karosserie</p>
                    <p className="font-medium">
                      {submission.bodyType ? bodyTypeLabels[submission.bodyType] : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Zustand</p>
                    <p className="font-medium">
                      {conditionLabels[submission.condition]}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Swiss Market Details */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Schweizer Markt Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Antrieb</p>
                      <p className="font-medium">{driveTypeLabels[submission.driveType] || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">MFK gültig bis</p>
                      <p className="font-medium">
                        {submission.mfkDate
                          ? new Date(submission.mfkDate).toLocaleDateString("de-CH", { month: "2-digit", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vorbesitzer</p>
                      <p className="font-medium">{submission.previousOwners || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unfallfrei</p>
                      <p className="font-medium">
                        {submission.accidentFree ? (
                          <Badge className="bg-green-500">Ja</Badge>
                        ) : (
                          <span className="text-gray-500">Nicht angegeben</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Value Modifiers */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Zusätzliche Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Serviceheft</p>
                      <p className="font-medium">
                        {submission.serviceHistory ? serviceHistoryLabels[submission.serviceHistory] : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Farbe</p>
                      <p className="font-medium">{submission.exteriorColor || "—"}</p>
                    </div>
                  </div>
                  {submission.equipment && submission.equipment.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Ausstattung</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.equipment.map((item) => (
                          <Badge key={item} variant="secondary">
                            {equipmentLabels[item] || item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Bilder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Fahrzeugbilder</p>
                    <div className="grid grid-cols-4 gap-2">
                      {submission.vehicleImages.map((image) => (
                        <img
                          key={image.id}
                          src={image.url}
                          alt="Fahrzeug"
                          className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(image.url)}
                        />
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Fahrzeugausweis</p>
                    <img
                      src={submission.fahrzeugausweisUrl}
                      alt="Fahrzeugausweis"
                      className="max-w-md rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(submission.fahrzeugausweisUrl)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Valuation */}
            <Card>
              <CardHeader>
                <CardTitle>KI-Bewertung</CardTitle>
                <CardDescription>
                  Automatische Marktanalyse durch Perplexity AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Marktpreis</p>
                      <p className="text-xl font-bold">
                        {formatPrice(submission.aiMarketValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preisspanne</p>
                      <p className="font-medium">
                        {formatPrice(submission.aiPriceMin)} -{" "}
                        {formatPrice(submission.aiPriceMax)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ankaufspreis (Empf.)</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatPrice(submission.aiPurchasePrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Genauigkeit</p>
                      <Badge
                        className={
                          submission.aiConfidence === "high"
                            ? "bg-green-500"
                            : submission.aiConfidence === "medium"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }
                      >
                        {submission.aiConfidence === "high"
                          ? "Hoch"
                          : submission.aiConfidence === "medium"
                          ? "Mittel"
                          : "Niedrig"}
                      </Badge>
                    </div>
                  </div>

                  {submission.aiReasoning && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Begründung</p>
                      <p className="text-sm">{submission.aiReasoning}</p>
                    </div>
                  )}

                  {submission.aiListings && submission.aiListings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-gray-500">
                          Vergleichbare Inserate ({submission.aiListings.length} gefunden)
                        </p>
                        {submission.aiListingsMetadata?.qualityScore != null && (
                          <Badge
                            variant="outline"
                            className={
                              submission.aiListingsMetadata.qualityScore >= 80
                                ? "bg-green-50 text-green-700 border-green-300"
                                : submission.aiListingsMetadata.qualityScore >= 60
                                ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                                : "bg-red-50 text-red-700 border-red-300"
                            }
                          >
                            Datenqualität: {submission.aiListingsMetadata.qualityScore}%
                          </Badge>
                        )}
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-2 font-medium">Fahrzeug</th>
                              <th className="text-right p-2 font-medium">Preis</th>
                              <th className="text-right p-2 font-medium">km</th>
                              <th className="text-center p-2 font-medium">Jahr</th>
                              <th className="text-center p-2 font-medium">Quelle</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {submission.aiListings.map((listing, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="p-2">
                                  <a
                                    href={listing.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    {listing.title}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </td>
                                <td className="p-2 text-right font-medium">
                                  {listing.price != null ? `CHF ${listing.price.toLocaleString("de-CH")}` : "—"}
                                </td>
                                <td className="p-2 text-right text-gray-600">
                                  {listing.mileage != null ? listing.mileage.toLocaleString("de-CH") : "—"}
                                </td>
                                <td className="p-2 text-center text-gray-600">
                                  {listing.year ?? "—"}
                                </td>
                                <td className="p-2 text-center">
                                  <Badge variant="outline" className="text-xs">
                                    {listing.source ?? "—"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {submission.aiSources && submission.aiSources.length > 0 && !submission.aiListings && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Quellen ({submission.aiListingsCount} Inserate analysiert)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {submission.aiSources.map((source, index) => {
                          const isUrl = source.startsWith("http")
                          const displayName = isUrl ? new URL(source).hostname : source
                          const href = isUrl ? source : `https://${source}`
                          return (
                            <a
                              key={index}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {displayName}
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle>Verkäufer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{submission.sellerName}</p>
                </div>
                <div className="space-y-2">
                  <a
                    href={`mailto:${submission.sellerEmail}`}
                    className="flex items-center gap-2 text-sm hover:text-blue-600"
                  >
                    <Mail className="h-4 w-4" />
                    {submission.sellerEmail}
                  </a>
                  <a
                    href={`tel:${submission.sellerPhone}`}
                    className="flex items-center gap-2 text-sm hover:text-blue-600"
                  >
                    <Phone className="h-4 w-4" />
                    {submission.sellerPhone}
                  </a>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {submission.sellerLocation}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={`tel:${submission.sellerPhone}`}>
                      <Phone className="h-4 w-4 mr-1" />
                      Anrufen
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={`mailto:${submission.sellerEmail}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      E-Mail
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Bearbeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">Neu</SelectItem>
                      <SelectItem value="CONTACTED">Kontaktiert</SelectItem>
                      <SelectItem value="OFFER_SENT">Angebot gesendet</SelectItem>
                      <SelectItem value="ACCEPTED">Angenommen</SelectItem>
                      <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                      <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Finales Angebot (CHF)</Label>
                  <Input
                    type="number"
                    value={editOfferPrice}
                    onChange={(e) => setEditOfferPrice(e.target.value)}
                    placeholder={submission.aiPurchasePrice?.toString() || "Preis eingeben"}
                  />
                </div>

                <div>
                  <Label>Interne Notizen</Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Notizen hinzufügen..."
                    rows={4}
                  />
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Änderungen speichern
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Vergrößert"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
