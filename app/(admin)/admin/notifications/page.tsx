"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  Mail,
  Smartphone,
  Send,
  Eye,
  Settings,
  CheckCircle,
  UserPlus,
  Key,
  Share2,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Users,
  FileText,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Notification event types
const NOTIFICATION_EVENTS = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Sent when a new user signs up",
    category: "onboarding",
    icon: UserPlus,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "email_verification",
    name: "Email Verification",
    description: "Verification link for new accounts",
    category: "onboarding",
    icon: CheckCircle,
    emailEnabled: true,
    inAppEnabled: false,
  },
  {
    id: "password_reset",
    name: "Password Reset",
    description: "Password reset request link",
    category: "security",
    icon: Key,
    emailEnabled: true,
    inAppEnabled: false,
  },
  {
    id: "magic_link",
    name: "Magic Link Login",
    description: "Passwordless sign-in link",
    category: "security",
    icon: Key,
    emailEnabled: true,
    inAppEnabled: false,
  },
  {
    id: "password_changed",
    name: "Password Changed",
    description: "Confirmation when password is updated",
    category: "security",
    icon: Key,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "journey_shared",
    name: "Journey Shared",
    description: "When someone shares a journey with the user",
    category: "collaboration",
    icon: Share2,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "collaborator_joined",
    name: "Collaborator Joined",
    description: "When a collaborator joins a journey",
    category: "collaboration",
    icon: Users,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "comment_received",
    name: "New Comment",
    description: "When someone comments on a journey element",
    category: "collaboration",
    icon: MessageSquare,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "mention",
    name: "Mentioned in Comment",
    description: "When user is @mentioned in a comment",
    category: "collaboration",
    icon: MessageSquare,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "workspace_invite",
    name: "Workspace Invitation",
    description: "Invitation to join a workspace",
    category: "collaboration",
    icon: Users,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "ai_complete",
    name: "AI Generation Complete",
    description: "When AI finishes generating content",
    category: "system",
    icon: Sparkles,
    emailEnabled: false,
    inAppEnabled: true,
  },
  {
    id: "export_ready",
    name: "Export Ready",
    description: "When a large export is ready for download",
    category: "system",
    icon: FileText,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "subscription_created",
    name: "Subscription Started",
    description: "Confirmation of new subscription",
    category: "billing",
    icon: CreditCard,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "subscription_cancelled",
    name: "Subscription Cancelled",
    description: "Confirmation of cancellation",
    category: "billing",
    icon: CreditCard,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "payment_failed",
    name: "Payment Failed",
    description: "When a payment fails to process",
    category: "billing",
    icon: AlertTriangle,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "trial_ending",
    name: "Trial Ending Soon",
    description: "Reminder before trial expires",
    category: "billing",
    icon: Clock,
    emailEnabled: true,
    inAppEnabled: true,
  },
  {
    id: "weekly_digest",
    name: "Weekly Digest",
    description: "Weekly summary of activity",
    category: "digest",
    icon: FileText,
    emailEnabled: true,
    inAppEnabled: false,
  },
]

const CATEGORIES = [
  { id: "all", name: "All Events" },
  { id: "onboarding", name: "Onboarding" },
  { id: "security", name: "Security" },
  { id: "collaboration", name: "Collaboration" },
  { id: "billing", name: "Billing" },
  { id: "system", name: "System" },
  { id: "digest", name: "Digests" },
]

// Rene Logo SVG Component for emails
function ReneLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4H24C26.2091 4 28 5.79086 28 8V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V8C4 5.79086 5.79086 4 8 4Z" fill="currentColor"/>
      <path d="M10 12H14V20H10V12Z" fill="white"/>
      <path d="M16 10H20V20H16V10Z" fill="white"/>
      <text x="36" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="18" fontWeight="600" fill="currentColor">
        Rene
      </text>
    </svg>
  )
}

// Email template preview component
function EmailPreview({ event }: { event: typeof NOTIFICATION_EVENTS[0] }) {
  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
      {/* Email Header with Logo */}
      <div className="bg-[#18181B] px-6 py-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <ReneLogo className="h-8 w-auto text-white" />
        </div>
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
          <event.icon className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white text-center">
          {event.name === "Welcome Email" && "Welcome to Rene"}
          {event.name === "Email Verification" && "Verify Your Email"}
          {event.name === "Password Reset" && "Reset Your Password"}
          {event.name === "Magic Link Login" && "Sign In to Rene"}
          {event.name === "Password Changed" && "Password Updated"}
          {event.name === "Journey Shared" && "A Journey Was Shared With You"}
          {event.name === "Collaborator Joined" && "New Collaborator Joined"}
          {event.name === "New Comment" && "New Comment on Your Journey"}
          {event.name === "Mentioned in Comment" && "You Were Mentioned"}
          {event.name === "Workspace Invitation" && "You're Invited!"}
          {event.name === "AI Generation Complete" && "AI Generation Complete"}
          {event.name === "Export Ready" && "Your Export is Ready"}
          {event.name === "Subscription Started" && "Subscription Confirmed"}
          {event.name === "Subscription Cancelled" && "Subscription Cancelled"}
          {event.name === "Payment Failed" && "Payment Issue"}
          {event.name === "Trial Ending Soon" && "Your Trial Ends Soon"}
          {event.name === "Weekly Digest" && "Your Weekly Summary"}
        </h2>
        <p className="text-center text-zinc-400 text-sm mt-2">{event.description}</p>
      </div>

      {/* Email Body */}
      <div className="px-8 py-8">
        <p className="text-zinc-800 mb-5 text-[15px]">
          Hi <span className="font-semibold">{"{{user_name}}"}</span>,
        </p>
        
        {event.id === "welcome" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Welcome to Rene! We are thrilled to have you join our community of customer experience professionals.
            </p>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              With Rene, you can map customer journeys, identify pain points, and discover powerful solutions to transform your customer experience.
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Get Started
              </a>
            </div>
          </>
        )}

        {event.id === "email_verification" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Please verify your email address by clicking the button below.
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Verify Email
              </a>
            </div>
            <p className="text-zinc-400 text-sm">
              This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
            </p>
          </>
        )}

        {event.id === "password_reset" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Reset Password
              </a>
            </div>
            <p className="text-zinc-400 text-sm">
              This link will expire in 1 hour. If you did not request this, please ignore this email or contact support.
            </p>
          </>
        )}

        {event.id === "magic_link" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Click the button below to securely sign in to your Rene account. No password needed.
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Sign In to Rene
              </a>
            </div>
            <p className="text-zinc-400 text-sm">
              This link will expire in 15 minutes and can only be used once. If you did not request this, you can safely ignore this email.
            </p>
          </>
        )}

        {event.id === "password_changed" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Your password was successfully changed. If you did not make this change, please contact support immediately.
            </p>
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-amber-800 text-sm">
                <strong>Security tip:</strong> If you did not change your password, secure your account immediately.
              </p>
            </div>
          </>
        )}

        {event.id === "journey_shared" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              <span className="font-semibold text-zinc-800">{"{{sharer_name}}"}</span> has shared a journey with you:
            </p>
            <div className="my-5 rounded-xl bg-zinc-50 border border-zinc-200 p-5">
              <p className="font-semibold text-zinc-900">{"{{journey_title}}"}</p>
              <p className="text-sm text-zinc-500 mt-1.5">{"{{journey_description}}"}</p>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                View Journey
              </a>
            </div>
          </>
        )}

        {event.id === "collaborator_joined" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              <span className="font-semibold text-zinc-800">{"{{collaborator_name}}"}</span> has joined your journey:
            </p>
            <div className="my-5 rounded-xl bg-zinc-50 border border-zinc-200 p-5">
              <p className="font-semibold text-zinc-900">{"{{journey_title}}"}</p>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                View Journey
              </a>
            </div>
          </>
        )}

        {event.id === "comment_received" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              <span className="font-semibold text-zinc-800">{"{{commenter_name}}"}</span> commented on your journey:
            </p>
            <div className="my-5 rounded-xl bg-zinc-50 border border-zinc-200 p-5">
              <p className="text-zinc-700 italic leading-relaxed">"{`{{comment_text}}`}"</p>
              <p className="text-sm text-zinc-500 mt-3">On: {"{{element_name}}"}</p>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                View Comment
              </a>
            </div>
          </>
        )}

        {event.id === "mention" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              <span className="font-semibold text-zinc-800">{"{{mentioner_name}}"}</span> mentioned you in a comment:
            </p>
            <div className="my-5 rounded-xl bg-zinc-50 border border-zinc-200 p-5">
              <p className="text-zinc-700 italic leading-relaxed">"{`{{comment_text}}`}"</p>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                View & Reply
              </a>
            </div>
          </>
        )}

        {event.id === "workspace_invite" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              <span className="font-semibold text-zinc-800">{"{{inviter_name}}"}</span> has invited you to join:
            </p>
            <div className="my-5 rounded-xl bg-zinc-50 border border-zinc-200 p-5">
              <p className="font-semibold text-zinc-900">{"{{workspace_name}}"}</p>
              <p className="text-sm text-zinc-500 mt-1.5">Role: {"{{role}}"}</p>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Accept Invitation
              </a>
            </div>
          </>
        )}

        {event.id === "subscription_created" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Your subscription to <span className="font-semibold text-zinc-800">{"{{plan_name}}"}</span> is now active!
            </p>
            <div className="my-5 rounded-xl bg-emerald-50 border border-emerald-200 p-5">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Payment Successful</span>
              </div>
              <p className="text-sm text-emerald-600 mt-2">Amount: {"{{amount}}"}</p>
            </div>
          </>
        )}

        {event.id === "subscription_cancelled" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Your subscription has been cancelled. You will continue to have access until {"{{end_date}}"}.
            </p>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              We are sorry to see you go. If there is anything we can do to improve, please let us know.
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Reactivate Subscription
              </a>
            </div>
          </>
        )}

        {event.id === "payment_failed" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              We were unable to process your payment. Please update your payment method to avoid service interruption.
            </p>
            <div className="my-5 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-red-700 text-sm font-medium">
                Action required: Update your payment method within 7 days.
              </p>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Update Payment Method
              </a>
            </div>
          </>
        )}

        {event.id === "trial_ending" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Your free trial ends in <span className="font-semibold text-zinc-800">{"{{days_remaining}}"} days</span>. 
              Subscribe now to keep access to all features.
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                Choose a Plan
              </a>
            </div>
          </>
        )}

        {event.id === "weekly_digest" && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              Here is what happened this week:
            </p>
            <div className="my-5 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <span className="text-zinc-700">Journeys created</span>
                <span className="font-semibold text-zinc-900">{"{{journeys_created}}"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <span className="text-zinc-700">Solutions applied</span>
                <span className="font-semibold text-zinc-900">{"{{solutions_applied}}"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                <span className="text-zinc-700">Team activity</span>
                <span className="font-semibold text-zinc-900">{"{{team_activity}}"}</span>
              </div>
            </div>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                View Dashboard
              </a>
            </div>
          </>
        )}

        {(event.id === "ai_complete" || event.id === "export_ready") && (
          <>
            <p className="text-zinc-600 mb-4 text-[15px] leading-relaxed">
              {event.id === "ai_complete" 
                ? "Your AI-generated content is ready to review."
                : "Your export has been processed and is ready for download."}
            </p>
            <div className="my-8 text-center">
              <a href="#" className="inline-block rounded-lg bg-[#18181B] px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                {event.id === "ai_complete" ? "View Results" : "Download Export"}
              </a>
            </div>
          </>
        )}
      </div>

      {/* Email Footer */}
      <div className="border-t border-zinc-200 bg-zinc-50 px-8 py-6">
        <div className="text-center">
          <ReneLogo className="h-6 w-auto text-zinc-400 mx-auto mb-3" />
          <p className="text-xs text-zinc-500">
            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Unsubscribe</a>
            {" · "}
            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Preferences</a>
            {" · "}
            <a href="#" className="text-zinc-600 hover:text-zinc-900 transition-colors">Help</a>
          </p>
          <p className="mt-3 text-[11px] text-zinc-400">
            Renascence · Dubai, United Arab Emirates
          </p>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [notifications, setNotifications] = useState(
    NOTIFICATION_EVENTS.map(e => ({
      ...e,
      emailEnabled: e.emailEnabled,
      inAppEnabled: e.inAppEnabled,
    }))
  )
  const [sendingTest, setSendingTest] = useState<string | null>(null)

  const filteredEvents = activeCategory === "all" 
    ? notifications 
    : notifications.filter(n => n.category === activeCategory)

  const toggleEmail = (eventId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === eventId ? { ...n, emailEnabled: !n.emailEnabled } : n)
    )
  }

  const toggleInApp = (eventId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === eventId ? { ...n, inAppEnabled: !n.inAppEnabled } : n)
    )
  }

  const sendTestEmail = async (eventId: string) => {
    setSendingTest(eventId)
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSendingTest(null)
    toast.success("Test email sent to your inbox")
  }

  const handleSave = () => {
    toast.success("Notification settings saved")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure email and in-app notifications for all system events
          </p>
        </div>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="events" className="gap-1.5">
            <Bell className="h-4 w-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            {/* Category Filter */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 text-left text-sm transition-colors ${
                        activeCategory === cat.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Events List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Notification Events</CardTitle>
                    <CardDescription>
                      Toggle email and in-app notifications for each event type
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5" />
                      In-App
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col divide-y divide-border">
                  {filteredEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-muted p-2">
                          <event.icon className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{event.name}</p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Switch
                          checked={event.emailEnabled}
                          onCheckedChange={() => toggleEmail(event.id)}
                        />
                        <Switch
                          checked={event.inAppEnabled}
                          onCheckedChange={() => toggleInApp(event.id)}
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Email Preview: {event.name}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <EmailPreview event={event} />
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sendTestEmail(event.id)}
                                disabled={sendingTest === event.id}
                              >
                                {sendingTest === event.id ? (
                                  <>
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-1.5 h-3.5 w-3.5" />
                                    Send Test Email
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          {/* Supabase Configuration Notice */}
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Supabase Email Templates</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Authentication emails (magic link, password reset, email verification) are managed in your Supabase project dashboard. 
                  The templates below are visual previews showing our recommended design.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                    <a href="https://supabase.com/dashboard/project/_/auth/templates" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3 w-3" />
                      Configure in Supabase
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                    navigator.clipboard.writeText(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background-color: #18181b; padding: 32px; text-align: center;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 700;">René Studio</span>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0;">{{ .Subject }}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                {{ .Email }}, click the button below to proceed:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background-color: #18181b; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
                      Confirm
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 24px; text-align: center;">
              <p style="color: #71717a; font-size: 11px; margin: 0;">
                René Studio · Renascence · Dubai, UAE
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim())
                    toast.success("HTML template copied to clipboard")
                  }}>
                    <Copy className="mr-1.5 h-3 w-3" />
                    Copy HTML Template
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {NOTIFICATION_EVENTS.filter(e => e.emailEnabled).map(event => (
              <Card key={event.id} className="group cursor-pointer hover:border-primary/50 transition-colors">
                <Dialog>
                  <DialogTrigger asChild>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-indigo-100 p-2.5">
                          <event.icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {event.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                          <Badge variant="secondary" className="mt-2 text-[10px]">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Email Template: {event.name}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <EmailPreview event={event} />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestEmail(event.id)}
                        disabled={sendingTest === event.id}
                      >
                        {sendingTest === event.id ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Send Test Email
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Settings</CardTitle>
                <CardDescription>Configure email delivery preferences</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>From Name</Label>
                  <Input defaultValue="CX Journey Studio" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>From Email</Label>
                  <Input defaultValue="notifications@studio.renascence.io" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Reply-To Email</Label>
                  <Input defaultValue="support@renascence.io" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Footer</p>
                    <p className="text-xs text-muted-foreground">Company address and unsubscribe links</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Track Opens</p>
                    <p className="text-xs text-muted-foreground">Track when emails are opened</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Track Clicks</p>
                    <p className="text-xs text-muted-foreground">Track link clicks in emails</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">In-App Notifications</CardTitle>
                <CardDescription>Configure in-app notification behavior</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sound Alerts</p>
                    <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Desktop Notifications</p>
                    <p className="text-xs text-muted-foreground">Show browser notifications</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Badge Count</p>
                    <p className="text-xs text-muted-foreground">Show unread count in navigation</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Label>Auto-dismiss after (seconds)</Label>
                  <Input type="number" defaultValue="5" className="w-24" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Max notifications shown</Label>
                  <Input type="number" defaultValue="5" className="w-24" />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Digest Settings</CardTitle>
                <CardDescription>Configure email digest frequency and content</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Weekly Digest Day</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                      <option>Monday</option>
                      <option>Tuesday</option>
                      <option>Wednesday</option>
                      <option>Thursday</option>
                      <option>Friday</option>
                      <option>Saturday</option>
                      <option>Sunday</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Digest Time</Label>
                    <Input type="time" defaultValue="09:00" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Digest Content</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="inc-journeys" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                      <label htmlFor="inc-journeys" className="text-sm">Include journey activity</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="inc-team" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                      <label htmlFor="inc-team" className="text-sm">Include team activity</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="inc-tips" defaultChecked className="h-4 w-4 rounded border-gray-300" />
                      <label htmlFor="inc-tips" className="text-sm">Include tips and updates</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supabase Email Templates Configuration */}
            <Card className="lg:col-span-2 border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Supabase Auth Email Templates</CardTitle>
                </div>
                <CardDescription>
                  Magic Link, Password Reset, and Email Verification emails are sent directly by Supabase. 
                  Configure these templates in your Supabase dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Configuration Required in Supabase</p>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        To customize authentication emails (Magic Link, Password Reset, Email Verification), 
                        you must configure the email templates directly in your Supabase project dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h4 className="text-sm font-medium mb-3">Setup Instructions</h4>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>
                      Go to{" "}
                      <a 
                        href="https://supabase.com/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Supabase Dashboard <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Select your project and navigate to <strong>Authentication</strong> {">"} <strong>Email Templates</strong></li>
                    <li>Customize each template type:
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        <li><strong>Magic Link</strong> - Passwordless sign-in emails</li>
                        <li><strong>Confirm Signup</strong> - Email verification for new users</li>
                        <li><strong>Reset Password</strong> - Password recovery emails</li>
                        <li><strong>Invite User</strong> - Team invitation emails</li>
                      </ul>
                    </li>
                    <li>Use the template previews above as reference for your email design</li>
                    <li>Configure your custom SMTP server under <strong>Project Settings</strong> {">"} <strong>Auth</strong> {">"} <strong>SMTP Settings</strong></li>
                  </ol>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h4 className="text-sm font-medium mb-3">Available Template Variables</h4>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="flex items-center gap-2">
                      <code className="bg-background border rounded px-1.5 py-0.5">{`{{ .ConfirmationURL }}`}</code>
                      <span className="text-muted-foreground">- Magic link/verification URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-background border rounded px-1.5 py-0.5">{`{{ .Token }}`}</code>
                      <span className="text-muted-foreground">- OTP token (if enabled)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-background border rounded px-1.5 py-0.5">{`{{ .Email }}`}</code>
                      <span className="text-muted-foreground">- User email address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-background border rounded px-1.5 py-0.5">{`{{ .SiteURL }}`}</code>
                      <span className="text-muted-foreground">- Your site URL</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3 w-3" />
                      Open Supabase Dashboard
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://supabase.com/docs/guides/auth/auth-smtp" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3 w-3" />
                      SMTP Configuration Docs
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
