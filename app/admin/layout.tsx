"use client"

import type React from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, hasPermission } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Only redirect after auth state is confirmed
    if (!loading) {
      const authorized = user && hasPermission("admin")
      setIsAuthorized(authorized)

      if (!authorized) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router, hasPermission])

  // Show loading state while checking authorization
  if (loading || isAuthorized === null) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null
  }

  // Only render the layout when authorized
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Button variant="outline" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Administration Panel</p>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </SidebarInset>
  )
}

