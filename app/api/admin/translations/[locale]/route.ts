import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { locales, type Locale } from "@/lib/i18n/config"
import fs from "fs/promises"
import path from "path"

// GET - Download translations for a locale
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
  }

  try {
    const filePath = path.join(process.cwd(), "messages", `${locale}.json`)
    const content = await fs.readFile(filePath, "utf-8")
    const translations = JSON.parse(content)
    
    return NextResponse.json(translations)
  } catch (error) {
    console.error("Error reading translations:", error)
    return NextResponse.json({ error: "Failed to read translations" }, { status: 500 })
  }
}

// PUT - Update translations for a locale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
  }

  try {
    const translations = await request.json()
    
    // Validate it's a valid object
    if (typeof translations !== "object" || translations === null) {
      return NextResponse.json({ error: "Invalid translations format" }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), "messages", `${locale}.json`)
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2), "utf-8")
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error writing translations:", error)
    return NextResponse.json({ error: "Failed to write translations" }, { status: 500 })
  }
}
