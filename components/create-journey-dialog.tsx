"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createJourney } from "@/lib/actions/data"
import { cn } from "@/lib/utils"
import { useSound } from "@/components/sound-provider"
import { ChevronDown, HelpCircle } from "lucide-react"
import { INDUSTRIES } from "@/lib/industries"

// Use shared INDUSTRIES from lib/industries.ts
const CATEGORIES = INDUSTRIES

interface CreateJourneyDialogProps {
  children: React.ReactNode
  defaultType?: "current" | "future" | "deployed"
}

export function CreateJourneyDialog({ children, defaultType = "current" }: CreateJourneyDialogProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"current" | "future" | "deployed">(defaultType)
  const [category, setCategory] = useState("retail")
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [tagsInput, setTagsInput] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { play } = useSound()

  function resetForm() {
    setTitle("")
    setDescription("")
    setType(defaultType)
    setCategory("retail")
    setTagsInput("")
  }

  function handleSubmit() {
    if (!title.trim()) return

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      try {
        const result = await createJourney({ title: title.trim(), description, type, category, tags })
        play("journey-created")
        toast.success("Journey created successfully")
        setOpen(false)
        resetForm()
        router.push(`/journeys/${result.id}/canvas`)
      } catch {
        play("error")
        toast.error("Failed to create journey. Please make sure you are logged in.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Journey</DialogTitle>
          <DialogDescription>
            Define a new customer journey map. You can add stages, steps, and touchpoints after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="journey-title">Title</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[280px] text-xs leading-relaxed">
                    <p className="font-medium mb-1">AI Language Detection</p>
                    <p>When using AI features, the output language is determined by:</p>
                    <ol className="list-decimal ml-3 mt-1 space-y-0.5">
                      <li>Explicit requests in your prompt (e.g., "in Spanish")</li>
                      <li>The language of your title/description</li>
                      <li>Your manual language selection</li>
                    </ol>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="journey-title"
              placeholder="e.g., E-Commerce Purchase Journey"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit() }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="journey-desc">Description (optional)</Label>
            <Textarea
              id="journey-desc"
              placeholder="Brief description of this journey..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="journey-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "current" | "future" | "deployed")}>
                <SelectTrigger id="journey-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Journey</SelectItem>
                  <SelectItem value="future">Future Journey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      {(() => {
                        const cat = CATEGORIES.find(c => c.value === category)
                        if (cat) {
                          const Icon = cat.icon
                          return <><Icon className="h-3.5 w-3.5" />{t(cat.labelKey)}</>
                        }
                        return "Select..."
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
                                onClick={() => { setCategory(cat.value); setCategoryOpen(false) }}
                                className={cn(
                                  "flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-md transition-colors whitespace-nowrap",
                                  category === cat.value
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="journey-tags">Tags (optional, comma-separated)</Label>
            <Input
              id="journey-tags"
              placeholder="e.g., e-commerce, mobile, checkout"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isPending}>
            {isPending ? "Creating..." : "Create Journey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
