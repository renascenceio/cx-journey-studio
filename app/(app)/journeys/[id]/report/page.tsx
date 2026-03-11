"use client"

import { useParams } from "next/navigation"
import { useRef } from "react"
import { getEmotionalArc, gapAnalysisData } from "@/lib/data-utils"
import { useJourney } from "@/hooks/use-journey"
import { Button } from "@/components/ui/button"
import { Printer, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ExportDialog } from "@/components/export-dialog"

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  review: "In Review",
  approved: "Approved",
  deployed: "Deployed",
  archived: "Archived",
}

const typeLabels: Record<string, string> = {
  current: "Current State",
  future: "Future State",
  template: "Template",
  deployed: "Deployed",
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const normalized = ((score + max) / (2 * max)) * 100
  const isPositive = score >= 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
          style={{ width: `${Math.max(normalized, 5)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isPositive ? "text-emerald-700" : "text-red-700"}`}>
        {score > 0 ? "+" : ""}{score}
      </span>
    </div>
  )
}

export default function JourneyReportPage() {
  const params = useParams()
  const journeyId = params.id as string
  const { journey, isLoading } = useJourney(journeyId)
  const reportRef = useRef<HTMLDivElement>(null)

  if (isLoading || !journey) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  const emotionalArc = getEmotionalArc(journey)
  const totalSteps = journey.stages.reduce((s, st) => s + st.steps.length, 0)
  const totalTouchpoints = journey.stages.reduce((s, st) => s + st.steps.reduce((ss, stp) => ss + stp.touchPoints.length, 0), 0)
  const avgScore = emotionalArc.length > 0
    ? Math.round((emotionalArc.reduce((s, e) => s + e.score, 0) / emotionalArc.length) * 10) / 10
    : 0

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          header, nav, footer { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      {/* Actions bar (hidden in print) */}
      <div className="no-print sticky top-14 z-40 flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 lg:px-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Link href={`/journeys/${journeyId}`}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Journey
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ExportDialog type="journey" data={journey} elementRef={reportRef} title={journey.title}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </ExportDialog>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="mx-auto max-w-4xl px-6 py-10 text-foreground bg-background">

        {/* Cover Section */}
        <div className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Journey Report
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance mb-3">
            {journey.title}
          </h1>
          {journey.description && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-4">
              {journey.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div><span className="font-medium text-foreground">Type:</span> {typeLabels[journey.type]}</div>
            <div><span className="font-medium text-foreground">Status:</span> {statusLabels[journey.status]}</div>
            <div><span className="font-medium text-foreground">Owner:</span> {journey.ownerId}</div>
            <div><span className="font-medium text-foreground">Created:</span> {new Date(journey.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
          {journey.archetypes.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">Archetypes:</span>
              {journey.archetypes.map((a) => (
                <span key={a.id} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Executive Summary</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{journey.stages.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Stages</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{totalSteps}</p>
              <p className="text-xs text-muted-foreground mt-1">Steps</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{totalTouchpoints}</p>
              <p className="text-xs text-muted-foreground mt-1">Touchpoints</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className={`text-3xl font-bold ${avgScore >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {avgScore > 0 ? "+" : ""}{avgScore}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Avg Emotional Score</p>
            </div>
          </div>
        </div>

        {/* Journey Canvas (Table) */}
        <div className="mb-10 print-break">
          <h2 className="text-lg font-semibold text-foreground mb-4">Journey Canvas</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-28">Stage</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-36">Step</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Touchpoint</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-28">Pains / Gains</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-20">Score</th>
                </tr>
              </thead>
              <tbody>
                {journey.stages.map((stage) =>
                  stage.steps.map((step, si) =>
                    step.touchPoints.map((tp, ti) => {
                      const painCount = tp.painPoints?.length || 0
                      const highlightCount = tp.highlights?.length || 0
                      return (
                        <tr key={tp.id} className="border-t border-border">
                          {si === 0 && ti === 0 && (
                            <td className="px-3 py-2 font-medium text-foreground align-top bg-muted/20" rowSpan={stage.steps.reduce((s, st) => s + st.touchPoints.length, 0)}>
                              {stage.name}
                            </td>
                          )}
                          {ti === 0 && (
                            <td className="px-3 py-2 text-foreground align-top" rowSpan={step.touchPoints.length}>
                              {step.name}
                            </td>
                          )}
                          <td className="px-3 py-2 text-muted-foreground">{tp.channel}</td>
                          <td className="px-3 py-2 text-xs">
                            {painCount > 0 && <span className="text-red-600">{painCount} pain{painCount > 1 ? "s" : ""}</span>}
                            {painCount > 0 && highlightCount > 0 && <span className="text-muted-foreground"> / </span>}
                            {highlightCount > 0 && <span className="text-emerald-600">{highlightCount} gain{highlightCount > 1 ? "s" : ""}</span>}
                            {painCount === 0 && highlightCount === 0 && <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <ScoreBar score={tp.emotionalScore} />
                          </td>
                        </tr>
                      )
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emotional Arc */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Emotional Arc</h2>
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-end gap-3 h-40">
              {emotionalArc.map((point) => {
                const normalizedHeight = ((point.score + 5) / 10) * 100
                return (
                  <div key={point.stageName} className="flex-1 flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold ${point.score >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {point.score > 0 ? "+" : ""}{point.score}
                    </span>
                    <div className="w-full flex flex-col items-center" style={{ height: 120 }}>
                      <div className="flex-1" />
                      <div
                        className={`w-full max-w-12 rounded-t ${point.score >= 0 ? "bg-emerald-500/70" : "bg-red-500/70"}`}
                        style={{ height: `${Math.max(normalizedHeight, 8)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">
                      {point.stageName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Gap Analysis (if future journey) */}
        {journey.type === "future" && (
          <div className="mb-10 print-break">
            <h2 className="text-lg font-semibold text-foreground mb-4">Gap Analysis</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Touchpoint</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Stage</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Current</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Future</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {gapAnalysisData.map((row) => (
                    <tr key={row.touchPointName} className="border-t border-border">
                      <td className="px-3 py-2 font-medium text-foreground">{row.touchPointName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.stageName}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={row.currentScore >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {row.currentScore > 0 ? "+" : ""}{row.currentScore}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-emerald-600">+{row.futureScore}</td>
                      <td className="px-3 py-2 text-center font-medium text-primary">{row.gap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Collaborators */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Collaborators</h2>
          <div className="flex flex-wrap gap-3">
            {journey.collaborators.map((c) => (
              <div key={c.userId} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {c.userId.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.userId}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{c.role.replace("_", " ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Generated by CX Journey Studio on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>
    </>
  )
}
