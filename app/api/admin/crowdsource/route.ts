import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface JourneyData {
  id: string
  category: string
  geography?: string
  organization_id: string
  stages: unknown[]
  steps?: unknown[]
  touchpoints?: unknown[]
  pain_points?: unknown[]
  highlights?: unknown[]
  created_at: string
}

interface ElementCount {
  name: string
  type: string
  description: string
  category: string
  geography: string
  frequency: number
  journeys: Set<string>
  organizations: Set<string>
  first_seen: string
  last_seen: string
  sentiment_score?: number
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // First try to get from crowdsource_elements table if it exists
    const { data: existingElements, error: elementsError } = await supabase
      .from("crowdsource_elements")
      .select("*")
      .order("frequency", { ascending: false })

    if (!elementsError && existingElements && existingElements.length > 0) {
      // Get analysis metadata
      const { data: meta } = await supabase
        .from("crowdsource_meta")
        .select("*")
        .single()

      return NextResponse.json({
        elements: existingElements,
        lastAnalyzed: meta?.last_analyzed || new Date().toISOString(),
        totalJourneys: meta?.total_journeys || existingElements.length
      })
    }

    // If no existing elements, analyze journeys in real-time
    const { data: journeys, error: journeyError } = await supabase
      .from("journeys")
      .select(`
        id,
        category,
        geography,
        organization_id,
        stages,
        created_at
      `)
      .not("stages", "is", null)
      .limit(500)

    if (journeyError) {
      console.error("Error fetching journeys:", journeyError)
      return NextResponse.json({
        elements: getMockElements(),
        lastAnalyzed: new Date().toISOString(),
        totalJourneys: 0
      })
    }

    if (!journeys || journeys.length === 0) {
      return NextResponse.json({
        elements: getMockElements(),
        lastAnalyzed: new Date().toISOString(),
        totalJourneys: 0
      })
    }

    // Analyze journeys and extract common elements
    const elementCounts = new Map<string, ElementCount>()

    for (const journey of journeys as JourneyData[]) {
      const category = journey.category || "Uncategorized"
      const geography = journey.geography || "Global"
      
      // Extract stages
      if (Array.isArray(journey.stages)) {
        for (const stage of journey.stages) {
          if (typeof stage === "object" && stage !== null) {
            const stageData = stage as Record<string, unknown>
            const name = String(stageData.name || stageData.title || "Unknown Stage")
            const key = `stage:${name.toLowerCase()}`
            
            if (!elementCounts.has(key)) {
              elementCounts.set(key, {
                name,
                type: "stage",
                description: String(stageData.description || `Stage: ${name}`),
                category,
                geography,
                frequency: 0,
                journeys: new Set(),
                organizations: new Set(),
                first_seen: journey.created_at,
                last_seen: journey.created_at
              })
            }
            
            const el = elementCounts.get(key)!
            el.frequency++
            el.journeys.add(journey.id)
            el.organizations.add(journey.organization_id)
            if (journey.created_at < el.first_seen) el.first_seen = journey.created_at
            if (journey.created_at > el.last_seen) el.last_seen = journey.created_at
            
            // Extract steps within stages
            const steps = stageData.steps as unknown[] | undefined
            if (Array.isArray(steps)) {
              for (const step of steps) {
                if (typeof step === "object" && step !== null) {
                  const stepData = step as Record<string, unknown>
                  const stepName = String(stepData.name || stepData.title || "Unknown Step")
                  const stepKey = `step:${stepName.toLowerCase()}`
                  
                  if (!elementCounts.has(stepKey)) {
                    elementCounts.set(stepKey, {
                      name: stepName,
                      type: "step",
                      description: String(stepData.description || `Step: ${stepName}`),
                      category,
                      geography,
                      frequency: 0,
                      journeys: new Set(),
                      organizations: new Set(),
                      first_seen: journey.created_at,
                      last_seen: journey.created_at
                    })
                  }
                  
                  const stepEl = elementCounts.get(stepKey)!
                  stepEl.frequency++
                  stepEl.journeys.add(journey.id)
                  stepEl.organizations.add(journey.organization_id)
                  
                  // Extract touchpoints within steps
                  const touchpoints = stepData.touchpoints as unknown[] | undefined
                  if (Array.isArray(touchpoints)) {
                    for (const tp of touchpoints) {
                      if (typeof tp === "object" && tp !== null) {
                        const tpData = tp as Record<string, unknown>
                        const tpName = String(tpData.name || tpData.channel || "Unknown Touchpoint")
                        const tpKey = `touchpoint:${tpName.toLowerCase()}`
                        
                        if (!elementCounts.has(tpKey)) {
                          elementCounts.set(tpKey, {
                            name: tpName,
                            type: "touchpoint",
                            description: String(tpData.description || `Touchpoint: ${tpName}`),
                            category,
                            geography,
                            frequency: 0,
                            journeys: new Set(),
                            organizations: new Set(),
                            first_seen: journey.created_at,
                            last_seen: journey.created_at
                          })
                        }
                        
                        const tpEl = elementCounts.get(tpKey)!
                        tpEl.frequency++
                        tpEl.journeys.add(journey.id)
                        tpEl.organizations.add(journey.organization_id)
                      }
                    }
                  }
                  
                  // Extract pain points within steps
                  const painPoints = stepData.pain_points as unknown[] | undefined
                  if (Array.isArray(painPoints)) {
                    for (const pp of painPoints) {
                      if (typeof pp === "object" && pp !== null) {
                        const ppData = pp as Record<string, unknown>
                        const ppName = String(ppData.name || ppData.title || ppData.description || "Unknown Pain Point")
                        const ppKey = `pain_point:${ppName.toLowerCase().slice(0, 50)}`
                        
                        if (!elementCounts.has(ppKey)) {
                          elementCounts.set(ppKey, {
                            name: ppName.slice(0, 100),
                            type: "pain_point",
                            description: String(ppData.description || ppName).slice(0, 300),
                            category,
                            geography,
                            frequency: 0,
                            journeys: new Set(),
                            organizations: new Set(),
                            first_seen: journey.created_at,
                            last_seen: journey.created_at,
                            sentiment_score: -0.5
                          })
                        }
                        
                        const ppEl = elementCounts.get(ppKey)!
                        ppEl.frequency++
                        ppEl.journeys.add(journey.id)
                        ppEl.organizations.add(journey.organization_id)
                      }
                    }
                  }
                  
                  // Extract highlights within steps
                  const highlights = stepData.highlights as unknown[] | undefined
                  if (Array.isArray(highlights)) {
                    for (const hl of highlights) {
                      if (typeof hl === "object" && hl !== null) {
                        const hlData = hl as Record<string, unknown>
                        const hlName = String(hlData.name || hlData.title || hlData.description || "Unknown Highlight")
                        const hlKey = `highlight:${hlName.toLowerCase().slice(0, 50)}`
                        
                        if (!elementCounts.has(hlKey)) {
                          elementCounts.set(hlKey, {
                            name: hlName.slice(0, 100),
                            type: "highlight",
                            description: String(hlData.description || hlName).slice(0, 300),
                            category,
                            geography,
                            frequency: 0,
                            journeys: new Set(),
                            organizations: new Set(),
                            first_seen: journey.created_at,
                            last_seen: journey.created_at,
                            sentiment_score: 0.7
                          })
                        }
                        
                        const hlEl = elementCounts.get(hlKey)!
                        hlEl.frequency++
                        hlEl.journeys.add(journey.id)
                        hlEl.organizations.add(journey.organization_id)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Convert to array and sort by frequency
    const elements = Array.from(elementCounts.entries())
      .map(([id, el]) => ({
        id,
        type: el.type,
        name: el.name,
        description: el.description,
        frequency: el.frequency,
        category: el.category,
        geographies: [el.geography],
        journeys_used: el.journeys.size,
        organizations_used: el.organizations.size,
        first_seen: el.first_seen,
        last_seen: el.last_seen,
        sentiment_score: el.sentiment_score
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100) // Return top 100 elements

    return NextResponse.json({
      elements: elements.length > 0 ? elements : getMockElements(),
      lastAnalyzed: new Date().toISOString(),
      totalJourneys: journeys.length
    })

  } catch (error) {
    console.error("Crowdsource error:", error)
    return NextResponse.json({
      elements: getMockElements(),
      lastAnalyzed: new Date().toISOString(),
      totalJourneys: 0
    })
  }
}

// Mock data for when there's no journey data
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
