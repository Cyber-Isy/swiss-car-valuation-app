"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Car,
  LogOut,
  RefreshCw,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: submissions.length,
    new: submissions.filter((s) => s.status === "NEW").length,
    inProgress: submissions.filter((s) =>
      ["CONTACTED", "OFFER_SENT", "ACCEPTED"].includes(s.status)
    ).length,
    completed: submissions.filter((s) => s.status === "COMPLETED").length,
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold">SwissCarMarket</span>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Car className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Neu</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Bearbeitung</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.inProgress}
                  </p>
                </div>
                <RefreshCw className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Abgeschlossen</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Anfragen</CardTitle>
                <CardDescription>
                  Alle eingegangenen Fahrzeuganfragen
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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
                <Button variant="outline" onClick={fetchSubmissions}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Fahrzeug</TableHead>
                  <TableHead>Verkäufer</TableHead>
                  <TableHead>Bewertung</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">Keine Anfragen gefunden</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Badge className={statusColors[submission.status]}>
                          {statusLabels[submission.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(submission.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {submission.brand} {submission.model}
                          </p>
                          <p className="text-sm text-gray-500">
                            {submission.year} • {submission.mileage.toLocaleString("de-CH")} km
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.sellerName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <a
                              href={`mailto:${submission.sellerEmail}`}
                              className="hover:text-red-600"
                            >
                              <Mail className="h-3 w-3" />
                            </a>
                            <a
                              href={`tel:${submission.sellerPhone}`}
                              className="hover:text-red-600"
                            >
                              <Phone className="h-3 w-3" />
                            </a>
                            <span>{submission.sellerLocation}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-red-600">
                            {formatPrice(submission.aiPurchasePrice)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Markt: {formatPrice(submission.aiMarketValue)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/submissions/${submission.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
