"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  // After login, ensure profile has org assignment
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const adminClient = createAdminClient()
    
    // Check if profile has an org; if not, create a personal workspace
    const { data: profile } = await adminClient
      .from("profiles")
      .select("organization_id, name")
      .eq("id", user.id)
      .single()

    if (profile && !profile.organization_id) {
      const userName = profile.name || user.user_metadata?.name || user.email?.split("@")[0] || "User"
      const workspaceName = `${userName}'s Workspace`
      const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
      
      // Create a personal workspace
      const { data: newOrg } = await adminClient
        .from("organizations")
        .insert({
          name: workspaceName,
          slug: uniqueSlug,
          plan: "free",
        })
        .select("id")
        .single()

      if (newOrg) {
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

        // Create a default team
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
        
        redirect("/onboarding")
      }
    }
  }

  redirect("/dashboard")
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const orgName = formData.get("orgName") as string
  const role = (formData.get("role") as string) || "contributor"

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        name,
        role,
        org_name: orgName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

// If the user was auto-confirmed (e.g. local dev), create their personal workspace
  if (data.user && data.session) {
  const adminClient = createAdminClient()
  const workspaceName = orgName || `${name}'s Workspace`
  const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
  
  // Create a personal workspace
  const { data: newOrg } = await adminClient
  .from("organizations")
  .insert({
  name: workspaceName,
  slug: uniqueSlug,
  plan: "free",
  })
  .select("id")
  .single()

  if (newOrg) {
  // Update the profile with org
  await adminClient
  .from("profiles")
  .update({
  name,
  organization_id: newOrg.id,
  role,
  })
  .eq("id", data.user.id)
  
  // Add user as admin of their workspace
  await adminClient.from("organization_members").insert({
  organization_id: newOrg.id,
  user_id: data.user.id,
  role: "admin",
  })
  
  // Create a default team
  const { data: team } = await adminClient.from("teams").insert({
  name: "My Team",
  description: `Default team for ${workspaceName}`,
  organization_id: newOrg.id,
  }).select("id").single()

  if (team) {
  await adminClient.from("team_members").insert({
  team_id: team.id,
  user_id: data.user.id,
  })
  }
  }
  
  redirect("/onboarding")
  }

  // Email confirmation required
  return { success: true, message: "Check your email to confirm your account." }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
