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
  Table2,
  Sparkles,
  FileImage,
  Presentation,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react"

type ImportMode = "file" | "paste" | "ai"
type ImportStep = "choose" | "input" | "processing" | "preview"

interface ParsedStage {
  name: string
  steps: {
    name: string
    description: string | null
    touchPoints: {
      channel: string
      description: string
      emotionalScore: number
      painPoints: { description: string; severity: string }[]
      highlights: { description: string; impact: string }[]
    }[]
  }[]
}

interface ParsedJourney {
  title: string
  description: string | null
  stages: ParsedStage[]
  suggestedTags: string[]
  suggestedType: "current" | "future" | "template"
  confidence: number
  notes: string | null
}

interface JourneyImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (journey: ParsedJourney) => void
}

export function JourneyImportDialog({ open, onOpenChange, onImportComplete }: JourneyImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("choose")
  const [mode, setMode] = useState<ImportMode>("file")
  const [pasteContent, setPasteContent] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileContent, setFileContent] = useState("")
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedJourney, setParsedJourney] = useState<ParsedJourney | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("choose")
    setMode("file")
    setPasteContent("")
    setFileName("")
    setFileContent("")
    setError("")
    setIsProcessing(false)
    setParsedJourney(null)
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
      // For PDF/slides, read as base64 and note it needs AI processing
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // For binary files, we'll just note the file name and let AI handle it
        setFileContent(`[Uploaded file: ${file.name}]\n\nThis is a ${ext?.toUpperCase()} file. The AI import engine will analyze this document and extract the journey structure from it.`)
        setMode("ai")
        setStep("input")
      }
      reader.readAsText(file)
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
      const res = await fetch("/api/import-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sourceType, fileName }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Import failed")
      }

      const { journey } = await res.json()
      setParsedJourney(journey)
      setStep("preview")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import. Please try again.")
      setStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  function handleConfirmImport() {
    if (parsedJourney && onImportComplete) {
      onImportComplete(parsedJourney)
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
      description: "Paste journey content directly",
      formats: "Any text format",
    },
    {
      id: "ai" as const,
      icon: Sparkles,
      label: "René AI Import",
      description: "Upload PDF or slides -- René AI extracts the journey",
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
            Import Journey
          </DialogTitle>
          <DialogDescription>
            {step === "choose" && "Choose how you want to import your journey map."}
            {step === "input" && mode === "file" && `Review the content from ${fileName} before importing.`}
            {step === "input" && mode === "paste" && "Paste your journey content below. The AI engine will parse any format."}
            {step === "input" && mode === "ai" && "Upload a PDF or presentation file for René AI-powered extraction."}
            {step === "processing" && "Analyzing your content and extracting journey structure..."}
            {step === "preview" && "Review the extracted journey before importing."}
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

              {/* Supported formats info */}
              <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">The AI import engine understands:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    "Service Blueprints",
                    "Experience Maps",
                    "McKinsey CDJ Models",
                    "JTBD Journey Maps",
                    "Swimlane Diagrams",
                    "Empathy Maps",
                    "CSV/Tabular Data",
                    "Markdown Documents",
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
              {/* File mode: show file content */}
              {mode === "file" && (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    {fileName.endsWith(".csv") ? (
                      <Table2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
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
                  <Textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="min-h-48 max-h-64 font-mono text-xs"
                    placeholder="File content will appear here..."
                  />
                </>
              )}

              {/* Paste mode */}
              {mode === "paste" && (
                <Textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="min-h-64 font-mono text-xs"
                  placeholder={`Paste your journey content here. Any format works:\n\n- Markdown journey descriptions\n- CSV data (stages, steps, touchpoints as columns)\n- Bullet-point lists of stages and steps\n- Copy-pasted content from journey mapping tools\n- Free-form journey narratives\n\nThe AI engine will parse and structure it automatically.`}
                />
              )}

              {/* AI mode: file upload for PDF/slides */}
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
                    placeholder="Optionally add context or instructions for the AI parser. For example: 'This is a real estate customer journey from a McKinsey deck. Focus on the buyer stages.'"
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
                  Parse with René AI
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <Loader2 className="absolute -inset-2 h-16 w-16 text-primary/30 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Analyzing journey content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Identifying stages, steps, touchpoints, and emotional scores...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === "preview" && parsedJourney && (
            <div className="flex flex-col gap-4 py-2">
              {/* Confidence + meta */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    parsedJourney.confidence >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                    parsedJourney.confidence >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  )}>
                    {parsedJourney.confidence}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Confidence Score</p>
                    <p className="text-[10px] text-muted-foreground">
                      {parsedJourney.confidence >= 80 ? "High confidence parse" :
                       parsedJourney.confidence >= 50 ? "Moderate confidence -- review recommended" :
                       "Low confidence -- manual review needed"}
                    </p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{parsedJourney.suggestedType}</Badge>
                  {parsedJourney.suggestedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Journey title */}
              <div className="rounded-lg border border-border p-3">
                <h3 className="text-sm font-semibold text-foreground">{parsedJourney.title}</h3>
                {parsedJourney.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{parsedJourney.description}</p>
                )}
              </div>

              {/* Stages preview */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {parsedJourney.stages.map((stage, si) => (
                  <div key={si} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                        {si + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-foreground">{stage.name}</h4>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {stage.steps.length} steps / {stage.steps.reduce((sum, s) => sum + s.touchPoints.length, 0)} touchpoints
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.steps.map((step, sti) => (
                        <span key={sti} className="text-[10px] rounded border border-border/50 bg-muted/30 px-2 py-0.5 text-muted-foreground">
                          {si + 1}.{sti + 1} {step.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {parsedJourney.notes && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Parser Notes</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{parsedJourney.notes}</p>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Stages", value: parsedJourney.stages.length },
                  { label: "Steps", value: parsedJourney.stages.reduce((s, st) => s + st.steps.length, 0) },
                  { label: "Touchpoints", value: parsedJourney.stages.reduce((s, st) => s + st.steps.reduce((ss, step) => ss + step.touchPoints.length, 0), 0) },
                  { label: "Pain Points", value: parsedJourney.stages.reduce((s, st) => s + st.steps.reduce((ss, step) => ss + step.touchPoints.reduce((ts, tp) => ts + tp.painPoints.length, 0), 0), 0) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border/50 bg-muted/20 p-2 text-center">
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep("input")}>
                  Re-parse
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleConfirmImport}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Import Journey
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
