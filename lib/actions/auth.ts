"use server"

import { createClient } from "@/lib/supabase/server"
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
    // Check if profile has an org; if not, assign the default one
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (profile && !profile.organization_id) {
      // Assign the default org
      await supabase
        .from("profiles")
        .update({ organization_id: "a0000000-0000-0000-0000-000000000001" })
        .eq("id", user.id)
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

  // If the user was auto-confirmed (e.g. local dev), set up their org
  if (data.user && data.session) {
    // Update the profile with org
    await supabase
      .from("profiles")
      .update({
        name,
        organization_id: "a0000000-0000-0000-0000-000000000001",
        role,
      })
      .eq("id", data.user.id)

    // Add to default team
    await supabase.from("team_members").insert({
      team_id: "b0000000-0000-0000-0000-000000000001",
      user_id: data.user.id,
    })

    redirect("/dashboard")
  }

  // Email confirmation required
  return { success: true, message: "Check your email to confirm your account." }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
