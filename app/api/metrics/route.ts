import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    let query = supabase.from("metrics").select("*")

    if (customerId) {
      query = query.eq("customer_id", customerId)
    }

    const { data, error } = await query
      .order("year", { ascending: true })
      .order("month", { ascending: true })
      .order("week", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    // Calculate derived metrics if not provided
    if (!body.ctr && body.impressions > 0) {
      body.ctr = (body.clicks / body.impressions) * 100
    }

    if (!body.cpc && body.clicks > 0) {
      body.cpc = body.cost / body.clicks
    }

    if (!body.cpa && body.conversions > 0) {
      body.cpa = body.cost / body.conversions
    }

    const { data, error } = await supabase.from("metrics").insert([body]).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to create metric" }, { status: 500 })
  }
}

