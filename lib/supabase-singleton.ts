import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Global variable to store the singleton instance
let supabaseInstance: SupabaseClient | null = null

// Initialize the Supabase client only once
export function getSupabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    // Server-side - create a new instance each time
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  // Client-side - use singleton pattern
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

    // Log that we've created the instance (for debugging)
    console.log("Created Supabase singleton instance")
  }

  return supabaseInstance
}

