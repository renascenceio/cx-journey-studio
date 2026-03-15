import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { VoCJourneyStats, VoCStageMetric, VoCStepMetric, VoCTouchpointMetric } from "@/lib/types"

// GET /api/voc/metrics - Get VoC metrics for a journey
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const journeyId = searchParams.get("journeyId")

  if (!journeyId) {
    return NextResponse.json({ error: "journeyId is required" }, { status: 400 })
  }

  try {
    // Check if VoC tables exist by trying a simple query
    const { error: tableCheckError } = await supabase
      .from("voc_metrics")
      .select("id")
      .limit(1)

    // If tables don't exist, return mock/demo data for UI development
    if (tableCheckError?.code === "42P01") {
      return NextResponse.json({ 
        stats: generateDemoStats(journeyId),
        isDemo: true
      })
    }

    // Fetch journey with stages, steps, and touchpoints
    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select(`
        id,
        title,
        stages (
          id,
          name,
          order,
          steps (
            id,
            description,
            order,
            touchpoints (
              id,
              channel,
              order
            )
          )
        )
      `)
      .eq("id", journeyId)
      .single()

    if (journeyError || !journey) {
      console.error("Error fetching journey:", journeyError)
      return NextResponse.json({ error: "Journey not found" }, { status: 404 })
    }

    // Fetch all metrics for this journey
    const { data: metrics, error: metricsError } = await supabase
      .from("voc_metrics")
      .select("*")
      .eq("journey_id", journeyId)
      .order("period_end", { ascending: false })

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError)
      // Return demo data if metrics table has issues
      return NextResponse.json({ 
        stats: generateDemoStats(journeyId),
        isDemo: true
      })
    }

    // Fetch recent feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from("voc_feedback")
      .select("*")
      .eq("journey_id", journeyId)
      .order("responded_at", { ascending: false })
      .limit(10)

    if (feedbackError) {
      console.error("Error fetching feedback:", feedbackError)
    }

    // Aggregate metrics
    const stats = aggregateMetrics(journey, metrics || [], feedback || [])

    return NextResponse.json({ stats, isDemo: false })
  } catch (err) {
    console.error("VoC metrics error:", err)
    // Return demo data on any error
    return NextResponse.json({ 
      stats: generateDemoStats(journeyId),
      isDemo: true
    })
  }
}

// Helper to aggregate metrics from raw data
function aggregateMetrics(
  journey: any,
  metrics: any[],
  feedback: any[]
): VoCJourneyStats {
  // Get journey-level metrics
  const journeyMetrics = metrics.filter(m => m.target_type === "journey")
  const latestNps = journeyMetrics.find(m => m.metric_type === "nps")
  const latestCsat = journeyMetrics.find(m => m.metric_type === "csat")
  const latestCes = journeyMetrics.find(m => m.metric_type === "ces")
  const latestSentiment = journeyMetrics.find(m => m.metric_type === "sentiment")

  // Build stage metrics
  const stageMetrics: VoCStageMetric[] = (journey.stages || [])
    .sort((a: any, b: any) => a.order - b.order)
    .map((stage: any) => {
      const stageData = metrics.filter(m => m.target_type === "stage" && m.target_id === stage.id)
      const stageFeedback = feedback.filter(f => f.target_type === "stage" && f.target_id === stage.id)
      
      return {
        stageId: stage.id,
        stageName: stage.name,
        nps: stageData.find(m => m.metric_type === "nps")?.value ?? null,
        csat: stageData.find(m => m.metric_type === "csat")?.value ?? null,
        ces: stageData.find(m => m.metric_type === "ces")?.value ?? null,
        sentiment: stageData.find(m => m.metric_type === "sentiment")?.value ?? null,
        feedbackCount: stageFeedback.length,
        steps: (stage.steps || [])
          .sort((a: any, b: any) => a.order - b.order)
          .map((step: any) => {
            const stepData = metrics.filter(m => m.target_type === "step" && m.target_id === step.id)
            const stepFeedback = feedback.filter(f => f.target_type === "step" && f.target_id === step.id)
            
            return {
              stepId: step.id,
              stepName: step.description || `Step ${step.order + 1}`,
              nps: stepData.find(m => m.metric_type === "nps")?.value ?? null,
              csat: stepData.find(m => m.metric_type === "csat")?.value ?? null,
              ces: stepData.find(m => m.metric_type === "ces")?.value ?? null,
              sentiment: stepData.find(m => m.metric_type === "sentiment")?.value ?? null,
              feedbackCount: stepFeedback.length,
              touchpoints: (step.touchpoints || [])
                .sort((a: any, b: any) => a.order - b.order)
                .map((tp: any) => {
                  const tpData = metrics.filter(m => m.target_type === "touchpoint" && m.target_id === tp.id)
                  const tpFeedback = feedback.filter(f => f.target_type === "touchpoint" && f.target_id === tp.id)
                  
                  return {
                    touchpointId: tp.id,
                    channel: tp.channel,
                    nps: tpData.find(m => m.metric_type === "nps")?.value ?? null,
                    csat: tpData.find(m => m.metric_type === "csat")?.value ?? null,
                    ces: tpData.find(m => m.metric_type === "ces")?.value ?? null,
                    sentiment: tpData.find(m => m.metric_type === "sentiment")?.value ?? null,
                    feedbackCount: tpFeedback.length,
                  } as VoCTouchpointMetric
                }),
            } as VoCStepMetric
          }),
      } as VoCStageMetric
    })

  return {
    overallNps: latestNps?.value ?? null,
    npsChange: null, // TODO: calculate from previous period
    npsSampleSize: latestNps?.sample_size ?? 0,
    overallCsat: latestCsat?.value ?? null,
    csatChange: null,
    csatSampleSize: latestCsat?.sample_size ?? 0,
    overallCes: latestCes?.value ?? null,
    cesChange: null,
    cesSampleSize: latestCes?.sample_size ?? 0,
    overallSentiment: latestSentiment?.value ?? null,
    sentimentChange: null,
    totalFeedbackCount: feedback.length,
    recentFeedback: feedback.slice(0, 5).map(f => ({
      id: f.id,
      dataSourceId: f.data_source_id,
      journeyId: f.journey_id,
      targetType: f.target_type,
      targetId: f.target_id,
      externalId: f.external_id,
      respondentId: f.respondent_id,
      feedbackType: f.feedback_type,
      sentiment: f.sentiment,
      sentimentScore: f.sentiment_score,
      npsScore: f.nps_score,
      csatScore: f.csat_score,
      cesScore: f.ces_score,
      textContent: f.text_content,
      tags: f.tags || [],
      metadata: f.metadata || {},
      respondedAt: f.responded_at,
      createdAt: f.created_at,
    })),
    stageMetrics,
    lastUpdated: metrics[0]?.updated_at ?? null,
  }
}

// Generate demo data for UI development
function generateDemoStats(journeyId: string): VoCJourneyStats {
  const demoStages: VoCStageMetric[] = [
    {
      stageId: "demo-1",
      stageName: "Awareness",
      nps: 42,
      csat: 4.2,
      ces: 3.1,
      sentiment: 0.65,
      feedbackCount: 234,
      steps: [
        {
          stepId: "demo-s1-1",
          stepName: "First contact",
          nps: 38,
          csat: 4.0,
          ces: 2.8,
          sentiment: 0.58,
          feedbackCount: 89,
          touchpoints: [
            { touchpointId: "demo-t1", channel: "Website", nps: 41, csat: 4.1, ces: 2.9, sentiment: 0.62, feedbackCount: 45 },
            { touchpointId: "demo-t2", channel: "Social Media", nps: 35, csat: 3.9, ces: 2.7, sentiment: 0.54, feedbackCount: 44 },
          ],
        },
      ],
    },
    {
      stageId: "demo-2",
      stageName: "Consideration",
      nps: 35,
      csat: 3.8,
      ces: 3.5,
      sentiment: 0.52,
      feedbackCount: 189,
      steps: [
        {
          stepId: "demo-s2-1",
          stepName: "Product research",
          nps: 32,
          csat: 3.6,
          ces: 3.8,
          sentiment: 0.48,
          feedbackCount: 95,
          touchpoints: [
            { touchpointId: "demo-t3", channel: "Website", nps: 34, csat: 3.7, ces: 3.6, sentiment: 0.51, feedbackCount: 60 },
            { touchpointId: "demo-t4", channel: "Email", nps: 30, csat: 3.5, ces: 4.0, sentiment: 0.45, feedbackCount: 35 },
          ],
        },
      ],
    },
    {
      stageId: "demo-3",
      stageName: "Purchase",
      nps: 28,
      csat: 3.5,
      ces: 4.2,
      sentiment: 0.38,
      feedbackCount: 312,
      steps: [
        {
          stepId: "demo-s3-1",
          stepName: "Checkout",
          nps: 25,
          csat: 3.3,
          ces: 4.5,
          sentiment: 0.32,
          feedbackCount: 156,
          touchpoints: [
            { touchpointId: "demo-t5", channel: "Website", nps: 26, csat: 3.4, ces: 4.4, sentiment: 0.35, feedbackCount: 120 },
            { touchpointId: "demo-t6", channel: "Mobile App", nps: 24, csat: 3.2, ces: 4.6, sentiment: 0.29, feedbackCount: 36 },
          ],
        },
      ],
    },
    {
      stageId: "demo-4",
      stageName: "Retention",
      nps: 55,
      csat: 4.5,
      ces: 2.5,
      sentiment: 0.78,
      feedbackCount: 456,
      steps: [
        {
          stepId: "demo-s4-1",
          stepName: "Support interaction",
          nps: 58,
          csat: 4.6,
          ces: 2.3,
          sentiment: 0.82,
          feedbackCount: 228,
          touchpoints: [
            { touchpointId: "demo-t7", channel: "Phone", nps: 62, csat: 4.7, ces: 2.1, sentiment: 0.85, feedbackCount: 120 },
            { touchpointId: "demo-t8", channel: "Live Chat", nps: 54, csat: 4.5, ces: 2.5, sentiment: 0.79, feedbackCount: 108 },
          ],
        },
      ],
    },
    {
      stageId: "demo-5",
      stageName: "Advocacy",
      nps: 72,
      csat: 4.8,
      ces: 1.8,
      sentiment: 0.92,
      feedbackCount: 123,
      steps: [
        {
          stepId: "demo-s5-1",
          stepName: "Referral",
          nps: 75,
          csat: 4.9,
          ces: 1.6,
          sentiment: 0.95,
          feedbackCount: 67,
          touchpoints: [
            { touchpointId: "demo-t9", channel: "Email", nps: 74, csat: 4.8, ces: 1.7, sentiment: 0.93, feedbackCount: 67 },
          ],
        },
      ],
    },
  ]

  return {
    overallNps: 42,
    npsChange: 3.5,
    npsSampleSize: 1248,
    overallCsat: 4.1,
    csatChange: 0.2,
    csatSampleSize: 1156,
    overallCes: 3.2,
    cesChange: -0.3,
    cesSampleSize: 982,
    overallSentiment: 0.65,
    sentimentChange: 0.05,
    totalFeedbackCount: 1314,
    recentFeedback: [
      {
        id: "demo-f1",
        dataSourceId: "demo-ds",
        journeyId,
        targetType: "touchpoint",
        targetId: "demo-t7",
        externalId: null,
        respondentId: "user-123",
        feedbackType: "survey",
        sentiment: "positive",
        sentimentScore: 0.85,
        npsScore: 9,
        csatScore: 5,
        cesScore: 2,
        textContent: "The support team was incredibly helpful and resolved my issue quickly!",
        tags: ["support", "positive", "quick-resolution"],
        metadata: {},
        respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "demo-f2",
        dataSourceId: "demo-ds",
        journeyId,
        targetType: "step",
        targetId: "demo-s3-1",
        externalId: null,
        respondentId: "user-456",
        feedbackType: "survey",
        sentiment: "negative",
        sentimentScore: -0.6,
        npsScore: 3,
        csatScore: 2,
        cesScore: 5,
        textContent: "The checkout process was confusing and took too long to complete.",
        tags: ["checkout", "negative", "ux-issue"],
        metadata: {},
        respondedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "demo-f3",
        dataSourceId: "demo-ds",
        journeyId,
        targetType: "stage",
        targetId: "demo-4",
        externalId: null,
        respondentId: "user-789",
        feedbackType: "review",
        sentiment: "positive",
        sentimentScore: 0.92,
        npsScore: 10,
        csatScore: 5,
        cesScore: 1,
        textContent: "Been a customer for 3 years now. Best decision I ever made!",
        tags: ["loyalty", "positive", "long-term"],
        metadata: {},
        respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ],
    stageMetrics: demoStages,
    lastUpdated: new Date().toISOString(),
  }
}
