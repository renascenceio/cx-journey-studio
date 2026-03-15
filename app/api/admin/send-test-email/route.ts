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
        subject = "Welcome to Rene!"
        html = emailTemplates.welcome(recipientName)
        break
      case "email_verification":
        subject = "Verify Your Email - Rene"
        html = emailTemplates.emailVerification(recipientName, "https://rene.cx/verify?token=test")
        break
      case "password_reset":
        subject = "Reset Your Password - Rene"
        html = emailTemplates.passwordReset(recipientName, "https://rene.cx/reset-password?token=test")
        break
      case "magic_link":
        subject = "Sign In to Rene"
        html = emailTemplates.magicLink(recipientEmail, "https://rene.cx/auth/callback?token=test")
        break
      case "password_changed":
        subject = "Password Updated - Rene"
        html = emailTemplates.passwordReset(recipientName, "https://rene.cx/login")
        break
      case "journey_shared":
        subject = "A Journey Was Shared With You - Rene"
        html = emailTemplates.journeyShared("Test User", "Sample Customer Journey", "https://rene.cx/journeys/test")
        break
      case "collaborator_joined":
        subject = "New Collaborator Joined - Rene"
        html = emailTemplates.collaboratorJoined("Test Collaborator", "Sample Customer Journey", "https://rene.cx/journeys/test")
        break
      case "new_comment":
        subject = "New Comment on Your Journey - Rene"
        html = emailTemplates.newComment("Test User", "Sample Customer Journey", "This is a preview of the comment...", "https://rene.cx/journeys/test")
        break
      case "mentioned":
        subject = "You Were Mentioned - Rene"
        html = emailTemplates.mentioned("Test User", "Sample Customer Journey", "Hey @you, check this out...", "https://rene.cx/journeys/test")
        break
      default:
        subject = "Test Email from Rene"
        html = emailTemplates.testEmail(recipientName)
    }
    
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    })
    
    if (!result.success) {
      console.error("[API] Email send failed:", result)
      return NextResponse.json({ 
        error: result.error || "Failed to send email",
        details: result.details,
        hint: "Make sure RESEND_API_KEY is configured in Vercel environment variables and domain updates.rene.cx is verified in Resend dashboard",
        fromAddress: "noreply@updates.rene.cx",
        debugInfo: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + "..."
        }
      }, { status: 500 })
    }
    
    console.log("[API] Email sent successfully:", result.id)
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${recipientEmail}`,
      emailId: result.id,
      fromAddress: "noreply@updates.rene.cx"
    })
    
  } catch (error) {
    console.error("[API] Send test email error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send email" 
    }, { status: 500 })
  }
}
