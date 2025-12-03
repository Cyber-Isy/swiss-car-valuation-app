"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save, TrendingUp, Info } from "lucide-react"
import { toast } from "sonner"

interface Settings {
  id: string
  profitMargin: number
  updatedAt: string
  updatedBy: string | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [profitMargin, setProfitMargin] = useState<number>(15.0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/settings")
      const data = await response.json()
      setSettings(data)
      setProfitMargin(data.profitMargin)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Fehler beim Laden der Einstellungen")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profitMargin }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      const data = await response.json()
      setSettings(data)
      toast.success("Einstellungen erfolgreich gespeichert")
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast.error(error.message || "Fehler beim Speichern der Einstellungen")
    } finally {
      setSaving(false)
    }
  }

  const calculateExample = () => {
    const marketValue = 20000
    const margin = profitMargin || 0
    const purchasePrice = marketValue * (1 - margin / 100)
    const profit = marketValue - purchasePrice
    return { marketValue, purchasePrice, profit }
  }

  const example = calculateExample()

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminNav />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
          <p className="text-gray-600 mt-1">
            Konfigurieren Sie die Gewinnmarge für Fahrzeugbewertungen
          </p>
        </div>

        {/* Profit Margin Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle>Gewinnmarge</CardTitle>
            </div>
            <CardDescription>
              Legen Sie die Gewinnmarge fest, die bei der Berechnung des Ankaufpreises verwendet wird
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profit Margin Input */}
            <div className="space-y-2">
              <Label htmlFor="profitMargin" className="text-base font-medium">
                Gewinnmarge (%)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="profitMargin"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                  className="max-w-xs text-lg font-semibold"
                />
                <span className="text-3xl font-bold text-blue-600">
                  {(profitMargin || 0).toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Die Gewinnmarge wird vom Marktwert abgezogen, um den Ankaufpreis zu berechnen
              </p>
            </div>

            {/* Visual Range Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={profitMargin}
                onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
                <span>30%</span>
                <span>40%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Beispielrechnung</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Marktwert (AI-Bewertung)</span>
                  <span className="text-lg font-semibold text-gray-900">
                    CHF {example.marketValue.toLocaleString("de-CH")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Gewinnmarge ({(profitMargin || 0).toFixed(1)}%)</span>
                  <span className="text-lg font-semibold text-orange-600">
                    - CHF {Math.round(example.profit).toLocaleString("de-CH")}
                  </span>
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">Ankaufpreis (Angebot)</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      CHF {Math.round(example.purchasePrice).toLocaleString("de-CH")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                {settings?.updatedBy && (
                  <p>
                    Zuletzt geändert von: <span className="font-medium">{settings.updatedBy}</span>
                  </p>
                )}
                {settings?.updatedAt && (
                  <p>
                    am {new Date(settings.updatedAt).toLocaleString("de-CH")}
                  </p>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Einstellungen speichern
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">Hinweise zur Gewinnmarge:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Die Gewinnmarge wird automatisch bei jeder neuen Bewertung angewendet</li>
                  <li>Bestehende Bewertungen werden nicht rückwirkend geändert</li>
                  <li>Empfohlener Bereich: 10-20% für wettbewerbsfähige Angebote</li>
                  <li>Die Änderung wird sofort für alle neuen Anfragen wirksam</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
