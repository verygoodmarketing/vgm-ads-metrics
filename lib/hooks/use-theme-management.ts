"use client"

import { useState } from "react"
import { createClientSupabaseClient, type Theme } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "@/components/theme-provider"

export function useThemeManagement() {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const supabase = createClientSupabaseClient()

  const updateUserTheme = async (userId: string, newTheme: Theme): Promise<boolean> => {
    setIsUpdating(true)

    try {
      // Update the theme in the database
      const { error } = await supabase
        .from("users")
        .update({
          theme_preference: newTheme,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      // Update the theme in the UI
      setTheme(newTheme)

      return true
    } catch (error: any) {
      console.error("Error updating theme:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update theme preference.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const getUserTheme = async (userId: string): Promise<Theme | null> => {
    try {
      const { data, error } = await supabase.from("users").select("theme_preference").eq("id", userId).single()

      if (error) throw error

      return (data.theme_preference as Theme) || "system"
    } catch (error: any) {
      console.error("Error fetching theme preference:", error)
      return null
    }
  }

  return {
    currentTheme: theme,
    isUpdating,
    updateUserTheme,
    getUserTheme,
  }
}

