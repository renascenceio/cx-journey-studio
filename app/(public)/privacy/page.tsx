import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Journey Studio",
  description: "Privacy Policy for Journey Studio - Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground">
            Last updated: March 13, 2026
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Renascence (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates Journey Studio. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are committed to protecting your privacy and ensuring the security of your personal information. Please read this policy carefully to understand our practices.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Account Information:</strong> Name, email address, password, organization name, and role</li>
              <li><strong>Profile Information:</strong> Avatar, bio, timezone, and preferences</li>
              <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely by Stripe)</li>
              <li><strong>User Content:</strong> Journey maps, touchpoints, notes, and other content you create</li>
              <li><strong>Communications:</strong> Messages to our support team and feedback you provide</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
              <li><strong>Cookies:</strong> Session cookies, preference cookies, and analytics cookies</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>OAuth Providers:</strong> When you sign in with Google or Microsoft, we receive your name, email, and profile picture</li>
              <li><strong>Team Invitations:</strong> When someone invites you to a team, we receive your email address</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative messages, updates, and security alerts</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Personalize your experience and provide relevant content</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. AI Features and Data Processing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Journey Studio includes AI-powered features. When you use these features:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your inputs may be processed by third-party AI providers (e.g., OpenAI, Anthropic)</li>
              <li>We do not use your content to train AI models</li>
              <li>AI processing is subject to our data processing agreements with providers</li>
              <li>You can opt out of AI features in your account settings</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information in the following circumstances:
            </p>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.1 With Your Consent</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We share information when you give us explicit consent, such as when you share a journey publicly or invite collaborators.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.2 Service Providers</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We work with trusted third-party service providers who help us operate the Service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Hosting and deployment</li>
              <li><strong>Resend:</strong> Email delivery</li>
              <li><strong>OpenAI/Anthropic:</strong> AI features</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">5.3 Legal Requirements</h3>
            <p className="text-muted-foreground leading-relaxed">
              We may disclose information if required by law, court order, or government request, or to protect our rights, privacy, safety, or property.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Secure authentication with password hashing</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and employee training</li>
              <li>Incident response procedures</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We retain your information for as long as your account is active or as needed to provide the Service. After account deletion:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Personal data is deleted within 30 days</li>
              <li>Backups are purged within 90 days</li>
              <li>Anonymized analytics data may be retained indefinitely</li>
              <li>Legal compliance data is retained as required by law</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, contact us at privacy@renascence.io or use the account settings in the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for the Service to function</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You can manage cookie preferences in your browser settings. Note that disabling certain cookies may affect functionality.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. International Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses where required, to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Journey Studio is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If we learn we have collected information from a child under 16, we will delete it promptly.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service before they become effective. Your continued use of the Service after changes indicates acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-foreground font-medium">Renascence - Privacy Team</p>
              <p className="text-muted-foreground">Email: privacy@renascence.io</p>
              <p className="text-muted-foreground">Website: https://renascence.io</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Data Protection Officer</h2>
            <p className="text-muted-foreground leading-relaxed">
              For data protection inquiries, you may also contact our Data Protection Officer at dpo@renascence.io.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
