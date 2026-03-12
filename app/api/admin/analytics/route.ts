import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// B9: Admin Analytics Dashboard API
// Returns comprehensive platform metrics

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify admin access
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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    // Parse date range from query
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"
    
    const now = new Date()
    let startDate: Date
    
    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
    
    const startISO = startDate.toISOString()
    
    // ========== USER ANALYTICS ==========
    
    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
    
    // New signups in period
    const { count: newSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)
    
    // Active users (users who have activity in period)
    const { count: activeUsers } = await supabase
      .from("activity_log")
      .select("actor_id", { count: "exact", head: true })
      .gte("created_at", startISO)
    
    // Users by plan
    const { data: planDistribution } = await supabase
      .from("profiles")
      .select("plan")
    
    const planCounts = (planDistribution || []).reduce((acc, p) => {
      const plan = p.plan || "free"
      acc[plan] = (acc[plan] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // ========== CONTENT METRICS ==========
    
    // Total journeys
    const { count: totalJourneys } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
    
    // Journeys by type
    const { data: journeyTypes } = await supabase
      .from("journeys")
      .select("type")
    
    const journeyTypeCounts = (journeyTypes || []).reduce((acc, j) => {
      acc[j.type] = (acc[j.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // New journeys in period
    const { count: newJourneys } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)
    
    // Total archetypes
    const { count: totalArchetypes } = await supabase
      .from("archetypes")
      .select("*", { count: "exact", head: true })
    
    // Total solutions
    const { count: totalSolutions } = await supabase
      .from("solutions")
      .select("*", { count: "exact", head: true })
    
    // Public vs private journeys
    const { count: publicJourneys } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .eq("visibility", "public")
    
    // ========== ENGAGEMENT METRICS ==========
    
    // AI generations in period (from activity log)
    const { count: aiGenerations } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("action", "ai_generation")
      .gte("created_at", startISO)
    
    // Total stages, steps, touchpoints for depth metrics
    const { count: totalStages } = await supabase
      .from("stages")
      .select("*", { count: "exact", head: true })
    
    const { count: totalSteps } = await supabase
      .from("steps")
      .select("*", { count: "exact", head: true })
    
    const { count: totalTouchpoints } = await supabase
      .from("touch_points")
      .select("*", { count: "exact", head: true })
    
    // ========== GROWTH METRICS ==========
    
    // Signups over time (daily for the period)
    const { data: signupTrend } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", startISO)
      .order("created_at", { ascending: true })
    
    // Group signups by day
    const signupsByDay = (signupTrend || []).reduce((acc, p) => {
      const day = p.created_at.split("T")[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Journeys created over time
    const { data: journeyTrend } = await supabase
      .from("journeys")
      .select("created_at")
      .gte("created_at", startISO)
      .order("created_at", { ascending: true })
    
    const journeysByDay = (journeyTrend || []).reduce((acc, j) => {
      const day = j.created_at.split("T")[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // ========== PLATFORM HEALTH ==========
    
    // Count AI-generated content
    const { count: aiGeneratedTouchpoints } = await supabase
      .from("touch_points")
      .select("*", { count: "exact", head: true })
      .eq("is_ai_generated", true)
    
    // Workspaces count
    const { count: totalWorkspaces } = await supabase
      .from("workspaces")
      .select("*", { count: "exact", head: true })
    
    // Templates count
    const { count: totalTemplates } = await supabase
      .from("templates")
      .select("*", { count: "exact", head: true })
    
    return NextResponse.json({
      dateRange: { start: startISO, end: now.toISOString(), range },
      users: {
        total: totalUsers || 0,
        newInPeriod: newSignups || 0,
        activeInPeriod: activeUsers || 0,
        byPlan: planCounts,
        growthRate: totalUsers ? Math.round(((newSignups || 0) / totalUsers) * 100 * 10) / 10 : 0
      },
      content: {
        journeys: {
          total: totalJourneys || 0,
          newInPeriod: newJourneys || 0,
          byType: journeyTypeCounts,
          public: publicJourneys || 0,
          private: (totalJourneys || 0) - (publicJourneys || 0)
        },
        archetypes: totalArchetypes || 0,
        solutions: totalSolutions || 0,
        stages: totalStages || 0,
        steps: totalSteps || 0,
        touchpoints: totalTouchpoints || 0
      },
      engagement: {
        aiGenerations: aiGenerations || 0,
        aiGeneratedContent: aiGeneratedTouchpoints || 0,
        avgJourneyDepth: totalJourneys ? Math.round(((totalStages || 0) / totalJourneys) * 10) / 10 : 0
      },
      platform: {
        workspaces: totalWorkspaces || 0,
        templates: totalTemplates || 0
      },
      trends: {
        signups: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
        journeys: Object.entries(journeysByDay).map(([date, count]) => ({ date, count }))
      }
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
