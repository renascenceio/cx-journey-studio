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

// René Studio Logo HTML for footer (light version - dark icon on light background)
const RENE_LOGO_FOOTER_HTML = `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
  <tr>
    <td style="background: #18181B; width: 28px; height: 28px; border-radius: 6px; text-align: center; vertical-align: middle; padding: 6px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
        <tr>
          <td style="width: 5px; height: 10px; background: #ffffff; border-radius: 1px;"></td>
          <td style="width: 3px;"></td>
          <td style="width: 5px; height: 12px; background: #ffffff; border-radius: 1px;"></td>
        </tr>
      </table>
    </td>
    <td style="padding-left: 10px;">
      <span style="font-size: 14px; font-weight: 600; color: #18181B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">René Studio</span>
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
  showPreferencesLink?: boolean  // Whether to show notification preferences link (not for transactional emails)
}): string {
  const siteName = options?.siteName || "René Studio"
  const unsubscribeUrl = options?.unsubscribeUrl || "https://rene.cx/settings/notifications"
  const preferencesUrl = options?.preferencesUrl || "https://rene.cx/settings/notifications"
  const showPreferencesLink = options?.showPreferencesLink !== false  // Default to true
  
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
          <!-- Dark Header -->
          <tr>
            <td style="background: #18181B; background-color: #18181B; padding: 32px 40px; text-align: center;" bgcolor="#18181B">
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
                    <!-- René Studio Logo -->
                    <div style="margin-bottom: 16px;">
                      ${RENE_LOGO_FOOTER_HTML}
                    </div>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #71717a;">
                      Journey Design Studio
                    </p>
                    <p style="margin: 0 0 16px; font-size: 12px; color: #a1a1aa;">
                      You're receiving this because you have an account at rene.cx
                    </p>
                    ${showPreferencesLink ? `
                    <p style="margin: 0; font-size: 12px;">
                      <a href="${preferencesUrl}" style="color: #71717a; text-decoration: underline;">Notification Preferences</a>
                      <span style="color: #d4d4d8; margin: 0 8px;">|</span>
                      <a href="${unsubscribeUrl}" style="color: #71717a; text-decoration: underline;">Unsubscribe</a>
                    </p>
                    ` : ''}
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
                René Studio<br>
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
      Thank you for joining René Studio! We're excited to have you on board. Start creating amazing customer journey maps and transform how you understand your customers.
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
  `, { headerTitle: "Welcome to René Studio", headerIcon: "👋", showPreferencesLink: false }),

  passwordReset: (name: string, resetUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      We received a request to reset your René Studio password. Click the button below to create a new password.
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
  `, { headerTitle: "Reset Your Password", headerIcon: "🔐", showPreferencesLink: false }),

  magicLink: (email: string, loginUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Click the button below to sign in to René Studio as <strong>${email}</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Sign In to René Studio
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
      This link will expire in 10 minutes and can only be used once.
    </p>
  `, { headerTitle: "Sign In to René Studio", headerIcon: "🔑", showPreferencesLink: false }),

  journeyShared: (inviterName: string, journeyTitle: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${inviterName}</strong> has shared a journey with you on René Studio.
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
  `, { headerTitle: "Journey Shared With You", headerIcon: "🗺️", showPreferencesLink: true }),

  testEmail: (recipientName: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      This is a test email from René Studio. If you received this, your email notifications are working correctly!
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
  `, { headerTitle: "Test Email", headerIcon: "✉️", showPreferencesLink: false }),

  // Additional email templates
  emailVerification: (name: string, verifyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Please verify your email address to complete your René Studio account setup.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Verify Email Address
      </a>
    </div>
    <p style="margin: 0; font-size: 13px; color: #71717a; text-align: center;">
      This link will expire in 24 hours.
    </p>
  `, { headerTitle: "Verify Your Email", headerIcon: "📧", showPreferencesLink: false }),

  collaboratorJoined: (collaboratorName: string, journeyTitle: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${collaboratorName}</strong> has joined your journey as a collaborator on René Studio.
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
  `, { headerTitle: "New Collaborator Joined", headerIcon: "👥", showPreferencesLink: true }),

  newComment: (commenterName: string, journeyTitle: string, commentPreview: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${commenterName}</strong> commented on your journey in René Studio.
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
  `, { headerTitle: "New Comment", headerIcon: "💬", showPreferencesLink: true }),

  mentioned: (mentionerName: string, journeyTitle: string, commentPreview: string, journeyUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>${mentionerName}</strong> mentioned you in a comment on René Studio.
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
  `, { headerTitle: "You Were Mentioned", headerIcon: "@", showPreferencesLink: true }),

  // Billing emails - Payment failure sequence (Day 0, 3, 5, 7)
  
  // Day 0: Initial payment failure notification
  paymentFailedDay0: (name: string, amount: string, retryUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      We were unable to process your payment of <strong>${amount}</strong> for your René Studio subscription.
    </p>
    <div style="margin: 24px 0; padding: 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 13px; color: #991b1b;">
        <strong>You have 7 days</strong> to update your payment method before your account is downgraded to Free.
      </p>
    </div>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Don't worry - your content will remain safe. However, you may lose access to premium features if your plan changes.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${retryUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Update Payment Method
      </a>
    </div>
  `, { headerTitle: "Payment Failed", headerIcon: "⚠️", showPreferencesLink: false }),

  // Day 3: First reminder
  paymentFailedDay3: (name: string, retryUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      This is a friendly reminder that your René Studio payment is still pending.
    </p>
    <div style="margin: 24px 0; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>4 days remaining</strong> to update your payment method before your account is downgraded.
      </p>
    </div>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Please update your payment details to continue enjoying all your current features without interruption.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${retryUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Update Payment Method
      </a>
    </div>
  `, { headerTitle: "Payment Reminder", headerIcon: "⏰", showPreferencesLink: false }),

  // Day 5: Final warning
  paymentFailedDay5: (name: string, retryUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      <strong>Urgent:</strong> Your René Studio payment is still outstanding.
    </p>
    <div style="margin: 24px 0; padding: 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 13px; color: #991b1b;">
        <strong>Only 2 days left!</strong> Your account will be downgraded to Free on the 7th day if payment is not received.
      </p>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #52525b;">
      After downgrade, you'll be limited to:
    </p>
    <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 14px; line-height: 1.8; color: #52525b;">
      <li>3 journeys maximum</li>
      <li>1 team member</li>
      <li>50 AI credits per month</li>
      <li>No premium features</li>
    </ul>
    <p style="margin: 0 0 24px; font-size: 14px; color: #71717a;">
      Your content will remain safe and accessible, but some features may be restricted.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${retryUrl}" style="display: inline-block; padding: 14px 32px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Update Payment Now
      </a>
    </div>
  `, { headerTitle: "Final Payment Warning", headerIcon: "🚨", showPreferencesLink: false }),

  // Day 7: Account downgraded to Free
  accountDowngraded: (name: string, previousPlan: string, upgradeUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Your René Studio account has been downgraded from <strong>${previousPlan}</strong> to the <strong>Free</strong> plan due to payment issues.
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7;">
      <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #18181b;">What this means:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #52525b;">
        <li><strong>Your content is safe</strong> - All your journeys, archetypes, and data remain intact</li>
        <li><strong>Limited features</strong> - You now have access to Free plan features only</li>
        <li><strong>Team access</strong> - Additional team members may lose access</li>
      </ul>
    </div>
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Free plan limits:
    </p>
    <ul style="margin: 0 0 24px; padding-left: 24px; font-size: 14px; line-height: 1.8; color: #52525b;">
      <li>3 journeys maximum</li>
      <li>1 team member</li>
      <li>50 AI credits per month</li>
    </ul>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Ready to restore your full access? Upgrade anytime to get back all your premium features.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${upgradeUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Upgrade Your Plan
      </a>
    </div>
  `, { headerTitle: "Account Downgraded", headerIcon: "📉", showPreferencesLink: false }),

  // Legacy alias for backward compatibility
  paymentFailed: (name: string, amount: string, retryUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      We were unable to process your payment of <strong>${amount}</strong> for your René Studio subscription.
    </p>
    <div style="margin: 24px 0; padding: 16px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
      <p style="margin: 0; font-size: 13px; color: #991b1b;">
        Please update your payment method to avoid service interruption.
      </p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${retryUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Update Payment Method
      </a>
    </div>
  `, { headerTitle: "Payment Failed", headerIcon: "⚠️", showPreferencesLink: false }),

  subscriptionCreated: (name: string, planName: string, dashboardUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Thank you for subscribing to René Studio <strong>${planName}</strong>! Your subscription is now active.
    </p>
    <div style="margin: 24px 0; padding: 20px; background: #ecfdf5; border-radius: 12px; border: 1px solid #a7f3d0;">
      <p style="margin: 0; font-size: 14px; color: #047857; font-weight: 500;">
        ✓ Your subscription is now active
      </p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Go to Dashboard
      </a>
    </div>
  `, { headerTitle: "Subscription Started", headerIcon: "🎉", showPreferencesLink: true }),

  trialEnding: (name: string, daysLeft: number, upgradeUrl: string) => wrapEmailTemplate(`
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Hi ${name},
    </p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
      Your René Studio trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>. Upgrade now to keep access to all features.
    </p>
    <div style="margin: 24px 0; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        After your trial ends, you'll lose access to premium features.
      </p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${upgradeUrl}" style="display: inline-block; padding: 14px 32px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Upgrade Now
      </a>
    </div>
  `, { headerTitle: "Trial Ending Soon", headerIcon: "⏰", showPreferencesLink: true }),
}
