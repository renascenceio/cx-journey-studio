"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Globe, Key, Palette, Mail, Shield, Upload, ImageIcon, Trash2 } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminConfigPage() {
  const { data: config } = useSWR("/api/admin/config", fetcher)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    siteName: "",
    siteDescription: "",
    supportEmail: "",
    enableSignups: true,
    enableAI: true,
    enableCrowdSolutions: true,
    maintenanceMode: false,
    openaiKey: "",
    anthropicKey: "",
    googleAiKey: "",
    defaultProvider: "openai",
    customCss: "",
    primaryColor: "#6366f1",
    maxJourneysPerUser: "50",
  })
  
  const [logoUploading, setLogoUploading] = useState<string | null>(null)
  const [logos, setLogos] = useState({
    logoLight: "",
    logoDark: "",
    logoMarkLight: "",
    logoMarkDark: "",
  })

  useEffect(() => {
    if (config) {
      setForm({
        siteName: config.siteName || "CX Journey Studio",
        siteDescription: config.siteDescription || "",
        supportEmail: config.supportEmail || "",
        enableSignups: config.enableSignups ?? true,
        enableAI: config.enableAI ?? true,
        enableCrowdSolutions: config.enableCrowdSolutions ?? true,
        maintenanceMode: config.maintenanceMode ?? false,
        openaiKey: "",
        anthropicKey: "",
        googleAiKey: "",
        defaultProvider: config.defaultProvider || "openai",
        customCss: config.customCss || "",
        primaryColor: config.primaryColor || "#6366f1",
        maxJourneysPerUser: String(config.maxJourneysPerUser ?? 50),
      })
      // Load logos from config if available
      setLogos({
        logoLight: config.logoLightUrl || "",
        logoDark: config.logoDarkUrl || "",
        logoMarkLight: config.logoMarkLightUrl || "",
        logoMarkDark: config.logoMarkDarkUrl || "",
      })
    }
  }, [config])

  async function handleLogoUpload(type: keyof typeof logos, file: File) {
    setLogoUploading(type)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)
      
      const res = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(err.error || "Upload failed")
      }
      
      const { url } = await res.json()
      setLogos(prev => ({ ...prev, [type]: url }))
      // Refresh config and site-config caches
      mutate("/api/admin/config")
      mutate("/api/site-config")
      toast.success("Logo uploaded successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo")
    } finally {
      setLogoUploading(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: form.siteName,
          site_description: form.siteDescription,
          support_email: form.supportEmail,
          enable_signups: form.enableSignups,
          enable_ai: form.enableAI,
          enable_crowd_solutions: form.enableCrowdSolutions,
          maintenance_mode: form.maintenanceMode,
          openai_key: form.openaiKey || undefined,
          anthropic_key: form.anthropicKey || undefined,
          google_ai_key: form.googleAiKey || undefined,
          default_provider: form.defaultProvider,
          custom_css: form.customCss,
          primary_color: form.primaryColor,
          max_journeys_per_user: parseInt(form.maxJourneysPerUser) || 50,
        }),
      })
      mutate("/api/admin/config")
      toast.success("Configuration saved")
    } catch { toast.error("Failed to save configuration") }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Site Configuration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Control platform behavior, branding, feature flags, and API keys</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {/* General */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">General</CardTitle>
          </div>
          <CardDescription>Basic platform identity and contact information</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Site Name</Label>
              <Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Support Email</Label>
              <Input type="email" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} placeholder="support@example.com" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Site Description</Label>
            <Textarea value={form.siteDescription} onChange={(e) => setForm({ ...form, siteDescription: e.target.value })} rows={2} placeholder="A brief description shown in metadata..." />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Feature Flags</CardTitle>
          </div>
          <CardDescription>Toggle platform features on or off</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allow New Signups</p>
              <p className="text-xs text-muted-foreground">Enable or disable new user registration</p>
            </div>
            <Switch checked={form.enableSignups} onCheckedChange={(v) => setForm({ ...form, enableSignups: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">AI Features</p>
              <p className="text-xs text-muted-foreground">Enable AI-powered insights, search, and generation</p>
            </div>
            <Switch checked={form.enableAI} onCheckedChange={(v) => setForm({ ...form, enableAI: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Crowd-Sourced Solutions</p>
              <p className="text-xs text-muted-foreground">Allow users to submit their own solutions</p>
            </div>
            <Switch checked={form.enableCrowdSolutions} onCheckedChange={(v) => setForm({ ...form, enableCrowdSolutions: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Show a maintenance page to non-admin users</p>
            </div>
            <Switch checked={form.maintenanceMode} onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })} />
          </div>
        </CardContent>
      </Card>

      {/* API Keys -- Multi-Provider AI (JDS-023) */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">AI Provider Configuration</CardTitle>
          </div>
          <CardDescription>Configure multiple AI providers. The platform will use whichever provider is configured, with fallback support.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              OpenAI
              {config?.hasOpenaiKey && <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">Connected</Badge>}
            </Label>
            <Input
              type="password"
              value={form.openaiKey}
              onChange={(e) => setForm({ ...form, openaiKey: e.target.value })}
              placeholder={config?.hasOpenaiKey ? "sk-...saved" : "sk-..."}
            />
            <p className="text-xs text-muted-foreground">GPT-4o, GPT-4, GPT-3.5 -- used for journey insights, archetype generation, smart search</p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              Anthropic (Claude)
              {form.anthropicKey && <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">Configured</Badge>}
            </Label>
            <Input
              type="password"
              value={form.anthropicKey || ""}
              onChange={(e) => setForm({ ...form, anthropicKey: e.target.value })}
              placeholder="sk-ant-..."
            />
            <p className="text-xs text-muted-foreground">Claude 3.5 Sonnet, Claude 3 Opus -- alternative provider with strong reasoning</p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              Google AI (Gemini)
              {form.googleAiKey && <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">Configured</Badge>}
            </Label>
            <Input
              type="password"
              value={form.googleAiKey || ""}
              onChange={(e) => setForm({ ...form, googleAiKey: e.target.value })}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground">Gemini Pro, Gemini Ultra -- Google multimodal AI</p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label>Default Provider</Label>
            <Select
              value={form.defaultProvider || "openai"}
              onValueChange={(v) => setForm({ ...form, defaultProvider: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                <SelectItem value="google">Google (Gemini)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose which provider to use by default. Others serve as fallbacks.</p>
          </div>
        </CardContent>
      </Card>

      {/* Logo Management */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base">Logo Management</CardTitle>
          </div>
          <CardDescription>Upload custom logos for light and dark themes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Full Logo - Light */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-medium">Full Logo (Light Theme)</Label>
              <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-white p-4">
                <Image
                  src={logos.logoLight}
                  alt="Logo Light"
                  width={160}
                  height={48}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={logoUploading === "logoLight"}
                  onClick={() => document.getElementById("upload-logo-light")?.click()}
                >
                  <Upload className="mr-1.5 h-3 w-3" />
                  {logoUploading === "logoLight" ? "Uploading..." : "Upload"}
                </Button>
                <input
                  id="upload-logo-light"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload("logoLight", e.target.files[0])}
                />
              </div>
            </div>

            {/* Full Logo - Dark */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-medium">Full Logo (Dark Theme)</Label>
              <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-zinc-900 p-4">
                <Image
                  src={logos.logoDark}
                  alt="Logo Dark"
                  width={160}
                  height={48}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={logoUploading === "logoDark"}
                  onClick={() => document.getElementById("upload-logo-dark")?.click()}
                >
                  <Upload className="mr-1.5 h-3 w-3" />
                  {logoUploading === "logoDark" ? "Uploading..." : "Upload"}
                </Button>
                <input
                  id="upload-logo-dark"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload("logoDark", e.target.files[0])}
                />
              </div>
            </div>

            {/* Logo Mark - Light */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-medium">Logo Mark (Light Theme)</Label>
              <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-white p-4">
                <Image
                  src={logos.logoMarkLight}
                  alt="Logo Mark Light"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={logoUploading === "logoMarkLight"}
                  onClick={() => document.getElementById("upload-mark-light")?.click()}
                >
                  <Upload className="mr-1.5 h-3 w-3" />
                  {logoUploading === "logoMarkLight" ? "Uploading..." : "Upload"}
                </Button>
                <input
                  id="upload-mark-light"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload("logoMarkLight", e.target.files[0])}
                />
              </div>
            </div>

            {/* Logo Mark - Dark */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-medium">Logo Mark (Dark Theme)</Label>
              <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-zinc-900 p-4">
                <Image
                  src={logos.logoMarkDark}
                  alt="Logo Mark Dark"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={logoUploading === "logoMarkDark"}
                  onClick={() => document.getElementById("upload-mark-dark")?.click()}
                >
                  <Upload className="mr-1.5 h-3 w-3" />
                  {logoUploading === "logoMarkDark" ? "Uploading..." : "Upload"}
                </Button>
                <input
                  id="upload-mark-dark"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload("logoMarkDark", e.target.files[0])}
                />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Recommended: Full logos should be transparent PNGs at least 400px wide. Logo marks should be square, at least 128x128px.
          </p>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-base">Branding</CardTitle>
          </div>
          <CardDescription>Customize the look and feel of your platform</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-border" />
                <Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Max Journeys per User</Label>
              <Input type="number" min={1} value={form.maxJourneysPerUser} onChange={(e) => setForm({ ...form, maxJourneysPerUser: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Custom CSS (advanced)</Label>
            <Textarea value={form.customCss} onChange={(e) => setForm({ ...form, customCss: e.target.value })} rows={4} placeholder="/* Custom overrides */" className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            <CardTitle className="text-base">Security</CardTitle>
          </div>
          <CardDescription>Security-related settings and controls</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h4 className="text-sm font-semibold text-destructive">Danger Zone</h4>
            <p className="mt-1 text-xs text-muted-foreground">These actions are irreversible. Proceed with caution.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => toast.info("This would purge all inactive sessions")}>
                Purge Sessions
              </Button>
              <Button variant="outline" size="sm" className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => toast.info("This would clear the solutions cache")}>
                Clear Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
