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

// Rene Logo HTML for emails - uses text with icon since SVG text isn't well supported
const RENE_LOGO_HTML = `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
  <tr>
    <td style="background: #ffffff; width: 36px; height: 36px; border-radius: 8px; text-align: center; vertical-align: middle;">
      <div style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="width: 6px; height: 12px; background: #18181B; border-radius: 1px;"></td>
            <td style="width: 4px;"></td>
            <td style="width: 6px; height: 16px; background: #18181B; border-radius: 1px;"></td>
          </tr>
        </table>
      </div>
    </td>
    <td style="padding-left: 12px;">
      <span style="font-size: 20px; font-weight: 600; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.02em;">Rene</span>
    </td>
  </tr>
</table>
`

// Email template helper with modern design matching admin preview
export function wrapEmailTemplate(content: string, options?: { 
  siteName?: string
  headerIcon?: string
  headerTitle?: string
  unsubscribeUrl?: string
  preferencesUrl?: string
}): string {
  const siteName = options?.siteName || "Rene"
  const unsubscribeUrl = options?.unsubscribeUrl || "https://rene.cx/settings/notifications"
  const preferencesUrl = options?.preferencesUrl || "https://rene.cx/settings/notifications"
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${siteName}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">
          <!-- Dark Header with Logo -->
          <tr>
            <td style="background-color: #18181B; padding: 32px 40px; text-align: center;">
              <!-- Logo -->
              <div style="margin-bottom: 24px;">
                ${RENE_LOGO_HTML}
              </div>
              ${options?.headerIcon ? `
              <!-- Icon Circle -->
              <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255,255,255,0.1); border-radius: 16px; line-height: 56px; margin-bottom: 16px;">
                <span style="font-size: 28px;">${options.headerIcon}</span>
              </div>
              ` : ''}
              ${options?.headerTitle ? `
              <!-- Header Title -->
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.01em;">
                ${options.headerTitle}
              </h1>
              ` : ''}
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
            <td style="padding: 24px 40px; background: #fafafa; border-top: 1px solid #e4e4e7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px; font-size: 13px; color: #71717a;">
                      ${siteName} by Renascence
                    </p>
                    <p style="margin: 0 0 16px; font-size: 12px; color: #a1a1aa;">
                      You're receiving this because you have an account at rene.cx
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      <a href="${preferencesUrl}" style="color: #71717a; text-decoration: underline;">Notification Preferences</a>
                      <span style="color: #d4d4d8; margin: 0 8px;">|</span>
                      <a href="${unsubscribeUrl}" style="color: #71717a; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!-- Additional Footer -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="margin: 0; font-size: 11px; color: #a1a1aa;">
                Renascence Journey Design Studio<br>
                Simplifying customer experience mapping
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
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Thank you for joining Rene! We're excited to have you on board. Start creating amazing customer journey maps and transform how you understand your customers.
    </p>
    ${verifyUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Verify Email Address
      </a>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://rene.cx/dashboard" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Go to Dashboard
      </a>
    </div>
    `}
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
      Need help getting started? Check out our <a href="https://rene.cx/docs" style="color: #18181b; text-decoration: underline;">documentation</a> or reach out to our support team.
    </p>
  `, { headerTitle: "Welcome to Rene", headerIcon: "👋" }),

  passwordReset: (name: string, resetUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Reset Password
      </a>
    </div>
    <div style="margin: 24px 0; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
      </p>
    </div>
  `, { headerTitle: "Reset Your Password", headerIcon: "🔐" }),

  magicLink: (email: string, loginUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Click the button below to sign in as <strong>${email}</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Sign In to Rene
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
      This link will expire in 10 minutes and can only be used once.
    </p>
  `, { headerTitle: "Sign In to Rene", headerIcon: "🔑" }),

  journeyShared: (inviterName: string, journeyTitle: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${inviterName}</strong> has shared a journey with you.
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Journey</p>
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #18181b;">${journeyTitle}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${journeyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Journey
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a;">
      You can now collaborate on this journey and provide feedback.
    </p>
  `, { headerTitle: "Journey Shared With You", headerIcon: "🗺️" }),

  testEmail: (recipientName: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      This is a test email from Rene. If you received this, your email notifications are working correctly!
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="24" valign="top">
            <span style="font-size: 16px;">✓</span>
          </td>
          <td>
            <p style="margin: 0; font-size: 14px; color: #047857; font-weight: 500;">
              Email delivery successful
            </p>
          </td>
        </tr>
      </table>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a;">
      Sent at: ${new Date().toLocaleString()}
    </p>
  `, { headerTitle: "Test Email", headerIcon: "✉️" }),

  // Additional email templates
  emailVerification: (name: string, verifyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Please verify your email address to complete your account setup.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Verify Email Address
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
      This link will expire in 24 hours.
    </p>
  `, { headerTitle: "Verify Your Email", headerIcon: "📧" }),

  collaboratorJoined: (collaboratorName: string, journeyTitle: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${collaboratorName}</strong> has joined your journey as a collaborator.
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Journey</p>
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #18181b;">${journeyTitle}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${journeyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Journey
      </a>
    </div>
  `, { headerTitle: "New Collaborator Joined", headerIcon: "👥" }),

  newComment: (commenterName: string, journeyTitle: string, commentPreview: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${commenterName}</strong> commented on your journey.
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">${journeyTitle}</p>
      <p style="margin: 0; font-size: 15px; color: #52525b; font-style: italic;">"${commentPreview}"</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${journeyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Comment
      </a>
    </div>
  `, { headerTitle: "New Comment", headerIcon: "💬" }),

  mentioned: (mentionerName: string, journeyTitle: string, commentPreview: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${mentionerName}</strong> mentioned you in a comment.
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">${journeyTitle}</p>
      <p style="margin: 0; font-size: 15px; color: #52525b; font-style: italic;">"${commentPreview}"</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${journeyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Comment
      </a>
    </div>
  `, { headerTitle: "You Were Mentioned", headerIcon: "@" }),
}
