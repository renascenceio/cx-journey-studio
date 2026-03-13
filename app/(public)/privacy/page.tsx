import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Privacy Policy | Journey Studio",
  description: "Privacy Policy for Journey Studio - Learn how we collect, use, and protect your personal information.",
}

interface LegalSection {
  id: string
  title: string
  content: string
}

const DEFAULT_SECTIONS: LegalSection[] = [
  { id: "1", title: "Introduction", content: "This Privacy Policy describes how Renascence (\"we,\" \"us,\" or \"our\") collects, uses, and shares information about you when you use our Journey Studio platform (\"the Service\"). We are committed to protecting your privacy and handling your data with transparency." },
  { id: "2", title: "Information We Collect", content: "Account Information: When you create an account, we collect your name, email address, organization name, and password.\n\nUsage Data: We automatically collect information about how you interact with the Service, including pages visited, features used, and time spent.\n\nJourney Content: We store the customer journey maps, touchpoints, and related content you create.\n\nDevice Information: We collect device type, browser type, IP address, and operating system.\n\nCommunications: We keep records of your communications with our support team." },
  { id: "3", title: "How We Use Your Information", content: "We use the information we collect to:\n\n• Provide and maintain the Service\n• Process transactions and send related information\n• Send technical notices and support messages\n• Respond to your comments and questions\n• Analyze usage patterns to improve the Service\n• Protect against fraudulent or illegal activity\n• Comply with legal obligations" },
  { id: "4", title: "AI Data Processing", content: "Journey Studio includes AI-powered features that process your content. When you use AI features:\n\n• Your journey content may be sent to third-party AI providers (OpenAI, Anthropic)\n• AI providers process data according to their privacy policies\n• We do not use your content to train AI models\n• AI-generated outputs are stored in your account\n• You can opt out of AI features in your settings" },
  { id: "5", title: "Information Sharing", content: "We may share your information with:\n\nService Providers: Third parties who help us operate the Service:\n• Supabase (database and authentication)\n• Vercel (hosting and infrastructure)\n• Stripe (payment processing)\n• Resend (email communications)\n\nLegal Requirements: When required by law or to protect our rights.\n\nBusiness Transfers: In connection with a merger, acquisition, or sale of assets.\n\nWith Your Consent: When you explicitly authorize sharing." },
  { id: "6", title: "Data Security", content: "We implement appropriate security measures to protect your information:\n\n• Encryption in transit (TLS 1.3) and at rest (AES-256)\n• Regular security audits and penetration testing\n• Access controls and authentication requirements\n• Secure data centers with SOC 2 compliance\n• Regular backups and disaster recovery procedures\n\nHowever, no method of transmission over the Internet is 100% secure." },
  { id: "7", title: "Data Retention", content: "We retain your information for as long as your account is active or as needed to provide services. After account deletion:\n\n• Account data is deleted within 30 days\n• Backups are purged within 90 days\n• Anonymized analytics data may be retained\n• Legal hold data is retained as required" },
  { id: "8", title: "Your Rights", content: "Depending on your location, you may have the following rights:\n\n• Access: Request a copy of your personal data\n• Rectification: Correct inaccurate information\n• Erasure: Request deletion of your data\n• Portability: Export your data in a portable format\n• Restriction: Limit how we process your data\n• Objection: Object to certain processing activities\n• Withdraw Consent: Revoke previously given consent\n\nTo exercise these rights, contact privacy@renascence.io" },
  { id: "9", title: "Cookies and Tracking", content: "We use cookies and similar technologies to:\n\n• Keep you logged in\n• Remember your preferences\n• Analyze how you use the Service\n• Improve performance\n\nYou can control cookies through your browser settings. Disabling cookies may affect Service functionality." },
  { id: "10", title: "International Transfers", content: "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place:\n\n• Standard contractual clauses\n• Data processing agreements\n• Compliance with applicable transfer mechanisms" },
  { id: "11", title: "Children's Privacy", content: "The Service is not intended for users under 16 years of age. We do not knowingly collect information from children. If we learn we have collected data from a child, we will delete it promptly." },
  { id: "12", title: "Changes to This Policy", content: "We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service. Your continued use after changes become effective constitutes acceptance." },
  { id: "13", title: "Contact Us", content: "For privacy-related inquiries:\n\nEmail: privacy@renascence.io\nData Protection Officer: dpo@renascence.io\n\nRenascence\nDubai, United Arab Emirates" },
]

async function getPrivacyContent() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "legal_privacy")
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

export default async function PrivacyPolicyPage() {
  const { sections, lastUpdated } = await getPrivacyContent()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
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
