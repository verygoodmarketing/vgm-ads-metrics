"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user, loading, supabaseAvailable } = useAuth()
  const [redirectionAttempts, setRedirectionAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only attempt redirection if auth state is determined
    if (!loading) {
      try {
        if (!supabaseAvailable) {
          // Don't redirect if database is unavailable
          setError("Database cannot be reached. Please try again later.")
          return
        }
        
        if (user) {
          router.push("/dashboard")
        } else {
          router.push("/login")
        }
        // Track redirection attempts
        setRedirectionAttempts((prev) => prev + 1)
      } catch (err) {
        console.error("Redirection error:", err)
        setError("Failed to redirect. Please try navigating manually.")
      }
    }
  }, [user, loading, router, supabaseAvailable])

  // If we've tried redirecting multiple times and still on this page, show manual options
  const showManualOptions = redirectionAttempts > 2

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        {loading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg">Loading authentication state...</p>
          </>
        ) : !supabaseAvailable ? (
          <>
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-lg text-red-500 mb-4">Database cannot be reached. Please try again later.</p>
            <Button onClick={() => window.location.reload()} className="mb-4">
              Retry Connection
            </Button>
            <div>
              <Link href="/debug" className="text-sm text-blue-500 hover:underline">
                Run Connection Diagnostics
              </Link>
            </div>
          </>
        ) : error ? (
          <>
            <p className="text-lg text-red-500 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
              <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
            </div>
          </>
        ) : showManualOptions ? (
          <>
            <p className="text-lg mb-4">Automatic redirection failed. Please select where to go:</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
              <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  )
}
