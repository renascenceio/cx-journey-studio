"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Shield, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Save, 
  Search,
  Crown,
  User,
  Headphones,
  Eye,
  AlertTriangle,
  Check,
  X
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Available admin permissions
const ADMIN_PERMISSIONS = [
  { id: "analytics", label: "Analytics", description: "View analytics dashboard" },
  { id: "finance", label: "Finance", description: "View financial data and reports" },
  { id: "lineage", label: "Lineage", description: "Track asset lineage and AI usage" },
  { id: "templates", label: "Templates", description: "Manage journey templates" },
  { id: "users", label: "Users", description: "View and manage user accounts" },
  { id: "solutions", label: "Solutions", description: "Manage solutions library" },
  { id: "ai-prompts", label: "AI Prompts", description: "Configure AI prompts" },
  { id: "notifications", label: "Notifications", description: "Manage notification settings" },
  { id: "billing", label: "Billing", description: "Manage billing and plans" },
  { id: "config", label: "Site Config", description: "System configuration" },
  { id: "legal", label: "Legal Content", description: "Edit terms and privacy policy" },
  { id: "translations", label: "Translations", description: "Manage translations" },
  { id: "support", label: "Support", description: "Handle support tickets" },
  { id: "status", label: "System Status", description: "View system status" },
]

const ROLE_ICONS: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-4 w-4 text-amber-500" />,
  admin: <ShieldCheck className="h-4 w-4 text-blue-500" />,
  support: <Headphones className="h-4 w-4 text-green-500" />,
  moderator: <Eye className="h-4 w-4 text-purple-500" />,
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
  moderator: "Moderator",
}

interface AdminRole {
  id: string
  user_id: string
  role: string
  permissions: string[]
  granted_by: string | null
  granted_at: string
  is_active: boolean
  notes: string | null
  created_at: string
  user?: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
  granter?: {
    name: string
    email: string
  }
}

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

export default function AdminAccessPage() {
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([])
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedRole, setSelectedRole] = useState<string>("admin")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setCurrentUserId(user.id)

      // Only aslan@renascence.io is the super admin - hardcoded for security
      const isSuperAdminUser = user.email === "aslan@renascence.io"
      setIsSuperAdmin(isSuperAdminUser)

      // Load admin roles with user profiles
      const { data: roles, error: rolesError } = await supabase
        .from("admin_roles")
        .select(`
          *,
          user:profiles!admin_roles_user_id_fkey(id, name, avatar_url),
          granter:profiles!admin_roles_granted_by_fkey(name, email)
        `)
        .order("created_at", { ascending: false })

      if (rolesError) {
        console.error("Error loading admin roles:", rolesError)
        // If table doesn't exist, we'll show empty state
      } else {
        // Add email from auth.users
        const rolesWithEmail = await Promise.all((roles || []).map(async (role) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(role.user_id).catch(() => ({ data: null }))
          return {
            ...role,
            user: {
              ...role.user,
              email: authUser?.user?.email || "Unknown"
            }
          }
        }))
        setAdminRoles(rolesWithEmail as AdminRole[])
      }

      // Load all users for the dropdown
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .order("name")

      // Get emails from a workaround (profiles table doesn't have email)
      setAllUsers((profiles || []).map(p => ({
        ...p,
        email: "", // Will be filled when selecting
        name: p.name || "Unknown User"
      })))

    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAdmin() {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select a user and role")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from("admin_roles")
        .upsert({
          user_id: selectedUser,
          role: selectedRole,
          permissions: selectedRole === "super_admin" ? ["all"] : selectedPermissions,
          granted_by: currentUserId,
          granted_at: new Date().toISOString(),
          is_active: true,
          notes: notes || null,
        }, { onConflict: "user_id" })

      if (error) throw error

      toast.success("Admin access granted successfully")
      setShowAddDialog(false)
      setSelectedUser("")
      setSelectedRole("admin")
      setSelectedPermissions([])
      setNotes("")
      loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to grant access"
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(roleId: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from("admin_roles")
        .update({ is_active: isActive })
        .eq("id", roleId)

      if (error) throw error

      toast.success(isActive ? "Access enabled" : "Access disabled")
      loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update"
      toast.error(errorMessage)
    }
  }

  async function handleRemoveAdmin(roleId: string) {
    if (!confirm("Are you sure you want to remove this admin access?")) return

    try {
      const { error } = await supabase
        .from("admin_roles")
        .delete()
        .eq("id", roleId)

      if (error) throw error

      toast.success("Admin access removed")
      loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove"
      toast.error(errorMessage)
    }
  }

  function togglePermission(permissionId: string) {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
  }

  // The only admin is aslan@renascence.io - hardcoded for security
  const superAdminDisplay = {
    id: "super-admin",
    user_id: currentUserId || "",
    role: "super_admin",
    permissions: ADMIN_PERMISSIONS.map(p => p.id),
    granted_by: null,
    granted_at: "2024-01-01T00:00:00Z",
    is_active: true,
    notes: "System super administrator - hardcoded access",
    created_at: "2024-01-01T00:00:00Z",
    user: {
      id: currentUserId || "",
      email: "aslan@renascence.io",
      name: "Aslan Patov",
      avatar_url: null
    }
  }
  
  const filteredRoles = [superAdminDisplay].filter(role => 
    role.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Only super administrators can access this page. Contact your system administrator if you need access.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Access Management</h1>
          <p className="text-muted-foreground">
            Only aslan@renascence.io has admin access (hardcoded for security)
          </p>
        </div>
        {/* Grant Access dialog hidden - only aslan@renascence.io is admin */}
        <Dialog open={false} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="hidden">
              <UserPlus className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Grant Admin Access</DialogTitle>
              <DialogDescription>
                Select a user and configure their admin permissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter(u => !adminRoles.some(r => r.user_id === u.id))
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            {user.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        {ROLE_ICONS.admin}
                        Admin - Custom permissions
                      </div>
                    </SelectItem>
                    <SelectItem value="support">
                      <div className="flex items-center gap-2">
                        {ROLE_ICONS.support}
                        Support - Handle support tickets
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        {ROLE_ICONS.moderator}
                        Moderator - View-only access
                      </div>
                    </SelectItem>
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        {ROLE_ICONS.super_admin}
                        Super Admin - Full access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole !== "super_admin" && (
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-lg border bg-muted/30">
                    {ADMIN_PERMISSIONS.map(permission => (
                      <div key={permission.id} className="flex items-start gap-3">
                        <Checkbox
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <div className="grid gap-0.5">
                          <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                            {permission.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Add a note about this access grant..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdmin} disabled={saving || !selectedUser}>
                {saving ? "Granting..." : "Grant Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Super Admin Access</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have full system access. Be careful when granting or modifying admin permissions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Admins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Administrators</CardTitle>
              <CardDescription>
                1 user with admin access (Super Admin only)
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No admin users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={role.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {role.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{role.user?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {role.user?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ROLE_ICONS[role.role]}
                        <span>{ROLE_LABELS[role.role]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.role === "super_admin" ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Full Access
                        </Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(role.permissions || []).slice(0, 3).map((p: string) => (
                            <Badge key={p} variant="secondary" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                          {(role.permissions || []).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(role.permissions || []).length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {role.is_active ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            <X className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(role.granted_at).toLocaleDateString()}
                      </div>
                      {role.granter && (
                        <div className="text-xs text-muted-foreground">
                          by {role.granter.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={role.is_active}
                          onCheckedChange={(checked) => handleToggleActive(role.id, checked)}
                          disabled={role.user_id === currentUserId}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveAdmin(role.id)}
                          disabled={role.user_id === currentUserId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ADMIN_PERMISSIONS.map(permission => (
              <div key={permission.id} className="space-y-1">
                <p className="font-medium text-sm">{permission.label}</p>
                <p className="text-xs text-muted-foreground">{permission.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
