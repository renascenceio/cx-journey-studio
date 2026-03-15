"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Shield, 
  Users, 
  Mail, 
  LayoutGrid, 
  List,
  Building2,
  Calendar,
  Clock,
  Activity,
  FileText,
  Coins,
  Globe,
  MapPin
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { getInitials } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface UserRecord {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  orgName: string
  orgId: string | null
  createdAt: string
  // Extended data
  lastLoginAt: string | null
  journeyCount: number
  workspaceCount: number
  creditsUsed: number
  creditsBalance: number
  language: string
  timezone: string
  country: string | null
  lastActivityAt: string | null
  isActive: boolean
}

const roleColors: Record<string, string> = {
  admin: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  journey_master: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  contributor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  viewer: "bg-muted text-muted-foreground",
  external: "bg-muted text-muted-foreground",
}

export default function AdminUsersPage() {
  const { data, isLoading } = useSWR<{ users: UserRecord[] }>("/api/admin/users", fetcher)
  const users = data?.users || []
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filtered = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin" || u.role === "journey_master").length,
    contributors: users.filter((u) => u.role === "contributor").length,
    viewers: users.filter((u) => u.role === "viewer" || u.role === "external").length,
    activeThisMonth: users.filter((u) => {
      if (!u.lastActivityAt) return false
      const lastActivity = new Date(u.lastActivityAt)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return lastActivity > thirtyDaysAgo
    }).length,
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      mutate("/api/admin/users")
      toast.success("Role updated")
    } catch {
      toast.error("Failed to update role")
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  function getTimeAgo(date: string | null) {
    if (!date) return "Never"
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days < 1) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`
    return formatDate(date)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all registered users, roles, and organization memberships
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admins/Masters</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.contributors}</p>
              <p className="text-xs text-muted-foreground">Contributors</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.viewers}</p>
              <p className="text-xs text-muted-foreground">Viewers/External</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.activeThisMonth}</p>
              <p className="text-xs text-muted-foreground">Active (30d)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="journey_master">Master</SelectItem>
            <SelectItem value="contributor">Contributor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : viewMode === "list" ? (
        <Card className="border-border/60">
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Organization</div>
              <div className="col-span-2">Last Active</div>
              <div className="col-span-2">Actions</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
            ) : (
              filtered.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-accent/30 transition-colors">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                    >
                      <SelectTrigger className="h-7 text-[11px] w-auto">
                        <Badge variant="secondary" className={`text-[10px] ${roleColors[user.role] || ""}`}>
                          {user.role.replace("_", " ")}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="journey_master">Master</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-foreground truncate">{user.orgName || "--"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">{getTimeAgo(user.lastActivityAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedUser(user)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((user) => (
            <Card 
              key={user.id} 
              className="border-border/60 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <Badge variant="secondary" className={`mt-2 text-[10px] ${roleColors[user.role] || ""}`}>
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{user.journeyCount}</p>
                    <p className="text-[10px] text-muted-foreground">Journeys</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{user.workspaceCount}</p>
                    <p className="text-[10px] text-muted-foreground">Workspaces</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{user.creditsBalance}</p>
                    <p className="text-[10px] text-muted-foreground">Credits</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{user.orgName || "No org"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(user.lastActivityAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {selectedUser.avatar ? <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} /> : null}
                    <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedUser.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      {selectedUser.email}
                      <Badge variant="secondary" className={roleColors[selectedUser.role]}>
                        {selectedUser.role.replace("_", " ")}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Stats */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedUser.journeyCount}</p>
                            <p className="text-xs text-muted-foreground">Journeys</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedUser.workspaceCount}</p>
                            <p className="text-xs text-muted-foreground">Workspaces</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Coins className="h-8 w-8 text-amber-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedUser.creditsBalance}</p>
                            <p className="text-xs text-muted-foreground">Credits Balance</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Details */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">User Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Organization</span>
                        <span className="text-sm font-medium">{selectedUser.orgName || "None"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Joined</span>
                        <span className="text-sm font-medium">{formatDate(selectedUser.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Login</span>
                        <span className="text-sm font-medium">{getTimeAgo(selectedUser.lastLoginAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Activity</span>
                        <span className="text-sm font-medium">{getTimeAgo(selectedUser.lastActivityAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Language</span>
                        <span className="text-sm font-medium">{selectedUser.language || "English"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Timezone</span>
                        <span className="text-sm font-medium">{selectedUser.timezone || "UTC"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Country</span>
                        <span className="text-sm font-medium">{selectedUser.country || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Credits Used</span>
                        <span className="text-sm font-medium">{selectedUser.creditsUsed.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                          {selectedUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm">Activity timeline coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Role Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">User Role</span>
                        <Select
                          value={selectedUser.role}
                          onValueChange={(v) => {
                            handleRoleChange(selectedUser.id, v)
                            setSelectedUser({ ...selectedUser, role: v })
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="journey_master">Master</SelectItem>
                            <SelectItem value="contributor">Contributor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full" disabled>
                        Reset Password
                      </Button>
                      <Button variant="outline" className="w-full text-destructive hover:text-destructive" disabled>
                        Suspend User
                      </Button>
                      <Button variant="destructive" className="w-full" disabled>
                        Delete User
                      </Button>
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
