import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/dashboard"

  const supabase = await createClient()

  // Handle magic link authentication (token_hash based)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "signup" | "recovery" | "invite" | "magiclink",
    })

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/dashboard`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
    
    // Error handling for magic link
    return NextResponse.redirect(`${origin}/login?error=invalid_token`)
  }

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // After confirmation, ensure user has a workspace
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let hasExistingWorkspace = false
      
      if (user) {
        const adminClient = createAdminClient()
        
        // Check if user already has an organization assigned
        const { data: profile } = await adminClient
          .from("profiles")
          .select("organization_id, name")
          .eq("id", user.id)
          .single()

        hasExistingWorkspace = !!(profile?.organization_id)

        // If user doesn't have an org, create a personal workspace for them
        if (profile && !profile.organization_id) {
          const userName = profile.name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
          const workspaceName = `${userName}'s Workspace`
          const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
          
          // Create a personal workspace for the new user
          const { data: newOrg, error: orgError } = await adminClient
            .from("organizations")
            .insert({
              name: workspaceName,
              slug: uniqueSlug,
              plan: "free",
            })
            .select("id")
            .single()

          if (!orgError && newOrg) {
            // Update profile with the new organization
            await adminClient
              .from("profiles")
              .update({ organization_id: newOrg.id })
              .eq("id", user.id)

            // Add user as admin of their workspace
            await adminClient.from("organization_members").insert({
              organization_id: newOrg.id,
              user_id: user.id,
              role: "admin",
            })

            // Create a default team for the workspace
            const { data: team } = await adminClient.from("teams").insert({
              name: "My Team",
              description: `Default team for ${workspaceName}`,
              organization_id: newOrg.id,
            }).select("id").single()

            if (team) {
              await adminClient.from("team_members").insert({
                team_id: team.id,
                user_id: user.id,
              })
            }
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      
      // Determine redirect destination - existing users go to dashboard, new users to onboarding
      const redirectUrl = hasExistingWorkspace ? "/dashboard" : next
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectUrl}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
