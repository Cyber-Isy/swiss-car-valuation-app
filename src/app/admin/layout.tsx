import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Don't redirect on login page
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/admin/login'

  if (!session && !isLoginPage) {
    // We'll handle auth check in individual pages for now
    // redirect("/admin/login")
  }

  return <>{children}</>
}
