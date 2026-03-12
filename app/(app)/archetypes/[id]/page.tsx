"use client"

import { use } from "react"
import { useTranslations } from "next-intl"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Target,
  Frown,
  Activity,
  Users,
  ShieldCheck,
  Zap,
  Footprints,
  Brain,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  FileText,
  User,
  Heart,
  MapPin,
  Compass,
  Plus,
  Trash2,
} from "lucide-react"
import { useArchetype } from "@/hooks/use-archetypes"
import { InlineRenameTitle } from "@/components/inline-rename-title"
import { renameArchetype } from "@/lib/actions/data"
import { useJourneys } from "@/hooks/use-journeys"
import type { ArchetypeCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"
import { useTheme } from "next-themes"
import { useEffect, useState, useMemo, useRef } from "react"
import { ExportDialog } from "@/components/export-dialog"
import { Download } from "lucide-react"
import { getIndustryLabelKey } from "@/lib/industries"

const categoryColors: Record<ArchetypeCategory, string> = {
  "e-commerce": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  banking: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  healthcare: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  saas: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  real_estate: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  insurance: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  hospitality: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  telecommunications: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
}

const accentColor = "#4f6bed"

// CX Archetype field tooltips
const fieldTooltips: Record<string, string> = {
  description: "A brief narrative describing who this customer archetype is, their background, and defining characteristics.",
  goals: "What this archetype is trying to achieve through their customer journey. Their desired outcomes and objectives.",
  needs: "The underlying requirements and necessities that drive this archetype's behavior and decisions.",
  touchpoints: "The channels, platforms, and interaction points where this archetype engages with the brand or service.",
  expectations: "What this archetype anticipates from their experience - the standards they hold for service, quality, and outcomes.",
  barriers: "Obstacles, pain points, and friction that prevent this archetype from achieving their goals or completing their journey.",
  drivers: "The motivations and factors that push this archetype forward in their journey and influence their decisions.",
  importantSteps: "Critical moments and key actions in the customer journey that significantly impact this archetype's experience.",
  triggers: "Events, situations, or stimuli that initiate this archetype's journey or prompt them to take action.",
  mindset: "The psychological state, attitudes, and mental framework this archetype brings to their customer experience.",
  solutionPrinciples: "Design guidelines and principles that should govern how solutions are created for this archetype.",
  valuesMissions: "Core beliefs and purpose that guide this archetype's choices and define what matters most to them.",
  needsServices: "Specific services and support this archetype requires to have a successful experience.",
  pillarRatings: "Scores across key CX pillars indicating how important each dimension is to this archetype's experience.",
  radarCharts: "Visual representation of this archetype's profile across multiple dimensions and attributes.",
}

function FieldTooltip({ field }: { field: string }) {
  const tooltip = fieldTooltips[field]
  if (!tooltip) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

import { getInitials } from "@/lib/utils"

function DotScale({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            i < score ? "bg-primary" : "bg-muted-foreground/15"
          )}
        />
      ))}
    </div>
  )
}

function useChartColors() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return theme-appropriate colors directly based on resolvedTheme
  // This ensures immediate updates when theme changes
  const colors = useMemo(() => {
    if (!mounted) return { text: "#6b7280", grid: "#e5e7eb", theme: "light" }
    
    const isDark = resolvedTheme === "dark"
    return {
      text: isDark ? "#a1a1aa" : "#71717a",
      grid: isDark ? "#3f3f46" : "#e4e4e7",
      theme: resolvedTheme || "light"
    }
  }, [resolvedTheme, mounted])

  return colors
}

export default function ArchetypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations()
  const { id } = use(params)
  const { archetype, isLoading, mutate } = useArchetype(id)
  const { journeys: allJourneys } = useJourneys()
  const chartColors = useChartColors()
  const contentRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [editPillars, setEditPillars] = useState<{ name: string; score: number; group: string }[]>([])
  const [editRadarCharts, setEditRadarCharts] = useState<{ label: string; dimensions: { axis: string; value: number }[] }[]>([])
  const [saving, setSaving] = useState(false)

  function startEdit() {
    if (!archetype) return
    
    // Set pillar ratings as structured objects
    setEditPillars(archetype.pillarRatings.map(p => ({ name: p.name, score: p.score, group: p.group })))
    // Set radar charts as structured objects
    setEditRadarCharts(archetype.radarCharts.map(c => ({ 
      label: c.label, 
      dimensions: c.dimensions.map(d => ({ axis: d.axis, value: d.value })) 
    })))
  
    setEditFields({
      name: archetype.name,
      role: archetype.role,
      subtitle: archetype.subtitle || "",
      description: archetype.description,
      goalsNarrative: archetype.goalsNarrative || "",
      needsNarrative: archetype.needsNarrative || "",
      touchpointsNarrative: archetype.touchpointsNarrative || "",
      goals: archetype.goals.join("\n"),
      frustrations: archetype.frustrations.join("\n"),
      behaviors: archetype.behaviors.join("\n"),
      expectations: archetype.expectations.join("\n"),
      barriers: archetype.barriers.join("\n"),
      drivers: archetype.drivers.join("\n"),
      importantSteps: archetype.importantSteps.join("\n"),
      triggers: archetype.triggers.join("\n"),
      mindset: archetype.mindset.join("\n"),
      solutionPrinciples: archetype.solutionPrinciples.join("\n"),
      valueMetric: archetype.valueMetric || "",
      basePercentage: archetype.basePercentage || "",
    })
    setEditing(true)
  }
  
  // Helper to update a single pillar score
  function updatePillarScore(index: number, newScore: number) {
    setEditPillars(prev => prev.map((p, i) => i === index ? { ...p, score: newScore } : p))
  }
  
  // Helper to update radar chart dimension
  function updateRadarDimension(chartIndex: number, dimIndex: number, field: "axis" | "value", newValue: string | number) {
    setEditRadarCharts(prev => prev.map((chart, ci) => {
      if (ci !== chartIndex) return chart
      return {
        ...chart,
        dimensions: chart.dimensions.map((dim, di) => {
          if (di !== dimIndex) return dim
          return { ...dim, [field]: field === "value" ? Number(newValue) : newValue }
        })
      }
    }))
  }
  
  // Helper to add a dimension to a radar chart
  function addRadarDimension(chartIndex: number) {
    setEditRadarCharts(prev => prev.map((chart, ci) => {
      if (ci !== chartIndex) return chart
      return { ...chart, dimensions: [...chart.dimensions, { axis: "New Dimension", value: 50 }] }
    }))
  }
  
  // Helper to remove a dimension from a radar chart
  function removeRadarDimension(chartIndex: number, dimIndex: number) {
    setEditRadarCharts(prev => prev.map((chart, ci) => {
      if (ci !== chartIndex) return chart
      return { ...chart, dimensions: chart.dimensions.filter((_, di) => di !== dimIndex) }
    }))
  }
  
  // Helper to update radar chart label
  function updateRadarChartLabel(chartIndex: number, newLabel: string) {
    setEditRadarCharts(prev => prev.map((chart, ci) => ci === chartIndex ? { ...chart, label: newLabel } : chart))
  }

  async function handleSave() {
    if (saving) return // Prevent double submission
    setSaving(true)
    try {
      const res = await fetch(`/api/archetypes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFields.name?.trim(),
          role: editFields.role?.trim(),
          subtitle: editFields.subtitle?.trim(),
          description: editFields.description?.trim(),
          goals_narrative: editFields.goalsNarrative?.trim(),
          needs_narrative: editFields.needsNarrative?.trim(),
          touchpoints_narrative: editFields.touchpointsNarrative?.trim(),
          goals: editFields.goals?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          frustrations: editFields.frustrations?.split("\n").map((f: string) => f.trim()).filter(Boolean),
          behaviors: editFields.behaviors?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          expectations: editFields.expectations?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          barriers: editFields.barriers?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          drivers: editFields.drivers?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          important_steps: editFields.importantSteps?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          triggers: editFields.triggers?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          mindset: editFields.mindset?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          solution_principles: editFields.solutionPrinciples?.split("\n").map((g: string) => g.trim()).filter(Boolean),
          value_metric: editFields.valueMetric?.trim() || null,
          base_percentage: editFields.basePercentage?.trim() || null,
          pillar_ratings: editPillars,
          radar_charts: editRadarCharts,
        }),
      })
      if (!res.ok) throw new Error()
      await mutate()
      setEditing(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !archetype) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  const relatedJourneys = allJourneys.filter((j) => j.archetypes.some((a) => a.id === archetype.id))
  const higherOrder = archetype.pillarRatings.filter((p) => p.group === "higher_order")
  const basicOrder = archetype.pillarRatings.filter((p) => p.group === "basic_order")

  return (
    <TooltipProvider delayDuration={200}>
    <div ref={contentRef} className="mx-auto max-w-7xl px-4 py-6 lg:px-6 bg-background">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/archetypes" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Archetypes
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                <X className="mr-1.5 h-3.5 w-3.5" />Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1.5 h-3.5 w-3.5" />{saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <ExportDialog type="archetype" data={archetype} elementRef={contentRef} title={archetype.name}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </ExportDialog>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Edit Archetype
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ============ ROW 1: Narrative blocks ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-6">
        {[
          { label: "Description", sub: "I am", content: archetype.description, field: "description", tooltipKey: "description", icon: User, color: "text-blue-600 dark:text-blue-400" },
          { label: "Goals", sub: "I want", content: archetype.goalsNarrative, field: "goalsNarrative", tooltipKey: "goals", icon: Target, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Needs", sub: "I do", content: archetype.needsNarrative, field: "needsNarrative", tooltipKey: "needs", icon: Heart, color: "text-rose-600 dark:text-rose-400" },
          { label: "Touchpoints", sub: "I use", content: archetype.touchpointsNarrative, field: "touchpointsNarrative", tooltipKey: "touchpoints", icon: MapPin, color: "text-violet-600 dark:text-violet-400" },
        ].map((block) => (
          <Card key={block.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-0.5 flex items-center gap-1.5">
                <block.icon className={cn("h-3.5 w-3.5", block.color)} />
                {block.label} <span className="font-normal text-muted-foreground">({block.sub})</span>
                <FieldTooltip field={block.tooltipKey} />
              </p>
              {editing ? (
                <Textarea
                  className="mt-2 text-xs resize-none"
                  rows={3}
                  value={editFields[block.field] || ""}
                  onChange={(e) => setEditFields({ ...editFields, [block.field]: e.target.value })}
                />
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground mt-2">{block.content}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============ ROW 2: Identity card + Radar charts ============ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 mb-6">
        {/* Identity sidebar */}
        <Card className="lg:col-span-3 border-border/60 overflow-hidden bg-primary/5 dark:bg-primary/10">
          <div className="flex flex-col items-center gap-3 px-5 py-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">
                {getInitials(archetype.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              {editing ? (
                <div className="flex flex-col gap-1.5 px-2">
                  <Input className="text-center h-8 text-sm font-bold bg-background" value={editFields.name || ""} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} />
                  <Input className="text-center h-7 text-xs bg-background" value={editFields.role || ""} onChange={(e) => setEditFields({ ...editFields, role: e.target.value })} placeholder="Role" />
                  <Input className="text-center h-7 text-xs bg-background" value={editFields.subtitle || ""} onChange={(e) => setEditFields({ ...editFields, subtitle: e.target.value })} placeholder="Subtitle" />
                </div>
              ) : (
                <>
                  <InlineRenameTitle
                    value={archetype.name}
                    className="text-lg text-center justify-center"
                    onRename={async (newName) => { await renameArchetype(archetype.id, newName); mutate() }}
                  />
                  {archetype.subtitle && (
                    <p className="text-[11px] text-muted-foreground italic mt-0.5 text-center">{archetype.subtitle}</p>
                  )}
                </>
              )}
<Badge variant="outline" className={cn("mt-2 text-[10px]", categoryColors[archetype.category])}>
              {t(getIndustryLabelKey(archetype.category))}
            </Badge>
            </div>
            {editing ? (
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center">
                  <Input 
                    className="text-center h-8 text-lg font-bold w-20 bg-background" 
                    value={editFields.valueMetric || ""} 
                    onChange={(e) => setEditFields({ ...editFields, valueMetric: e.target.value })} 
                    placeholder="$0"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Total Value</p>
                </div>
                <div className="text-center">
                  <Input 
                    className="text-center h-8 text-lg font-bold w-20 bg-background" 
                    value={editFields.basePercentage || ""} 
                    onChange={(e) => setEditFields({ ...editFields, basePercentage: e.target.value })} 
                    placeholder="0%"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Customer Base</p>
                </div>
              </div>
            ) : (
              (archetype.valueMetric && archetype.valueMetric !== "N/A") && (
                <div className="flex items-center gap-6 mt-2">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{archetype.valueMetric}</p>
                    <p className="text-[10px] text-muted-foreground">Total Value</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{archetype.basePercentage}</p>
                    <p className="text-[10px] text-muted-foreground">Customer Base</p>
                  </div>
                </div>
              )
            )}
          </div>
          <CardContent className="p-4 flex flex-col gap-3">
            {editing ? (
              <>
                {/* Higher Order Pillars - Editable */}
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Higher Order Pillars
                    <FieldTooltip field="pillarRatings" />
                  </p>
                  <div className="flex flex-col gap-3">
                    {editPillars.filter(p => p.group === "higher_order").map((p) => {
                      const globalIdx = editPillars.findIndex(ep => ep.name === p.name && ep.group === p.group)
                      return (
                        <div key={p.name} className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-foreground w-20 shrink-0">{p.name}</span>
                          <Slider
                            value={[p.score]}
                            min={0}
                            max={10}
                            step={1}
                            onValueChange={(val) => updatePillarScore(globalIdx, val[0])}
                            className="flex-1"
                          />
                          <span className="text-[11px] font-bold text-primary w-8 text-right">{p.score}/10</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {/* Basic Order Pillars - Editable */}
                <div className="border-t border-border/50 pt-3">
                  <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Basic Order Pillars
                  </p>
                  <div className="flex flex-col gap-3">
                    {editPillars.filter(p => p.group === "basic_order").map((p) => {
                      const globalIdx = editPillars.findIndex(ep => ep.name === p.name && ep.group === p.group)
                      return (
                        <div key={p.name} className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-foreground w-20 shrink-0">{p.name}</span>
                          <Slider
                            value={[p.score]}
                            min={0}
                            max={10}
                            step={1}
                            onValueChange={(val) => updatePillarScore(globalIdx, val[0])}
                            className="flex-1"
                          />
                          <span className="text-[11px] font-bold text-primary w-8 text-right">{p.score}/10</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Higher Order Pillars */}
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Higher Order Pillars
                  </p>
                  <div className="flex flex-col gap-2">
                    {higherOrder.map((p) => (
                      <div key={p.name} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-foreground w-24 shrink-0">{p.name}</span>
                        <DotScale score={p.score} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Basic Order Pillars */}
                <div className="border-t border-border/50 pt-3">
                  <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Basic Order Pillars
                  </p>
                  <div className="flex flex-col gap-2">
                    {basicOrder.map((p) => (
                      <div key={p.name} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-foreground w-24 shrink-0">{p.name}</span>
                        <DotScale score={p.score} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Radar Charts */}
        <div className={cn(
          "grid gap-4",
          archetype.radarCharts.length === 1 ? "lg:col-span-9 grid-cols-1" : "lg:col-span-9 grid-cols-1 md:grid-cols-2"
        )}>
          {editing ? (
            editRadarCharts.map((chart, chartIdx) => (
              <Card key={chartIdx} className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <Input
                      value={chart.label}
                      onChange={(e) => updateRadarChartLabel(chartIdx, e.target.value)}
                      className="text-xs font-bold uppercase h-7 px-2"
                      placeholder="Chart label..."
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-col gap-3">
                    {chart.dimensions.map((dim, dimIdx) => (
                      <div key={dimIdx} className="flex items-center gap-2">
                        <Input
                          value={dim.axis}
                          onChange={(e) => updateRadarDimension(chartIdx, dimIdx, "axis", e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="text-[11px] h-7 px-2 w-28 shrink-0"
                          placeholder="Axis name..."
                        />
                        <Slider
                          value={[dim.value]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(val) => updateRadarDimension(chartIdx, dimIdx, "value", val[0])}
                          className="flex-1"
                        />
                        <span className="text-[11px] font-bold text-primary w-8 text-right">{dim.value}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRadarDimension(chartIdx, dimIdx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 mt-1"
                      onClick={() => addRadarDimension(chartIdx)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Dimension
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            archetype.radarCharts.map((chart, chartIndex) => {
              // Different colors for each radar chart - vibrant with good contrast
              const radarColors = [
                { stroke: "#3b82f6", fill: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" }, // blue
                { stroke: "#10b981", fill: "#10b981", glow: "rgba(16, 185, 129, 0.3)" }, // emerald
                { stroke: "#8b5cf6", fill: "#8b5cf6", glow: "rgba(139, 92, 246, 0.3)" }, // violet
                { stroke: "#f59e0b", fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)" }, // amber
                { stroke: "#ef4444", fill: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" }, // red
                { stroke: "#06b6d4", fill: "#06b6d4", glow: "rgba(6, 182, 212, 0.3)" }, // cyan
                { stroke: "#ec4899", fill: "#ec4899", glow: "rgba(236, 72, 153, 0.3)" }, // pink
              ]
              const chartColor = radarColors[chartIndex % radarColors.length]
              const gradientId = `radarGradient-${chartIndex}-${chartColors.theme}`
              
              return (
                <Card key={`${chart.label}-${chartColors.theme}`} className="border-border/60 overflow-hidden">
                  <CardHeader className="pb-0 pt-4 px-4">
                    <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" style={{ color: chartColor.stroke }} />
                      {chart.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart 
                        key={`radar-${chartIndex}-${chartColors.theme}`}
                        data={chart.dimensions.map((d, i) => {
                          const baseAxis = d.axis || `Dim ${i + 1}`
                          const count = chart.dimensions.slice(0, i).filter(x => x.axis === d.axis).length
                          return { 
                            axis: count > 0 ? `${baseAxis} (${count + 1})` : baseAxis, 
                            value: d.value
                          }
                        })}
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                      >
                        <defs>
                          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor.fill} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={chartColor.fill} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <PolarGrid 
                          stroke={chartColors.grid} 
                          strokeOpacity={0.6}
                          gridType="polygon"
                        />
                        <PolarAngleAxis
                          dataKey="axis"
                          tick={{ fontSize: 10, fill: chartColors.text, fontWeight: 500 }}
                          tickLine={false}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 8, fill: chartColors.text }}
                          tickCount={5}
                          axisLine={false}
                        />
                        <Radar
                          name={chart.label}
                          dataKey="value"
                          stroke={chartColor.stroke}
                          fill={`url(#${gradientId})`}
                          strokeWidth={2.5}
                          dot={{ 
                            r: 4, 
                            fill: chartColor.fill, 
                            stroke: chartColors.theme === "dark" ? "#1f1f23" : "#ffffff",
                            strokeWidth: 2 
                          }}
                          activeDot={{ 
                            r: 6, 
                            fill: chartColor.fill, 
                            stroke: chartColors.theme === "dark" ? "#1f1f23" : "#ffffff",
                            strokeWidth: 2 
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center pb-2 text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <span 
                          className="h-2.5 w-2.5 rounded-full" 
                          style={{ 
                            backgroundColor: chartColor.fill,
                            boxShadow: `0 0 6px ${chartColor.glow}`
                          }} 
                        />
                        <span className="font-medium">{chart.label}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* ============ ROW 3: Lists grid ============ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: "Expectations", items: archetype.expectations, icon: Target, color: "text-blue-600 dark:text-blue-400", field: "expectations", tooltipKey: "expectations" },
          { label: "Barriers", items: archetype.barriers, icon: AlertTriangle, color: "text-red-600 dark:text-red-400", field: "barriers", tooltipKey: "barriers" },
          { label: "Drivers", items: archetype.drivers, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", field: "drivers", tooltipKey: "drivers" },
          { label: "Mindset", items: archetype.mindset, icon: Brain, color: "text-violet-600 dark:text-violet-400", field: "mindset", tooltipKey: "mindset" },
        ].map((block) => (
          <Card key={block.label} className="border-border/60">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5 border-b border-border/50 pb-2">
                <block.icon className={cn("h-3.5 w-3.5", block.color)} />
                {block.label}
                <FieldTooltip field={block.tooltipKey} />
              </h3>
              {editing ? (
                <Textarea
                  className="text-xs resize-none"
                  rows={4}
                  placeholder="Comma-separated values..."
                  value={editFields[block.field] || ""}
                  onChange={(e) => setEditFields({ ...editFields, [block.field]: e.target.value })}
                />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {block.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {[
          { label: "Important Steps", items: archetype.importantSteps, icon: Footprints, color: "text-primary", field: "importantSteps", tooltipKey: "importantSteps" },
          { label: "Triggers", items: archetype.triggers, icon: Zap, color: "text-amber-600 dark:text-amber-400", field: "triggers", tooltipKey: "triggers" },
          { label: "Key Behaviors", items: archetype.behaviors, icon: Activity, color: "text-blue-600 dark:text-blue-400", field: "behaviors", tooltipKey: "touchpoints" },
        ].map((block) => (
          <Card key={block.label} className="border-border/60">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5 border-b border-border/50 pb-2">
                <block.icon className={cn("h-3.5 w-3.5", block.color)} />
                {block.label}
                <FieldTooltip field={block.tooltipKey} />
              </h3>
              {editing ? (
                <Textarea
                  className="text-xs resize-none"
                  rows={4}
                  placeholder="Comma-separated values..."
                  value={editFields[block.field] || ""}
                  onChange={(e) => setEditFields({ ...editFields, [block.field]: e.target.value })}
                />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {block.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============ ROW 4: Values, Needs, Touchpoints Lists ============ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {[
          { label: "Values / Missions", items: archetype.goals, icon: Compass, color: "text-emerald-600 dark:text-emerald-400", field: "goals", tooltipKey: "valuesMissions" },
          { label: "Needs / Services", items: archetype.frustrations, icon: Heart, color: "text-rose-600 dark:text-rose-400", field: "frustrations", tooltipKey: "needsServices" },
          { label: "Touchpoints", items: archetype.behaviors, icon: MapPin, color: "text-violet-600 dark:text-violet-400", field: "behaviors", tooltipKey: "touchpoints" },
        ].map((block) => (
          <Card key={block.label} className="border-border/60">
            <CardContent className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-1.5 border-b border-border/50 pb-2">
                <block.icon className={cn("h-3.5 w-3.5", block.color)} />
                {block.label}
                <FieldTooltip field={block.tooltipKey} />
              </h3>
              {editing ? (
                <Textarea
                  className="text-xs resize-none"
                  rows={4}
                  placeholder="Comma-separated values..."
                  value={editFields[block.field] || ""}
                  onChange={(e) => setEditFields({ ...editFields, [block.field]: e.target.value })}
                />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {block.items.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============ ROW 5: Solution Principles ============ */}
      <Card className="border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04] mb-6">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Solution Principles
            <FieldTooltip field="solutionPrinciples" />
          </h3>
          {editing ? (
            <Textarea
              className="text-sm resize-none"
              rows={6}
              placeholder="One principle per line..."
              value={editFields.solutionPrinciples || ""}
              onChange={(e) => setEditFields({ ...editFields, solutionPrinciples: e.target.value })}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {archetype.solutionPrinciples.map((principle, i) => {
                // Highlight text after "the experience must" in bold
                const lowerPrinciple = principle.toLowerCase()
                const mustIndex = lowerPrinciple.indexOf("the experience must")
                if (mustIndex !== -1) {
                  const beforeMust = principle.slice(0, mustIndex + "the experience must".length)
                  const afterMust = principle.slice(mustIndex + "the experience must".length)
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">
                        {beforeMust}<span className="font-bold">{afterMust}</span>
                      </p>
                    </div>
                  )
                }
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">{principle}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ ROW 6: Linked Journeys ============ */}
      {relatedJourneys.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              Linked Journeys ({relatedJourneys.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {relatedJourneys.map((j) => (
              <Link key={j.id} href={`/journeys/${j.id}`}>
                <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-4 py-3 hover:bg-muted/30 transition-colors">
                  <Badge variant="outline" className="text-[9px] capitalize shrink-0">{j.type}</Badge>
                  <span className="text-sm font-medium text-foreground truncate flex-1">{j.title}</span>
                  <Badge variant="secondary" className="text-[9px] capitalize shrink-0">{j.status.replace("_", " ")}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  )
}
