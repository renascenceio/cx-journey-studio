import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Terms of Service | Journey Studio",
  description: "Terms of Service for Journey Studio - Read our terms and conditions for using our customer journey mapping platform.",
}

interface LegalSection {
  id: string
  title: string
  content: string
}

const DEFAULT_SECTIONS: LegalSection[] = [
  { id: "1", title: "Acceptance of Terms", content: "By accessing or using Journey Studio (\"the Service\"), operated by Renascence (\"we,\" \"us,\" or \"our\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.\n\nThese terms apply to all users of the Service, including individual users, team members, and organizations." },
  { id: "2", title: "Description of Service", content: "Journey Studio is a customer experience journey mapping platform that enables organizations to:\n\n• Create and manage customer journey maps\n• Collaborate with team members on journey design\n• Analyze touchpoints and identify experience opportunities\n• Generate insights using AI-powered features\n• Share and publish journey maps" },
  { id: "3", title: "Account Registration", content: "To use certain features of the Service, you must register for an account. When registering, you agree to:\n\n• Provide accurate, current, and complete information\n• Maintain and update your information as needed\n• Keep your password secure and confidential\n• Accept responsibility for all activities under your account\n• Notify us immediately of any unauthorized access" },
  { id: "4", title: "Subscription and Billing", content: "Journey Studio offers various subscription plans including free and paid tiers. By subscribing to a paid plan, you agree to:\n\n• Pay all applicable fees as described at the time of purchase\n• Automatic renewal of subscriptions unless cancelled\n• Provide valid payment information\n• Accept that prices may change with reasonable notice\n\nRefunds are handled on a case-by-case basis. Contact our support team for refund requests." },
  { id: "5", title: "User Content", content: "You retain ownership of all content you create, upload, or share through the Service (\"User Content\"). By using the Service, you grant us a limited license to:\n\n• Store and process your content to provide the Service\n• Display your content to authorized users you designate\n• Create backups for data protection purposes\n\nYou are responsible for ensuring you have the right to use and share any content you upload to the Service." },
  { id: "6", title: "Acceptable Use", content: "You agree not to use the Service to:\n\n• Violate any applicable laws or regulations\n• Infringe on intellectual property rights of others\n• Upload malicious software or harmful content\n• Attempt to gain unauthorized access to the Service\n• Interfere with the proper functioning of the Service\n• Harass, abuse, or harm other users\n• Use the Service for competitive analysis without permission" },
  { id: "7", title: "AI Features", content: "Journey Studio includes AI-powered features for content generation and analysis. By using these features, you acknowledge that:\n\n• AI-generated content may require human review and editing\n• We do not guarantee the accuracy of AI outputs\n• Your inputs may be processed by third-party AI providers\n• You are responsible for reviewing and validating AI-generated content" },
  { id: "8", title: "Intellectual Property", content: "The Service, including its original content, features, and functionality, is owned by Renascence and is protected by international copyright, trademark, and other intellectual property laws. Our trademarks and trade dress may not be used without our prior written consent." },
  { id: "9", title: "Termination", content: "We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe:\n\n• Violates these Terms of Service\n• Is harmful to other users or the Service\n• Is fraudulent or illegal\n\nUpon termination, your right to use the Service will cease immediately. You may request export of your data within 30 days of termination." },
  { id: "10", title: "Disclaimer of Warranties", content: "THE SERVICE IS PROVIDED \"AS IS\" AND \"AS AVAILABLE\" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE." },
  { id: "11", title: "Limitation of Liability", content: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, RENASCENCE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES." },
  { id: "12", title: "Governing Law", content: "These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of Dubai, UAE." },
  { id: "13", title: "Changes to Terms", content: "We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the revised terms." },
  { id: "14", title: "Contact Us", content: "If you have any questions about these Terms of Service, please contact us at:\n\nRenascence\nEmail: legal@renascence.io\nWebsite: https://renascence.io" },
]

async function getTermsContent() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "legal_terms")
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

export default async function TermsOfServicePage() {
  const { sections, lastUpdated } = await getTermsContent()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms of Service
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
