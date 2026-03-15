import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/voc/data-sources/[id] - Get a specific data source
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const { data, error } = await supabase
      .from("voc_data_sources")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching VoC data source:", error)
      return NextResponse.json({ error: "Data source not found" }, { status: 404 })
    }

    return NextResponse.json({ dataSource: data })
  } catch (err) {
    console.error("VoC data source error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/voc/data-sources/[id] - Update a data source
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.config !== undefined) updates.config = body.config
    if (body.syncFrequency !== undefined) updates.sync_frequency = body.syncFrequency
    if (body.fieldMappings !== undefined) updates.field_mappings = body.fieldMappings
    if (body.isActive !== undefined) updates.is_active = body.isActive

    const { data, error } = await supabase
      .from("voc_data_sources")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating VoC data source:", error)
      return NextResponse.json({ error: "Failed to update data source" }, { status: 500 })
    }

    return NextResponse.json({ dataSource: data })
  } catch (err) {
    console.error("VoC update data source error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/voc/data-sources/[id] - Delete a data source
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const { error } = await supabase
      .from("voc_data_sources")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting VoC data source:", error)
      return NextResponse.json({ error: "Failed to delete data source" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("VoC delete data source error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
