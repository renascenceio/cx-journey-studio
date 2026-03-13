"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Building2, 
  Users, 
  FolderKanban,
  Calendar, 
  LayoutGrid,
  List,
  FileText,
  Clock,
  Activity,
  Map
} from "lucide-react"
import useSWR from "swr"
import { getInitials } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Workspace {
  id: string
  name: string
  description: string | null
  organization_id: string
  organization_name: string
  organization_logo: string | null
  created_at: string
  // Extended data
  memberCount: number
  journeyCount: number
  activeJourneyCount: number
  completedJourneyCount: number
  lastActivityAt: string | null
  creatorName: string
  creatorEmail: string
}

export default function AdminWorkspacesPage() {
  const { data, isLoading } = useSWR<{ workspaces: Workspace[] }>("/api/admin/workspaces", fetcher)
  const workspaces = data?.workspaces || []
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [orgFilter, setOrgFilter] = useState<string>("all")

  // Get unique organizations for filter
  const organizations = Array.from(new Set(workspaces.map(w => w.organization_name)))

  const filtered = workspaces.filter((ws) => {
    const matchesSearch = ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.organization_name.toLowerCase().includes(search.toLowerCase()) ||
      (ws.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesOrg = orgFilter === "all" || ws.organization_name === orgFilter
    return matchesSearch && matchesOrg
  })

  const stats = {
    total: workspaces.length,
    totalMembers: workspaces.reduce((acc, w) => acc + w.memberCount, 0),
    totalJourneys: workspaces.reduce((acc, w) => acc + w.journeyCount, 0),
    activeJourneys: workspaces.reduce((acc, w) => acc + w.activeJourneyCount, 0),
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  function getAge(createdAt: string) {
    const created = new Date(createdAt)
    const now = new Date()
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 1) return "Today"
    if (days === 1) return "1 day ago"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all workspaces (teams) across organizations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <FolderKanban className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Workspaces</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Map className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.totalJourneys}</p>
              <p className="text-xs text-muted-foreground">Total Journeys</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.activeJourneys}</p>
              <p className="text-xs text-muted-foreground">Active Journeys</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All Organizations</option>
          {organizations.map((org) => (
            <option key={org} value={org}>{org}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Workspace List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">No workspaces found</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ws) => (
            <Card 
              key={ws.id} 
              className="border-border/60 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelectedWorkspace(ws)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{ws.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ws.description || "No description"}</p>
                  </div>
                </div>

                {/* Organization Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <Avatar className="h-5 w-5 rounded">
                    {ws.organization_logo ? <AvatarImage src={ws.organization_logo} /> : null}
                    <AvatarFallback className="rounded text-[8px] bg-muted">
                      {getInitials(ws.organization_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{ws.organization_name}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{ws.memberCount}</p>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{ws.journeyCount}</p>
                    <p className="text-[10px] text-muted-foreground">Journeys</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">{ws.activeJourneyCount}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getAge(ws.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>{ws.lastActivityAt ? getAge(ws.lastActivityAt) : "No activity"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/60">
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-3">Workspace</div>
              <div className="col-span-2">Organization</div>
              <div className="col-span-1">Members</div>
              <div className="col-span-1">Journeys</div>
              <div className="col-span-1">Active</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Actions</div>
            </div>

            {filtered.map((ws) => (
              <div key={ws.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-accent/30 transition-colors">
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ws.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ws.description || "No description"}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <Avatar className="h-5 w-5 rounded shrink-0">
                    {ws.organization_logo ? <AvatarImage src={ws.organization_logo} /> : null}
                    <AvatarFallback className="rounded text-[8px] bg-muted">
                      {getInitials(ws.organization_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{ws.organization_name}</span>
                </div>
                <div className="col-span-1 text-sm text-foreground">{ws.memberCount}</div>
                <div className="col-span-1 text-sm text-foreground">{ws.journeyCount}</div>
                <div className="col-span-1 text-sm text-green-600">{ws.activeJourneyCount}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{formatDate(ws.created_at)}</div>
                <div className="col-span-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setSelectedWorkspace(ws)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workspace Detail Dialog */}
      <Dialog open={!!selectedWorkspace} onOpenChange={(open) => !open && setSelectedWorkspace(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedWorkspace && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedWorkspace.name}</DialogTitle>
                <DialogDescription>
                  {selectedWorkspace.description || "No description"}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="journeys">Journeys</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Organization Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Organization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                          {selectedWorkspace.organization_logo ? (
                            <AvatarImage src={selectedWorkspace.organization_logo} />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-primary/10 text-sm">
                            {getInitials(selectedWorkspace.organization_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedWorkspace.organization_name}</p>
                          <p className="text-xs text-muted-foreground">Parent Organization</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedWorkspace.memberCount}</p>
                            <p className="text-xs text-muted-foreground">Members</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedWorkspace.journeyCount}</p>
                            <p className="text-xs text-muted-foreground">Total Journeys</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Activity className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedWorkspace.activeJourneyCount}</p>
                            <p className="text-xs text-muted-foreground">Active</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Details */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Workspace Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm font-medium">{formatDate(selectedWorkspace.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created By</span>
                        <span className="text-sm font-medium">{selectedWorkspace.creatorName || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Activity</span>
                        <span className="text-sm font-medium">
                          {selectedWorkspace.lastActivityAt ? formatDate(selectedWorkspace.lastActivityAt) : "No activity"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Completed Journeys</span>
                        <span className="text-sm font-medium">{selectedWorkspace.completedJourneyCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="members" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm">Member list coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="journeys" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm">Journey list coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
