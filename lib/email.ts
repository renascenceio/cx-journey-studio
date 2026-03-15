import { Resend } from "resend"

// Lazy initialization to ensure env vars are available at runtime
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; id?: string; details?: unknown }> {
  const resend = getResendClient()
  
  // Check if Resend is configured
  if (!resend) {
    const apiKeyPresent = !!process.env.RESEND_API_KEY
    const apiKeyLength = process.env.RESEND_API_KEY?.length || 0
    console.error("[Email] RESEND_API_KEY check - present:", apiKeyPresent, "length:", apiKeyLength)
    return { 
      success: false, 
      error: "Email service not configured - RESEND_API_KEY missing",
      details: { apiKeyPresent, apiKeyLength }
    }
  }

  try {
    // Using verified domain updates.rene.cx
    const fromAddress = options.from || "René Studio <noreply@updates.rene.cx>"
    
    console.log("[Email] Attempting to send email to:", options.to, "Subject:", options.subject, "From:", fromAddress)
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    })

    if (error) {
      console.error("[Email] Resend API returned error:", JSON.stringify(error))
      return { success: false, error: error.message, details: error }
    }

    console.log("[Email] Successfully sent! ID:", data?.id)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("[Email] Exception thrown:", err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error",
      details: err instanceof Error ? { name: err.name, stack: err.stack } : err
    }
  }
}

// Email template helper
export function wrapEmailTemplate(content: string, options?: { siteName?: string; logoUrl?: string }): string {
  const siteName = options?.siteName || "René Studio"
  const logoUrl = options?.logoUrl || "https://rene.cx/logo.png"
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <img src="${logoUrl}" alt="${siteName}" height="40" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #fafafa; border-top: 1px solid #e4e4e7; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">
                ${siteName} by Renascence
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #a1a1aa;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

// Pre-built email templates
export const emailTemplates = {
  welcome: (name: string, verifyUrl?: string) => wrapEmailTemplate(`
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">
      Welcome to René Studio!
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
      Hi ${name},<br><br>
      Thank you for joining René Studio! We're excited to have you on board.
    </p>
    ${verifyUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Verify Email Address
      </a>
    </div>
    ` : ''}
    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #52525b;">
      Start creating amazing customer journey maps today!
    </p>
  `),

  passwordReset: (name: string, resetUrl: string) => wrapEmailTemplate(`
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">
      Reset Your Password
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
      Hi ${name},<br><br>
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Reset Password
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a;">
      This link will expire in 1 hour. If you didn't request this, please ignore this email.
    </p>
  `),

  magicLink: (email: string, loginUrl: string) => wrapEmailTemplate(`
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">
      Sign In to René Studio
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
      Click the button below to sign in as <strong>${email}</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Sign In
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a;">
      This link will expire in 10 minutes and can only be used once.
    </p>
  `),

  journeyShared: (inviterName: string, journeyTitle: string, journeyUrl: string) => wrapEmailTemplate(`
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">
      Journey Shared With You
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
      <strong>${inviterName}</strong> has shared a journey with you:
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #fafafa; border-radius: 12px; border: 1px solid #e4e4e7;">
      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #18181b;">${journeyTitle}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${journeyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Journey
      </a>
    </div>
  `),

  testEmail: (recipientName: string) => wrapEmailTemplate(`
    <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">
      Test Email
    </h1>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
      Hi ${recipientName},<br><br>
      This is a test email from René Studio. If you received this, your email notifications are working correctly!
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0;">
      <p style="margin: 0; font-size: 14px; color: #047857; font-weight: 500;">
        ✓ Email delivery successful
      </p>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a;">
      Sent at: ${new Date().toISOString()}
    </p>
  `),
}
