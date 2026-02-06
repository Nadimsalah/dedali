import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from("resellers")
    .select(`
      id,
      user_id,
      company_name,
      phone,
      city,
      user:profiles (name, email, phone)
    `)

  if (error) {
    console.error("Error fetching resellers for admin:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resellers: data || [] })
}

