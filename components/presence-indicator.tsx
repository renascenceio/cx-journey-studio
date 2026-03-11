"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ActiveUser {
  id: string
  name: string
  avatar?: string
  context: string // e.g. "viewing Canvas", "editing Payment stage"
  color: string // tailwind color class
}

const presenceColors = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
]

interface PresenceIndicatorProps {
  activeUsers: ActiveUser[]
  maxVisible?: number
  className?: string
}

export function PresenceIndicator({ activeUsers, maxVisible = 4, className }: PresenceIndicatorProps) {
  if (activeUsers.length === 0) return null

  const visible = activeUsers.slice(0, maxVisible)
  const overflow = activeUsers.length - maxVisible

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex -space-x-1.5">
        {visible.map((user, i) => {
          // Generate initials safely - handle empty names, emails, etc.
          const displayName = user.name || "User"
          const initials = displayName
            .split(" ")
            .filter(n => n.length > 0)
            .map((n) => n[0]?.toUpperCase() || "")
            .join("")
            .slice(0, 2) || "U"
          return (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-6 w-6 ring-2 ring-background">
                      <AvatarFallback className="text-[9px] font-medium bg-muted text-muted-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Pulse dot */}
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                      presenceColors[i % presenceColors.length]
                    )}>
                      <span className={cn(
                        "absolute inset-0 rounded-full animate-ping opacity-75",
                        presenceColors[i % presenceColors.length]
                      )} />
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground ml-1">-- {user.context}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
        {overflow > 0 && (
          <Avatar className="h-6 w-6 ring-2 ring-background">
            <AvatarFallback className="text-[9px] font-medium bg-muted text-muted-foreground">
              +{overflow}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {activeUsers.length} viewing
      </span>
    </div>
  )
}

// Hook to get current user's presence data
import { useAuth } from "@/lib/auth-provider"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

// Determine context from the current pathname
function getContextFromPath(pathname: string | null): string {
  if (!pathname) return "viewing Journey"
  if (pathname.includes("/canvas")) return "viewing Canvas"
  if (pathname.includes("/archetypes")) return "viewing Archetypes"
  if (pathname.includes("/overview")) return "viewing Overview"
  if (pathname.includes("/health")) return "viewing Health"
  if (pathname.includes("/activity")) return "viewing Activity"
  if (pathname.includes("/gap-analysis")) return "viewing Gap Analysis"
  if (pathname.includes("/collaborators")) return "viewing Collaborators"
  if (pathname.includes("/versions")) return "viewing Versions"
  return "viewing Journey"
}

// Real presence hook that shows the current user as active
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useMockPresence(journeyId: string): ActiveUser[] {
  const auth = useAuth()
  const pathname = usePathname()
  
  return useMemo(() => {
    // Return empty if auth context not ready or no user
    if (!auth || !auth.user) return []
    
    const context = getContextFromPath(pathname)
    
    return [
      { 
        id: auth.user.id, 
        name: auth.user.name || auth.user.email || "You", 
        context,
        color: presenceColors[0] 
      }
    ]
  }, [auth, pathname])
}
