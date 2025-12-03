"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Car, LogOut, LayoutDashboard, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AdminNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/settings",
      label: "Einstellungen",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ]

  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">SwissCarMarket</span>
              <Badge variant="secondary">Admin</Badge>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
