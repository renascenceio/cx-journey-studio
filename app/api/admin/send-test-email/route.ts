import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendEmail, emailTemplates } from "@/lib/email"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, name, role")
    .eq("id", user.id)
    .single()
  
  const isSuperAdmin = profile?.email === "aslan@renascence.io"
  const isAdmin = profile?.role === "admin" || profile?.role === "journey_master"
  
  if (!isSuperAdmin && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  try {
    const body = await request.json()
    const { email, eventType } = body
    
    const recipientEmail = email || profile?.email
    const recipientName = profile?.name || "User"
    
    if (!recipientEmail) {
      return NextResponse.json({ error: "No email address provided" }, { status: 400 })
    }
    
    // Send test email based on event type
    let html: string
    let subject: string
    
    switch (eventType) {
      case "welcome":
        subject = "Welcome to René Studio!"
        html = emailTemplates.welcome(recipientName)
        break
      case "password_reset":
        subject = "Reset Your Password"
        html = emailTemplates.passwordReset(recipientName, "https://rene.cx/reset-password?token=test")
        break
      case "magic_link":
        subject = "Sign In to René Studio"
        html = emailTemplates.magicLink(recipientEmail, "https://rene.cx/auth/callback?token=test")
        break
      case "journey_shared":
        subject = "Journey Shared With You"
        html = emailTemplates.journeyShared("Test User", "Sample Customer Journey", "https://rene.cx/journeys/test")
        break
      default:
        subject = "Test Email from René Studio"
        html = emailTemplates.testEmail(recipientName)
    }
    
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || "Failed to send email",
        hint: "Make sure RESEND_API_KEY is configured in environment variables"
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${recipientEmail}`,
      emailId: result.id
    })
    
  } catch (error) {
    console.error("[API] Send test email error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send email" 
    }, { status: 500 })
  }
}
