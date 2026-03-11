import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { workspaceName, industry, teamSize, goals, inviteEmails } = body

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (profile?.organization_id) {
    // Update existing organization with onboarding details
    await supabase.from("organizations").update({
      name: workspaceName,
      metadata: { industry, teamSize, goals, onboarded: true },
    }).eq("id", profile.organization_id)
  }

  // Send invites if provided
  if (inviteEmails && inviteEmails.length > 0) {
    for (const email of inviteEmails) {
      if (email && email.includes("@")) {
        // Store invite record
        await supabase.from("invitations").insert({
          organization_id: profile?.organization_id,
          email,
          invited_by: user.id,
          status: "pending",
        }).select().maybeSingle()
      }
    }
  }

  return NextResponse.json({ success: true })
}
