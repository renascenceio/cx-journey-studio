import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Get journey count
    const { count: journeyCount } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
    
    // Get organization count
    const { count: organizationCount } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
    
    // For now, use a static rating (could be computed from feedback later)
    const avgRating = "4.9"
    
    return NextResponse.json({
      journeyCount: journeyCount || 0,
      organizationCount: organizationCount || 0,
      avgRating,
    })
  } catch (error) {
    console.error("Error fetching public stats:", error)
    // Return fallback values on error
    return NextResponse.json({
      journeyCount: "10,000+",
      organizationCount: "500+",
      avgRating: "4.9",
    })
  }
}
