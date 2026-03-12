"use client"

import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, MoreHorizontal, Copy, Rocket, BookTemplate, Upload, FileText, History, Eye, EyeOff, ThumbsUp, ArrowDown, ArrowUp, Sparkles, Loader2, Link2, Mail, Check, Globe, Lock } from "lucide-react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { JourneyImportDialog } from "@/components/journey-import-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useJourney, useJourneyVersions } from "@/hooks/use-journey"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { updateJourneyStatus, duplicateJourney, toggleJourneyVisibility, upvoteJourney } from "@/lib/actions/data"
import { mutate } from "swr"
import { useRouter } from "next/navigation"
import { PresenceIndicator, useMockPresence } from "@/components/presence-indicator"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  deployed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
}

const typeLabels: Record<string, string> = {
  current: "Current",
  future: "Future",
  template: "Template",
  deployed: "Deployed",
}

import { getInitials } from "@/lib/utils"
import { getIndustryLabelKey } from "@/lib/industries"

export default function JourneyDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const journeyId = params.id as string
  const router = useRouter()
  const { journey, isLoading } = useJourney(journeyId)
  const { versions } = useJourneyVersions(journeyId)
  const [importOpen, setImportOpen] = useState(false)
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false)
  const [promoteTarget, setPromoteTarget] = useState<{ type: string; status: string; label: string } | null>(null)
  const [promoting, setPromoting] = useState(false)
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateOptions, setGenerateOptions] = useState({
    stages: true,
    steps: true,
    touchpoints: true,
    painPoints: true,
    highlights: true,
  })
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [linkCopied, setLinkCopied] = useState(false)
  
  // Hook must be called at top level (before any early returns)
  const activePresence = useMockPresence(journeyId)
  
  // Initialize upvote count from journey data
  useEffect(() => {
    if (journey?.upvote_count !== undefined) {
      setUpvoteCount(journey.upvote_count)
    }
  }, [journey?.upvote_count])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Journey not found</p>
        <Button asChild variant="outline" className="mt-4" size="sm">
          <Link href="/journeys">Back to Journeys</Link>
        </Button>
      </div>
    )
  }

  const basePath = `/journeys/${journeyId}`

  // Build tabs dynamically based on journey type
  const allTabs = [
    { label: "Overview", href: `${basePath}/overview`, segment: "overview" },
    { label: "Canvas", href: `${basePath}/canvas`, segment: "canvas" },
    { label: "Emotional Arc", href: `${basePath}/emotional-arc`, segment: "emotional-arc" },
    { label: "Archetypes", href: `${basePath}/archetypes`, segment: "archetypes" },
    ...(journey.type === "future"
      ? [{ label: "Gap Analysis", href: `${basePath}/gap-analysis`, segment: "gap-analysis" }]
      : []),
    ...(journey.type === "deployed"
      ? [{ label: "Health", href: `${basePath}/health`, segment: "health" }]
      : []),
    { label: "Rituals", href: `${basePath}/rituals`, segment: "rituals", comingSoon: true },
    { label: "Voice", href: `${basePath}/voice`, segment: "voice", comingSoon: true },
    { label: "Lingo", href: `${basePath}/lingo`, segment: "lingo", comingSoon: true },
    { label: "Collaborators", href: `${basePath}/collaborators`, segment: "collaborators" },
    { label: "Activity", href: `${basePath}/activity`, segment: "activity" },
    { label: `Versions (${versions.length})`, href: `${basePath}/versions`, segment: "versions" },
  ]

  function isTabActive(tab: { href: string; segment: string | null }) {
    if (!tab.segment) return false
    return pathname.startsWith(`${basePath}/${tab.segment}`)
  }

  const collabAvatars = journey.collaborators.slice(0, 4).map((c) => ({ id: c.userId, name: c.name || c.email || "User" }))

  return (
    <div className="flex flex-col">
      <Toaster />
      {/* Journey header */}
      <div className="border-b border-border bg-background px-4 py-4 lg:px-6">
        <div className="mx-auto max-w-7xl">
          {/* Top row: back button + actions */}
          <div className="flex items-center justify-between mb-3">
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/journeys">
                <ArrowLeft className="h-3.5 w-3.5" />
                Journeys
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {/* Live presence indicator */}
              {activePresence.length > 0 && (
                <>
                  <PresenceIndicator activeUsers={activePresence} maxVisible={3} />
                  <div className="h-4 w-px bg-border hidden sm:block" />
                </>
              )}
              {/* Collaborator avatars */}
              <div className="hidden items-center gap-1 sm:flex">
                <div className="flex -space-x-1.5">
                  {collabAvatars.map((user) => (
                    <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="bg-primary/10 text-[9px] font-medium text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {journey.collaborators.length > 4 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{journey.collaborators.length - 4}
                  </span>
                )}
              </div>
              {/* Generate with René AI button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs gap-1.5"
                onClick={() => setAiGenerateOpen(true)}
              >
                <Sparkles className="h-3 w-3" />
                Generate with René AI
              </Button>
              {/* Upvote button */}
              <Button 
                variant={hasUpvoted ? "default" : "outline"} 
                size="sm" 
                className={cn(
                  "h-7 text-xs gap-1.5",
                  hasUpvoted && "bg-primary text-primary-foreground"
                )}
                onClick={async () => {
                  try {
                    const result = await upvoteJourney(journeyId)
                    setHasUpvoted(result.upvoted)
                    setUpvoteCount(result.count)
                    mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                    toast.success(result.upvoted ? "Upvoted!" : "Upvote removed")
                  } catch { toast.error("Failed to upvote") }
                }}
              >
                <ThumbsUp className={cn("h-3 w-3", hasUpvoted && "fill-current")} />
                {upvoteCount > 0 ? upvoteCount : "Upvote"}
              </Button>
              {/* Share dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <Share2 className="h-3 w-3" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    disabled={!journey?.is_public}
                    onClick={async () => {
                      if (!journey?.is_public) return
                      const shareUrl = `${window.location.origin}/view/${journeyId}`
                      await navigator.clipboard.writeText(shareUrl)
                      setLinkCopied(true)
                      toast.success("Link copied to clipboard")
                      setTimeout(() => setLinkCopied(false), 2000)
                    }}
                    className={!journey?.is_public ? "opacity-50" : ""}
                  >
                    {!journey?.is_public ? (
                      <Lock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    ) : linkCopied ? (
                      <Check className="mr-2 h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Link2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    Copy Public Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!journey?.is_public}
                    onClick={() => {
                      if (!journey?.is_public) return
                      const shareUrl = `${window.location.origin}/view/${journeyId}`
                      const subject = encodeURIComponent(`Check out this journey: ${journey?.title || "Customer Journey"}`)
                      const body = encodeURIComponent(`I wanted to share this customer journey map with you:\n\n${journey?.title || "Customer Journey"}\n\nView it here: ${shareUrl}`)
                      window.location.href = `mailto:?subject=${subject}&body=${body}`
                    }}
                    className={!journey?.is_public ? "opacity-50" : ""}
                  >
                    {!journey?.is_public ? (
                      <Lock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Mail className="mr-2 h-3.5 w-3.5" />
                    )}
                    Share via Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] text-muted-foreground">
                      {journey?.is_public 
                        ? "This journey is public. Anyone with the link can view it."
                        : "Make this journey public from the More menu to enable sharing."}
                    </p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Promotions */}
                  {journey.type === "current" && (
                    <DropdownMenuItem onClick={() => { setPromoteTarget({ type: "future", status: "draft", label: "Future" }); setPromoteDialogOpen(true) }}>
                      <ArrowUp className="mr-2 h-3.5 w-3.5" />
                      Promote to Future
                    </DropdownMenuItem>
                  )}
                  {journey.type === "future" && (
                    <DropdownMenuItem onClick={() => { setPromoteTarget({ type: "deployed", status: "deployed", label: "Deployed" }); setPromoteDialogOpen(true) }}>
                      <Rocket className="mr-2 h-3.5 w-3.5" />
                      Deploy Journey
                    </DropdownMenuItem>
                  )}
                  {/* Demotions (JDS-039) */}
                  {journey.type === "deployed" && (
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await updateJourneyStatus(journeyId, "approved", "future")
                          mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                          toast.success(`"${journey.title}" demoted to Future Journey`)
                          router.push("/journeys?tab=future")
                        } catch { toast.error("Failed to demote journey") }
                      }}
                    >
                      <ArrowDown className="mr-2 h-3.5 w-3.5" />
                      Demote to Future
                    </DropdownMenuItem>
                  )}
                  {journey.type === "future" && (
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await updateJourneyStatus(journeyId, "draft", "current")
                          mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                          toast.success(`"${journey.title}" demoted to Current Journey`)
                          router.push("/journeys?tab=current")
                        } catch { toast.error("Failed to demote journey") }
                      }}
                    >
                      <ArrowDown className="mr-2 h-3.5 w-3.5" />
                      Demote to Current
                    </DropdownMenuItem>
                  )}
                  {(journey.type !== "template") && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const result = await duplicateJourney(journeyId)
                        mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                        toast.success(`Duplicated "${journey.title}"`)
                        router.push(`/journeys/${result.id}`)
                      } catch { toast.error("Failed to duplicate journey") }
                    }}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/journeys/${journeyId}/report`, "_blank")}>
                    <FileText className="mr-2 h-3.5 w-3.5" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setImportOpen(true)}>
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Import
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Visibility toggle */}
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const result = await toggleJourneyVisibility(journeyId)
                        mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                        toast.success(result.isPublic ? "Journey is now public" : "Journey is now private")
                      } catch { toast.error("Failed to change visibility") }
                    }}
                  >
                    {journey.is_public ? <Lock className="mr-2 h-3.5 w-3.5" /> : <Globe className="mr-2 h-3.5 w-3.5" />}
                    {journey.is_public ? "Make Private" : "Make Public"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async () => {
                      try {
                        await updateJourneyStatus(journeyId, "archived")
                        mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                        toast.success("Journey archived")
                        router.push("/journeys")
                      } catch { toast.error("Failed to archive journey") }
                    }}
                  >
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title + badges */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground text-balance">
                {journey.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-medium">
                  {typeLabels[journey.type]}
                </Badge>
{journey.category && (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {t(getIndustryLabelKey(journey.category))}
                </Badge>
              )}
                <Badge variant="outline" className={`text-[10px] ${statusColors[journey.status]}`}>
                  {journey.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                {/* Visibility indicator (info only) */}
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                    journey.is_public
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  {journey.is_public ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                  {journey.is_public ? "Public" : "Private"}
                </span>
                {journey.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary tab nav */}
          <nav className="mt-4 -mb-px flex gap-0 overflow-x-auto scrollbar-none [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none]" role="tablist">
            {allTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                role="tab"
                aria-selected={isTabActive(tab)}
                className={cn(
                  "shrink-0 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
                  isTabActive(tab)
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {tab.label}
                {"comingSoon" in tab && tab.comingSoon && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">
                    Soon
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <ErrorBoundary
          fallbackTitle="Failed to load this section"
          fallbackDescription="An error occurred while rendering this page tab. Click below to retry."
        >
          {children}
        </ErrorBoundary>
      </div>

      {/* Promotion Copy vs Move dialog (JDS-040) */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to {promoteTarget?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              How would you like to promote &ldquo;{journey?.title}&rdquo;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <button
              disabled={promoting}
              onClick={async () => {
                if (!promoteTarget) return
                setPromoting(true)
                try {
                  await updateJourneyStatus(journeyId, promoteTarget.status, promoteTarget.type)
                  mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                  toast.success(`"${journey?.title}" moved to ${promoteTarget.label}`)
                  setPromoteDialogOpen(false)
                  router.push(`/journeys?tab=${promoteTarget.type}`)
                } catch { toast.error("Failed to promote journey") }
                finally { setPromoting(false) }
              }}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <Rocket className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Move</p>
                <p className="text-xs text-muted-foreground">Move this journey in-place. It will no longer appear in its current category.</p>
              </div>
            </button>
            <button
              disabled={promoting}
              onClick={async () => {
                if (!promoteTarget) return
                setPromoting(true)
                try {
                  const result = await duplicateJourney(journeyId)
                  await updateJourneyStatus(result.id, promoteTarget.status, promoteTarget.type)
                  mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                  toast.success(`Copy of "${journey?.title}" promoted to ${promoteTarget.label}`)
                  setPromoteDialogOpen(false)
                  router.push(`/journeys/${result.id}/overview`)
                } catch { toast.error("Failed to copy & promote journey") }
                finally { setPromoting(false) }
              }}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <Copy className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Copy</p>
                <p className="text-xs text-muted-foreground">Create a duplicate and promote the copy. The original stays in its current category.</p>
              </div>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={promoting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import dialog */}
      <JourneyImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={(journey) => {
          toast.success(`Journey "${journey.title}" imported successfully`, {
            description: `${journey.stages.length} stages with ${journey.stages.reduce((s, st) => s + st.steps.length, 0)} steps extracted.`,
          })
        }}
      />

      {/* René AI Generate Confirmation Dialog */}
      <AlertDialog open={aiGenerateOpen} onOpenChange={setAiGenerateOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Journey with René AI
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p>
                René AI will generate a complete journey structure based on the <strong>{journey?.title}</strong> metadata, including category, description, tags, and linked archetypes.
              </p>
              
              {/* What will be generated */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground mb-2">
                  What will be generated:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    5-12 stages covering the complete customer lifecycle
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Multiple steps per stage with detailed descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Touchpoints with channels and emotional scores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Pain points for negative experiences
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Highlights for positive experiences
                  </li>
                </ul>
              </div>

              {/* Generation options */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground mb-2">
                  Select what to generate:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateOptions.stages}
                      disabled
                      className="rounded border-border"
                    />
                    <span className="text-muted-foreground">Stages</span>
                    <span className="text-[9px] text-muted-foreground/60">(required)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateOptions.steps}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setGenerateOptions(prev => ({
                          ...prev,
                          steps: checked,
                          // Disable touchpoints if steps unchecked
                          touchpoints: checked ? prev.touchpoints : false,
                          // Disable pain points & highlights if touchpoints would be disabled
                          painPoints: checked ? prev.painPoints : false,
                          highlights: checked ? prev.highlights : false,
                        }))
                      }}
                      className="rounded border-border"
                    />
                    <span className={generateOptions.steps ? "text-foreground" : "text-muted-foreground"}>Steps</span>
                  </label>
                  <label className={`flex items-center gap-2 text-xs ${generateOptions.steps ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                    <input
                      type="checkbox"
                      checked={generateOptions.touchpoints}
                      disabled={!generateOptions.steps}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setGenerateOptions(prev => ({
                          ...prev,
                          touchpoints: checked,
                          // Disable pain points & highlights if touchpoints unchecked
                          painPoints: checked ? prev.painPoints : false,
                          highlights: checked ? prev.highlights : false,
                        }))
                      }}
                      className="rounded border-border"
                    />
                    <span className={generateOptions.touchpoints && generateOptions.steps ? "text-foreground" : "text-muted-foreground"}>Touchpoints</span>
                  </label>
                  <label className={`flex items-center gap-2 text-xs ${generateOptions.touchpoints ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                    <input
                      type="checkbox"
                      checked={generateOptions.painPoints}
                      disabled={!generateOptions.touchpoints}
                      onChange={(e) => setGenerateOptions(prev => ({ ...prev, painPoints: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className={generateOptions.painPoints && generateOptions.touchpoints ? "text-foreground" : "text-muted-foreground"}>Pain Points</span>
                  </label>
                  <label className={`flex items-center gap-2 text-xs ${generateOptions.touchpoints ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                    <input
                      type="checkbox"
                      checked={generateOptions.highlights}
                      disabled={!generateOptions.touchpoints}
                      onChange={(e) => setGenerateOptions(prev => ({ ...prev, highlights: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className={generateOptions.highlights && generateOptions.touchpoints ? "text-foreground" : "text-muted-foreground"}>Highlights</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Warning: This will replace existing content
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  All current stages, steps, and touchpoints will be deleted and replaced. This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={generating}
              className="bg-primary"
              onClick={async (e) => {
                e.preventDefault()
                setGenerating(true)
                try {
                  const response = await fetch("/api/ai/generate-journey", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      journeyId,
                      title: journey?.title,
                      description: journey?.description,
                      options: generateOptions,
                    }),
                  })
                  
                  const result = await response.json()
                  
                  if (!response.ok) {
                    throw new Error(result.error || "Generation failed")
                  }
                  
                  toast.success("Journey generated successfully", {
                    description: `René AI created ${result.stagesCount} stages, ${result.stepsCount} steps, and ${result.touchpointsCount} touchpoints.`
                  })
                  mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                  setAiGenerateOpen(false)
                } catch (err) {
                  const errorMsg = err instanceof Error ? err.message : "Failed to generate journey"
                  toast.error("Failed to generate journey", { description: errorMsg })
                } finally {
                  setGenerating(false)
                }
              }}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with René AI
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
