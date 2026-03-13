import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Journey Studio",
  description: "Terms of Service for Journey Studio - Read our terms and conditions for using our customer journey mapping platform.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-muted-foreground">
            Last updated: March 13, 2026
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By accessing or using Journey Studio (&quot;the Service&quot;), operated by Renascence (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              These terms apply to all users of the Service, including individual users, team members, and organizations.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Journey Studio is a customer experience journey mapping platform that enables organizations to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Create and manage customer journey maps</li>
              <li>Collaborate with team members on journey design</li>
              <li>Analyze touchpoints and identify experience opportunities</li>
              <li>Generate insights using AI-powered features</li>
              <li>Share and publish journey maps</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use certain features of the Service, you must register for an account. When registering, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Subscription and Billing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Journey Studio offers various subscription plans including free and paid tiers. By subscribing to a paid plan, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Pay all applicable fees as described at the time of purchase</li>
              <li>Automatic renewal of subscriptions unless cancelled</li>
              <li>Provide valid payment information</li>
              <li>Accept that prices may change with reasonable notice</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Refunds are handled on a case-by-case basis. Contact our support team for refund requests.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. User Content</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain ownership of all content you create, upload, or share through the Service (&quot;User Content&quot;). By using the Service, you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Store and process your content to provide the Service</li>
              <li>Display your content to authorized users you designate</li>
              <li>Create backups for data protection purposes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for ensuring you have the right to use and share any content you upload to the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Upload malicious software or harmful content</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the Service for competitive analysis without permission</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. AI Features</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Journey Studio includes AI-powered features for content generation and analysis. By using these features, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>AI-generated content may require human review and editing</li>
              <li>We do not guarantee the accuracy of AI outputs</li>
              <li>Your inputs may be processed by third-party AI providers</li>
              <li>You are responsible for reviewing and validating AI-generated content</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by Renascence and is protected by international copyright, trademark, and other intellectual property laws. Our trademarks and trade dress may not be used without our prior written consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Violates these Terms of Service</li>
              <li>Is harmful to other users or the Service</li>
              <li>Is fraudulent or illegal</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Upon termination, your right to use the Service will cease immediately. You may request export of your data within 30 days of termination.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RENASCENCE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the courts of Dubai, UAE.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-foreground font-medium">Renascence</p>
              <p className="text-muted-foreground">Email: legal@renascence.io</p>
              <p className="text-muted-foreground">Website: https://renascence.io</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
