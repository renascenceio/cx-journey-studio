"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Bell, Mail, MessageSquare, AlertTriangle, Users, GitBranch, FileText } from "lucide-react"

interface NotificationPref {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  email: boolean
  inApp: boolean
}

const defaultPrefs: NotificationPref[] = [
  {
    id: "journey_updates",
    label: "Journey Updates",
    description: "When a journey you own or collaborate on is modified",
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    email: true,
    inApp: true,
  },
  {
    id: "version_created",
    label: "Version Created",
    description: "When a new version snapshot is saved for your journeys",
    icon: <GitBranch className="h-4 w-4 text-muted-foreground" />,
    email: false,
    inApp: true,
  },
  {
    id: "comments_mentions",
    label: "Comments & Mentions",
    description: "When someone comments on your journey or mentions you",
    icon: <MessageSquare className="h-4 w-4 text-muted-foreground" />,
    email: true,
    inApp: true,
  },
  {
    id: "health_alerts",
    label: "Health Alerts",
    description: "When a journey health score drops below threshold",
    icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
    email: true,
    inApp: true,
  },
  {
    id: "team_activity",
    label: "Team Activity",
    description: "When team members join, leave, or change roles",
    icon: <Users className="h-4 w-4 text-muted-foreground" />,
    email: false,
    inApp: true,
  },
  {
    id: "weekly_digest",
    label: "Weekly Digest",
    description: "Summary of all workspace activity from the past week",
    icon: <Mail className="h-4 w-4 text-muted-foreground" />,
    email: true,
    inApp: false,
  },
]

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPref[]>(defaultPrefs)
  const [digestDay, setDigestDay] = useState("monday")
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietFrom, setQuietFrom] = useState("22:00")
  const [quietTo, setQuietTo] = useState("08:00")

  const togglePref = (id: string, channel: "email" | "inApp") => {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p))
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Choose how and when you want to be notified about workspace activity.
        </p>
      </div>

      {/* Notification preferences table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Notification Channels</CardTitle>
          <CardDescription>Toggle email and in-app notifications per event type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 border-b border-border/40 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Event</span>
            <span className="text-center">Email</span>
            <span className="text-center">In-App</span>
          </div>

          {prefs.map((pref, i) => (
            <div
              key={pref.id}
              className={`grid grid-cols-[1fr_80px_80px] items-center gap-4 px-6 py-3.5 ${
                i < prefs.length - 1 ? "border-b border-border/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{pref.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.email}
                  onCheckedChange={() => togglePref(pref.id, "email")}
                  aria-label={`${pref.label} email notifications`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={pref.inApp}
                  onCheckedChange={() => togglePref(pref.id, "inApp")}
                  aria-label={`${pref.label} in-app notifications`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Digest schedule */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Weekly Digest Schedule</CardTitle>
          <CardDescription>Choose which day to receive your weekly activity summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="text-sm text-muted-foreground min-w-[80px]">Send on</Label>
            <Select value={digestDay} onValueChange={setDigestDay}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quiet hours */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Quiet Hours</CardTitle>
              <CardDescription>Mute in-app notifications during specific hours.</CardDescription>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
              aria-label="Enable quiet hours"
            />
          </div>
        </CardHeader>
        {quietHoursEnabled && (
          <CardContent>
            <div className="flex items-center gap-4">
              <Label className="text-sm text-muted-foreground min-w-[50px]">From</Label>
              <input
                type="time"
                value={quietFrom}
                onChange={(e) => setQuietFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
              <Label className="text-sm text-muted-foreground min-w-[20px] text-center">to</Label>
              <input
                type="time"
                value={quietTo}
                onChange={(e) => setQuietTo(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              />
            </div>
          </CardContent>
        )}
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button variant="outline" size="sm">Reset to Defaults</Button>
        <Button
          size="sm"
          onClick={() => toast.success("Notification preferences saved")}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  )
}
