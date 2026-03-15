"use client"

import { useState } from "react"
import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MapPin, MessageSquare, Send, CheckCircle } from "lucide-react"
import { toast } from "sonner"

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "For general inquiries",
    value: "hello@renascence.io",
    href: "mailto:hello@renascence.io",
  },
  {
    icon: MessageSquare,
    title: "Support",
    description: "For technical help",
    value: "support@renascence.io",
    href: "mailto:support@renascence.io",
  },
  {
    icon: MapPin,
    title: "Office",
    description: "Visit us in Dubai",
    value: "Dubai, UAE",
    href: "https://maps.google.com/?q=Dubai",
  },
]

const inquiryTypes = [
  { value: "general", label: "General Inquiry" },
  { value: "sales", label: "Sales & Pricing" },
  { value: "support", label: "Technical Support" },
  { value: "partnership", label: "Partnership" },
  { value: "press", label: "Press & Media" },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    inquiryType: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    // In production, this would send to an API endpoint
    toast.success("Message sent successfully!")
    setSubmitted(true)
    setSending(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Thank you!</h1>
          <p className="mt-4 text-muted-foreground">
            We&apos;ve received your message and will get back to you within 24 hours.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/home">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have questions about René Studio? We&apos;d love to hear from you. 
              Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                target={method.href.startsWith("http") ? "_blank" : undefined}
                rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-start gap-4 rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <method.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{method.title}</div>
                  <div className="text-sm text-muted-foreground">{method.description}</div>
                  <div className="mt-1 text-sm text-primary">{method.value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">Send us a message</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill out the form below and we&apos;ll get back to you within 24 hours.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Your company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiryType">Inquiry Type *</Label>
                <Select
                  required
                  value={formData.inquiryType}
                  onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                >
                  <SelectTrigger id="inquiryType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                required
                rows={5}
                placeholder="Tell us how we can help..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={sending}>
              {sending ? (
                "Sending..."
              ) : (
                <>
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
