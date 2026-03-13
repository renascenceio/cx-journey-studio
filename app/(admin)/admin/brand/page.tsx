"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Palette, Upload, ImageIcon, Save } from "lucide-react"
import { SoundConfigCard, type SoundConfig } from "@/components/admin/sound-config"
import Image from "next/image"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminBrandPage() {
  const { data: config } = useSWR("/api/admin/config", fetcher)
  const [saving, setSaving] = useState(false)
  
  const [logoUploading, setLogoUploading] = useState<string | null>(null)
  const [logos, setLogos] = useState({
    logoLight: "",
    logoDark: "",
    logoMarkLight: "",
    logoMarkDark: "",
  })
  
  const [brandForm, setBrandForm] = useState({
    primaryColor: "#6366f1",
    customCss: "",
  })
  
  const [soundConfig, setSoundConfig] = useState<SoundConfig | null>(null)
  const [savingSounds, setSavingSounds] = useState(false)

  useEffect(() => {
    if (config) {
      // Load logos from config if available
      setLogos({
        logoLight: config.logo_light_url || config.logoLightUrl || "",
        logoDark: config.logo_dark_url || config.logoDarkUrl || "",
        logoMarkLight: config.logo_mark_light_url || config.logoMarkLightUrl || "",
        logoMarkDark: config.logo_mark_dark_url || config.logoMarkDarkUrl || "",
      })
      
      setBrandForm({
        primaryColor: config.primaryColor || "#6366f1",
        customCss: config.customCss || "",
      })
      
      // Load sound config
      if (config.soundsConfig) {
        setSoundConfig(config.soundsConfig)
      }
    }
  }, [config])

  async function handleLogoUpload(type: string, file: File) {
    if (!file) return

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
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await res.json()
      
      // Update local state with new URL
      setLogos(prev => ({
        ...prev,
        [type]: data.url
      }))
      
      // Revalidate the config to get fresh data
      mutate("/api/admin/config")
      mutate("/api/site-config")
      
      toast.success("Logo uploaded successfully")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload logo"
      toast.error(errorMessage)
    } finally {
      setLogoUploading(null)
    }
  }
  
  async function handleSaveBranding() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: brandForm.primaryColor,
          customCss: brandForm.customCss,
        }),
      })
      
      if (!res.ok) throw new Error("Failed to save")
      
      mutate("/api/admin/config")
      toast.success("Branding settings saved")
    } catch {
      toast.error("Failed to save branding settings")
    } finally {
      setSaving(false)
    }
  }
  
  async function handleSaveSounds(newConfig: SoundConfig) {
    setSavingSounds(true)
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soundsConfig: newConfig,
        }),
      })
      
      if (!res.ok) throw new Error("Failed to save")
      
      setSoundConfig(newConfig)
      mutate("/api/admin/config")
      toast.success("Sound settings saved")
    } catch {
      toast.error("Failed to save sound settings")
    } finally {
      setSavingSounds(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brand Settings</h1>
        <p className="text-muted-foreground">
          Customize your brand identity, logos, and visual appearance
        </p>
      </div>

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
                {logos.logoLight ? (
                  <Image
                    src={logos.logoLight}
                    alt="Logo Light"
                    width={160}
                    height={48}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[10px]">No logo</span>
                  </div>
                )}
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
                {logos.logoDark ? (
                  <Image
                    src={logos.logoDark}
                    alt="Logo Dark"
                    width={160}
                    height={48}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-zinc-500">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[10px]">No logo</span>
                  </div>
                )}
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
                {logos.logoMarkLight ? (
                  <Image
                    src={logos.logoMarkLight}
                    alt="Logo Mark Light"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[10px]">No logo</span>
                  </div>
                )}
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
                {logos.logoMarkDark ? (
                  <Image
                    src={logos.logoMarkDark}
                    alt="Logo Mark Dark"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-zinc-500">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[10px]">No logo</span>
                  </div>
                )}
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
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-base">Colors & Styling</CardTitle>
          </div>
          <CardDescription>Customize colors and add custom CSS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-xs">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={brandForm.primaryColor}
                  onChange={(e) => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))}
                  className="h-9 w-14 cursor-pointer p-1"
                />
                <Input
                  value={brandForm.primaryColor}
                  onChange={(e) => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))}
                  placeholder="#6366f1"
                  className="flex-1 text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customCss" className="text-xs">Custom CSS</Label>
            <Textarea
              id="customCss"
              value={brandForm.customCss}
              onChange={(e) => setBrandForm(f => ({ ...f, customCss: e.target.value }))}
              placeholder="/* Add custom CSS here */"
              className="font-mono text-xs min-h-[100px]"
            />
          </div>
          
          <Button onClick={handleSaveBranding} disabled={saving} size="sm">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </CardContent>
      </Card>

      {/* Sound Configuration */}
      <SoundConfigCard 
        config={soundConfig}
        onSave={handleSaveSounds}
        saving={savingSounds}
      />
    </div>
  )
}
