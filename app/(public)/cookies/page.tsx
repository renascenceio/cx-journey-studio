import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Cookie Policy | Journey Studio",
  description: "Cookie Policy for Journey Studio - Learn about how we use cookies and similar technologies on our platform.",
}

interface LegalSection {
  id: string
  title: string
  content: string
}

const DEFAULT_SECTIONS: LegalSection[] = [
  { id: "1", title: "What Are Cookies", content: "Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.\n\nJourney Studio uses cookies and similar technologies (such as local storage and session storage) to provide, secure, and improve our Service." },
  { id: "2", title: "Types of Cookies We Use", content: "Essential Cookies: These cookies are necessary for the Service to function and cannot be switched off. They include:\n• Authentication cookies to keep you logged in\n• Security cookies to prevent fraud\n• Session cookies to remember your actions\n\nFunctional Cookies: These cookies enable enhanced functionality:\n• Language and region preferences\n• Theme preferences (light/dark mode)\n• Recently viewed items\n\nAnalytics Cookies: These cookies help us understand how visitors interact with our Service:\n• Pages visited and time spent\n• Features used\n• Error occurrences\n\nPerformance Cookies: These cookies help us improve performance:\n• Load times and response times\n• Browser and device information" },
  { id: "3", title: "Cookie Details", content: "Here are the specific cookies we use:\n\nsb-access-token: Supabase authentication token (Essential, Session)\nsb-refresh-token: Supabase refresh token (Essential, 7 days)\ntheme: Your color theme preference (Functional, 1 year)\nlocale: Your language preference (Functional, 1 year)\n_ga: Google Analytics identifier (Analytics, 2 years)\n_gid: Google Analytics session (Analytics, 24 hours)" },
  { id: "4", title: "Third-Party Cookies", content: "Some cookies are placed by third-party services that appear on our pages. We use the following third-party services:\n\nSupabase: Authentication and database services\n• Cookies: sb-access-token, sb-refresh-token\n• Purpose: User authentication\n• Privacy Policy: supabase.com/privacy\n\nVercel Analytics: Performance monitoring\n• Cookies: va-*\n• Purpose: Page performance tracking\n• Privacy Policy: vercel.com/legal/privacy-policy\n\nStripe: Payment processing (for paid features)\n• Cookies: __stripe_*\n• Purpose: Secure payment processing\n• Privacy Policy: stripe.com/privacy" },
  { id: "5", title: "Local Storage", content: "In addition to cookies, we use browser local storage and session storage for:\n\n• Caching journey map data for offline access\n• Storing draft content before saving\n• Remembering your sidebar and panel preferences\n• Storing temporary editing state\n\nLocal storage data persists until you clear your browser data or we programmatically remove it." },
  { id: "6", title: "Managing Cookies", content: "You can control and manage cookies in several ways:\n\nBrowser Settings: Most browsers allow you to refuse or delete cookies. Instructions vary by browser:\n• Chrome: Settings > Privacy and Security > Cookies\n• Firefox: Options > Privacy & Security > Cookies\n• Safari: Preferences > Privacy > Cookies\n• Edge: Settings > Privacy & Security > Cookies\n\nOur Cookie Settings: You can adjust your cookie preferences in your account settings under Privacy > Cookie Preferences.\n\nOpt-Out Links:\n• Google Analytics: tools.google.com/dlpage/gaoptout" },
  { id: "7", title: "Impact of Disabling Cookies", content: "If you disable or refuse cookies, please note that some features of the Service may not function properly:\n\n• You may not be able to stay logged in\n• Your preferences will not be remembered\n• Some features may not work as expected\n• Performance may be degraded\n\nEssential cookies cannot be disabled as they are necessary for the Service to function." },
  { id: "8", title: "Do Not Track", content: "Some browsers have a \"Do Not Track\" feature that signals to websites that you do not want your online activity tracked. The Service currently does not respond to Do Not Track signals, but you can manage tracking through your cookie preferences." },
  { id: "9", title: "Updates to This Policy", content: "We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. When we make changes, we will update the \"Last updated\" date at the top of this policy.\n\nWe encourage you to review this policy periodically to stay informed about how we use cookies." },
  { id: "10", title: "Contact Us", content: "If you have questions about our use of cookies or this Cookie Policy, please contact us:\n\nEmail: privacy@renascence.io\n\nRenascence\nDubai, United Arab Emirates" },
]

async function getCookieContent() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "legal_cookies")
      .single()

    if (data?.value) {
      const parsed = JSON.parse(data.value)
      return {
        sections: parsed.sections || DEFAULT_SECTIONS,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      }
    }
  } catch {
    // Fall back to defaults
  }
  return {
    sections: DEFAULT_SECTIONS,
    lastUpdated: new Date().toISOString(),
  }
}

export default async function CookiePolicyPage() {
  const { sections, lastUpdated } = await getCookieContent()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {sections.map((section: LegalSection, index: number) => (
            <section key={section.id} className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {index + 1}. {section.title}
              </h2>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
