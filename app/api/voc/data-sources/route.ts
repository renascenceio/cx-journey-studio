import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { VoCDataSource, VoCDataSourceConfig, VoCFieldMapping } from "@/lib/types"

// GET /api/voc/data-sources - List data sources for a journey or workspace
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const journeyId = searchParams.get("journeyId")
  const organizationId = searchParams.get("organizationId")

  try {
    let query = supabase
      .from("voc_data_sources")
      .select("*")
      .order("created_at", { ascending: false })

    if (journeyId) {
      query = query.eq("journey_id", journeyId)
    } else if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching VoC data sources:", error)
      return NextResponse.json({ error: "Failed to fetch data sources" }, { status: 500 })
    }

    // Transform snake_case to camelCase
    const dataSources: VoCDataSource[] = (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      journeyId: row.journey_id,
      name: row.name,
      type: row.type,
      config: row.config as VoCDataSourceConfig,
      fieldMappings: row.field_mappings as VoCFieldMapping[],
      syncFrequency: row.sync_frequency,
      lastSyncAt: row.last_sync_at,
      lastSyncStatus: row.last_sync_status,
      lastSyncError: row.last_sync_error,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
    }))

    return NextResponse.json({ dataSources })
  } catch (err) {
    console.error("VoC data sources error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/voc/data-sources - Create a new data source
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, type, config, journeyId, organizationId, syncFrequency, fieldMappings } = body

    if (!name || !type || !organizationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("voc_data_sources")
      .insert({
        name,
        type,
        config: config || {},
        journey_id: journeyId || null,
        organization_id: organizationId,
        sync_frequency: syncFrequency || "daily",
        field_mappings: fieldMappings || [],
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating VoC data source:", error)
      return NextResponse.json({ error: "Failed to create data source" }, { status: 500 })
    }

    return NextResponse.json({ dataSource: data })
  } catch (err) {
    console.error("VoC create data source error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
