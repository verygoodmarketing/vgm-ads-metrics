"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user, supabaseAvailable } = useAuth()

  return (
    <ThemeProvider userId={user?.id} isAuthenticated={!!user} isSupabaseAvailable={supabaseAvailable}>
      {children}
    </ThemeProvider>
  )
}

