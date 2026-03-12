import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { locales, type Locale } from "@/lib/i18n/config"
import { put, list } from "@vercel/blob"
import fs from "fs/promises"
import path from "path"

// Use Blob storage for production, filesystem for development
const USE_BLOB = process.env.BLOB_READ_WRITE_TOKEN ? true : false

// Helper to check if user has admin access (either global admin or workspace owner)
async function checkAdminAccess(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  try {
    // Check if user is a global admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (!profileError && profile?.role === "admin") {
      return true
    }

    // Check if user is owner of any workspace (journey_master role)
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "journey_master")
      .limit(1)
      .maybeSingle()

    if (!memberError && membership) {
      return true
    }

    // If both queries fail (tables don't exist), allow authenticated users for now
    if (profileError && memberError) {
      console.warn("Admin check tables not found, allowing authenticated user")
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking admin access:", error)
    // Allow access if there's an error (e.g., tables don't exist yet)
    return true
  }
}

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

  const hasAccess = await checkAdminAccess(supabase, user.id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
  }

  try {
    let translations: Record<string, unknown>

    if (USE_BLOB) {
      // Try to read from Blob first (for custom translations)
      try {
        const blobPrefix = `translations/${locale}.json`
        const { blobs } = await list({ prefix: blobPrefix, limit: 1 })
        if (blobs.length > 0) {
          const response = await fetch(blobs[0].url)
          translations = await response.json()
        } else {
          // Fall back to filesystem (default translations)
          const filePath = path.join(process.cwd(), "messages", `${locale}.json`)
          const content = await fs.readFile(filePath, "utf-8")
          translations = JSON.parse(content)
        }
      } catch {
        // Fall back to filesystem
        const filePath = path.join(process.cwd(), "messages", `${locale}.json`)
        const content = await fs.readFile(filePath, "utf-8")
        translations = JSON.parse(content)
      }
    } else {
      // Development: read from filesystem
      const filePath = path.join(process.cwd(), "messages", `${locale}.json`)
      const content = await fs.readFile(filePath, "utf-8")
      translations = JSON.parse(content)
    }
    
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

  const hasAccess = await checkAdminAccess(supabase, user.id)
  if (!hasAccess) {
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

    const content = JSON.stringify(translations, null, 2)
    console.log(`[v0] Saving translations for ${locale}, size: ${content.length} bytes, USE_BLOB: ${USE_BLOB}`)

    if (USE_BLOB) {
      // Production: write to Blob storage
      const result = await put(`translations/${locale}.json`, content, {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      })
      console.log(`[v0] Blob save successful, url: ${result.url}`)
    } else {
      // Development: write to filesystem
      const filePath = path.join(process.cwd(), "messages", `${locale}.json`)
      await fs.writeFile(filePath, content, "utf-8")
      console.log(`[v0] Filesystem save successful: ${filePath}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error writing translations:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to write translations"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
