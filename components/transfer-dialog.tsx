"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { 
  ArrowRightLeft, 
  Copy, 
  Search, 
  Loader2, 
  Building2,
  User,
  AlertTriangle,
  Check,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { transferJourney, transferArchetype, transferWorkspaceOwnership } from "@/lib/actions/transfer"
import type { TransferAction, TransferAssetType } from "@/lib/types"
import useSWR from "swr"
import { useDebounce } from "@/hooks/use-debounce"

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetType: TransferAssetType
  assetId: string
  assetName: string
  currentWorkspaceId: string
  currentWorkspaceName?: string
  onTransferComplete?: (newAssetId?: string) => void
}

interface WorkspaceResult {
  id: string
  name: string
  slug?: string
  logo?: string
  plan?: string
  role: string
  memberCount?: number
}

interface UserResult {
  id: string
  email: string
  name: string
  avatar?: string
  role?: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function TransferDialog({
  open,
  onOpenChange,
  assetType,
  assetId,
  assetName,
  currentWorkspaceId,
  currentWorkspaceName,
  onTransferComplete,
}: TransferDialogProps) {
  const [action, setAction] = useState<TransferAction>("copy")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTarget, setSelectedTarget] = useState<WorkspaceResult | UserResult | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setAction("copy")
      setSearchQuery("")
      setSelectedTarget(null)
    }
  }, [open])

  // Search for workspaces (for journey/archetype transfer)
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useSWR(
    open && assetType !== "workspace" 
      ? `/api/search/workspaces?q=${encodeURIComponent(debouncedQuery)}&exclude=${currentWorkspaceId}`
      : null,
    fetcher
  )

  // Search for users (for workspace ownership transfer)
  const { data: usersData, isLoading: isLoadingUsers } = useSWR(
    open && assetType === "workspace" && debouncedQuery.length >= 2
      ? `/api/search/users?q=${encodeURIComponent(debouncedQuery)}&workspaceId=${currentWorkspaceId}`
      : null,
    fetcher
  )

  const workspaces: WorkspaceResult[] = workspacesData?.workspaces || []
  const users: UserResult[] = usersData?.users || []
  const isLoading = isLoadingWorkspaces || isLoadingUsers

  const handleTransfer = async () => {
    if (!selectedTarget) return

    setIsTransferring(true)

    try {
      let result

      if (assetType === "journey") {
        result = await transferJourney(assetId, action, (selectedTarget as WorkspaceResult).id)
      } else if (assetType === "archetype") {
        result = await transferArchetype(assetId, action, (selectedTarget as WorkspaceResult).id)
      } else if (assetType === "workspace") {
        result = await transferWorkspaceOwnership(assetId, (selectedTarget as UserResult).id)
      }

      if (result?.success) {
        const actionLabel = action === "move" ? "moved" : "copied"
        toast.success(
          assetType === "workspace" 
            ? "Workspace ownership transferred successfully"
            : `${assetName} ${actionLabel} successfully`
        )
        onTransferComplete?.(result.newAssetId)
        onOpenChange(false)
      } else {
        toast.error(result?.error || "Transfer failed")
      }
    } catch (error) {
      console.error("Transfer error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsTransferring(false)
    }
  }

  const getTitle = () => {
    if (assetType === "workspace") return "Transfer Workspace Ownership"
    return `Transfer ${assetType.charAt(0).toUpperCase() + assetType.slice(1)}`
  }

  const getDescription = () => {
    if (assetType === "workspace") {
      return "Transfer ownership of this workspace to another team member. You will become an admin."
    }
    return `Move or copy "${assetName}" to another workspace.`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Selection (not for workspace ownership) */}
          {assetType !== "workspace" && (
            <div className="space-y-3">
              <Label>Action</Label>
              <RadioGroup 
                value={action} 
                onValueChange={(v) => setAction(v as TransferAction)}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="copy" id="copy" className="peer sr-only" />
                  <Label
                    htmlFor="copy"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                      "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    )}
                  >
                    <Copy className="h-5 w-5 mb-2" />
                    <span className="font-medium">Copy</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Keep original
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="move" id="move" className="peer sr-only" />
                  <Label
                    htmlFor="move"
                    className={cn(
                      "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                      "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    )}
                  >
                    <ArrowRightLeft className="h-5 w-5 mb-2" />
                    <span className="font-medium">Move</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Remove from here
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <Separator />

          {/* Search */}
          <div className="space-y-3">
            <Label>
              {assetType === "workspace" ? "Search team member" : "Select destination workspace"}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={assetType === "workspace" ? "Search by name or email..." : "Search workspaces..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Results */}
            <ScrollArea className="h-[200px] rounded-md border">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : assetType === "workspace" ? (
                // User results
                users.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {users.map(user => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedTarget(user)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors",
                          "hover:bg-accent",
                          selectedTarget && (selectedTarget as UserResult).id === user.id && "bg-accent ring-2 ring-primary"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {user.role && (
                          <Badge variant="secondary" className="text-xs">
                            {user.role}
                          </Badge>
                        )}
                        {selectedTarget && (selectedTarget as UserResult).id === user.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : debouncedQuery.length >= 2 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <User className="h-8 w-8 mb-2" />
                    <p className="text-sm">No users found</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Search className="h-8 w-8 mb-2" />
                    <p className="text-sm">Type to search users</p>
                  </div>
                )
              ) : (
                // Workspace results
                workspaces.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {workspaces.map(workspace => (
                      <button
                        key={workspace.id}
                        onClick={() => setSelectedTarget(workspace)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors",
                          "hover:bg-accent",
                          selectedTarget && (selectedTarget as WorkspaceResult).id === workspace.id && "bg-accent ring-2 ring-primary"
                        )}
                      >
                        <Avatar className="h-9 w-9 rounded-md">
                          {workspace.logo ? (
                            <AvatarImage src={workspace.logo} />
                          ) : (
                            <AvatarFallback className="rounded-md bg-primary/10">
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{workspace.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{workspace.memberCount || 1} members</span>
                            {workspace.role && (
                              <>
                                <span>·</span>
                                <span>You: {workspace.role}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {selectedTarget && (selectedTarget as WorkspaceResult).id === workspace.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Building2 className="h-8 w-8 mb-2" />
                    <p className="text-sm">No other workspaces available</p>
                    <p className="text-xs mt-1">Create or join another workspace first</p>
                  </div>
                )
              )}
            </ScrollArea>
          </div>

          {/* Warning for move action */}
          {action === "move" && selectedTarget && assetType !== "workspace" && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Moving will remove "{assetName}" from {currentWorkspaceName || "this workspace"} permanently.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for workspace ownership transfer */}
          {assetType === "workspace" && selectedTarget && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-200">
                You will lose owner access and become an admin. The new owner will have full control over the workspace.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTransferring}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedTarget || isTransferring}
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {action === "move" ? "Moving..." : "Copying..."}
              </>
            ) : assetType === "workspace" ? (
              "Transfer Ownership"
            ) : action === "move" ? (
              "Move"
            ) : (
              "Copy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
