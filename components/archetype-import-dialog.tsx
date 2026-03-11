"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Upload,
  FileText,
  Sparkles,
  FileImage,
  Presentation,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  Target,
  Frown,
  Lightbulb,
  Activity,
  ShieldCheck,
  Brain,
} from "lucide-react"

type ImportMode = "file" | "paste" | "ai"
type ImportStep = "choose" | "input" | "processing" | "preview"

interface ParsedArchetype {
  name: string
  role: string
  subtitle: string | null
  category: string
  description: string
  goalsNarrative: string
  needsNarrative: string
  touchpointsNarrative: string
  goals: string[]
  frustrations: string[]
  behaviors: string[]
  expectations: string[]
  barriers: string[]
  drivers: string[]
  importantSteps: string[]
  triggers: string[]
  mindset: string[]
  solutionPrinciples: string[]
  valueMetric: string | null
  basePercentage: string | null
  pillarRatings: { name: string; score: number; group: string }[]
  radarCharts: { label: string; dimensions: { axis: string; value: number }[] }[]
  tags: string[]
  confidence: number
  notes: string | null
}

interface ArchetypeImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (archetype: ParsedArchetype) => void
}

function MiniDotScale({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < score ? "bg-primary" : "bg-muted-foreground/15"
          )}
        />
      ))}
    </div>
  )
}

export function ArchetypeImportDialog({ open, onOpenChange, onImportComplete }: ArchetypeImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("choose")
  const [mode, setMode] = useState<ImportMode>("file")
  const [pasteContent, setPasteContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileContent, setFileContent] = useState("")
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedArchetype, setParsedArchetype] = useState<ParsedArchetype | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("choose")
    setMode("file")
    setPasteContent("")
    setFileName("")
    setFileContent("")
    setError("")
    setIsProcessing(false)
    setParsedArchetype(null)
  }

  function handleClose(val: boolean) {
    if (!val) reset()
    onOpenChange(val)
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase()
    const validExts = ["md", "markdown", "csv", "txt", "json"]
    const pdfSlideExts = ["pdf", "pptx", "ppt"]

    if (!validExts.includes(ext || "") && !pdfSlideExts.includes(ext || "")) {
      setError(`Unsupported file type: .${ext}. Supported: .md, .csv, .txt, .json, .pdf, .pptx`)
      return
    }

    setFileName(file.name)
    setError("")

    if (pdfSlideExts.includes(ext || "")) {
      setFileContent(`[Uploaded file: ${file.name}]\n\nThis is a ${ext?.toUpperCase()} file. The AI import engine will analyze this document and extract the archetype from it.`)
      setMode("ai")
      setStep("input")
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setFileContent(text)
        setStep("input")
      }
      reader.readAsText(file)
    }
  }

  async function handleImport() {
    setIsProcessing(true)
    setStep("processing")
    setError("")

    const content = mode === "paste" ? pasteContent : fileContent
    const sourceType = mode === "ai" ? "pdf/slides" : fileName.endsWith(".csv") ? "csv" : fileName.endsWith(".md") || fileName.endsWith(".markdown") ? "markdown" : "text"

    try {
      const res = await fetch("/api/import-archetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sourceType, fileName }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Import failed")
      }

      const { archetype } = await res.json()
      setParsedArchetype(archetype)
      setStep("preview")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import. Please try again.")
      setStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  function handleConfirmImport() {
    if (parsedArchetype && onImportComplete) {
      onImportComplete(parsedArchetype)
    }
    handleClose(false)
  }

  const importModes = [
    {
      id: "file" as const,
      icon: Upload,
      label: "Upload File",
      description: "Import from Markdown, CSV, or text file",
      formats: ".md, .csv, .txt, .json",
    },
    {
      id: "paste" as const,
      icon: FileText,
      label: "Paste Content",
      description: "Paste persona or archetype content directly",
      formats: "Any text format",
    },
    {
      id: "ai" as const,
      icon: Sparkles,
      label: "René AI Import & Enrich",
      description: "Upload PDF or slides -- René AI extracts and enriches the archetype",
      formats: ".pdf, .pptx",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "choose" && (
              <Button variant="ghost" size="icon" className="h-6 w-6 -ml-1" onClick={() => setStep("choose")}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            Import Archetype
          </DialogTitle>
          <DialogDescription>
            {step === "choose" && "Choose how you want to import your customer archetype or persona."}
            {step === "input" && mode === "file" && `Review the content from ${fileName} before importing.`}
            {step === "input" && mode === "paste" && "Paste your persona or archetype content below. The AI engine will parse and enrich it."}
            {step === "input" && mode === "ai" && "Upload a PDF or presentation file for René AI-powered extraction and enrichment."}
            {step === "processing" && "Analyzing your content, extracting archetype structure, and enriching with insights..."}
            {step === "preview" && "Review the extracted and enriched archetype before importing."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Choose mode */}
          {step === "choose" && (
            <div className="grid gap-3 py-2">
              {importModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    if (m.id === "paste") setStep("input")
                    if (m.id === "file") fileInputRef.current?.click()
                    if (m.id === "ai") fileInputRef.current?.click()
                  }}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 text-left transition-all hover:border-primary/40 hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground/60">{m.formats}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </button>
              ))}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".md,.markdown,.csv,.txt,.json,.pdf,.pptx,.ppt"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) processFile(file)
                  e.target.value = ""
                }}
              />

              <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">The AI engine understands and enriches:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    "Buyer Personas",
                    "User Personas (UX)",
                    "Customer Archetypes",
                    "Empathy Maps",
                    "JTBD Profiles",
                    "Behavioral Segments",
                    "Psychographic Profiles",
                    "Persona Slide Decks",
                  ].map((format) => (
                    <span key={format} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Input content */}
          {step === "input" && (
            <div className="flex flex-col gap-4 py-2">
              {mode === "file" && (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{fileName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-auto shrink-0"
                      onClick={() => { setFileName(""); setFileContent(""); setStep("choose") }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="min-h-48 max-h-64 font-mono text-xs"
                    placeholder="File content will appear here..."
                  />
                </>
              )}

              {mode === "paste" && (
                <Textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="min-h-64 font-mono text-xs"
                  placeholder={`Paste your persona or archetype content here. Any format works:\n\n- Persona profiles with demographics and goals\n- Empathy map quadrants (says/thinks/does/feels)\n- Bullet-point lists of traits and behaviors\n- Copy-pasted content from research tools\n- Brief descriptions -- the AI will enrich sparse input\n\nThe engine will parse, structure, and enrich it automatically.`}
                />
              )}

              {mode === "ai" && (
                <div className="flex flex-col gap-4">
                  {fileName ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                      {fileName.endsWith(".pdf") ? (
                        <FileImage className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <Presentation className="h-4 w-4 text-orange-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{fileName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto shrink-0"
                        onClick={() => { setFileName(""); setFileContent(""); setStep("choose") }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-foreground">Drop your PDF or slides here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                    </div>
                  )}

                  <Textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="min-h-32 text-xs"
                    placeholder="Optionally add context for the AI parser. For example: 'This is a real estate buyer persona from our Q3 research. Focus on their emotional drivers and family needs.'"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep("choose")}>
                  Back
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleImport}
                  disabled={
                    (mode === "paste" && !pasteContent.trim()) ||
                    ((mode === "file" || mode === "ai") && !fileContent.trim())
                  }
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Parse & Enrich with René AI
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <Loader2 className="absolute -inset-2 h-16 w-16 text-primary/30 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Analyzing archetype content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Extracting traits, enriching narratives, generating pillar ratings and radar charts...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === "preview" && parsedArchetype && (
            <div className="flex flex-col gap-4 py-2">
              {/* Confidence + meta */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    parsedArchetype.confidence >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                    parsedArchetype.confidence >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  )}>
                    {parsedArchetype.confidence}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Confidence Score</p>
                    <p className="text-[10px] text-muted-foreground">
                      {parsedArchetype.confidence >= 80 ? "High confidence parse" :
                       parsedArchetype.confidence >= 50 ? "Moderate -- review recommended" :
                       "Low confidence -- manual review needed"}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{parsedArchetype.category.replace(/_/g, " ")}</Badge>
                  {parsedArchetype.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Identity */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {parsedArchetype.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{parsedArchetype.name}</h3>
                    <p className="text-xs text-muted-foreground">{parsedArchetype.role}</p>
                    {parsedArchetype.subtitle && (
                      <p className="text-[10px] text-muted-foreground/70 italic">{parsedArchetype.subtitle}</p>
                    )}
                  </div>
                  {parsedArchetype.valueMetric && (
                    <div className="ml-auto flex items-center gap-4 text-[11px]">
                      <span className="text-muted-foreground">Value: <span className="font-semibold text-foreground">{parsedArchetype.valueMetric}</span></span>
                      {parsedArchetype.basePercentage && (
                        <span className="text-muted-foreground">Base: <span className="font-semibold text-foreground">{parsedArchetype.basePercentage}</span></span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{parsedArchetype.description}</p>
              </div>

              {/* Narratives */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Goals (I want)", text: parsedArchetype.goalsNarrative },
                  { label: "Needs (I do)", text: parsedArchetype.needsNarrative },
                  { label: "Touchpoints (I use)", text: parsedArchetype.touchpointsNarrative },
                ].map((n) => (
                  <div key={n.label} className="rounded-lg border border-border/60 p-3">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{n.label}</h4>
                    <p className="text-[10px] leading-relaxed text-foreground line-clamp-4">{n.text}</p>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" />{parsedArchetype.goals.length} goals</span>
                <span className="flex items-center gap-1"><Frown className="h-3 w-3" />{parsedArchetype.frustrations.length} frustrations</span>
                <span className="flex items-center gap-1"><Activity className="h-3 w-3" />{parsedArchetype.behaviors.length} behaviors</span>
                <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" />{parsedArchetype.solutionPrinciples.length} principles</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />{parsedArchetype.pillarRatings.length} pillars</span>
              </div>

              {/* Pillar Ratings compact */}
              <div className="rounded-lg border border-border/60 p-3">
                <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Pillar Ratings</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {parsedArchetype.pillarRatings.map((p) => (
                    <div key={p.name} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-foreground">{p.name}</span>
                      <MiniDotScale score={p.score} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution Principles preview */}
              {parsedArchetype.solutionPrinciples.length > 0 && (
                <div className="rounded-lg border border-border/60 p-3">
                  <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Solution Principles</h4>
                  <div className="flex flex-col gap-1.5">
                    {parsedArchetype.solutionPrinciples.slice(0, 3).map((sp, i) => (
                      <p key={i} className="text-[10px] leading-relaxed text-foreground">
                        <span className="font-semibold text-primary mr-1">{i + 1}.</span>
                        {sp}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {parsedArchetype.notes && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">AI Notes</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{parsedArchetype.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setStep("input")}>
                  Back to Edit
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleConfirmImport}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Import Archetype
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
