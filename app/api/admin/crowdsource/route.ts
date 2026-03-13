import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch crowdsource elements from the database
  const { data: elements, error } = await supabase
    .from("crowdsource_elements")
    .select("*")
    .order("frequency", { ascending: false })

  if (error) {
    // If table doesn't exist yet, return mock data
    if (error.code === "42P01") {
      return NextResponse.json({
        elements: getMockElements(),
        lastAnalyzed: new Date().toISOString(),
        totalJourneys: 0
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get analysis metadata
  const { data: meta } = await supabase
    .from("crowdsource_meta")
    .select("*")
    .single()

  return NextResponse.json({
    elements: elements || getMockElements(),
    lastAnalyzed: meta?.last_analyzed || new Date().toISOString(),
    totalJourneys: meta?.total_journeys || 0
  })
}

// Mock data for when the database tables don't exist yet
function getMockElements() {
  return [
    {
      id: "1",
      type: "stage",
      name: "Awareness",
      description: "Initial customer awareness and discovery phase",
      frequency: 87,
      category: "Retail",
      geographies: ["UAE", "Saudi Arabia", "USA"],
      journeys_used: 45,
      organizations_used: 12,
      first_seen: "2024-01-15",
      last_seen: "2024-03-10",
      example_context: "Customer discovers brand through social media advertising"
    },
    {
      id: "2",
      type: "touchpoint",
      name: "Mobile App Onboarding",
      description: "First-time user experience in mobile application",
      frequency: 72,
      category: "Banking & Finance",
      geographies: ["UAE", "UK"],
      journeys_used: 38,
      organizations_used: 8,
      first_seen: "2024-02-01",
      last_seen: "2024-03-08",
      example_context: "New customer completes KYC through mobile app"
    },
    {
      id: "3",
      type: "pain_point",
      name: "Long Wait Times",
      description: "Extended waiting periods during service delivery",
      frequency: 65,
      category: "Healthcare",
      geographies: ["UAE", "Saudi Arabia"],
      journeys_used: 32,
      organizations_used: 15,
      first_seen: "2024-01-20",
      last_seen: "2024-03-12",
      sentiment_score: -0.7,
      example_context: "Patients waiting over 30 minutes for scheduled appointments"
    },
    {
      id: "4",
      type: "highlight",
      name: "Personalized Recommendations",
      description: "AI-powered product and service recommendations",
      frequency: 58,
      category: "Retail",
      geographies: ["USA", "UK", "UAE"],
      journeys_used: 28,
      organizations_used: 9,
      first_seen: "2024-02-10",
      last_seen: "2024-03-11",
      sentiment_score: 0.85,
      example_context: "Customer receives tailored suggestions based on purchase history"
    },
    {
      id: "5",
      type: "step",
      name: "Identity Verification",
      description: "KYC and identity verification process step",
      frequency: 52,
      category: "Banking & Finance",
      geographies: ["UAE", "Saudi Arabia", "Bahrain"],
      journeys_used: 25,
      organizations_used: 11,
      first_seen: "2024-01-25",
      last_seen: "2024-03-09"
    },
    {
      id: "6",
      type: "pain_point",
      name: "Complex Navigation",
      description: "Difficulty finding information or completing tasks",
      frequency: 48,
      category: "Telecommunications",
      geographies: ["UAE"],
      journeys_used: 22,
      organizations_used: 6,
      first_seen: "2024-02-05",
      last_seen: "2024-03-07",
      sentiment_score: -0.6,
      example_context: "Users unable to locate billing information in self-service portal"
    }
  ]
}
