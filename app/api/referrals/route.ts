import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  getUserReferralCode, 
  getReferralLink, 
  getReferralStats, 
  getUserReferrals 
} from "@/lib/referrals"

// GET /api/referrals - Get user's referral info and stats
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get or create referral code
    const referralCode = await getUserReferralCode(user.id)
    const referralLink = getReferralLink(referralCode)
    
    // Get stats
    const stats = await getReferralStats(user.id)
    
    // Get referral history
    const referrals = await getUserReferrals(user.id)
    
    return NextResponse.json({
      referralCode,
      referralLink,
      stats,
      referrals
    })
  } catch (error) {
    console.error("Failed to get referral info:", error)
    return NextResponse.json({ error: "Failed to get referral info" }, { status: 500 })
  }
}
