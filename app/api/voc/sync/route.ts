import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/voc/sync - Trigger a manual sync for a data source
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { dataSourceId } = await req.json()

    if (!dataSourceId) {
      return NextResponse.json({ error: "dataSourceId is required" }, { status: 400 })
    }

    // Check if VoC tables exist
    const { data: dataSource, error: sourceError } = await supabase
      .from("voc_data_sources")
      .select("*")
      .eq("id", dataSourceId)
      .single()

    if (sourceError?.code === "42P01") {
      // Tables don't exist yet - return success for demo
      return NextResponse.json({ 
        success: true, 
        message: "Demo mode - sync simulated",
        isDemo: true 
      })
    }

    if (sourceError || !dataSource) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 })
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from("voc_sync_logs")
      .insert({
        data_source_id: dataSourceId,
        status: "running",
      })
      .select()
      .single()

    if (logError) {
      console.error("Error creating sync log:", logError)
    }

    // Perform sync based on data source type
    // This is a placeholder - actual sync logic would be implemented per connector
    try {
      const result = await performSync(dataSource)
      
      // Update sync log
      if (syncLog) {
        await supabase
          .from("voc_sync_logs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            records_processed: result.recordsProcessed,
            records_created: result.recordsCreated,
            records_updated: result.recordsUpdated,
          })
          .eq("id", syncLog.id)
      }

      // Update data source last sync info
      await supabase
        .from("voc_data_sources")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "success",
          last_sync_error: null,
        })
        .eq("id", dataSourceId)

      return NextResponse.json({ 
        success: true, 
        syncLogId: syncLog?.id,
        ...result 
      })
    } catch (syncError: any) {
      // Update sync log with error
      if (syncLog) {
        await supabase
          .from("voc_sync_logs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: syncError.message,
          })
          .eq("id", syncLog.id)
      }

      // Update data source with error
      await supabase
        .from("voc_data_sources")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "failed",
          last_sync_error: syncError.message,
        })
        .eq("id", dataSourceId)

      throw syncError
    }
  } catch (err: any) {
    console.error("VoC sync error:", err)
    return NextResponse.json({ 
      error: err.message || "Sync failed" 
    }, { status: 500 })
  }
}

// Placeholder sync function - actual implementation depends on connector type
async function performSync(dataSource: any): Promise<{
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
}> {
  // This would be replaced with actual connector logic
  // For now, return mock results
  switch (dataSource.type) {
    case "google_sheets":
      // Would call Google Sheets API here
      return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 }
    case "qualtrics":
      // Would call Qualtrics API here
      return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 }
    case "medallia":
      // Would call Medallia API here
      return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 }
    case "questionpro":
      // Would call QuestionPro API here
      return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 }
    case "surveymonkey":
      // Would call SurveyMonkey API here
      return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 }
    case "custom_api":
      // Would call custom API here
      return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 }
    default:
      throw new Error(`Unknown data source type: ${dataSource.type}`)
  }
}
