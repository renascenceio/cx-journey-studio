"use client"

import { useParams, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AlertTriangle, Sparkles, Eye } from "lucide-react"

interface PublicTouchPoint {
  id: string
  channel: string
  description: string | null
  emotionalScore: number
  painPoints: { id: string; description: string; severity: string; emotionalScore: number | null }[]
  highlights: { id: string; description: string; impact: string; emotionalScore: number | null }[]
}

interface PublicStep {
  id: string
  name: string
  description: string | null
  order: number
  touchPoints: PublicTouchPoint[]
}

interface PublicStage {
  id: string
  name: string
  order: number
  steps: PublicStep[]
}

interface PublicJourney {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  persona: string | null
  tags: string[]
  stages: PublicStage[]
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
})

function scoreColor(score: number): string {
  if (score <= -3) return "text-red-600 dark:text-red-400"
  if (score <= -1) return "text-orange-600 dark:text-orange-400"
  if (score === 0) return "text-muted-foreground"
  if (score <= 2) return "text-yellow-600 dark:text-yellow-400"
  return "text-emerald-600 dark:text-emerald-400"
}

function scoreBg(score: number): string {
  if (score <= -3) return "bg-red-100 dark:bg-red-900/30"
  if (score <= -1) return "bg-orange-100 dark:bg-orange-900/30"
  if (score === 0) return "bg-muted"
  if (score <= 2) return "bg-yellow-100 dark:bg-yellow-900/30"
  return "bg-emerald-100 dark:bg-emerald-900/30"
}

function TouchPointCard({ tp, stageIndex, stepIndex, tpIndex }: { tp: PublicTouchPoint; stageIndex: number; stepIndex: number; tpIndex: number }) {
  const painCount = tp.painPoints?.length || 0
  const highlightCount = tp.highlights?.length || 0
  
  return (
    <div className={cn("rounded-lg border border-border p-3", scoreBg(tp.emotionalScore))}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
            {stageIndex + 1}.{stepIndex + 1}.{tpIndex + 1}
          </span>
          <span className="text-xs font-medium text-foreground">{tp.channel}</span>
        </div>
        <span className={cn("text-sm font-bold font-mono", scoreColor(tp.emotionalScore))}>
          {tp.emotionalScore > 0 ? "+" : ""}{tp.emotionalScore}
        </span>
      </div>
      {tp.description && (
        <p className="text-xs text-muted-foreground mb-2">{tp.description}</p>
      )}
      <div className="flex items-center gap-3 text-[10px]">
        {painCount > 0 && (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {painCount} pain{painCount > 1 ? "s" : ""}
          </span>
        )}
        {highlightCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" />
            {highlightCount} highlight{highlightCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )
}



function EmotionalArcView({ journey }: { journey: PublicJourney }) {
  // Flatten all touchpoints
  const allTouchpoints = journey.stages.flatMap((stage, si) => 
    stage.steps.flatMap((step, sti) => 
      step.touchPoints.map((tp, tpi) => ({
        ...tp,
        label: `${si + 1}.${sti + 1}.${tpi + 1}`,
        stageName: stage.name,
        stepName: step.name,
      }))
    )
  )

  if (allTouchpoints.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No touchpoints to visualize</p>
      </div>
    )
  }

  const maxScore = 5
  const minScore = -5

  return (
    <div className="space-y-4">
      {/* Arc visualization */}
      <div className="relative h-48 bg-muted/30 rounded-lg border border-border overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4 px-2">
          {[5, 2.5, 0, -2.5, -5].map((score) => (
            <div key={score} className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-6 text-right">{score > 0 ? `+${score}` : score}</span>
              <div className="flex-1 border-t border-border/50" />
            </div>
          ))}
        </div>
        
        {/* Points and line */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Line connecting points */}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={allTouchpoints.map((tp, i) => {
              const x = 32 + ((i / (allTouchpoints.length - 1 || 1)) * (100 - 32 - 4))
              const y = 16 + ((maxScore - tp.emotionalScore) / (maxScore - minScore)) * (100 - 32)
              return `${x}%,${y}%`
            }).join(" ")}
          />
          
          {/* Points */}
          {allTouchpoints.map((tp, i) => {
            const x = 32 + ((i / (allTouchpoints.length - 1 || 1)) * (100 - 32 - 4))
            const y = 16 + ((maxScore - tp.emotionalScore) / (maxScore - minScore)) * (100 - 32)
            return (
              <circle
                key={tp.id}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill={tp.emotionalScore >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 72%, 51%)"}
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {(allTouchpoints.reduce((s, tp) => s + tp.emotionalScore, 0) / allTouchpoints.length).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {allTouchpoints.filter(tp => tp.emotionalScore > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {allTouchpoints.filter(tp => tp.emotionalScore < 0).length}
            </p>
            <p className="text-xs text-muted-foreground">Negative</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PublicStageColumn({ stage, index }: { stage: PublicStage; index: number }) {
  const totalTouchpoints = stage.steps.reduce((acc, step) => acc + step.touchPoints.length, 0)
  const avgScore = totalTouchpoints > 0 
    ? stage.steps.reduce((acc, step) => acc + step.touchPoints.reduce((s, tp) => s + tp.emotionalScore, 0), 0) / totalTouchpoints 
    : 0

  function scoreBgHeader(score: number) {
    if (score <= -2) return "bg-red-100 dark:bg-red-900/20"
    if (score <= 0) return "bg-orange-50 dark:bg-orange-900/10"
    if (score <= 2) return "bg-yellow-50 dark:bg-yellow-900/10"
    return "bg-green-50 dark:bg-green-900/10"
  }

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
      {/* Stage header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b border-border/40", scoreBgHeader(avgScore))}>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {index + 1}. {stage.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{stage.steps.length} steps</span>
            <span className="text-muted-foreground/40">|</span>
            <span>{totalTouchpoints} touchpoints</span>
          </div>
        </div>
        <span className={cn("text-base font-bold font-mono", scoreColor(avgScore))}>
          {avgScore > 0 ? "+" : ""}{avgScore.toFixed(1)}
        </span>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 p-3 flex-1 overflow-y-auto">
        {stage.steps.map((step, stepIndex) => (
          <div key={step.id} className="rounded-lg border border-border/60 bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 bg-muted/20">
              <h4 className="text-xs font-medium text-foreground flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">{index + 1}.{stepIndex + 1}</span>
                {step.name}
              </h4>
              {step.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{step.description}</p>
              )}
            </div>
            <div className="p-2 space-y-2">
              {step.touchPoints.map((tp, tpIndex) => (
                <TouchPointCard 
                  key={tp.id} 
                  tp={tp} 
                  stageIndex={index} 
                  stepIndex={stepIndex} 
                  tpIndex={tpIndex} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CanvasView({ journey }: { journey: PublicJourney }) {
  return (
    <div className="overflow-x-auto overflow-y-auto bg-muted/20 rounded-xl border border-border/40 -mx-4 lg:-mx-6">
      <div className="flex gap-4 p-4 min-h-[500px]" style={{ minWidth: "max-content" }}>
        {journey.stages.map((stage, index) => (
          <PublicStageColumn key={stage.id} stage={stage} index={index} />
        ))}
      </div>
    </div>
  )
}

function OverviewView({ journey }: { journey: PublicJourney }) {
  const totalStages = journey.stages.length
  const totalSteps = journey.stages.reduce((s, st) => s + st.steps.length, 0)
  const totalTouchpoints = journey.stages.reduce((s, st) => s + st.steps.reduce((ss, step) => ss + step.touchPoints.length, 0), 0)
  const totalPains = journey.stages.reduce((s, st) => s + st.steps.reduce((ss, step) => ss + step.touchPoints.reduce((sp, tp) => sp + (tp.painPoints?.length || 0), 0), 0), 0)
  const totalHighlights = journey.stages.reduce((s, st) => s + st.steps.reduce((ss, step) => ss + step.touchPoints.reduce((sh, tp) => sh + (tp.highlights?.length || 0), 0), 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalStages}</p>
            <p className="text-xs text-muted-foreground">Stages</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalSteps}</p>
            <p className="text-xs text-muted-foreground">Steps</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalTouchpoints}</p>
            <p className="text-xs text-muted-foreground">Touchpoints</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalPains}</p>
            <p className="text-xs text-muted-foreground">Pain Points</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalHighlights}</p>
            <p className="text-xs text-muted-foreground">Highlights</p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {journey.description && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{journey.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stage overview */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Journey Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {journey.stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-center gap-2"
              >
                <div className="flex flex-col items-center shrink-0 min-w-[100px]">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground mt-1 text-center">{stage.name}</span>
                  <span className="text-[10px] text-muted-foreground">{stage.steps.length} steps</span>
                </div>
                {index < journey.stages.length - 1 && (
                  <div className="w-8 h-px bg-border shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PublicJourneyViewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const journeyId = params.id as string
  const defaultTab = searchParams.get("view") || "overview"
  
  const { data: journey, error, isLoading } = useSWR<PublicJourney>(
    `/api/journeys/${journeyId}/public`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !journey) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Journey Not Found</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          This journey may be private, deleted, or the link is incorrect. 
          If you believe this is an error, please contact the journey owner.
        </p>
        <a 
          href="/" 
          className="text-sm text-primary hover:underline"
        >
          Go to Homepage
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* Minimal branding bar */}
      <div className="border-b border-border bg-muted/30 py-2 px-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">JS</span>
            </div>
            <span className="text-xs text-muted-foreground">Shared via Journey Studio</span>
          </div>
          <a href="/" className="text-xs text-primary hover:underline">Create your own</a>
        </div>
      </div>
      
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      {/* Journey header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          {journey.title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {journey.type.charAt(0).toUpperCase() + journey.type.slice(1)} Journey
          </Badge>
          {journey.persona && (
            <Badge variant="secondary" className="text-xs">
              Persona: {journey.persona}
            </Badge>
          )}
          {journey.tags?.map((tag) => (
            <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>
          ))}
        </div>
      </div>

      {/* View tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="emotional-arc">Emotional Arc</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewView journey={journey} />
        </TabsContent>
        
        <TabsContent value="canvas">
          <CanvasView journey={journey} />
        </TabsContent>
        
        <TabsContent value="emotional-arc">
          <EmotionalArcView journey={journey} />
        </TabsContent>
      </Tabs>
    </main>
    </div>
  )
}
