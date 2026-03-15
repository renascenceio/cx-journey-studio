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
    // Always fetch journey structure first (needed for both real and demo data)
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

    // Check if VoC tables exist by trying a simple query
    const { error: tableCheckError } = await supabase
      .from("voc_metrics")
      .select("id")
      .limit(1)

    // If tables don't exist, return demo data based on actual journey structure
    if (tableCheckError?.code === "42P01") {
      return NextResponse.json({ 
        stats: generateDemoStatsFromJourney(journey),
        isDemo: true
      })
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
        stats: generateDemoStatsFromJourney(journey),
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
    // Return basic demo data on any error (journey fetch may have failed too)
    return NextResponse.json({ 
      stats: generateBasicDemoStats(journeyId),
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

// Helper to generate realistic VoC scores with some variance
function generateScore(base: number, variance: number): number {
  return Math.round((base + (Math.random() - 0.5) * variance) * 10) / 10
}

function generateNps(stageIndex: number, totalStages: number): number {
  // NPS typically varies by stage - awareness/consideration lower, retention/advocacy higher
  const baseNps = stageIndex < totalStages / 2 ? 25 + stageIndex * 8 : 40 + (stageIndex - totalStages / 2) * 15
  return Math.round(generateScore(baseNps, 20))
}

function generateCsat(nps: number): number {
  // CSAT correlates with NPS (1-5 scale)
  const base = 3.0 + (nps / 100) * 2
  return Math.round(generateScore(base, 0.8) * 10) / 10
}

function generateCes(stageIndex: number): number {
  // CES (1-7 scale, lower is better) - purchase stages typically higher effort
  const base = stageIndex < 2 ? 2.5 : stageIndex < 4 ? 3.8 : 2.0
  return Math.round(generateScore(base, 1.2) * 10) / 10
}

function generateSentiment(nps: number): number {
  // Sentiment (-1 to 1) correlates with NPS
  const base = (nps + 100) / 200 - 0.1
  return Math.round(generateScore(base, 0.2) * 100) / 100
}

// Generate demo data based on actual journey structure
function generateDemoStatsFromJourney(journey: any): VoCJourneyStats {
  const stages = (journey.stages || []).sort((a: any, b: any) => a.order - b.order)
  const totalStages = stages.length
  
  let allFeedback: any[] = []
  let totalFeedbackCount = 0
  
  const stageMetrics: VoCStageMetric[] = stages.map((stage: any, stageIndex: number) => {
    const stageNps = generateNps(stageIndex, totalStages)
    const stageCsat = generateCsat(stageNps)
    const stageCes = generateCes(stageIndex)
    const stageSentiment = generateSentiment(stageNps)
    const stageFeedbackCount = Math.floor(50 + Math.random() * 200)
    totalFeedbackCount += stageFeedbackCount
    
    const steps = (stage.steps || []).sort((a: any, b: any) => a.order - b.order)
    
    const stepMetrics: VoCStepMetric[] = steps.map((step: any, stepIndex: number) => {
      const stepNps = Math.round(stageNps + (Math.random() - 0.5) * 15)
      const stepCsat = generateCsat(stepNps)
      const stepCes = Math.round((stageCes + (Math.random() - 0.5) * 1) * 10) / 10
      const stepSentiment = generateSentiment(stepNps)
      const stepFeedbackCount = Math.floor(stageFeedbackCount / steps.length)
      
      const touchpoints = (step.touchpoints || []).sort((a: any, b: any) => a.order - b.order)
      
      const touchpointMetrics: VoCTouchpointMetric[] = touchpoints.map((tp: any) => {
        const tpNps = Math.round(stepNps + (Math.random() - 0.5) * 10)
        return {
          touchpointId: tp.id,
          channel: tp.channel || "Unknown",
          nps: tpNps,
          csat: generateCsat(tpNps),
          ces: Math.round((stepCes + (Math.random() - 0.5) * 0.8) * 10) / 10,
          sentiment: generateSentiment(tpNps),
          feedbackCount: Math.floor(stepFeedbackCount / Math.max(touchpoints.length, 1)),
        }
      })
      
      // Generate sample feedback for steps and touchpoints
      const shouldAddFeedback = Math.random() > 0.5 // Add feedback to ~50% of steps
      
      if (shouldAddFeedback) {
        const sentiment = stepNps > 40 ? "positive" : stepNps > 20 ? "neutral" : "negative"
        const feedbackTemplates = {
          positive: [
            `Great experience with ${stage.name}! The process was smooth and efficient.`,
            `Really impressed with how easy ${step.description || 'this step'} was.`,
            `The team was very helpful throughout ${stage.name.toLowerCase()}.`,
          ],
          neutral: [
            `${stage.name} was okay, but could be improved.`,
            `The ${step.description || 'process'} worked as expected.`,
            `Average experience, nothing special but nothing wrong either.`,
          ],
          negative: [
            `Had some issues during ${stage.name}. The ${step.description || 'process'} was confusing.`,
            `Expected better from ${stage.name}. Too many steps involved.`,
            `Frustrating experience with ${step.description || 'this part'}. Needs improvement.`,
          ],
        }
        
        // Add step-level feedback
        allFeedback.push({
          id: `demo-f-${stage.id}-${step.id}`,
          dataSourceId: "demo-ds",
          journeyId: journey.id,
          targetType: "step",
          targetId: step.id,
          externalId: null,
          respondentId: `user-${Math.floor(Math.random() * 1000)}`,
          feedbackType: ["survey", "review", "support"][Math.floor(Math.random() * 3)] as any,
          sentiment,
          sentimentScore: sentiment === "positive" ? 0.8 : sentiment === "neutral" ? 0.1 : -0.6,
          npsScore: stepNps > 40 ? 9 : stepNps > 20 ? 7 : 4,
          csatScore: stepCsat,
          cesScore: stepCes,
          textContent: feedbackTemplates[sentiment as keyof typeof feedbackTemplates][Math.floor(Math.random() * 3)],
          tags: [stage.name.toLowerCase().replace(/\s+/g, "-"), sentiment],
          metadata: { stageName: stage.name, stepDescription: step.description },
          respondedAt: new Date(Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000).toISOString(),
        })
        
        // Add touchpoint-level feedback for some touchpoints
        touchpoints.forEach((tp: any) => {
          if (Math.random() > 0.7) {
            const tpSentiment = Math.random() > 0.5 ? "positive" : Math.random() > 0.5 ? "neutral" : "negative"
            const tpTemplates = {
              positive: `Loved using ${tp.channel || 'this channel'}! Very convenient.`,
              neutral: `${tp.channel || 'The channel'} worked fine.`,
              negative: `${tp.channel || 'This channel'} could be better. Had some issues.`,
            }
            allFeedback.push({
              id: `demo-f-tp-${tp.id}-${Math.random().toString(36).slice(2, 8)}`,
              dataSourceId: "demo-ds",
              journeyId: journey.id,
              targetType: "touchpoint",
              targetId: tp.id,
              externalId: null,
              respondentId: `user-${Math.floor(Math.random() * 1000)}`,
              feedbackType: "survey",
              sentiment: tpSentiment,
              sentimentScore: tpSentiment === "positive" ? 0.75 : tpSentiment === "neutral" ? 0.05 : -0.5,
              npsScore: tpSentiment === "positive" ? 8 : tpSentiment === "neutral" ? 6 : 3,
              csatScore: tpSentiment === "positive" ? 4.5 : tpSentiment === "neutral" ? 3.2 : 2.1,
              cesScore: tpSentiment === "positive" ? 2 : tpSentiment === "neutral" ? 4 : 5.5,
              textContent: tpTemplates[tpSentiment as keyof typeof tpTemplates],
              tags: [tp.channel?.toLowerCase().replace(/\s+/g, "-") || "touchpoint", tpSentiment],
              metadata: { stageName: stage.name, stepDescription: step.description, channel: tp.channel },
              respondedAt: new Date(Date.now() - Math.floor(Math.random() * 96) * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - Math.floor(Math.random() * 96) * 60 * 60 * 1000).toISOString(),
            })
          }
        })
      }
      
      // Also add some stage-level feedback
      if (stepIndex === 0 && Math.random() > 0.6) {
        const sentiment = stageNps > 50 ? "positive" : stageNps > 25 ? "neutral" : "negative"
        allFeedback.push({
          id: `demo-f-stage-${stage.id}`,
          dataSourceId: "demo-ds",
          journeyId: journey.id,
          targetType: "stage",
          targetId: stage.id,
          externalId: null,
          respondentId: `user-${Math.floor(Math.random() * 1000)}`,
          feedbackType: "review",
          sentiment,
          sentimentScore: sentiment === "positive" ? 0.85 : sentiment === "neutral" ? 0.15 : -0.55,
          npsScore: sentiment === "positive" ? 10 : sentiment === "neutral" ? 7 : 5,
          csatScore: sentiment === "positive" ? 4.8 : sentiment === "neutral" ? 3.5 : 2.5,
          cesScore: sentiment === "positive" ? 1.8 : sentiment === "neutral" ? 3.5 : 5,
          textContent: sentiment === "positive" 
            ? `Overall, ${stage.name} exceeded my expectations!`
            : sentiment === "neutral"
            ? `${stage.name} was an average experience.`
            : `Disappointed with ${stage.name}. Needs significant improvement.`,
          tags: [stage.name.toLowerCase().replace(/\s+/g, "-"), sentiment, "overall"],
          metadata: { stageName: stage.name },
          respondedAt: new Date(Date.now() - Math.floor(Math.random() * 48) * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 48) * 60 * 60 * 1000).toISOString(),
        })
      }
      
      return {
        stepId: step.id,
        stepName: step.description || `Step ${stepIndex + 1}`,
        nps: stepNps,
        csat: stepCsat,
        ces: stepCes,
        sentiment: stepSentiment,
        feedbackCount: stepFeedbackCount,
        touchpoints: touchpointMetrics,
      }
    })
    
    return {
      stageId: stage.id,
      stageName: stage.name,
      nps: stageNps,
      csat: stageCsat,
      ces: stageCes,
      sentiment: stageSentiment,
      feedbackCount: stageFeedbackCount,
      steps: stepMetrics,
    }
  })
  
  // Calculate overall metrics as weighted average
  const overallNps = stageMetrics.length > 0 
    ? Math.round(stageMetrics.reduce((sum, s) => sum + (s.nps || 0), 0) / stageMetrics.length)
    : 42
  const overallCsat = stageMetrics.length > 0
    ? Math.round(stageMetrics.reduce((sum, s) => sum + (s.csat || 0), 0) / stageMetrics.length * 10) / 10
    : 4.1
  const overallCes = stageMetrics.length > 0
    ? Math.round(stageMetrics.reduce((sum, s) => sum + (s.ces || 0), 0) / stageMetrics.length * 10) / 10
    : 3.2
  const overallSentiment = stageMetrics.length > 0
    ? Math.round(stageMetrics.reduce((sum, s) => sum + (s.sentiment || 0), 0) / stageMetrics.length * 100) / 100
    : 0.65
  
  // Sort feedback by date
  allFeedback.sort((a, b) => new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime())

  return {
    overallNps,
    npsChange: Math.round((Math.random() - 0.3) * 10) / 10,
    npsSampleSize: Math.floor(800 + Math.random() * 600),
    overallCsat,
    csatChange: Math.round((Math.random() - 0.4) * 0.6 * 10) / 10,
    csatSampleSize: Math.floor(700 + Math.random() * 500),
    overallCes,
    cesChange: Math.round((Math.random() - 0.5) * 0.8 * 10) / 10,
    cesSampleSize: Math.floor(600 + Math.random() * 400),
    overallSentiment,
    sentimentChange: Math.round((Math.random() - 0.4) * 0.2 * 100) / 100,
    totalFeedbackCount,
    recentFeedback: allFeedback.slice(0, 5),
    stageMetrics,
    lastUpdated: new Date().toISOString(),
  }
}

// Basic demo data fallback when journey fetch fails
function generateBasicDemoStats(journeyId: string): VoCJourneyStats {
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
    totalFeedbackCount: 0,
    recentFeedback: [],
    stageMetrics: [],
    lastUpdated: new Date().toISOString(),
  }
}
