"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Globe, Key, Palette, Mail, Shield, Upload, ImageIcon, Trash2, Volume2, ExternalLink, Copy, CheckCircle2, AlertCircle } from "lucide-react"
import { SoundConfigCard, type SoundConfig } from "@/components/admin/sound-config"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Default logos used as fallbacks
const DEFAULT_LOGOS = {
  logoLight: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-light-TKrukgyff9qYn05XX01mnhB1RP7Wrb.png",
  logoDark: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-dark-xOhDTEdqNvUAZaKUpWWdevckyCXaMX.png",
  logoMarkLight: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logomark-light-IhqbmEuQwYjHrb2rJf3aAzBLZ7TbDV.png",
  logoMarkDark: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logomark-dark-j1hSjCo5bIOlFJWH2t8l3LU3LfLqYN.png",
  loginLogoLight: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-light-TKrukgyff9qYn05XX01mnhB1RP7Wrb.png",
  loginLogoDark: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-dark-xOhDTEdqNvUAZaKUpWWdevckyCXaMX.png",
}

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
    loginLogoLight: "",
    loginLogoDark: "",
  })
  const [soundConfig, setSoundConfig] = useState<SoundConfig | null>(null)
  const [savingSounds, setSavingSounds] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // OAuth credentials
  const [oauthConfig, setOauthConfig] = useState({
    googleClientId: "",
    googleClientSecret: "",
    microsoftClientId: "",
    microsoftClientSecret: "",
  })
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }
  
  // Get callback URL for OAuth
  const getCallbackUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth/callback`
    }
    return "https://your-domain.com/auth/callback"
  }

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
        loginLogoLight: config.loginLogoLightUrl || "",
        loginLogoDark: config.loginLogoDarkUrl || "",
      })
      // Load sounds config
      if (config.soundsConfig) {
        setSoundConfig(config.soundsConfig)
      }
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

  async function handleSaveSounds(newSoundConfig: SoundConfig) {
    setSavingSounds(true)
    try {
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sounds_config: newSoundConfig,
        }),
      })
      setSoundConfig(newSoundConfig)
      mutate("/api/admin/config")
      toast.success("Sound configuration saved")
    } catch {
      toast.error("Failed to save sound configuration")
    } finally {
      setSavingSounds(false)
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

      {/* OAuth Configuration */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">OAuth Authentication</CardTitle>
          </div>
          <CardDescription>Configure Google and Microsoft sign-in for your users</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Important Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Supabase Dashboard Required</p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  OAuth credentials must be configured directly in your Supabase project dashboard under Authentication {">"} Providers.
                  The fields below are for your reference only.
                </p>
              </div>
            </div>
          </div>

          {/* Callback URL */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <Label className="text-sm font-medium">Callback URL (Required for both providers)</Label>
            <p className="mt-1 text-xs text-muted-foreground mb-3">
              Add this URL to your OAuth app settings in Google Cloud Console and Microsoft Azure
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background border border-border px-3 py-2 text-xs font-mono text-foreground">
                {getCallbackUrl()}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getCallbackUrl(), "callback")}
              >
                {copiedField === "callback" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Google OAuth */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-border">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Google Sign-In</p>
                  <p className="text-xs text-muted-foreground">Allow users to sign in with their Google account</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Configure in Supabase
              </Badge>
            </div>
            
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h4 className="text-sm font-medium mb-3">Setup Instructions</h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Create a new project or select an existing one</li>
                <li>Go to "APIs & Services" {">"} "Credentials"</li>
                <li>Click "Create Credentials" {">"} "OAuth client ID"</li>
                <li>Select "Web application" as the application type</li>
                <li>Add your domain to "Authorized JavaScript origins"</li>
                <li>Add the callback URL above to "Authorized redirect URIs"</li>
                <li>Copy the Client ID and Client Secret</li>
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
                  {" "}{">"} Authentication {">"} Providers {">"} Google
                </li>
                <li>Enable Google provider and paste your credentials</li>
              </ol>
            </div>
          </div>

          <Separator />

          {/* Microsoft OAuth */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-border">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M11.4 24H0V12.6h11.4V24z"/>
                    <path fill="#00a4ef" d="M24 24H12.6V12.6H24V24z"/>
                    <path fill="#7fba00" d="M11.4 11.4H0V0h11.4v11.4z"/>
                    <path fill="#ffb900" d="M24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Microsoft Sign-In</p>
                  <p className="text-xs text-muted-foreground">Allow users to sign in with their Microsoft account</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Configure in Supabase
              </Badge>
            </div>
            
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h4 className="text-sm font-medium mb-3">Setup Instructions</h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <a 
                    href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Microsoft Azure Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Click "New registration"</li>
                <li>Enter a name for your application</li>
                <li>Select "Accounts in any organizational directory and personal Microsoft accounts"</li>
                <li>Add the callback URL above as a "Web" redirect URI</li>
                <li>After creation, copy the "Application (client) ID"</li>
                <li>Go to "Certificates & secrets" {">"} "New client secret"</li>
                <li>Copy the secret value (you will not see it again)</li>
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
                  {" "}{">"} Authentication {">"} Providers {">"} Azure (Microsoft)
                </li>
                <li>Enable Azure provider and paste your credentials</li>
              </ol>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3 w-3" />
                Supabase Dashboard
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3 w-3" />
                Google Cloud Console
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3 w-3" />
                Microsoft Azure Portal
              </a>
            </Button>
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
                  src={logos.logoLight || DEFAULT_LOGOS.logoLight}
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
                  src={logos.logoDark || DEFAULT_LOGOS.logoDark}
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
                  src={logos.logoMarkLight || DEFAULT_LOGOS.logoMarkLight}
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
                  src={logos.logoMarkDark || DEFAULT_LOGOS.logoMarkDark}
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
          
          {/* Login Page Logos - Separate Section */}
          <Separator className="my-4" />
          <div>
            <Label className="text-sm font-medium">Login Page Logos</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Custom logos displayed on the login and signup pages. Falls back to full logos if not set.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Login Logo - Light (shown on dark background) */}
              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium">Login Page Logo (Dark Background)</Label>
                <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-zinc-900 p-4">
                  <Image
                    src={logos.loginLogoDark || logos.logoDark || DEFAULT_LOGOS.loginLogoDark}
                    alt="Login Logo Dark"
                    width={200}
                    height={60}
                    className="max-h-14 w-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={logoUploading === "loginLogoDark"}
                    onClick={() => document.getElementById("upload-login-dark")?.click()}
                  >
                    <Upload className="mr-1.5 h-3 w-3" />
                    {logoUploading === "loginLogoDark" ? "Uploading..." : "Upload"}
                  </Button>
                  <input
                    id="upload-login-dark"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload("loginLogoDark", e.target.files[0])}
                  />
                </div>
              </div>

              {/* Login Logo - Dark (shown on light background) */}
              <div className="flex flex-col gap-3">
                <Label className="text-xs font-medium">Login Page Logo (Light Background)</Label>
                <div className="relative flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-white p-4">
                  <Image
                    src={logos.loginLogoLight || logos.logoLight || DEFAULT_LOGOS.loginLogoLight}
                    alt="Login Logo Light"
                    width={200}
                    height={60}
                    className="max-h-14 w-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={logoUploading === "loginLogoLight"}
                    onClick={() => document.getElementById("upload-login-light")?.click()}
                  >
                    <Upload className="mr-1.5 h-3 w-3" />
                    {logoUploading === "loginLogoLight" ? "Uploading..." : "Upload"}
                  </Button>
                  <input
                    id="upload-login-light"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload("loginLogoLight", e.target.files[0])}
                  />
                </div>
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

      {/* Sound Configuration */}
      <SoundConfigCard 
        config={soundConfig} 
        onSave={handleSaveSounds} 
        saving={savingSounds} 
      />

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
