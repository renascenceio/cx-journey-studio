"use client"

import { use, useRef } from "react"
import Link from "next/link"
import { useArchetype } from "@/hooks/use-archetypes"
import { useJourneys } from "@/hooks/use-journeys"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft, Download } from "lucide-react"
import type { ArchetypeCategory } from "@/lib/types"
import { ExportDialog } from "@/components/export-dialog"

const categoryLabels: Record<ArchetypeCategory, string> = {
  "e-commerce": "E-Commerce",
  banking: "Banking & Finance",
  healthcare: "Healthcare",
  saas: "SaaS",
  real_estate: "Real Estate",
  insurance: "Insurance",
  hospitality: "Hospitality",
  telecommunications: "Telecommunications",
}

function DotScale({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < score ? "bg-primary" : "bg-muted"}`}
        />
      ))}
      <span className="ml-2 text-xs font-medium text-foreground">{score}/{max}</span>
    </div>
  )
}

export default function ArchetypeReportPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const { archetype, isLoading } = useArchetype(params.id)
  const { journeys: allJourneys } = useJourneys()
  const reportRef = useRef<HTMLDivElement>(null)

  if (isLoading || !archetype) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  const linkedJourneys = allJourneys.filter((j) => j.archetypes.some((a) => a.id === archetype.id))

  const higherOrder = archetype.pillarRatings.filter((p) => p.group === "higher_order")
  const basicOrder = archetype.pillarRatings.filter((p) => p.group === "basic_order")

  return (
    <>
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          header, nav, footer { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      {/* Actions bar */}
      <div className="no-print sticky top-14 z-40 flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 lg:px-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Link href={`/archetypes/${params.id}`}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Archetype
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ExportDialog type="archetype" data={archetype} elementRef={reportRef} title={archetype.name}>
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
        {/* Header */}
        <div className="mb-10 border-b border-border pb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Archetype Report
          </p>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {archetype.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{archetype.name}</h1>
              <p className="text-base text-muted-foreground mt-1">{archetype.role}</p>
              {archetype.subtitle && (
                <p className="text-sm italic text-muted-foreground/70 mt-1">{archetype.subtitle}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {categoryLabels[archetype.category]}
                </span>
                {archetype.valueMetric && (
                  <span>Value: <strong className="text-foreground">{archetype.valueMetric}</strong></span>
                )}
                {archetype.basePercentage && (
                  <span>Base: <strong className="text-foreground">{archetype.basePercentage}</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Narratives */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Archetype Narrative</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">I Am (Description)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{archetype.description}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">I Want (Goals)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{archetype.goalsNarrative}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">I Do (Needs)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{archetype.needsNarrative}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">I Use (Touchpoints)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{archetype.touchpointsNarrative}</p>
            </div>
          </div>
        </div>

        {/* Pillar Ratings */}
        <div className="mb-10 print-break">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pillar Ratings</h2>
          <div className="grid grid-cols-2 gap-6">
            {higherOrder.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Higher Order</h3>
                <div className="flex flex-col gap-2.5">
                  {higherOrder.map((p) => (
                    <div key={p.name} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-foreground w-32 shrink-0">{p.name}</span>
                      <DotScale score={p.score} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {basicOrder.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Basic Order</h3>
                <div className="flex flex-col gap-2.5">
                  {basicOrder.map((p) => (
                    <div key={p.name} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-foreground w-32 shrink-0">{p.name}</span>
                      <DotScale score={p.score} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lists */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Detailed Attributes</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Goals", items: archetype.goals },
              { label: "Frustrations", items: archetype.frustrations },
              { label: "Behaviors", items: archetype.behaviors },
              { label: "Expectations", items: archetype.expectations },
              { label: "Barriers", items: archetype.barriers },
              { label: "Drivers", items: archetype.drivers },
              { label: "Important Steps", items: archetype.importantSteps },
              { label: "Triggers", items: archetype.triggers },
              { label: "Mindset", items: archetype.mindset },
            ]
              .filter((section) => section.items.length > 0)
              .map((section) => (
                <div key={section.label} className="rounded-lg border border-border p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {section.label}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        {/* Solution Principles */}
        {archetype.solutionPrinciples.length > 0 && (
          <div className="mb-10 print-break">
            <h2 className="text-lg font-semibold text-foreground mb-4">Solution Principles</h2>
            <div className="flex flex-col gap-2">
              {archetype.solutionPrinciples.map((principle, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Journeys */}
        {linkedJourneys.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Linked Journeys</h2>
            <div className="flex flex-col gap-2">
              {linkedJourneys.map((j) => (
                <div key={j.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{j.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{j.type} - {j.status.replace("_", " ")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {j.stages.length} stages
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Generated by CX Journey Studio on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>
    </>
  )
}
