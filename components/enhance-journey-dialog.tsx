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
  
  // File upload state - support multiple files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileContent, setFileContent] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Language
  const { language, setLanguage, getPromptPrefix } = useAILanguage(journey.title)

  const resetState = useCallback(() => {
    setTextInput("")
    setTranscript("")
setAudioBlob(null)
    setTranscript("")
    setUploadedFiles([])
    setFileContent("")
    setIsExtracting(false)
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

  // File upload functions - support multiple files
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    
    for (const file of files) {
      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
      const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type) ||
        ["csv", "txt", "md", "pdf", "pptx", "docx", "ppt", "doc", "key"].includes(fileExt)
      
      if (!isValidType) {
        toast.error(`Unsupported file: ${file.name}`, {
          description: "Please upload CSV, TXT, PDF, PPTX, DOCX, or Keynote files."
        })
        continue
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
        toast.error(`File too large: ${file.name}`, {
          description: "Maximum size is 10MB per file."
        })
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    // Add to existing files
    const newFiles = [...uploadedFiles, ...validFiles]
    setUploadedFiles(newFiles)
    
    // Extract content from all files
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
      
      if (!res.ok) {
        throw new Error("Failed to extract file content")
      }
      
      const data = await res.json()
      setFileContent(data.content)
      setProgress(100)
      
      toast.success("Files processed", {
        description: `${data.successCount} of ${data.totalFiles} files extracted successfully`
      })
    } catch (err) {
      console.error("File extraction error:", err)
      toast.error("Failed to extract file content", {
        description: "Please try uploading the files again."
      })
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
      // Re-extract content for remaining files
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
        if (uploadedFiles.length === 0 || !fileContent) {
          toast.error("Please upload at least one file first")
          return
        }
        input = { 
          type: "file", 
          content: fileContent, 
          fileName: uploadedFiles.map(f => f.name).join(", "),
          fileType: uploadedFiles[0]?.type || "application/octet-stream",
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
            {/* Upload Area - Always visible for adding more files */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                "hover:border-primary hover:bg-primary/5",
                isExtracting && "opacity-50 pointer-events-none"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                {uploadedFiles.length > 0 ? "Add more files" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV, TXT, PDF, PPTX, DOCX, or Keynote (max 10MB each)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.md,.pdf,.pptx,.ppt,.docx,.doc,.key"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isAnalyzing || isExtracting}
                multiple
              />
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
                  <p className="text-sm font-medium">{uploadedFiles.length} file(s) uploaded</p>
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
                <div className="space-y-2 max-h-48 overflow-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeFile(index)}
                          disabled={isAnalyzing || isExtracting}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {fileContent && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p className="text-muted-foreground mb-1">Extracted content preview:</p>
                    <div className="max-h-20 overflow-auto">
                      {fileContent.substring(0, 300)}
                      {fileContent.length > 300 && "..."}
                    </div>
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
disabled={isAnalyzing || isExtracting || (
                activeTab === "text" && !textInput.trim() ||
                activeTab === "voice" && !transcript ||
                activeTab === "file" && (uploadedFiles.length === 0 || !fileContent)
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
