"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslations } from "next-intl"
import { 
  Search, BookTemplate, Layers, GitBranch, Plus, Users, Globe, User, X, Sparkles, Loader2, ChevronDown, Crown,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-provider"
import { createJourney, addStage, addStep } from "@/lib/actions/data"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { INDUSTRIES } from "@/lib/industries"
import { AILanguageSelector, useAILanguage } from "@/components/ai-language-selector"
import { AIModelSelector, useAIModel } from "@/components/ai-model-selector"

interface JourneyTemplate {
  id: string
  name: string
  description: string
  category: string
  stages: { name: string; steps: string[] }[]
  is_public: boolean
}

// Use shared INDUSTRIES from lib/industries.ts
const CATEGORIES = INDUSTRIES

export default function TemplatesPage() {
  const t = useTranslations()
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [publicCount, setPublicCount] = useState(0)
  const [myCount, setMyCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [useTemplate, setUseTemplate] = useState<JourneyTemplate | null>(null)
  const [targetType, setTargetType] = useState<"current" | "future">("current")
  const [journeyName, setJourneyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [scope, setScope] = useState<"public" | "my">("public")
  const [collabEmail, setCollabEmail] = useState("")
  const [collabEmails, setCollabEmails] = useState<string[]>([])
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiIndustry, setAiIndustry] = useState("e-commerce")
  const [aiGenerating, setAiGenerating] = useState(false)
  const { language: aiLanguage, setLanguage: setAiLanguage, getPromptPrefix } = useAILanguage(aiPrompt)
  const { modelId: aiModelId, setModelId: setAiModelId, model: aiModel, estimatedCredits } = useAIModel()
  const router = useRouter()

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: aiPrompt, 
          industry: aiIndustry,
          language: aiLanguage,
          languagePromptPrefix: getPromptPrefix(),
          modelId: aiModelId,
        }),
      })
      if (!res.ok) throw new Error("Generation failed")
      const { template } = await res.json()
      if (template) {
        // Save the template
        const saveRes = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            description: template.description,
            category: template.category || aiIndustry,
            stages: (template.stages || []).map((s: { name: string; steps?: { name: string }[] }) => ({
              name: s.name,
              steps: (s.steps || []).map((st: { name: string }) => st.name),
            })),
            is_public: false,
          }),
        })
        if (!saveRes.ok) throw new Error("Save failed")
        setAiDialogOpen(false)
        setAiPrompt("")
        setScope("my")
        // Re-fetch templates
        fetch(`/api/admin/templates?scope=my`)
          .then((r) => r.json())
          .then((data) => setTemplates(Array.isArray(data) ? data : []))
        toast.success(`AI template "${template.name}" created and saved to My Templates`)
      }
    } catch {
      toast.error("AI template generation failed. Check your API key in admin settings.")
    } finally {
      setAiGenerating(false)
    }
  }

// Fetch counts for both tabs on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/templates?scope=public").then(r => r.json()),
      fetch("/api/admin/templates?scope=my").then(r => r.json()),
    ]).then(([publicData, myData]) => {
      setPublicCount(Array.isArray(publicData) ? publicData.length : 0)
      setMyCount(Array.isArray(myData) ? myData.length : 0)
    }).catch(() => {})
  }, [])

  useEffect(() => {
  setIsLoading(true)
  fetch(`/api/admin/templates?scope=${scope}`)
  .then((r) => r.json())
  .then((data) => {
  setTemplates(Array.isArray(data) ? data : [])
  // Update the count for the current scope
  if (scope === "public") setPublicCount(data.length)
  else setMyCount(data.length)
  setIsLoading(false)
  })
  .catch(() => setIsLoading(false))
  }, [scope])

  // JDS-014: Order categories by frequency of use (most templates first)
  const orderedCategories = useMemo(() => {
    const counts: Record<string, number> = {}
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return CATEGORIES
      .filter(c => counts[c.value] > 0)
      .sort((a, b) => (counts[b.value] || 0) - (counts[a.value] || 0))
  }, [templates])
  
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)

  const filtered = useMemo(() => {
    let items = templates
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      )
    }
    if (selectedCategory !== "all") {
      items = items.filter((t) => t.category === selectedCategory)
    }
    return items
  }, [search, selectedCategory, templates])

  async function handleUseTemplate() {
    if (!useTemplate || !journeyName.trim()) return
    setCreating(true)
    try {
      const result = await createJourney({
        title: journeyName,
        description: useTemplate.description,
        type: targetType,
        tags: [useTemplate.category],
      })
      if (result?.id) {
        // Create stages and steps from template
        for (let i = 0; i < useTemplate.stages.length; i++) {
          const stageTemplate = useTemplate.stages[i]
          const stageResult = await addStage(result.id, stageTemplate.name)
          if (stageResult?.id) {
            for (const stepName of stageTemplate.steps) {
              await addStep(stageResult.id, result.id, stepName)
            }
          }
        }
        // Invite collaborators if any were added
        if (collabEmails.length > 0) {
          for (const email of collabEmails) {
            try {
              await fetch(`/api/journeys/${result.id}/collaborators`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              })
            } catch {
              // Continue even if an invite fails
            }
          }
          toast.success(`Created "${journeyName}" and invited ${collabEmails.length} collaborator${collabEmails.length > 1 ? "s" : ""}`)
        } else {
          toast.success(`Created "${journeyName}" from template`)
        }
        setCollabEmails([])
        router.push(`/journeys/${result.id}`)
      }
    } catch {
      toast.error("Failed to create journey from template")
    }
    setCreating(false)
    setUseTemplate(null)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      <Toaster />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("templates.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("templates.subtitle")}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAiDialogOpen(true)}>
          <Sparkles className="h-3.5 w-3.5" />
          {t("templates.generateWithAI")}
        </Button>
      </div>

      {/* AI Generate Template Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("templates.generateAITitle")}
            </DialogTitle>
            <DialogDescription>
              {t("templates.generateAIDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>{t("templates.industry")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      {(() => {
                        const cat = CATEGORIES.find(c => c.value === aiIndustry)
                        if (cat) {
                          const Icon = cat.icon
                          return <><Icon className="h-3.5 w-3.5" />{t(cat.labelKey)}</>
                        }
                        return "Select industry..."
                      })()}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="flex gap-4">
                    {(() => {
                      const columns: typeof CATEGORIES[] = []
                      for (let i = 0; i < CATEGORIES.length; i += 8) {
                        columns.push(CATEGORIES.slice(i, i + 8))
                      }
                      return columns.map((col, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-0.5">
                          {col.map(cat => {
                            const Icon = cat.icon
                            return (
                              <button
                                key={cat.value}
                                onClick={() => setAiIndustry(cat.value)}
                                className={cn(
                                  "flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-md transition-colors whitespace-nowrap",
                                  aiIndustry === cat.value
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                )}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {t(cat.labelKey)}
                              </button>
                            )
                          })}
                        </div>
                      ))
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("templates.describeJourney")}</Label>
              <Textarea
                placeholder={t("templates.describeJourneyPlaceholder")}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("ai.generationLanguage")}</Label>
              <AILanguageSelector
                value={aiLanguage}
                onChange={setAiLanguage}
                assetName={aiPrompt}
                showDetectedBadge={true}
              />
              <p className="text-xs text-muted-foreground">
                {t("ai.generationLanguageDesc")}
              </p>
            </div>
            <AIModelSelector
              value={aiModelId}
              onChange={setAiModelId}
              showCostEstimate={true}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)} disabled={aiGenerating}>{t("common.cancel")}</Button>
            <Button onClick={handleAiGenerate} disabled={!aiPrompt.trim() || aiGenerating} className="gap-1.5">
              {aiGenerating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("templates.generating")}</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />{t("templates.generateTemplate")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Tabs: Studio Templates / My Templates */}
      <Tabs value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
        <TabsList className="h-auto p-1 w-fit">
<TabsTrigger value="public" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
  <Crown className="h-3.5 w-3.5" />
  <span>{t("templates.studio")}</span>
  <Badge variant="secondary" className={cn("ml-1 text-[9px] px-1.5 h-5", scope !== "public" && "opacity-50")}>
  {scope === "public" ? filtered.length : publicCount}
  </Badge>
  </TabsTrigger>
  <TabsTrigger value="my" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
  <User className="h-3.5 w-3.5" />
  <span>{t("templates.myTemplates")}</span>
  <Badge variant="secondary" className={cn("ml-1 text-[9px] px-1.5 h-5", scope !== "my" && "opacity-50")}>
  {scope === "my" ? filtered.length : myCount}
  </Badge>
  </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-52 justify-between text-xs">
              <span className="flex items-center gap-2">
                {selectedCategory === "all" ? (
                  `${t("templates.allCategories")} (${templates.length})`
                ) : (() => {
                  const cat = CATEGORIES.find(c => c.value === selectedCategory)
                  if (cat) {
                    const Icon = cat.icon
                    return <><Icon className="h-3.5 w-3.5" />{t(cat.labelKey)}</>
                  }
                  return selectedCategory
                })()}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="flex gap-4">
              {(() => {
                const allItems = [
                  { value: "all", labelKey: "common.all", icon: null as LucideIcon | null, count: templates.length },
                  ...CATEGORIES.map(cat => ({
                    value: cat.value,
                    labelKey: cat.labelKey,
                    icon: cat.icon as LucideIcon | null,
                    count: templates.filter(t => t.category === cat.value).length
                  }))
                ]
                const columns: typeof allItems[] = []
                for (let i = 0; i < allItems.length; i += 8) {
                  columns.push(allItems.slice(i, i + 8))
                }
                return columns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-0.5">
                    {col.map(item => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.value}
                          onClick={() => { setSelectedCategory(item.value); setCategoryDropdownOpen(false) }}
                          className={cn(
                            "flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-md transition-colors whitespace-nowrap",
                            selectedCategory === item.value
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                          {t(item.labelKey)}{item.count > 0 ? ` (${item.count})` : ""}
                        </button>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>
          </PopoverContent>
        </Popover>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder={t("templates.searchTemplates")} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56 pl-8 text-sm" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <BookTemplate className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">{t("templates.noTemplates")}</p>
            <p className="text-xs text-muted-foreground">{t("templates.noTemplatesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <Card key={template.id} className="group flex flex-col transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-normal capitalize">{template.category}</Badge>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-foreground">{template.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{template.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                {/* Stages preview */}
                <div className="flex flex-wrap gap-1.5">
                  {template.stages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5">
                      <span className="text-[10px] font-medium text-foreground">{stage.name}</span>
                      <span className="text-[9px] text-muted-foreground">({stage.steps.length})</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{template.stages.length} {t("templates.stages")}</span>
                  <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{template.stages.reduce((s, st) => s + st.steps.length, 0)} {t("templates.steps")}</span>
                </div>

                {/* Action */}
                <div className="mt-auto border-t border-border/50 pt-3">
                  <Button
                    size="sm"
                    className="h-7 w-full text-xs"
                    onClick={() => {
                      setUseTemplate(template)
                      setJourneyName(`${template.name}`)
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {t("templates.useTemplate")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Use Template Dialog */}
      <Dialog open={!!useTemplate} onOpenChange={(open) => !open && setUseTemplate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Use Template</DialogTitle>
            <DialogDescription>Create a new journey from &ldquo;{useTemplate?.name}&rdquo;</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="journey-name" className="text-sm">Journey Name</Label>
              <Input id="journey-name" value={journeyName} onChange={(e) => setJourneyName(e.target.value)} className="h-9" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="journey-type" className="text-sm">Journey Type</Label>
              <Select value={targetType} onValueChange={(v) => setTargetType(v as "current" | "future")}>
                <SelectTrigger id="journey-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Journey</SelectItem>
                  <SelectItem value="future">Future Journey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* JDS-016: Add Collaborators */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm">
                <Users className="mr-1 inline h-3 w-3" />
                Invite Collaborators <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="colleague@company.com"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && collabEmail.trim() && collabEmail.includes("@")) {
                      e.preventDefault()
                      if (!collabEmails.includes(collabEmail.trim())) {
                        setCollabEmails([...collabEmails, collabEmail.trim()])
                      }
                      setCollabEmail("")
                    }
                  }}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0"
                  disabled={!collabEmail.trim() || !collabEmail.includes("@")}
                  onClick={() => {
                    if (!collabEmails.includes(collabEmail.trim())) {
                      setCollabEmails([...collabEmails, collabEmail.trim()])
                    }
                    setCollabEmail("")
                  }}
                >
                  Add
                </Button>
              </div>
              {collabEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {collabEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="text-[10px] gap-1 pr-1">
                      {email}
                      <button
                        onClick={() => setCollabEmails(collabEmails.filter((e) => e !== email))}
                        className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                        <span className="sr-only">Remove {email}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseTemplate(null)}>Cancel</Button>
            <Button onClick={handleUseTemplate} disabled={!journeyName.trim() || creating}>
              {creating ? "Creating..." : "Create Journey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
