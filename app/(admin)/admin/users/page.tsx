"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Shield, Users, Mail } from "lucide-react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  orgName: string
  createdAt: string
}

const roleColors: Record<string, string> = {
  admin: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  journey_master: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  contributor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  viewer: "bg-muted text-muted-foreground",
  external: "bg-muted text-muted-foreground",
}

import { getInitials } from "@/lib/utils"

export default function AdminUsersPage() {
  const { data, isLoading } = useSWR<{ users: UserRecord[] }>("/api/admin/users", fetcher)
  const users = data?.users || []
  const [search, setSearch] = useState("")

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{users.filter((u) => u.role === "admin" || u.role === "journey_master").length}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{users.filter((u) => u.role === "viewer" || u.role === "external").length}</p>
              <p className="text-xs text-muted-foreground">Viewers/External</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <Card className="border-border/60">
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-3">Organization</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-1">Actions</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
            ) : (
              filtered.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-accent/30 transition-colors">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
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
                        <SelectItem value="journey_master">Journey Master</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-foreground truncate">{user.orgName || "--"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
