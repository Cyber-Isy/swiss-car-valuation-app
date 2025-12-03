"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminNav } from "@/components/admin-nav"
import {
  Car,
  RefreshCw,
  Search,
  Eye,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  TrendingUp,
  AlertCircle,
  Filter,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Submission {
  id: string
  status: string
  createdAt: string
  brand: string
  model: string
  year: number
  mileage: number
  sellerName: string
  sellerEmail: string
  sellerPhone: string
  sellerLocation: string
  aiPurchasePrice: number | null
  aiMarketValue: number | null
  archived: boolean
  archivedAt: string | null
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
  NEW: "bg-blue-600 text-white",
  CONTACTED: "bg-yellow-600 text-white",
  OFFER_SENT: "bg-purple-600 text-white",
  ACCEPTED: "bg-green-600 text-white",
  COMPLETED: "bg-gray-600 text-white",
  REJECTED: "bg-red-600 text-white",
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    }
  }, [status, router])

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/submissions")
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (id: string, archived: boolean) => {
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      })

      if (response.ok) {
        fetchSubmissions()
      }
    } catch (error) {
      console.error("Error archiving submission:", error)
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

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      searchTerm === "" ||
      submission.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.sellerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter

    const matchesArchived = showArchived ? submission.archived : !submission.archived

    return matchesSearch && matchesStatus && matchesArchived
  })

  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === "NEW").length,
    inProgress: submissions.filter((s) =>
      ["CONTACTED", "OFFER_SENT", "ACCEPTED"].includes(s.status)
    ).length,
    completed: submissions.filter((s) => s.status === "COMPLETED").length,
  }

  const totalValue = submissions
    .filter((s) => s.aiPurchasePrice)
    .reduce((sum, s) => sum + (s.aiPurchasePrice || 0), 0)

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Übersicht aller Fahrzeuganfragen und Bewertungen</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Car className="h-6 w-6 text-blue-700" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Gesamt Anfragen</p>
              <p className="text-xs text-gray-500">Alle eingegangenen Anfragen</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-700" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-600">{stats.new}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Neu & Unbearbeitet</p>
              <p className="text-xs text-gray-500">Warten auf Bearbeitung</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-purple-700" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-purple-600">{stats.inProgress}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">In Bearbeitung</p>
              <p className="text-xs text-gray-500">Aktive Verhandlungen</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-700" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{formatPrice(totalValue)}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Gesamtwert Portfolio</p>
              <p className="text-xs text-gray-500">Summe aller Bewertungen</p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Fahrzeuganfragen</CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {filteredSubmissions.length} von {submissions.length} Anfragen
                </CardDescription>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Suche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 md:w-64 border-gray-300"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] border-gray-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="NEW">Neu</SelectItem>
                    <SelectItem value="CONTACTED">Kontaktiert</SelectItem>
                    <SelectItem value="OFFER_SENT">Angebot gesendet</SelectItem>
                    <SelectItem value="ACCEPTED">Angenommen</SelectItem>
                    <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                    <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showArchived ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className={showArchived ? "bg-gray-700 hover:bg-gray-800" : "border-gray-300"}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? "Aktive" : "Archiv"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchSubmissions}
                  className="border-gray-300"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 mb-4">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "Keine Anfragen gefunden"
                    : "Noch keine Anfragen"}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
                    : "Sobald Kunden Fahrzeuge bewerten lassen, erscheinen sie hier."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Eingegangen</TableHead>
                      <TableHead className="font-semibold text-gray-700">Fahrzeug</TableHead>
                      <TableHead className="font-semibold text-gray-700">Verkäufer</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Bewertung</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <TableCell>
                          <Badge className={`${statusColors[submission.status]}`}>
                            {statusLabels[submission.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(submission.createdAt).toLocaleDateString("de-CH")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(submission.createdAt).toLocaleTimeString("de-CH", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {submission.brand} {submission.model}
                            </p>
                            <p className="text-sm text-gray-600">
                              {submission.year} • {submission.mileage.toLocaleString("de-CH")} km
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{submission.sellerName}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <a
                                href={`mailto:${submission.sellerEmail}`}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                E-Mail
                              </a>
                              <span className="text-gray-300">|</span>
                              <a
                                href={`tel:${submission.sellerPhone}`}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Anrufen
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="text-base font-bold text-green-700">
                              {formatPrice(submission.aiPurchasePrice)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Markt: {formatPrice(submission.aiMarketValue)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleArchive(submission.id, !submission.archived)
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {submission.archived ? (
                                <>
                                  <ArchiveRestore className="h-4 w-4 mr-1" />
                                  Wiederherstellen
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4 mr-1" />
                                  Archivieren
                                </>
                              )}
                            </Button>
                            <Link href={`/admin/submissions/${submission.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
