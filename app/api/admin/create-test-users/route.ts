import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const testUsers = [
  { email: "test-free@example.com", name: "Test Free User", plan: "free" },
  { email: "test-starter@example.com", name: "Test Starter User", plan: "starter" },
  { email: "test-business@example.com", name: "Test Business User", plan: "business" },
  { email: "test-enterprise@example.com", name: "Test Enterprise User", plan: "enterprise" },
]

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    
    let created = 0
    
    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", testUser.email)
        .maybeSingle()
      
      if (existingProfile) {
        // Update existing user's plan
        await supabase
          .from("profiles")
          .update({ plan_id: testUser.plan })
          .eq("id", existingProfile.id)
        continue
      }
      
      // Create organization for test user
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: `${testUser.name}'s Organization`,
          plan_id: testUser.plan,
        })
        .select("id")
        .single()
      
      if (orgError || !org) {
        console.error("Org creation error:", orgError)
        continue
      }
      
      // Create a mock profile for test purposes
      // Note: In production, you'd use Supabase Admin API to create auth users
      const testUserId = crypto.randomUUID()
      
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: testUserId,
          email: testUser.email,
          full_name: testUser.name,
          organization_id: org.id,
          role: "member",
          plan_id: testUser.plan,
        })
      
      if (profileError) {
        console.error("Profile creation error:", profileError)
        continue
      }
      
      // Create AI credits for the organization based on plan
      const creditsMap: Record<string, number> = {
        free: 50,
        starter: 500,
        business: 2000,
        enterprise: 10000,
      }
      
      await supabase
        .from("ai_credits")
        .upsert({
          organization_id: org.id,
          credits_monthly_allowance: creditsMap[testUser.plan] || 50,
          credits_purchased: 0,
          credits_used: 0,
        }, { onConflict: "organization_id" })
      
      created++
    }
    
    return NextResponse.json({ created, message: `Created ${created} test users` })
  } catch (error) {
    console.error("Create test users error:", error)
    return NextResponse.json({ error: "Failed to create test users" }, { status: 500 })
  }
}
