import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")?.trim()
  const excludeId = searchParams.get("exclude") // Exclude current workspace

  try {
    console.log("[v0] Searching workspaces for user:", user.id, "query:", query, "exclude:", excludeId)
    
    // Get all workspaces the user has access to
    const { data: memberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select(`
        workspace_id,
        role,
        workspaces:workspace_id (
          id,
          name,
          slug,
          logo,
          plan
        )
      `)
      .eq("user_id", user.id)

    console.log("[v0] Workspace memberships:", memberships?.length, "error:", membershipError)
    
    if (membershipError) {
      console.error("Workspace membership error:", membershipError)
      return NextResponse.json({ workspaces: [] })
    }

    // Filter and format workspaces
    let workspaces = memberships
      ?.filter(m => {
        const ws = m.workspaces as { id: string; name: string; slug?: string; logo?: string; plan?: string } | null
        if (!ws) return false
        if (excludeId && ws.id === excludeId) return false
        
        // Filter by query if provided
        if (query && query.length >= 2) {
          const searchLower = query.toLowerCase()
          return (
            ws.name?.toLowerCase().includes(searchLower) ||
            ws.slug?.toLowerCase().includes(searchLower)
          )
        }
        return true
      })
      .map(m => {
        const ws = m.workspaces as { id: string; name: string; slug?: string; logo?: string; plan?: string }
        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          logo: ws.logo,
          plan: ws.plan,
          role: m.role,
        }
      }) || []

    // Get member counts for each workspace
    const workspaceIds = workspaces.map(w => w.id)
    
    if (workspaceIds.length > 0) {
      const { data: memberCounts } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .in("workspace_id", workspaceIds)

      const countMap: Record<string, number> = {}
      memberCounts?.forEach(m => {
        countMap[m.workspace_id] = (countMap[m.workspace_id] || 0) + 1
      })

      workspaces = workspaces.map(w => ({
        ...w,
        memberCount: countMap[w.id] || 1,
      }))
    }

    // Sort by name
    workspaces.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ workspaces: workspaces.slice(0, 20) })
  } catch (error) {
    console.error("Workspace search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
