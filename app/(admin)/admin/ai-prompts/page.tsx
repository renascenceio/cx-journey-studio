"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Save, RotateCcw, BookOpen, Users, Lightbulb, ChevronDown, ChevronUp, Map, UserPlus, PenLine } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AIPrompt {
  id: string
  category: string
  name: string
  description: string | null
  system_prompt: string
  example_output: string | null
  created_at: string
  updated_at: string
}

const categoryConfig: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  journey_generation: { icon: Map, color: "text-emerald-500", label: "Journey Generation" },
  archetype_generation: { icon: UserPlus, color: "text-cyan-500", label: "Archetype Generation" },
  journey_solutions: { icon: BookOpen, color: "text-blue-500", label: "Journey Solutions" },
  archetype_solutions: { icon: Users, color: "text-violet-500", label: "Archetype Solutions" },
  general_solutions: { icon: Lightbulb, color: "text-amber-500", label: "General Solutions" },
  words_generation: { icon: PenLine, color: "text-rose-500", label: "Words / Blog Generation" },
}

export default function AIPromptsPage() {
  const { data: prompts, isLoading, mutate } = useSWR<AIPrompt[]>("/api/ai/prompts", fetcher)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editedPrompts, setEditedPrompts] = useState<Record<string, Partial<AIPrompt>>>({})
  const [saving, setSaving] = useState<string | null>(null)

  function handleChange(id: string, field: keyof AIPrompt, value: string) {
    setEditedPrompts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  function getEditedValue(prompt: AIPrompt, field: keyof AIPrompt): string {
    return (editedPrompts[prompt.id]?.[field] as string) ?? (prompt[field] as string) ?? ""
  }

  function hasChanges(prompt: AIPrompt): boolean {
    const edited = editedPrompts[prompt.id]
    if (!edited) return false
    return Object.entries(edited).some(([key, value]) => prompt[key as keyof AIPrompt] !== value)
  }

  async function handleSave(prompt: AIPrompt) {
    const edited = editedPrompts[prompt.id]
    if (!edited) return

    setSaving(prompt.id)
    try {
      const res = await fetch("/api/ai/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: prompt.category,
          ...edited,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      // Clear local edits and refresh
      setEditedPrompts((prev) => {
        const next = { ...prev }
        delete next[prompt.id]
        return next
      })
      await mutate()
      toast.success("Prompt saved successfully")
    } catch {
      toast.error("Failed to save prompt")
    } finally {
      setSaving(null)
    }
  }

  function handleReset(prompt: AIPrompt) {
    setEditedPrompts((prev) => {
      const next = { ...prev }
      delete next[prompt.id]
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Prompts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading prompts...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">René AI Prompts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the system prompts used by René AI to generate journeys, archetypes, and solutions. Changes take effect immediately.
        </p>
      </div>

      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How René AI Prompts Work</p>
            <p className="mt-1 text-muted-foreground">
              Each prompt category is used by René AI in different contexts. The <strong>System Prompt</strong> provides 
              instructions and guidelines that shape AI behavior. The <strong>Example Output</strong> (optional) shows the AI what good output looks like.
              René AI also automatically considers all available context (journey category, archetype data, etc.) when generating content.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prompt cards */}
      <div className="flex flex-col gap-4">
        {prompts?.map((prompt) => {
          const config = categoryConfig[prompt.category] || { icon: Sparkles, color: "text-muted-foreground", label: prompt.category }
          const Icon = config.icon
          const isExpanded = expandedId === prompt.id
          const changed = hasChanges(prompt)

          return (
            <Card key={prompt.id} className={cn("border-border/60 transition-shadow", changed && "ring-2 ring-primary/20")}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted", config.color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {prompt.name}
                        {changed && <Badge variant="outline" className="text-[9px] text-primary border-primary/30">Unsaved</Badge>}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">{prompt.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="flex flex-col gap-5 border-t border-border/60 pt-5">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <Label>Display Name</Label>
                    <Input
                      value={getEditedValue(prompt, "name")}
                      onChange={(e) => handleChange(prompt.id, "name", e.target.value)}
                      placeholder="Prompt name..."
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <Label>Description</Label>
                    <Input
                      value={getEditedValue(prompt, "description")}
                      onChange={(e) => handleChange(prompt.id, "description", e.target.value)}
                      placeholder="What this prompt is used for..."
                    />
                  </div>

                  {/* System Prompt */}
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      System Prompt
                      <Badge variant="outline" className="text-[9px]">Required</Badge>
                    </Label>
                    <Textarea
                      value={getEditedValue(prompt, "system_prompt")}
                      onChange={(e) => handleChange(prompt.id, "system_prompt", e.target.value)}
                      rows={12}
                      className="font-mono text-xs leading-relaxed"
                      placeholder="Instructions for the AI..."
                    />
                    <p className="text-[10px] text-muted-foreground">
                      This is the main instruction set sent to the AI. Include guidelines, constraints, and expected output structure.
                    </p>
                  </div>

                  {/* Example Output */}
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      Example Output
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">Optional</Badge>
                    </Label>
                    <Textarea
                      value={getEditedValue(prompt, "example_output")}
                      onChange={(e) => handleChange(prompt.id, "example_output", e.target.value)}
                      rows={4}
                      className="font-mono text-xs"
                      placeholder="An example of ideal AI output..."
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Provide a concrete example of what good output looks like. This helps the AI understand the expected format and quality.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground">
                      Last updated: {new Date(prompt.updated_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReset(prompt)}
                        disabled={!changed || saving === prompt.id}
                        className="gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(prompt)}
                        disabled={!changed || saving === prompt.id}
                        className="gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving === prompt.id ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Add new prompt section */}
      <Card className="border-dashed border-border/60">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Need a new prompt category?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact your developer to add new AI prompt categories for specific use cases.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
