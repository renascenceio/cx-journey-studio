import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"
import { 
  STANDARD_REFERRAL_CREDITS, 
  PREMIUM_REFERRAL_CREDITS, 
  PREMIUM_REFERRAL_CAP, 
  CREDITS_EXPIRY_MONTHS 
} from "./referral-constants"

// B16: Referral Program utilities
// Re-export constants for backwards compatibility
export { STANDARD_REFERRAL_CREDITS, PREMIUM_REFERRAL_CREDITS, PREMIUM_REFERRAL_CAP, CREDITS_EXPIRY_MONTHS }

export interface Referral {
  id: string
  referrer_id: string
  referee_id: string | null
  referee_email: string
  status: "pending" | "signed_up" | "qualified" | "credited" | "rejected"
  is_premium: boolean
  credits_awarded: number
  credits_expires_at: string | null
  qualified_at: string | null
  credited_at: string | null
  created_at: string
}

export interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  qualifiedReferrals: number
  creditsEarned: number
  premiumReferralsUsed: number
  premiumReferralsRemaining: number
}

// Generate a unique referral code for a user
export function generateReferralCode(): string {
  return nanoid(10) // 10 character alphanumeric code
}

// Get the email domain from an email address
export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || ""
}

// Check if an email domain is blocked (consumer email)
export async function isBlockedDomain(email: string): Promise<boolean> {
  const supabase = await createClient()
  const domain = getEmailDomain(email)
  
  const { data } = await supabase
    .from("blocked_email_domains")
    .select("domain")
    .eq("domain", domain)
    .single()
  
  return !!data
}

// Check if an email domain is premium (consultancy firm)
export async function isPremiumDomain(email: string): Promise<{ isPremium: boolean; multiplier: number }> {
  const supabase = await createClient()
  const domain = getEmailDomain(email)
  
  const { data } = await supabase
    .from("premium_referral_domains")
    .select("domain, bonus_multiplier")
    .eq("domain", domain)
    .single()
  
  return {
    isPremium: !!data,
    multiplier: data?.bonus_multiplier || 1
  }
}

// Get or create a user's referral code
export async function getUserReferralCode(userId: string): Promise<string> {
  const supabase = await createClient()
  
  // Check if user already has a referral code
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single()
  
  if (profile?.referral_code) {
    return profile.referral_code
  }
  
  // Generate new referral code
  const code = generateReferralCode()
  
  await supabase
    .from("profiles")
    .update({ referral_code: code })
    .eq("id", userId)
  
  return code
}

// Get user's referral link
export function getReferralLink(referralCode: string, baseUrl: string = ""): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://app.renascence.io"
  return `${base}/signup?ref=${referralCode}`
}

// Get referral stats for a user
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = await createClient()
  
  // Get referrals
  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
  
  // Get user's premium referrals used count
  const { data: profile } = await supabase
    .from("profiles")
    .select("premium_referrals_used")
    .eq("id", userId)
    .single()
  
  const all = referrals || []
  const premiumUsed = profile?.premium_referrals_used || 0
  
  return {
    totalReferrals: all.length,
    pendingReferrals: all.filter(r => r.status === "pending" || r.status === "signed_up").length,
    qualifiedReferrals: all.filter(r => r.status === "qualified" || r.status === "credited").length,
    creditsEarned: all.reduce((sum, r) => sum + (r.credits_awarded || 0), 0),
    premiumReferralsUsed: premiumUsed,
    premiumReferralsRemaining: Math.max(0, PREMIUM_REFERRAL_CAP - premiumUsed)
  }
}

// Create a new referral when someone signs up with a referral code
export async function createReferral(
  referrerCode: string,
  refereeEmail: string,
  refereeId?: string
): Promise<{ success: boolean; error?: string; referralId?: string }> {
  const supabase = await createClient()
  
  // Find the referrer by their code
  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, premium_referrals_used")
    .eq("referral_code", referrerCode)
    .single()
  
  if (!referrer) {
    return { success: false, error: "Invalid referral code" }
  }
  
  // Check if email is from a blocked domain
  if (await isBlockedDomain(refereeEmail)) {
    return { success: false, error: "Personal email addresses don't qualify for referral rewards" }
  }
  
  // Check if this email was already referred
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("referee_email", refereeEmail.toLowerCase())
    .single()
  
  if (existing) {
    return { success: false, error: "This email has already been referred" }
  }
  
  // Check if it's a premium domain
  const { isPremium } = await isPremiumDomain(refereeEmail)
  
  // Create the referral
  const { data: referral, error } = await supabase
    .from("referrals")
    .insert({
      referrer_id: referrer.id,
      referee_id: refereeId || null,
      referee_email: refereeEmail.toLowerCase(),
      status: refereeId ? "signed_up" : "pending",
      is_premium: isPremium && (referrer.premium_referrals_used || 0) < PREMIUM_REFERRAL_CAP
    })
    .select("id")
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Update referee's profile with referred_by if they exist
  if (refereeId) {
    await supabase
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", refereeId)
  }
  
  return { success: true, referralId: referral.id }
}

// Qualify a referral (when referee completes a meaningful action)
export async function qualifyReferral(refereeId: string): Promise<boolean> {
  const supabase = await createClient()
  
  // Find the referral for this referee
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referee_id", refereeId)
    .eq("status", "signed_up")
    .single()
  
  if (!referral) return false
  
  // Calculate credits to award
  const creditsToAward = referral.is_premium ? PREMIUM_REFERRAL_CREDITS : STANDARD_REFERRAL_CREDITS
  
  // Calculate expiry date (12 months from now)
  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + CREDITS_EXPIRY_MONTHS)
  
  // Update referral status and award credits
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      status: "credited",
      qualified_at: new Date().toISOString(),
      credited_at: new Date().toISOString(),
      credits_awarded: creditsToAward,
      credits_expires_at: expiryDate.toISOString()
    })
    .eq("id", referral.id)
  
  if (updateError) return false
  
  // Add credits to the referrer's balance
  const { data: referrerProfile } = await supabase
    .from("profiles")
    .select("ai_credits, premium_referrals_used")
    .eq("id", referral.referrer_id)
    .single()
  
  if (referrerProfile) {
    const newCredits = (referrerProfile.ai_credits || 0) + creditsToAward
    const newPremiumUsed = referral.is_premium 
      ? (referrerProfile.premium_referrals_used || 0) + 1 
      : referrerProfile.premium_referrals_used || 0
    
    await supabase
      .from("profiles")
      .update({ 
        ai_credits: newCredits,
        premium_referrals_used: newPremiumUsed
      })
      .eq("id", referral.referrer_id)
  }
  
  return true
}

// Get all referrals for a user (for dashboard)
export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false })
  
  return data || []
}
