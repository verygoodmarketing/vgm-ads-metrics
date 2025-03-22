import { createClient } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabase-singleton"

// Types for our database tables
export type Customer = {
  id: string
  name: string
  contact_name: string
  email: string
  phone: string | null
  status: "active" | "inactive"
  date_added: string
  created_at: string
  updated_at: string
  user_id?: string | null
}

export type Metric = {
  id: string
  customer_id: string
  year: string
  month: string
  week: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  cpc: number
  cpa: number
  created_at: string
  updated_at: string
}

export type UserRole = "admin" | "user" | "client"

export type Theme = "dark" | "light" | "system"

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  theme_preference?: Theme
  created_at: string
  updated_at: string
}

// Create a single supabase client for server-side usage
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Create a client-side Supabase client using the singleton
export const createClientSupabaseClient = () => {
  // Use the singleton instance
  return getSupabaseClient()
}

// Helper function to check if Supabase is available
export const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    // First check if we can create a client
    let supabase
    try {
      supabase = createClientSupabaseClient()
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      return false
    }

    if (!supabase) return false

    // Make a simple query to check connectivity
    try {
      await supabase.from("users").select("id").limit(1)
      return true
    } catch (error) {
      console.error("Supabase query failed:", error)
      return false
    }
  } catch (error) {
    console.error("Supabase availability check failed:", error)
    return false
  }
}

