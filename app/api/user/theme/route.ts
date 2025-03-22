import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function PUT(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { theme } = await request.json()

    // Get the current user's session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      // Return a 200 status even if not authenticated - the theme will still be saved in localStorage
      return NextResponse.json(
        { success: false, message: "Not authenticated, theme saved locally only" },
        { status: 200 },
      )
    }

    const userId = sessionData.session.user.id

    // Update the user's theme preference
    const { error } = await supabase
      .from("users")
      .update({
        theme_preference: theme,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating theme preference:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, theme })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: error.message || "Failed to update theme preference" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user's session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      // Return a 200 status even if not authenticated - we'll use localStorage
      return NextResponse.json({ theme: "system" }, { status: 200 })
    }

    const userId = sessionData.session.user.id

    // Get the user's theme preference
    const { data, error } = await supabase.from("users").select("theme_preference").eq("id", userId).single()

    if (error) {
      console.error("Error fetching theme preference:", error)
      return NextResponse.json({ theme: "system" }, { status: 200 })
    }

    const theme = data.theme_preference || "system"

    return NextResponse.json({ theme })
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ theme: "system" }, { status: 200 })
  }
}

