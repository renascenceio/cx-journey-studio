"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-provider"
import { ROLE_LABELS } from "@/lib/permissions"
import { Camera, Shield, Key, Building2, User, Receipt, Loader2, Globe } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { updateProfile } from "@/lib/actions/data"
import { SoundSettings } from "@/components/sound-settings"
import { Textarea } from "@/components/ui/textarea"
import { TimezonePicker, detectTimezone } from "@/components/timezone-picker"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn, getInitials } from "@/lib/utils"
import { ReferralDashboard } from "@/components/referral-dashboard"
import { LinkedAccounts } from "@/components/linked-accounts"
import { Gift, Link2 } from "lucide-react"

interface BillingAddress {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export default function SettingsProfilePage() {
  const t = useTranslations()
  const { user, supabaseUser } = useAuth()
  const [twoFactor, setTwoFactor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingBilling, setSavingBilling] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [accountType, setAccountType] = useState<"individual" | "corporate">("individual")
  const [companyName, setCompanyName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [billingEmail, setBillingEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({})
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [userTimezone, setUserTimezone] = useState<string>("")

  // Auto-detect timezone on first load
  useEffect(() => {
    const saved = localStorage.getItem("user_timezone")
    if (saved) {
      setUserTimezone(saved)
    } else {
      const detected = detectTimezone()
      setUserTimezone(detected)
      localStorage.setItem("user_timezone", detected)
    }
  }, [])

  // Load billing info from database
  useEffect(() => {
    async function loadBillingInfo() {
      if (!supabaseUser) return
      try {
        const res = await fetch("/api/profile/billing")
        if (res.ok) {
          const data = await res.json()
          if (data.account_type) setAccountType(data.account_type)
          if (data.company_name) setCompanyName(data.company_name)
          if (data.tax_id) setTaxId(data.tax_id)
          if (data.billing_email) setBillingEmail(data.billing_email)
          if (data.phone) setPhone(data.phone)
          if (data.billing_address) setBillingAddress(data.billing_address)
        }
      } catch {
        // Silent fail - fields will just be empty
      }
    }
    loadBillingInfo()
  }, [supabaseUser])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("purpose", "avatar")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setAvatarUrl(data.url)
      toast.success("Avatar updated")
    } catch {
      toast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await updateProfile({
        name: nameRef.current?.value || undefined,
        email: emailRef.current?.value || undefined,
      })
      toast.success("Profile updated")
    } catch { toast.error("Failed to update profile") }
    finally { setSaving(false) }
  }

  const displayName = user?.name ?? "Guest"
  const displayEmail = user?.email ?? ""
  const displayRole = user?.role ?? "viewer"

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      {/* Avatar & Name */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[displayRole]}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, or GIF. Max 2MB.</p>
            </div>
          </div>

          <Separator />

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t("settings.name")}</Label>
              <Input id="name" ref={nameRef} defaultValue={displayName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input id="email" ref={emailRef} type="email" defaultValue={displayEmail} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">{t("settings.timezone")}</Label>
              <TimezonePicker
                value={userTimezone}
                onChange={(tz) => {
                  setUserTimezone(tz)
                  localStorage.setItem("user_timezone", tz)
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t("settings.timezoneDesc")}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">{t("settings.role")}</Label>
              <Input id="role" defaultValue={ROLE_LABELS[displayRole]} readOnly className="bg-muted/50" />
            </div>
          </div>
          <Button className="self-start" onClick={handleSaveProfile} disabled={saving}>
            {saving ? t("common.saving") : t("settings.saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Account Type & Billing */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {t("settings.accountBilling")}
          </CardTitle>
          <CardDescription>{t("settings.accountBillingDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label>{t("settings.accountType")}</Label>
            <RadioGroup
              value={accountType}
              onValueChange={(v) => setAccountType(v as "individual" | "corporate")}
              className="grid grid-cols-2 gap-4"
            >
              <label
                htmlFor="individual"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                  accountType === "individual" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="individual" id="individual" />
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{t("settings.individual")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.individualDesc")}</p>
                </div>
              </label>
              <label
                htmlFor="corporate"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                  accountType === "corporate" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="corporate" id="corporate" />
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{t("settings.corporate")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.corporateDesc")}</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Corporate fields */}
          {accountType === "corporate" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="company-name">{t("settings.companyName")}</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tax-id">{t("settings.taxId")}</Label>
                <Input
                  id="tax-id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Billing contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing-email">{t("settings.billingEmail")}</Label>
              <Input
                id="billing-email"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t("settings.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Billing address */}
          <div className="space-y-4">
            <Label>{t("settings.billingAddress")}</Label>
            <div className="flex flex-col gap-2">
              <Input
                placeholder={t("settings.streetAddress")}
                value={billingAddress.street || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                placeholder={t("settings.city")}
                value={billingAddress.city || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
              />
              <Input
                placeholder={t("settings.stateProvince")}
                value={billingAddress.state || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
              />
              <Input
                placeholder={t("settings.postalCode")}
                value={billingAddress.postal_code || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
              />
            </div>
            <Select
              value={billingAddress.country || ""}
              onValueChange={(v) => setBillingAddress({ ...billingAddress, country: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="AE">United Arab Emirates</SelectItem>
                <SelectItem value="SA">Saudi Arabia</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="SG">Singapore</SelectItem>
                <SelectItem value="IN">India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="self-start gap-2"
            disabled={savingBilling}
            onClick={async () => {
              setSavingBilling(true)
              try {
                const res = await fetch("/api/profile/billing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    account_type: accountType,
                    company_name: companyName || null,
                    tax_id: taxId || null,
                    billing_email: billingEmail || null,
                    phone: phone || null,
                    billing_address: Object.keys(billingAddress).length > 0 ? billingAddress : null,
                  }),
                })
                if (res.ok) {
                  toast.success(t("success.saved"))
                } else {
                  toast.error(t("errors.saveFailed"))
                }
              } catch {
                toast.error(t("errors.saveFailed"))
              } finally {
                setSavingBilling(false)
              }
            }}
          >
            {savingBilling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {savingBilling ? t("common.saving") : t("settings.saveBillingInfo")}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            {t("settings.changePassword")}
          </CardTitle>
          <CardDescription>{t("settings.securityDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">{t("settings.currentPassword")}</Label>
              <Input id="current-password" type="password" />
            </div>
            <div />
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-new-password">{t("settings.confirmNewPassword")}</Label>
              <Input id="confirm-new-password" type="password" />
            </div>
          </div>
          <Button variant="outline" className="self-start" onClick={() => toast.success(t("success.updated"))}>
            {t("settings.changePassword")}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("settings.twoFactor")}
          </CardTitle>
          <CardDescription>{t("settings.twoFactorDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {twoFactor ? t("settings.twoFactorEnabled") : t("settings.twoFactorDisabled")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {twoFactor
                  ? t("settings.twoFactorProtected")
                  : t("settings.twoFactorEnable")}
              </p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={(v) => { setTwoFactor(v); toast.success(v ? t("settings.twoFactorEnabled") : t("settings.twoFactorDisabled")) }} />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("settings.displayLanguage")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.selectLanguage")}
              </p>
            </div>
            <LanguageSwitcher variant="outline" size="sm" showLabel />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <SoundSettings />

      {/* Linked Accounts (OAuth) */}
      <LinkedAccounts />

      {/* Referral Program */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            {t("referral.title")}
          </CardTitle>
          <CardDescription>{t("referral.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralDashboard />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t("settings.dangerZone")}</CardTitle>
          <CardDescription>{t("settings.dangerZoneDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">{t("settings.deleteAccount")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
