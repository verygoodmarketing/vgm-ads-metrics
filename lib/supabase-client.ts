import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Define a global type for the window object
declare global {
  interface Window {
    supabaseClient?: SupabaseClient
  }
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

// Create a singleton client for client-side usage
export const getSupabaseClient = (): SupabaseClient => {
  // Server-side - create a new instance each time
  if (typeof window === "undefined") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  // Client-side - use global window object to store the instance
  if (!window.supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    // Create a single instance with consistent options
    window.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "vgm-supabase-auth",
      },
    })

    console.log("Created Supabase client instance and stored in window object")
  }

  return window.supabaseClient
}

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

// Export types
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

