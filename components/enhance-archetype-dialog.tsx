"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  Mic, 
  Upload, 
  Loader2, 
  Sparkles,
  X,
  FileSpreadsheet,
  FileIcon,
  StopCircle,
  AlertCircle,
  Check,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import type { Archetype } from "@/lib/types"
import { AILanguageSelector, useAILanguage } from "@/components/ai-language-selector"
import { mutate } from "swr"

interface EnhanceArchetypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  archetype: Archetype
}

type InputTab = "text" | "voice" | "file"

interface ArchetypeChange {
  id: string
  field: string
  fieldLabel: string
  currentValue: string | string[] | null
  suggestedValue: string | string[]
  reasoning: string
  accepted: boolean | null // null = pending, true = accepted, false = rejected
}

const ACCEPTED_FILE_TYPES = {
  "text/csv": ".csv",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/msword": ".doc",
  "application/vnd.apple.keynote": ".key",
}

const ARCHETYPE_FIELD_LABELS: Record<string, string> = {
  description: "Description",
  goals: "Goals",
  needs: "Needs",
  painPoints: "Pain Points",
  behaviors: "Behaviors",
  motivations: "Motivations",
  triggers: "Triggers",
  barriers: "Barriers",
  preferredChannels: "Preferred Channels",
  quote: "Quote",
  background: "Background",
  demographics: "Demographics",
}

export function EnhanceArchetypeDialog({
  open,
  onOpenChange,
  archetype,
}: EnhanceArchetypeDialogProps) {
  const [activeTab, setActiveTab] = useState<InputTab>("text")
  const [textInput, setTextInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState<"input" | "review">("input")
  const [changes, setChanges] = useState<ArchetypeChange[]>([])
  const [summary, setSummary] = useState("")
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // File upload state - support multiple files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileContent, setFileContent] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Language
  const { language, setLanguage, getPromptPrefix } = useAILanguage(archetype.name)

  const resetState = useCallback(() => {
    setTextInput("")
    setTranscript("")
    setAudioBlob(null)
    setUploadedFiles([])
    setFileContent("")
    setIsExtracting(false)
    setProgress(0)
    setRecordingTime(0)
    setStep("input")
    setChanges([])
    setSummary("")
  }, [])

  const handleClose = useCallback(() => {
    if (!isAnalyzing && !isApplying) {
      resetState()
      onOpenChange(false)
    }
  }, [isAnalyzing, isApplying, resetState, onOpenChange])

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
        transcribeAudio(blob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      toast.error("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setIsAnalyzing(true)
    setProgress(20)
    
    try {
      const formData = new FormData()
      formData.append("audio", blob, "recording.webm")
      
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Transcription failed")
      
      const data = await res.json()
      setTranscript(data.text)
      setProgress(100)
      toast.success("Audio transcribed successfully")
    } catch (err) {
      toast.error("Failed to transcribe audio")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // File upload functions - support multiple files
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    
    for (const file of files) {
      const fileType = file.type || ""
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      
      const isAccepted = Object.keys(ACCEPTED_FILE_TYPES).includes(fileType) ||
        ["csv", "txt", "md", "pdf", "pptx", "docx", "ppt", "doc", "key"].includes(fileExt || "")

      if (!isAccepted) {
        toast.error(`Unsupported file: ${file.name}`, {
          description: "Please upload CSV, TXT, MD, PDF, PPTX, DOCX, or KEY files."
        })
        continue
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}`, {
          description: "Maximum size is 10MB per file."
        })
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    const newFiles = [...uploadedFiles, ...validFiles]
    setUploadedFiles(newFiles)
    await extractFilesContent(newFiles)
  }

  const extractFilesContent = async (files: File[]) => {
    if (files.length === 0) return
    
    setIsExtracting(true)
    setProgress(10)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append("file", file))
      
      setProgress(30)

      const res = await fetch("/api/ai/extract-file", {
        method: "POST",
        body: formData,
      })
      
      setProgress(70)

      if (!res.ok) throw new Error("Failed to extract file content")

      const data = await res.json()
      setFileContent(data.content)
      setProgress(100)
      toast.success("Files processed", {
        description: `${data.successCount} of ${data.totalFiles} files extracted successfully`
      })
    } catch (err) {
      console.error("File extraction error:", err)
      toast.error("Failed to extract file content")
      setUploadedFiles([])
      setFileContent("")
    } finally {
      setIsExtracting(false)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    
    if (newFiles.length === 0) {
      setFileContent("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } else {
      extractFilesContent(newFiles)
    }
  }
  
  const removeAllFiles = () => {
    setUploadedFiles([])
    setFileContent("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Get the current input content based on active tab
  const getCurrentContent = () => {
    switch (activeTab) {
      case "text":
        return textInput
      case "voice":
        return transcript
      case "file":
        return fileContent
      default:
        return ""
    }
  }

  const canAnalyze = () => {
    const content = getCurrentContent()
    return content.trim().length > 10 && !isAnalyzing && !isExtracting
  }

  // Analyze content and generate suggestions
  const analyzeContent = async () => {
    const content = getCurrentContent()
    if (!content.trim()) return

    setIsAnalyzing(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const res = await fetch("/api/ai/enhance-archetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archetypeId: archetype.id,
          archetype: archetype,
          inputContent: content,
          inputType: activeTab,
          language,
          languagePromptPrefix: getPromptPrefix(),
        }),
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Analysis failed")
      }

      const data = await res.json()
      console.log("[v0] Archetype enhance response:", data)
      setProgress(100)
      
      if (!data.changes || !Array.isArray(data.changes)) {
        console.log("[v0] No changes in response or invalid format")
        toast.info("No specific changes identified from the input")
        return
      }
      
      // Transform API response to changes
      const suggestedChanges: ArchetypeChange[] = data.changes.map((change: any, idx: number) => ({
        id: `change-${idx}`,
        field: change.field,
        fieldLabel: ARCHETYPE_FIELD_LABELS[change.field] || change.field,
        currentValue: change.currentValue,
        suggestedValue: change.suggestedValue,
        reasoning: change.reasoning,
        accepted: null,
      }))

      setChanges(suggestedChanges)
      setSummary(data.summary)
      setStep("review")
      
      toast.success(`${suggestedChanges.length} enhancement suggestions generated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze content")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Toggle change acceptance
  const toggleChange = (changeId: string, accepted: boolean) => {
    setChanges(prev => prev.map(c => 
      c.id === changeId ? { ...c, accepted } : c
    ))
  }

  // Accept all changes
  const acceptAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, accepted: true })))
  }

  // Reject all changes
  const rejectAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, accepted: false })))
  }

  // Apply accepted changes
  const applyChanges = async () => {
    const acceptedChanges = changes.filter(c => c.accepted === true)
    if (acceptedChanges.length === 0) {
      toast.error("No changes selected to apply")
      return
    }

    setIsApplying(true)

    try {
      // Build the update object
      const updates: Partial<Archetype> = {}
      
for (const change of acceptedChanges) {
  (updates as any)[change.field] = change.suggestedValue
  }
  
  // Use the PATCH API route to update the archetype
  const response = await fetch(`/api/archetypes/${archetype.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update archetype")
  }
  
  mutate((key: string) => typeof key === "string" && key.includes("/api/archetypes"))
      
      toast.success(`${acceptedChanges.length} changes applied successfully`)
      handleClose()
    } catch (err) {
      toast.error("Failed to apply changes")
    } finally {
      setIsApplying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const pendingCount = changes.filter(c => c.accepted === null).length
  const acceptedCount = changes.filter(c => c.accepted === true).length
  const rejectedCount = changes.filter(c => c.accepted === false).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === "input" ? "Enhance Archetype with René AI" : "Review Suggested Changes"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" 
              ? `Provide additional context to enhance "${archetype.name}" using text, voice, or file uploads.`
              : `Review and select which changes to apply to "${archetype.name}".`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            {/* Language Selector */}
            <div className="flex flex-col gap-2">
              <Label>Generation Language</Label>
              <AILanguageSelector
                value={language}
                onChange={setLanguage}
                assetName={archetype.name}
                showDetectedBadge={true}
              />
            </div>

            {/* Input Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InputTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="voice" className="gap-2">
                  <Mic className="h-4 w-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-2">
                  <Upload className="h-4 w-4" />
                  File
                </TabsTrigger>
              </TabsList>

              {/* Text Input */}
              <TabsContent value="text" className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Label>Paste or type additional context</Label>
                  <Textarea
                    placeholder="Paste research findings, interview transcripts, survey results, or any text that describes this customer archetype..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {textInput.length} characters
                  </p>
                </div>
              </TabsContent>

              {/* Voice Input */}
              <TabsContent value="voice" className="space-y-3">
                <div className="flex flex-col items-center gap-4 py-6">
                  {!audioBlob ? (
                    <>
                      <Button
                        size="lg"
                        variant={isRecording ? "destructive" : "default"}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isAnalyzing}
                        className="h-16 w-16 rounded-full"
                      >
                        {isRecording ? (
                          <StopCircle className="h-8 w-8" />
                        ) : (
                          <Mic className="h-8 w-8" />
                        )}
                      </Button>
                      {isRecording && (
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {isRecording ? "Click to stop recording" : "Click to start recording"}
                      </p>
                    </>
                  ) : (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Recording ({formatTime(recordingTime)})</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setAudioBlob(null)
                          setTranscript("")
                        }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {transcript && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <Label className="text-xs text-muted-foreground">Transcript</Label>
                          <p className="mt-1 text-sm">{transcript}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* File Upload - Multiple Files */}
              <TabsContent value="file" className="space-y-3">
                <div className="flex flex-col gap-3">
                  {/* Upload Area - Always visible */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors",
                      isExtracting && "opacity-50 pointer-events-none"
                    )}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {uploadedFiles.length > 0 ? "Add more files" : "Click to upload"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV, TXT, MD, PDF, PPTX, DOCX, KEY (max 10MB each)
                      </p>
                    </div>
                  </div>
                  
                  {/* Extracting Progress */}
                  {isExtracting && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-center text-muted-foreground">
                        Extracting content from files...
                      </p>
                    </div>
                  )}
                  
                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{uploadedFiles.length} file(s)</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={removeAllFiles}
                          disabled={isAnalyzing || isExtracting}
                        >
                          Remove all
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-auto">
                        {uploadedFiles.map((file, index) => (
                          <div key={`${file.name}-${index}`} className="rounded-lg border p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => removeFile(index)}
                                disabled={isExtracting}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {fileContent && (
                        <div className="rounded bg-muted/30 p-2 max-h-24 overflow-y-auto">
                          <p className="text-xs text-muted-foreground mb-1">Content preview:</p>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {fileContent.slice(0, 300)}
                            {fileContent.length > 300 && "..."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.md,.pdf,.pptx,.docx,.ppt,.doc,.key"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    disabled={isExtracting}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Analysis Progress */}
            {isAnalyzing && !isExtracting && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Analyzing content with René AI...
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isAnalyzing}>
                Cancel
              </Button>
              <Button onClick={analyzeContent} disabled={!canAnalyze()}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze & Suggest Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Review Step */
          <div className="space-y-4">
            {/* Summary */}
            {summary && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm">{summary}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <Badge variant="outline">{changes.length} suggestions</Badge>
              {acceptedCount > 0 && (
                <Badge variant="default" className="bg-emerald-600">
                  {acceptedCount} accepted
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="secondary">{rejectedCount} rejected</Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="outline">{pendingCount} pending</Badge>
              )}
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={acceptAll}>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Accept All
              </Button>
              <Button variant="outline" size="sm" onClick={rejectAll}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Reject All
              </Button>
            </div>

            {/* Changes List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    change.accepted === true && "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20",
                    change.accepted === false && "border-muted bg-muted/30 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {change.fieldLabel}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant={change.accepted === true ? "default" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleChange(change.id, true)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={change.accepted === false ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleChange(change.id, false)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Current vs Suggested */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Current</p>
                      <div className="rounded bg-muted/50 p-2 min-h-[60px]">
                        {Array.isArray(change.currentValue) 
                          ? change.currentValue.join(", ") || <span className="text-muted-foreground italic">Empty</span>
                          : change.currentValue || <span className="text-muted-foreground italic">Empty</span>
                        }
                      </div>
                    </div>
                    <div>
                      <p className="text-primary mb-1">Suggested</p>
                      <div className="rounded bg-primary/5 border border-primary/20 p-2 min-h-[60px]">
                        {Array.isArray(change.suggestedValue) 
                          ? change.suggestedValue.join(", ")
                          : change.suggestedValue
                        }
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {change.reasoning}
                  </p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep("input")}>
                Back to Input
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={applyChanges} 
                  disabled={acceptedCount === 0 || isApplying}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Apply {acceptedCount} Change{acceptedCount !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
