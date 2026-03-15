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
} from "lucide-react"
import { toast } from "sonner"
import type { EnhancementChange, EnhancementInput, Journey } from "@/lib/types"
import { AILanguageSelector, useAILanguage } from "@/components/ai-language-selector"

interface EnhanceJourneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  journey: Journey
  onChangesGenerated: (changes: EnhancementChange[], summary: string) => void
}

type InputTab = "text" | "voice" | "file"

const ACCEPTED_FILE_TYPES = {
  "text/csv": ".csv",
  "text/plain": ".txt",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/msword": ".doc",
  "application/vnd.apple.keynote": ".key",
}

export function EnhanceJourneyDialog({
  open,
  onOpenChange,
  journey,
  onChangesGenerated,
}: EnhanceJourneyDialogProps) {
  const [activeTab, setActiveTab] = useState<InputTab>("text")
  const [textInput, setTextInput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Language
  const { language, setLanguage, getPromptPrefix } = useAILanguage(journey.title)

  const resetState = useCallback(() => {
    setTextInput("")
    setTranscript("")
    setAudioBlob(null)
    setUploadedFile(null)
    setFileContent("")
    setProgress(0)
    setRecordingTime(0)
  }, [])

  const handleClose = useCallback(() => {
    if (!isAnalyzing) {
      resetState()
      onOpenChange(false)
    }
  }, [isAnalyzing, resetState, onOpenChange])

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
        
        // In a real implementation, send to speech-to-text API
        // For now, we'll set a placeholder
        setTranscript("[Voice recording captured - transcription would appear here]")
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)

    } catch (error) {
      console.error("Failed to start recording:", error)
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

  // File upload functions
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type) ||
      file.name.endsWith(".key") // Keynote files
    
    if (!isValidType) {
      toast.error("Unsupported file type. Please upload CSV, TXT, PDF, PPTX, DOCX, or Keynote files.")
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File too large. Maximum size is 10MB.")
      return
    }

    setUploadedFile(file)

    // Read file content (for text-based files)
    if (file.type === "text/plain" || file.type === "text/csv") {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFileContent(event.target?.result as string)
      }
      reader.readAsText(file)
    } else {
      // For binary files, we'll extract text server-side
      setFileContent(`[Content from ${file.name} will be extracted]`)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setFileContent("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Submit for analysis
  const handleAnalyze = async () => {
    let input: EnhancementInput

    switch (activeTab) {
      case "text":
        if (!textInput.trim()) {
          toast.error("Please enter some text to analyze")
          return
        }
        input = { type: "text", content: textInput.trim() }
        break
      
      case "voice":
        if (!transcript) {
          toast.error("Please record some audio first")
          return
        }
        input = { type: "voice", content: transcript }
        break
      
      case "file":
        if (!uploadedFile || !fileContent) {
          toast.error("Please upload a file first")
          return
        }
        input = { 
          type: "file", 
          content: fileContent, 
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
        }
        break
      
      default:
        return
    }

    setIsAnalyzing(true)
    setProgress(10)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90))
      }, 500)

      const response = await fetch("/api/ai/enhance-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId: journey.id,
          input,
          language,
        }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Analysis failed")
      }

      const result = await response.json()

      if (result.changes && result.changes.length > 0) {
        onChangesGenerated(result.changes, result.summary)
        handleClose()
        toast.success(`Found ${result.changes.length} suggested improvements`)
      } else {
        toast.info("No specific changes identified from the input")
      }

    } catch (error) {
      console.error("Enhancement analysis failed:", error)
      toast.error(error instanceof Error ? error.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".csv")) return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    if (fileName.endsWith(".pdf")) return <FileIcon className="h-8 w-8 text-red-500" />
    if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt") || fileName.endsWith(".key")) {
      return <FileIcon className="h-8 w-8 text-orange-500" />
    }
    if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      return <FileIcon className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-muted-foreground" />
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enhance with René AI
          </DialogTitle>
          <DialogDescription>
            Provide feedback, research, or documentation to intelligently improve your journey.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InputTab)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" disabled={isAnalyzing}>
              <FileText className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="voice" disabled={isAnalyzing}>
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="file" disabled={isAnalyzing}>
              <Upload className="h-4 w-4 mr-2" />
              File
            </TabsTrigger>
          </TabsList>

          {/* Text Input Tab */}
          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Paste feedback, research findings, or requirements</Label>
              <Textarea
                placeholder="e.g., Customer feedback shows that the checkout process is confusing. Many users abandon at the payment step because they can't find the promo code field..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] resize-none"
                disabled={isAnalyzing}
              />
              <p className="text-xs text-muted-foreground">
                {textInput.length} characters
              </p>
            </div>
          </TabsContent>

          {/* Voice Input Tab */}
          <TabsContent value="voice" className="mt-4 space-y-4">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              {!transcript ? (
                <>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="lg"
                    className={cn(
                      "h-20 w-20 rounded-full",
                      isRecording && "animate-pulse"
                    )}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                  >
                    {isRecording ? (
                      <StopCircle className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isRecording 
                      ? `Recording... ${formatTime(recordingTime)}`
                      : "Click to start recording"
                    }
                  </p>
                </>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Transcription</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTranscript("")
                        setAudioBlob(null)
                      }}
                      disabled={isAnalyzing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {transcript}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Voice recordings are transcribed and analyzed for journey improvements</span>
            </div>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="file" className="mt-4 space-y-4">
            {!uploadedFile ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV, TXT, PDF, PPTX, DOCX, or Keynote (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.pdf,.pptx,.ppt,.docx,.doc,.key"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isAnalyzing}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadedFile.name)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    disabled={isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {fileContent && fileContent.length < 500 && (
                  <div className="mt-3 p-2 bg-muted rounded text-xs max-h-24 overflow-auto">
                    {fileContent.substring(0, 500)}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Language Selector */}
        <div className="mt-4 space-y-2">
          <Label>Output Language</Label>
          <AILanguageSelector
            value={language}
            onChange={setLanguage}
            assetName={journey.title}
            showDetectedBadge={true}
          />
        </div>

        {/* Progress */}
        {isAnalyzing && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Analyzing input and generating suggestions...
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isAnalyzing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (
              activeTab === "text" && !textInput.trim() ||
              activeTab === "voice" && !transcript ||
              activeTab === "file" && !uploadedFile
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze & Suggest
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
