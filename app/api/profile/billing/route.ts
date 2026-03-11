import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("account_type, company_name, tax_id, billing_email, phone, billing_address")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profile || {})
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { account_type, company_name, tax_id, billing_email, phone, billing_address } = body

  // Validate account_type
  if (account_type && !["individual", "corporate"].includes(account_type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      account_type,
      company_name,
      tax_id,
      billing_email,
      phone,
      billing_address,
    })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
