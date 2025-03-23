import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Global variable to store the singleton instance
let supabaseInstance: SupabaseClient | null = null

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

// Get or create a Supabase client instance
export const getSupabaseClient = (): SupabaseClient => {
  if (typeof window === "undefined") {
    // Server-side - create a new instance each time
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  // Client-side - use singleton pattern
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    // Create a single instance with consistent options
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "vgm-supabase-auth",
      },
    })

    console.log("Created Supabase singleton instance")
  }

  return supabaseInstance
}

// For backward compatibility with existing code
export const createClientSupabaseClient = getSupabaseClient

// Helper function to check if Supabase is available
export const isSupabaseAvailable = async (): Promise<boolean> => {
  try {
    // First check if we have the required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase environment variables")
      return false
    }

    // In development, we can optionally bypass the actual check
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Assuming Supabase is available")
      return true
    }

    // Try to create a client
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch (error) {
      console.error("Failed to create Supabase client:", error)
      return false
    }

    if (!supabase) return false

    // Make a simple query to check connectivity
    try {
      const { data, error } = await supabase.from("users").select("id").limit(1)
      if (error) {
        console.error("Supabase query error:", error)
        return false
      }
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
