"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserPlus, Mail, MoreHorizontal, Send, Users, Globe, Trash2, Shield, Eye, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import useSWR, { mutate as globalMutate } from "swr"

const roleConfig = {
  admin: { label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", description: "Full access" },
  editor: { label: "Editor", icon: Pencil, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", description: "Can edit" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-muted text-muted-foreground", description: "View only" },
}

import { getInitials } from "@/lib/utils"

interface Profile {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface Collaborator {
  id: string
  role: "admin" | "editor" | "viewer"
  is_external: boolean
  external_email?: string
  external_name?: string
  invited_at: string
  accepted_at?: string
  profile?: Profile
}

interface CollaboratorsData {
  collaborators: Collaborator[]
  availableMembers: Profile[]
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to fetch")
  return data
}

function AddMemberDialog({ 
  journeyId, 
  availableMembers, 
  onSuccess 
}: { 
  journeyId: string
  availableMembers: Profile[]
  onSuccess: () => void 
}) {
  const [open, setOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor")
  const [sending, setSending] = useState(false)

  async function handleAdd() {
    if (!selectedMember) return
    setSending(true)
    try {
      const res = await fetch(`/api/journeys/${journeyId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selectedMember, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to add member")
      toast.success("Member added successfully")
      setSelectedMember("")
      setRole("editor")
      setOpen(false)
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add member")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Organization Member</DialogTitle>
          <DialogDescription>Add a team member from your organization to this journey.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>Select Member</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    All organization members are already collaborators
                  </div>
                ) : (
                  availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px]">{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                        <span className="text-muted-foreground">({member.email})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin - Full access to manage</SelectItem>
                <SelectItem value="editor">Editor - Can edit journey</SelectItem>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedMember || sending}>
            {sending ? "Adding..." : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InviteExternalDialog({ journeyId, onSuccess }: { journeyId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"editor" | "viewer">("viewer")
  const [sending, setSending] = useState(false)

  async function handleInvite() {
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/journeys/${journeyId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalEmail: email.trim(), externalName: name.trim() || undefined, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to invite")
      toast.success(`External collaborator added: ${email}`)
      setEmail("")
      setName("")
      setRole("viewer")
      setOpen(false)
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invitation")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          Invite External
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite External Collaborator</DialogTitle>
          <DialogDescription>Invite someone outside your organization to collaborate.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-email">Email Address *</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="external@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-name">Name (optional)</Label>
            <Input
              id="invite-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor - Can edit journey</SelectItem>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={!email.trim() || sending} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CollaboratorRow({ 
  collaborator, 
  journeyId, 
  onUpdate 
}: { 
  collaborator: Collaborator
  journeyId: string
  onUpdate: () => void 
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState(collaborator.role)
  const [updating, setUpdating] = useState(false)

  const name = collaborator.is_external 
    ? collaborator.external_name || collaborator.external_email || "External User"
    : collaborator.profile?.name || "Unknown"
  
  const email = collaborator.is_external 
    ? collaborator.external_email 
    : collaborator.profile?.email

  const config = roleConfig[collaborator.role]
  const RoleIcon = config.icon

  async function handleDelete() {
    setUpdating(true)
    try {
      const res = await fetch(`/api/journeys/${journeyId}/collaborators?collaboratorId=${collaborator.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove")
      toast.success(`${name} removed from journey`)
      onUpdate()
    } catch {
      toast.error("Failed to remove collaborator")
    } finally {
      setUpdating(false)
      setDeleteOpen(false)
    }
  }

  async function handleRoleChange() {
    if (newRole === collaborator.role) {
      setRoleDialogOpen(false)
      return
    }
    setUpdating(true)
    try {
      const res = await fetch(`/api/journeys/${journeyId}/collaborators`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId: collaborator.id, role: newRole }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(`${name}'s role updated to ${roleConfig[newRole].label}`)
      onUpdate()
    } catch {
      toast.error("Failed to update role")
    } finally {
      setUpdating(false)
      setRoleDialogOpen(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 px-5 py-4">
        <Avatar className="h-9 w-9">
          <AvatarFallback className={cn(
            "text-xs font-medium",
            collaborator.is_external ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
          )}>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{name}</p>
            {collaborator.is_external && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                External
              </Badge>
            )}
            {collaborator.accepted_at ? (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                Invited
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className={cn("text-[10px] gap-1", config.color)}>
            <RoleIcon className="h-3 w-3" />
            {config.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            {new Date(collaborator.invited_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
                <Shield className="h-3.5 w-3.5 mr-2" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Remove Access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{name}</strong> from this journey? They will lose all access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={updating} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {updating ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role change dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>Update {name}'s role on this journey.</DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!collaborator.is_external && (
                <SelectItem value="admin">Admin - Full access to manage</SelectItem>
              )}
              <SelectItem value="editor">Editor - Can edit journey</SelectItem>
              <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={updating}>
              {updating ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function CollaboratorsPage() {
  const params = useParams()
  const journeyId = params.id as string
  
  const { data, error, isLoading, mutate } = useSWR<CollaboratorsData>(
    `/api/journeys/${journeyId}/collaborators`,
    fetcher,
    { revalidateOnFocus: true }
  )

  const collaborators = data?.collaborators || []
  const availableMembers = data?.availableMembers || []
  
  const internalCollaborators = collaborators.filter(c => !c.is_external)
  const externalCollaborators = collaborators.filter(c => c.is_external)

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm text-destructive">Failed to load collaborators</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => mutate()}>
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Collaborators</h2>
            <p className="text-sm text-muted-foreground">
              {collaborators.length} collaborator{collaborators.length !== 1 ? "s" : ""} with access to this journey
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddMemberDialog journeyId={journeyId} availableMembers={availableMembers} onSuccess={() => mutate(undefined, { revalidate: true })} />
            <InviteExternalDialog journeyId={journeyId} onSuccess={() => mutate(undefined, { revalidate: true })} />
          </div>
        </div>

        {/* Tabs for internal vs external */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({collaborators.length})</TabsTrigger>
            <TabsTrigger value="internal">Organization ({internalCollaborators.length})</TabsTrigger>
            <TabsTrigger value="external">External ({externalCollaborators.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {collaborators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">No collaborators yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add team members or invite external collaborators</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {collaborators.map((collab) => (
                      <CollaboratorRow 
                        key={collab.id} 
                        collaborator={collab} 
                        journeyId={journeyId}
                        onUpdate={() => mutate(undefined, { revalidate: true })}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internal" className="mt-4">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {internalCollaborators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">No organization members</p>
                    <p className="text-xs text-muted-foreground mt-1">Add team members from your organization</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {internalCollaborators.map((collab) => (
                      <CollaboratorRow 
                        key={collab.id} 
                        collaborator={collab} 
                        journeyId={journeyId}
                        onUpdate={() => mutate(undefined, { revalidate: true })}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="external" className="mt-4">
            <Card className="border-border/60">
              <CardContent className="p-0">
                {externalCollaborators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Globe className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">No external collaborators</p>
                    <p className="text-xs text-muted-foreground mt-1">Invite people outside your organization</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {externalCollaborators.map((collab) => (
                      <CollaboratorRow 
                        key={collab.id} 
                        collaborator={collab} 
                        journeyId={journeyId}
                        onUpdate={() => mutate(undefined, { revalidate: true })}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help section */}
        <Card className="border-border/60 border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Mail className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Collaboration Roles</p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center max-w-lg">
              <div>
                <Badge className={cn("mb-1", roleConfig.admin.color)}>
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
                <p className="text-[10px] text-muted-foreground">Full control including managing collaborators</p>
              </div>
              <div>
                <Badge className={cn("mb-1", roleConfig.editor.color)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editor
                </Badge>
                <p className="text-[10px] text-muted-foreground">Can edit journey content and structure</p>
              </div>
              <div>
                <Badge className={cn("mb-1", roleConfig.viewer.color)}>
                  <Eye className="h-3 w-3 mr-1" />
                  Viewer
                </Badge>
                <p className="text-[10px] text-muted-foreground">Read-only access to view journey</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
