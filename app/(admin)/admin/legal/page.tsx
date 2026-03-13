"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Shield,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  RefreshCw,
  ExternalLink,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabase/client"

interface LegalSection {
  id: string
  title: string
  content: string
}

interface LegalDocument {
  id: string
  type: "terms" | "privacy"
  sections: LegalSection[]
  lastUpdated: string
  version: string
}

const DEFAULT_TERMS_SECTIONS: LegalSection[] = [
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

const DEFAULT_PRIVACY_SECTIONS: LegalSection[] = [
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

export default function LegalContentPage() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms")
  const [termsSections, setTermsSections] = useState<LegalSection[]>(DEFAULT_TERMS_SECTIONS)
  const [privacySections, setPrivacySections] = useState<LegalSection[]>(DEFAULT_PRIVACY_SECTIONS)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Load saved content from database
  useEffect(() => {
    async function loadContent() {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("site_config")
        .select("value")
        .in("key", ["legal_terms", "legal_privacy"])

      if (data) {
        const terms = data.find((d: { value: string }) => {
          const parsed = JSON.parse(d.value)
          return parsed.type === "terms"
        })
        const privacy = data.find((d: { value: string }) => {
          const parsed = JSON.parse(d.value)
          return parsed.type === "privacy"
        })

        if (terms) {
          const parsed = JSON.parse(terms.value)
          setTermsSections(parsed.sections || DEFAULT_TERMS_SECTIONS)
        }
        if (privacy) {
          const parsed = JSON.parse(privacy.value)
          setPrivacySections(parsed.sections || DEFAULT_PRIVACY_SECTIONS)
        }
      }
    }
    loadContent()
  }, [])

  const currentSections = activeTab === "terms" ? termsSections : privacySections
  const setSections = activeTab === "terms" ? setTermsSections : setPrivacySections

  function updateSection(id: string, field: "title" | "content", value: string) {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  function addSection() {
    const newId = String(currentSections.length + 1)
    setSections(prev => [...prev, { id: newId, title: "New Section", content: "" }])
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id))
  }

  function moveSection(id: string, direction: "up" | "down") {
    const index = currentSections.findIndex(s => s.id === id)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === currentSections.length - 1) return

    const newSections = [...currentSections]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]]
    setSections(newSections)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const supabase = getSupabaseClient()
      const key = activeTab === "terms" ? "legal_terms" : "legal_privacy"
      const value = JSON.stringify({
        type: activeTab,
        sections: currentSections,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      })

      const { error } = await supabase
        .from("site_config")
        .upsert({ key, value }, { onConflict: "key" })

      if (error) throw error

      setLastSaved(new Date().toISOString())
      toast.success(`${activeTab === "terms" ? "Terms of Service" : "Privacy Policy"} saved successfully`)
    } catch (error) {
      toast.error("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    if (activeTab === "terms") {
      setTermsSections(DEFAULT_TERMS_SECTIONS)
    } else {
      setPrivacySections(DEFAULT_PRIVACY_SECTIONS)
    }
    toast.info("Reset to default content")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Legal Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Terms of Service and Privacy Policy content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={activeTab === "terms" ? "/terms" : "/privacy"} target="_blank" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Preview
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {lastSaved && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last saved: {new Date(lastSaved).toLocaleString()}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "terms" | "privacy")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="terms" className="gap-2">
            <FileText className="h-4 w-4" />
            Terms of Service
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6">
          <SectionsEditor
            sections={termsSections}
            onUpdate={updateSection}
            onAdd={addSection}
            onRemove={removeSection}
            onMove={moveSection}
          />
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <SectionsEditor
            sections={privacySections}
            onUpdate={updateSection}
            onAdd={addSection}
            onRemove={removeSection}
            onMove={moveSection}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SectionsEditor({
  sections,
  onUpdate,
  onAdd,
  onRemove,
  onMove,
}: {
  sections: LegalSection[]
  onUpdate: (id: string, field: "title" | "content", value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onMove: (id: string, direction: "up" | "down") => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="flex flex-col gap-4 pr-4">
          {sections.map((section, index) => (
            <Card key={section.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onMove(section.id, "up")}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {index + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onMove(section.id, "down")}
                      disabled={index === sections.length - 1}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => onUpdate(section.id, "title", e.target.value)}
                        className="font-medium"
                        placeholder="Section Title"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => onRemove(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={(e) => onUpdate(section.id, "content", e.target.value)}
                      className="min-h-32 text-sm"
                      placeholder="Section content..."
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Button variant="outline" onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Section
      </Button>
    </div>
  )
}
