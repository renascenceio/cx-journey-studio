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
  const workspaceId = searchParams.get("workspaceId")

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  try {
    // If workspace ID is provided, search within workspace members
    if (workspaceId) {
      const { data: members, error } = await supabase
        .from("workspace_members")
        .select(`
          user_id,
          role,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq("workspace_id", workspaceId)
        .neq("user_id", user.id) // Exclude current user

      if (error) {
        console.error("Search members error:", error)
        return NextResponse.json({ users: [] })
      }

      // Filter by query (email or name)
      const filteredMembers = members?.filter(m => {
        const userData = m.users as { id: string; email: string; raw_user_meta_data?: { full_name?: string; name?: string } } | null
        if (!userData) return false
        
        const email = userData.email?.toLowerCase() || ""
        const name = (userData.raw_user_meta_data?.full_name || userData.raw_user_meta_data?.name || "").toLowerCase()
        const searchLower = query.toLowerCase()
        
        return email.includes(searchLower) || name.includes(searchLower)
      }) || []

      const users = filteredMembers.map(m => {
        const userData = m.users as { id: string; email: string; raw_user_meta_data?: { full_name?: string; name?: string; avatar_url?: string } }
        return {
          id: m.user_id,
          email: userData.email,
          name: userData.raw_user_meta_data?.full_name || userData.raw_user_meta_data?.name || userData.email,
          avatar: userData.raw_user_meta_data?.avatar_url,
          role: m.role,
        }
      }).slice(0, 10)

      return NextResponse.json({ users })
    }

    // General user search (for inviting to workspace)
    // Note: This requires appropriate permissions and should be limited
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq("id", user.id)
      .limit(10)

    if (error) {
      // Fallback to auth.users if profiles table doesn't exist
      console.log("Profiles search failed, trying auth approach")
      return NextResponse.json({ users: [] })
    }

    const users = profiles?.map(p => ({
      id: p.id,
      email: p.email,
      name: p.full_name || p.email,
      avatar: p.avatar_url,
    })) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
