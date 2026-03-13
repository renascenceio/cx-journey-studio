"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Crown, Shield, Building2, UserPlus, Search, Trash2, Edit, Info } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-provider"
import { useAdminPermissions, ADMIN_PERMISSIONS, SUPER_ADMIN_EMAIL, type Permission } from "@/hooks/use-admin-permissions"
import { createClient } from "@/lib/supabase/client"

// Permission groups for easier assignment
const PERMISSION_GROUPS = {
  content_manager: {
    label: "Content Manager",
    description: "Manage templates, solutions, legal content",
    permissions: [
      ADMIN_PERMISSIONS.MANAGE_TEMPLATES,
      ADMIN_PERMISSIONS.MANAGE_SOLUTIONS,
      ADMIN_PERMISSIONS.MANAGE_LEGAL,
      ADMIN_PERMISSIONS.MANAGE_LINEAGE,
      ADMIN_PERMISSIONS.MANAGE_TRENDS,
      ADMIN_PERMISSIONS.MANAGE_CROWDSOURCE,
    ],
  },
  brand_manager: {
    label: "Brand Manager",
    description: "Manage branding and notifications",
    permissions: [
      ADMIN_PERMISSIONS.MANAGE_BRAND,
      ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS,
    ],
  },
  support_manager: {
    label: "Support Manager",
    description: "Handle support tickets and view status",
    permissions: [
      ADMIN_PERMISSIONS.MANAGE_SUPPORT,
      ADMIN_PERMISSIONS.VIEW_SYSTEM_STATUS,
    ],
  },
  analytics_viewer: {
    label: "Analytics Viewer",
    description: "View dashboard and analytics",
    permissions: [
      ADMIN_PERMISSIONS.VIEW_DASHBOARD,
      ADMIN_PERMISSIONS.VIEW_ANALYTICS,
      ADMIN_PERMISSIONS.VIEW_FINANCE,
    ],
  },
  user_manager: {
    label: "User Manager",
    description: "Manage users and billing",
    permissions: [
      ADMIN_PERMISSIONS.MANAGE_USERS,
      ADMIN_PERMISSIONS.MANAGE_BILLING,
    ],
  },
  config_manager: {
    label: "Config Manager",
    description: "Manage site configuration",
    permissions: [
      ADMIN_PERMISSIONS.MANAGE_CONFIG,
      ADMIN_PERMISSIONS.MANAGE_AI_PROMPTS,
      ADMIN_PERMISSIONS.MANAGE_TRANSLATIONS,
    ],
  },
}

// All permissions with labels
const ALL_PERMISSIONS: { id: Permission; label: string; category: string }[] = [
  { id: ADMIN_PERMISSIONS.VIEW_DASHBOARD, label: "View Dashboard", category: "Dashboard" },
  { id: ADMIN_PERMISSIONS.VIEW_ANALYTICS, label: "View Analytics", category: "Dashboard" },
  { id: ADMIN_PERMISSIONS.VIEW_FINANCE, label: "View Finance", category: "Dashboard" },
  { id: ADMIN_PERMISSIONS.MANAGE_USERS, label: "Manage Users", category: "Users" },
  { id: ADMIN_PERMISSIONS.MANAGE_BILLING, label: "Manage Billing", category: "Users" },
  { id: ADMIN_PERMISSIONS.MANAGE_TEMPLATES, label: "Manage Templates", category: "Content" },
  { id: ADMIN_PERMISSIONS.MANAGE_SOLUTIONS, label: "Manage Solutions", category: "Content" },
  { id: ADMIN_PERMISSIONS.MANAGE_LEGAL, label: "Manage Legal", category: "Content" },
  { id: ADMIN_PERMISSIONS.MANAGE_LINEAGE, label: "Manage Lineage", category: "Content" },
  { id: ADMIN_PERMISSIONS.MANAGE_TRENDS, label: "Manage Trends", category: "Content" },
  { id: ADMIN_PERMISSIONS.MANAGE_CROWDSOURCE, label: "Manage Crowdsource", category: "Content" },
  { id: ADMIN_PERMISSIONS.MANAGE_BRAND, label: "Manage Brand", category: "Brand" },
  { id: ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS, label: "Manage Notifications", category: "Brand" },
  { id: ADMIN_PERMISSIONS.MANAGE_CONFIG, label: "Manage Config", category: "Configuration" },
  { id: ADMIN_PERMISSIONS.MANAGE_AI_PROMPTS, label: "Manage AI Prompts", category: "Configuration" },
  { id: ADMIN_PERMISSIONS.MANAGE_TRANSLATIONS, label: "Manage Translations", category: "Configuration" },
  { id: ADMIN_PERMISSIONS.MANAGE_SUPPORT, label: "Manage Support", category: "System" },
  { id: ADMIN_PERMISSIONS.VIEW_SYSTEM_STATUS, label: "View System Status", category: "System" },
  { id: ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS, label: "Manage Admin Access", category: "System" },
]

interface SiteAdmin {
  id: string
  user_id: string
  permissions: Permission[]
  granted_by: string | null
  granted_at: string
  is_active: boolean
  notes: string | null
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
}

interface WorkspaceAdmin {
  id: string
  user_id: string
  organization_id: string
  permissions: Permission[]
  granted_by: string | null
  granted_at: string
  is_active: boolean
  notes: string | null
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
  organization: {
    id: string
    name: string
  }
}

interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

interface Organization {
  id: string
  name: string
}

export default function AdminAccessPage() {
  const { user } = useAuth()
  const { isSuperAdmin } = useAdminPermissions()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState("super")
  const [searchQuery, setSearchQuery] = useState("")
  const [siteAdmins, setSiteAdmins] = useState<SiteAdmin[]>([])
  const [workspaceAdmins, setWorkspaceAdmins] = useState<WorkspaceAdmin[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [showAddSiteAdmin, setShowAddSiteAdmin] = useState(false)
  const [showAddWorkspaceAdmin, setShowAddWorkspaceAdmin] = useState(false)
  const [showEditPermissions, setShowEditPermissions] = useState<SiteAdmin | WorkspaceAdmin | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: "site" | "workspace"; id: string } | null>(null)
  
  // Form states
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [])
  
  async function loadData() {
    setLoading(true)
    try {
      // Load site admins
      const { data: siteAdminData } = await supabase
        .from("site_admins")
        .select("*")
        .eq("is_active", true)
      
      // Load user profiles for site admins
      if (siteAdminData && siteAdminData.length > 0) {
        const userIds = siteAdminData.map(a => a.user_id)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, name, avatar_url")
          .in("id", userIds)
        
        const adminsWithUsers = siteAdminData.map(admin => ({
          ...admin,
          user: profiles?.find(p => p.id === admin.user_id) || { id: admin.user_id, email: "", name: "Unknown", avatar_url: null }
        }))
        setSiteAdmins(adminsWithUsers)
      } else {
        setSiteAdmins([])
      }
      
      // Load workspace admins
      const { data: workspaceAdminData } = await supabase
        .from("workspace_admins")
        .select("*")
        .eq("is_active", true)
      
      if (workspaceAdminData && workspaceAdminData.length > 0) {
        const userIds = workspaceAdminData.map(a => a.user_id)
        const orgIds = workspaceAdminData.map(a => a.organization_id)
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, name, avatar_url")
          .in("id", userIds)
        
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds)
        
        const adminsWithData = workspaceAdminData.map(admin => ({
          ...admin,
          user: profiles?.find(p => p.id === admin.user_id) || { id: admin.user_id, email: "", name: "Unknown", avatar_url: null },
          organization: orgs?.find(o => o.id === admin.organization_id) || { id: admin.organization_id, name: "Unknown" }
        }))
        setWorkspaceAdmins(adminsWithData)
      } else {
        setWorkspaceAdmins([])
      }
      
      // Load users for selection
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, email, name, avatar_url")
        .order("name")
      
      setUsers(usersData || [])
      
      // Load organizations for selection
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name")
      
      setOrganizations(orgsData || [])
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }
  
  function togglePermission(permission: Permission) {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }
  
  function applyPermissionGroup(groupKey: keyof typeof PERMISSION_GROUPS) {
    const group = PERMISSION_GROUPS[groupKey]
    setSelectedPermissions(prev => {
      const newPerms = new Set(prev)
      group.permissions.forEach(p => newPerms.add(p))
      return Array.from(newPerms)
    })
  }
  
  async function handleAddSiteAdmin() {
    if (!selectedUserId || selectedPermissions.length === 0) {
      toast.error("Please select a user and at least one permission")
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from("site_admins")
        .upsert({
          user_id: selectedUserId,
          permissions: selectedPermissions,
          granted_by: user?.id,
          granted_at: new Date().toISOString(),
          is_active: true,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        })
      
      if (error) throw error
      
      toast.success("Site admin added successfully")
      setShowAddSiteAdmin(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error adding site admin:", error)
      toast.error("Failed to add site admin")
    } finally {
      setSaving(false)
    }
  }
  
  async function handleAddWorkspaceAdmin() {
    if (!selectedUserId || !selectedOrgId || selectedPermissions.length === 0) {
      toast.error("Please select a user, organization, and at least one permission")
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from("workspace_admins")
        .upsert({
          user_id: selectedUserId,
          organization_id: selectedOrgId,
          permissions: selectedPermissions,
          granted_by: user?.id,
          granted_at: new Date().toISOString(),
          is_active: true,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,organization_id",
        })
      
      if (error) throw error
      
      toast.success("Workspace admin added successfully")
      setShowAddWorkspaceAdmin(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error adding workspace admin:", error)
      toast.error("Failed to add workspace admin")
    } finally {
      setSaving(false)
    }
  }
  
  async function handleUpdatePermissions() {
    if (!showEditPermissions || selectedPermissions.length === 0) return
    
    setSaving(true)
    try {
      const table = "organization_id" in showEditPermissions ? "workspace_admins" : "site_admins"
      
      const { error } = await supabase
        .from(table)
        .update({
          permissions: selectedPermissions,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", showEditPermissions.id)
      
      if (error) throw error
      
      toast.success("Permissions updated successfully")
      setShowEditPermissions(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast.error("Failed to update permissions")
    } finally {
      setSaving(false)
    }
  }
  
  async function handleDelete() {
    if (!showDeleteConfirm) return
    
    setSaving(true)
    try {
      const table = showDeleteConfirm.type === "site" ? "site_admins" : "workspace_admins"
      
      const { error } = await supabase
        .from(table)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", showDeleteConfirm.id)
      
      if (error) throw error
      
      toast.success("Admin access revoked")
      setShowDeleteConfirm(null)
      loadData()
    } catch (error) {
      console.error("Error revoking access:", error)
      toast.error("Failed to revoke access")
    } finally {
      setSaving(false)
    }
  }
  
  function resetForm() {
    setSelectedUserId("")
    setSelectedOrgId("")
    setSelectedPermissions([])
    setNotes("")
  }
  
  function openEditDialog(admin: SiteAdmin | WorkspaceAdmin) {
    setShowEditPermissions(admin)
    setSelectedPermissions(admin.permissions)
    setNotes(admin.notes || "")
  }
  
  // Filter admins by search
  const filteredSiteAdmins = siteAdmins.filter(admin =>
    admin.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredWorkspaceAdmins = workspaceAdmins.filter(admin =>
    admin.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Group permissions by category
  const permissionsByCategory = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, typeof ALL_PERMISSIONS>)
  
  // Permission selector component
  const PermissionSelector = () => (
    <div className="space-y-6">
      {/* Permission Groups */}
      <div className="space-y-2">
        <Label>Quick Permission Sets</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => applyPermissionGroup(key as keyof typeof PERMISSION_GROUPS)}
            >
              {group.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Individual Permissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Permissions ({selectedPermissions.length} selected)</Label>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPermissions([])}>
            Clear All
          </Button>
        </div>
        {Object.entries(permissionsByCategory).map(([category, perms]) => (
          <div key={category} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{category}</p>
            <div className="grid grid-cols-2 gap-2">
              {perms.map(perm => (
                <div key={perm.id} className="flex items-center gap-2">
                  <Checkbox
                    id={perm.id}
                    checked={selectedPermissions.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer">
                    {perm.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Access Management</h1>
        <p className="text-muted-foreground">
          Manage administrative access levels and permissions
        </p>
      </div>
      
      {/* Info Card */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="flex items-start gap-4 pt-6">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm space-y-2">
            <p className="font-medium">Three-Tier Admin System:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li><strong>Super Admin</strong> ({SUPER_ADMIN_EMAIL}) - Full platform access, can manage all admins</li>
              <li><strong>Site Admins</strong> - Platform-wide access with granular permissions</li>
              <li><strong>Workspace Admins</strong> - Organization-scoped access with limited permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="super" className="gap-2">
              <Crown className="h-4 w-4" />
              Super Admin
            </TabsTrigger>
            <TabsTrigger value="site" className="gap-2">
              <Shield className="h-4 w-4" />
              Site Admins
              {siteAdmins.length > 0 && (
                <Badge variant="secondary" className="ml-1">{siteAdmins.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-2">
              <Building2 className="h-4 w-4" />
              Workspace Admins
              {workspaceAdmins.length > 0 && (
                <Badge variant="secondary" className="ml-1">{workspaceAdmins.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Super Admin Tab */}
        <TabsContent value="super" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Super Administrator
              </CardTitle>
              <CardDescription>
                The super administrator has full access to all platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-yellow-500/10 text-yellow-600">
                    AP
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">Aslan Patov</p>
                  <p className="text-sm text-muted-foreground">{SUPER_ADMIN_EMAIL}</p>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <Crown className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Super admin access is hardcoded for security and cannot be changed through this interface.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Site Admins Tab */}
        <TabsContent value="site" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Site Administrators</h3>
              <p className="text-sm text-muted-foreground">
                Platform-wide access with customizable permissions
              </p>
            </div>
            {isSuperAdmin && (
              <Dialog open={showAddSiteAdmin} onOpenChange={setShowAddSiteAdmin}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Site Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Site Administrator</DialogTitle>
                    <DialogDescription>
                      Grant platform-wide admin access with specific permissions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Select User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.email} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <PermissionSelector />
                    
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reason for granting access..."
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddSiteAdmin(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSiteAdmin} disabled={saving}>
                      {saving ? "Adding..." : "Add Site Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading site admins...
              </CardContent>
            </Card>
          ) : filteredSiteAdmins.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchQuery ? "No site admins match your search" : "No site admins configured yet"}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSiteAdmins.map(admin => (
                <Card key={admin.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={admin.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {admin.user?.name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{admin.user?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground truncate">{admin.user?.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {admin.permissions.slice(0, 3).map(perm => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm.replace("manage_", "").replace("view_", "")}
                        </Badge>
                      ))}
                      {admin.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{admin.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(admin)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setShowDeleteConfirm({ type: "site", id: admin.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Workspace Admins Tab */}
        <TabsContent value="workspace" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Workspace Administrators</h3>
              <p className="text-sm text-muted-foreground">
                Organization-scoped access with limited permissions
              </p>
            </div>
            {isSuperAdmin && (
              <Dialog open={showAddWorkspaceAdmin} onOpenChange={setShowAddWorkspaceAdmin}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Workspace Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Workspace Administrator</DialogTitle>
                    <DialogDescription>
                      Grant organization-scoped admin access with specific permissions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Select User</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.email} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Select Organization</Label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an organization..." />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <PermissionSelector />
                    
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reason for granting access..."
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddWorkspaceAdmin(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddWorkspaceAdmin} disabled={saving}>
                      {saving ? "Adding..." : "Add Workspace Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading workspace admins...
              </CardContent>
            </Card>
          ) : filteredWorkspaceAdmins.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchQuery ? "No workspace admins match your search" : "No workspace admins configured yet"}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredWorkspaceAdmins.map(admin => (
                <Card key={admin.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={admin.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {admin.user?.name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{admin.user?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground truncate">{admin.user?.email}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {admin.organization?.name || "Unknown Org"}
                    </Badge>
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {admin.permissions.slice(0, 2).map(perm => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm.replace("manage_", "").replace("view_", "")}
                        </Badge>
                      ))}
                      {admin.permissions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{admin.permissions.length - 2} more
                        </Badge>
                      )}
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(admin)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setShowDeleteConfirm({ type: "workspace", id: admin.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Permissions Dialog */}
      <Dialog open={!!showEditPermissions} onOpenChange={(open) => !open && setShowEditPermissions(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update admin permissions for {showEditPermissions?.user?.name || "this user"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <PermissionSelector />
            
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes about this admin..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPermissions(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Admin Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove admin access for this user. They will no longer be able to access the admin panel with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
