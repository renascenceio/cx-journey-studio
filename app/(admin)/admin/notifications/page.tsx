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

// Email template preview component
function EmailPreview({ event }: { event: typeof NOTIFICATION_EVENTS[0] }) {
  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      {/* Email Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <event.icon className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">
          {event.name === "Welcome Email" && "Welcome to CX Journey Studio"}
          {event.name === "Email Verification" && "Verify Your Email"}
          {event.name === "Password Reset" && "Reset Your Password"}
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
      </div>

      {/* Email Body */}
      <div className="px-6 py-6">
        <p className="text-gray-700 mb-4">
          Hi <span className="font-medium">{"{{user_name}}"}</span>,
        </p>
        
        {event.id === "welcome" && (
          <>
            <p className="text-gray-600 mb-4">
              Thank you for joining CX Journey Studio! We're excited to have you on board.
            </p>
            <p className="text-gray-600 mb-4">
              With CX Journey Studio, you can map customer journeys, identify pain points, 
              and discover solutions to improve your customer experience.
            </p>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Get Started
              </a>
            </div>
          </>
        )}

        {event.id === "email_verification" && (
          <>
            <p className="text-gray-600 mb-4">
              Please verify your email address by clicking the button below.
            </p>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Verify Email
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </>
        )}

        {event.id === "password_reset" && (
          <>
            <p className="text-gray-600 mb-4">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Reset Password
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              This link will expire in 1 hour. If you didn't request this, please ignore this email or contact support.
            </p>
          </>
        )}

        {event.id === "password_changed" && (
          <>
            <p className="text-gray-600 mb-4">
              Your password was successfully changed. If you did not make this change, please contact support immediately.
            </p>
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-amber-800 text-sm">
                <strong>Security tip:</strong> If you didn't change your password, secure your account immediately.
              </p>
            </div>
          </>
        )}

        {event.id === "journey_shared" && (
          <>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{"{{sharer_name}}"}</span> has shared a journey with you:
            </p>
            <div className="my-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="font-medium text-gray-900">{"{{journey_title}}"}</p>
              <p className="text-sm text-gray-500 mt-1">{"{{journey_description}}"}</p>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                View Journey
              </a>
            </div>
          </>
        )}

        {event.id === "collaborator_joined" && (
          <>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{"{{collaborator_name}}"}</span> has joined your journey:
            </p>
            <div className="my-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="font-medium text-gray-900">{"{{journey_title}}"}</p>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                View Journey
              </a>
            </div>
          </>
        )}

        {event.id === "comment_received" && (
          <>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{"{{commenter_name}}"}</span> commented on your journey:
            </p>
            <div className="my-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-gray-700 italic">"{`{{comment_text}}`}"</p>
              <p className="text-sm text-gray-500 mt-2">On: {"{{element_name}}"}</p>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                View Comment
              </a>
            </div>
          </>
        )}

        {event.id === "mention" && (
          <>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{"{{mentioner_name}}"}</span> mentioned you in a comment:
            </p>
            <div className="my-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-gray-700 italic">"{`{{comment_text}}`}"</p>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                View & Reply
              </a>
            </div>
          </>
        )}

        {event.id === "workspace_invite" && (
          <>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{"{{inviter_name}}"}</span> has invited you to join:
            </p>
            <div className="my-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="font-medium text-gray-900">{"{{workspace_name}}"}</p>
              <p className="text-sm text-gray-500 mt-1">Role: {"{{role}}"}</p>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Accept Invitation
              </a>
            </div>
          </>
        )}

        {event.id === "subscription_created" && (
          <>
            <p className="text-gray-600 mb-4">
              Your subscription to <span className="font-medium">{"{{plan_name}}"}</span> is now active!
            </p>
            <div className="my-4 rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Payment Successful</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Amount: {"{{amount}}"}</p>
            </div>
          </>
        )}

        {event.id === "subscription_cancelled" && (
          <>
            <p className="text-gray-600 mb-4">
              Your subscription has been cancelled. You'll continue to have access until {"{{end_date}}"}.
            </p>
            <p className="text-gray-600 mb-4">
              We're sorry to see you go. If there's anything we can do to improve, please let us know.
            </p>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Reactivate Subscription
              </a>
            </div>
          </>
        )}

        {event.id === "payment_failed" && (
          <>
            <p className="text-gray-600 mb-4">
              We were unable to process your payment. Please update your payment method to avoid service interruption.
            </p>
            <div className="my-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-700 text-sm">
                <strong>Action required:</strong> Update your payment method within 7 days.
              </p>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Update Payment Method
              </a>
            </div>
          </>
        )}

        {event.id === "trial_ending" && (
          <>
            <p className="text-gray-600 mb-4">
              Your free trial ends in <span className="font-medium">{"{{days_remaining}}"} days</span>. 
              Subscribe now to keep access to all features.
            </p>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Choose a Plan
              </a>
            </div>
          </>
        )}

        {event.id === "weekly_digest" && (
          <>
            <p className="text-gray-600 mb-4">
              Here's what happened this week:
            </p>
            <div className="my-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-gray-700">Journeys created</span>
                <span className="font-medium text-indigo-600">{"{{journeys_created}}"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-gray-700">Solutions applied</span>
                <span className="font-medium text-indigo-600">{"{{solutions_applied}}"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-gray-700">Team activity</span>
                <span className="font-medium text-indigo-600">{"{{team_activity}}"}</span>
              </div>
            </div>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                View Dashboard
              </a>
            </div>
          </>
        )}

        {(event.id === "ai_complete" || event.id === "export_ready") && (
          <>
            <p className="text-gray-600 mb-4">
              {event.id === "ai_complete" 
                ? "Your AI-generated content is ready to review."
                : "Your export has been processed and is ready for download."}
            </p>
            <div className="my-6 text-center">
              <a href="#" className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                {event.id === "ai_complete" ? "View Results" : "Download Export"}
              </a>
            </div>
          </>
        )}
      </div>

      {/* Email Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="text-center text-xs text-gray-500">
          <p>CX Journey Studio</p>
          <p className="mt-1">
            <a href="#" className="text-indigo-600 hover:underline">Unsubscribe</a>
            {" · "}
            <a href="#" className="text-indigo-600 hover:underline">Preferences</a>
            {" · "}
            <a href="#" className="text-indigo-600 hover:underline">Help</a>
          </p>
          <p className="mt-2 text-gray-400">
            {"{{company_address}}"}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
