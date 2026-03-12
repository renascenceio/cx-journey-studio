"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, Search, LayoutGrid, List, Upload, Rocket, Map, Compass, CheckCircle2, Archive, RotateCcw, Trash2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { JourneyImportDialog } from "@/components/journey-import-dialog"
import { CreateJourneyDialog } from "@/components/create-journey-dialog"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { JourneyCard } from "@/components/journey-card"
import { JourneyPeekSheet } from "@/components/journey-peek-sheet"
import { Toaster } from "@/components/ui/sonner"
import type { Journey, JourneyType, JourneyViewMode } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateJourneyStatus, archiveJourney, restoreArchivedJourney, permanentlyDeleteJourney } from "@/lib/actions/data"
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
import { mutate } from "swr"
import { useRouter } from "next/navigation"

function DeployJourneyDialog({ journeys, children }: { journeys: Journey[]; children: React.ReactNode }) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [deploying, setDeploying] = useState<string | null>(null)
  const router = useRouter()

  async function handleDeploy(j: Journey) {
    setDeploying(j.id)
    try {
      await updateJourneyStatus(j.id, "deployed")
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(`"${j.title}" has been deployed`)
      setOpen(false)
      router.push(`/journeys/${j.id}`)
    } catch {
      toast.error("Failed to deploy journey")
    } finally {
      setDeploying(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("journeyTabs.deployJourney")}</DialogTitle>
          <DialogDescription>
            {t("journeyTabs.deployJourneyDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2 max-h-80 overflow-y-auto">
          {journeys.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("journeyTabs.noJourneysToDeployDesc")}
            </p>
          ) : (
            journeys.map((j) => (
              <button
                key={j.id}
                onClick={() => handleDeploy(j)}
                disabled={deploying === j.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{j.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground capitalize">{j.type}</span>
                    <span className="text-[10px] text-muted-foreground">{j.stages.length} {t("journeyTabs.stages")}</span>
                  </div>
                </div>
                <Rocket className={`h-4 w-4 shrink-0 ${deploying === j.id ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

type TabType = "current" | "future" | "deployed" | "archived"

// Note: tabs are defined inside the component to use translations

export function JourneysClient({ journeys }: { journeys: Journey[] }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">{/* Loading journeys... */}</div>}>
      <JourneysContent journeys={journeys} />
    </Suspense>
  )
}

function JourneysContent({ journeys }: { journeys: Journey[] }) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as TabType) || "current"
  
  const tabs: { value: TabType; label: string; description: string; icon: typeof Map }[] = [
    { value: "current", label: t("journeyTabs.current"), description: t("journeyTabs.currentDesc"), icon: Map },
    { value: "future", label: t("journeyTabs.future"), description: t("journeyTabs.futureDesc"), icon: Compass },
    { value: "deployed", label: t("journeyTabs.deployed"), description: t("journeyTabs.deployedDesc"), icon: CheckCircle2 },
    { value: "archived", label: t("journeyTabs.archived"), description: t("journeyTabs.archivedDesc"), icon: Archive },
  ]
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated")
  const [viewMode, setViewMode] = useState<JourneyViewMode>("comprehensive")
  const [peekJourney, setPeekJourney] = useState<Journey | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [archiveDialogJourney, setArchiveDialogJourney] = useState<Journey | null>(null)
  const [restoreDialogJourney, setRestoreDialogJourney] = useState<Journey | null>(null)
  const [deleteDialogJourney, setDeleteDialogJourney] = useState<Journey | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const router = useRouter()

  // Archive handlers
  async function handleArchive(journey: Journey) {
    setActionPending(true)
    try {
      await archiveJourney(journey.id)
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(t("journeyTabs.journeyArchived"))
      setArchiveDialogJourney(null)
    } catch {
      toast.error("Failed to archive journey")
    } finally {
      setActionPending(false)
    }
  }

  async function handleRestore(journey: Journey) {
    setActionPending(true)
    try {
      await restoreArchivedJourney(journey.id)
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(t("journeyTabs.journeyRestored"))
      setRestoreDialogJourney(null)
    } catch {
      toast.error("Failed to restore journey")
    } finally {
      setActionPending(false)
    }
  }

  async function handlePermanentDelete(journey: Journey) {
    setActionPending(true)
    try {
      await permanentlyDeleteJourney(journey.id)
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(t("journeyTabs.journeyDeleted"))
      setDeleteDialogJourney(null)
    } catch {
      toast.error("Failed to delete journey")
    } finally {
      setActionPending(false)
    }
  }

  const journeysByType = useMemo(() => {
    if (activeTab === "archived") {
      return journeys.filter((j) => j.status === "archived")
    }
    return journeys.filter((j) => j.type === activeTab && j.status !== "archived")
  }, [journeys, activeTab])

  const countByType = useMemo(() => ({
    current: journeys.filter((j) => j.type === "current" && j.status !== "archived").length,
    future: journeys.filter((j) => j.type === "future" && j.status !== "archived").length,
    deployed: journeys.filter((j) => j.type === "deployed" && j.status !== "archived").length,
    archived: journeys.filter((j) => j.status === "archived").length,
  }), [journeys])

  const filteredJourneys = useMemo(() => {
    let list = journeysByType

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    list.sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === "name") return a.title.localeCompare(b.title)
      return 0
    })

    return list
  }, [journeysByType, searchQuery, sortBy])

  const currentDesc = tabs.find((t) => t.value === activeTab)?.description || ""

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <Toaster />
      <JourneyPeekSheet
        journey={peekJourney}
        open={!!peekJourney}
        onClose={() => setPeekJourney(null)}
      />

      <JourneyImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={(journey) => {
          toast.success(`Journey "${journey.title}" imported successfully`, {
            description: `${journey.stages.length} stages with ${journey.stages.reduce((s: number, st: { steps: unknown[] }) => s + st.steps.length, 0)} steps extracted.`,
          })
        }}
      />

      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("journey.journeys")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("journey.noJourneysDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            {t("common.import")}
          </Button>
          {activeTab === "archived" ? (
            <span className="text-xs text-muted-foreground">
              {countByType.archived} {t("journeyTabs.archived").toLowerCase()}
            </span>
          ) : activeTab === "deployed" ? (
            <DeployJourneyDialog journeys={journeys.filter((j) => j.type === "current" || j.type === "future")} t={t}>
              <Button size="sm" className="gap-1.5">
                <Rocket className="h-3.5 w-3.5" />
                {t("journeyTabs.deployJourney")}
              </Button>
            </DeployJourneyDialog>
          ) : (
            <CreateJourneyDialog defaultType={activeTab as "current" | "future"}>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {t("dashboard.newJourney")}
              </Button>
            </CreateJourneyDialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <div className="flex flex-col gap-4">
          <TabsList className="h-auto p-1 w-fit">
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2 px-4 py-2 data-[state=active]:bg-background">
                    <TabIcon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{countByType[tab.value]}</Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-none -mx-6 px-6 pb-1">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("common.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-40 pl-8 text-sm sm:w-48 lg:w-56"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-28 text-xs flex-shrink-0 sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">{t("journey.lastUpdated")}</SelectItem>
                <SelectItem value="created">{t("journey.dateCreated")}</SelectItem>
                <SelectItem value="name">{t("journey.alphabetical")}</SelectItem>
              </SelectContent>
            </Select>
            {/* View toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as JourneyViewMode)}
              className="h-8 flex-shrink-0"
            >
              <ToggleGroupItem value="comprehensive" aria-label="Card view" className="h-8 w-8 p-0">
                <LayoutGrid className="h-3.5 w-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem value="simple" aria-label="List view" className="h-8 w-8 p-0">
                <List className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <p className="mb-4 text-xs text-muted-foreground">{currentDesc}</p>
            {filteredJourneys.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
                {tab.value === "archived" ? (
                  <>
                    <Archive className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      {t("journeyTabs.noArchivedJourneys")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs text-center">
                      {t("journeyTabs.noArchivedJourneysDesc")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No {tab.label.toLowerCase()} found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search query"
                        : `Create your first ${tab.value} journey to get started`}
                    </p>
                    {!searchQuery && (
                      <Button className="mt-4" size="sm">
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        New {tab.value.charAt(0).toUpperCase() + tab.value.slice(1)} Journey
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : viewMode === "simple" ? (
              <div className="flex flex-col gap-1.5">
                {filteredJourneys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    variant="simple"
                    onPeek={setPeekJourney}
                    onArchive={setArchiveDialogJourney}
                    onRestore={setRestoreDialogJourney}
                    onPermanentDelete={setDeleteDialogJourney}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredJourneys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    variant="comprehensive"
                    onPeek={setPeekJourney}
                    onArchive={setArchiveDialogJourney}
                    onRestore={setRestoreDialogJourney}
                    onPermanentDelete={setDeleteDialogJourney}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveDialogJourney} onOpenChange={(open) => !open && setArchiveDialogJourney(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("journeyTabs.archiveJourney")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("journeyTabs.archiveJourneyConfirm", { title: archiveDialogJourney?.title || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => archiveDialogJourney && handleArchive(archiveDialogJourney)}
              disabled={actionPending}
            >
              {actionPending ? t("common.loading") : t("journeyTabs.archiveJourney")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreDialogJourney} onOpenChange={(open) => !open && setRestoreDialogJourney(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("journeyTabs.restoreJourney")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("journeyTabs.restoreJourneyConfirm", { title: restoreDialogJourney?.title || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => restoreDialogJourney && handleRestore(restoreDialogJourney)}
              disabled={actionPending}
            >
              {actionPending ? t("common.loading") : t("journeyTabs.restoreJourney")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogJourney} onOpenChange={(open) => !open && setDeleteDialogJourney(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("journeyTabs.permanentDelete")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("journeyTabs.permanentDeleteConfirm", { title: deleteDialogJourney?.title || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialogJourney && handlePermanentDelete(deleteDialogJourney)}
              disabled={actionPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionPending ? t("common.loading") : t("journeyTabs.permanentDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
