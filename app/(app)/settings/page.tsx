"use client"

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
import { LanguageSwitcher } from "@/components/locale-switcher"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { updateProfile } from "@/lib/actions/data"
import { SoundSettings } from "@/components/sound-settings"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn, getInitials } from "@/lib/utils"

interface BillingAddress {
  street?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export default function SettingsProfilePage() {
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
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your personal information and avatar</CardDescription>
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
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" ref={nameRef} defaultValue={displayName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" ref={emailRef} type="email" defaultValue={displayEmail} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="america-new-york">
                <SelectTrigger id="timezone" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america-new-york">America/New York (EST)</SelectItem>
                  <SelectItem value="america-chicago">America/Chicago (CST)</SelectItem>
                  <SelectItem value="america-los-angeles">America/Los Angeles (PST)</SelectItem>
                  <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                  <SelectItem value="europe-berlin">Europe/Berlin (CET)</SelectItem>
                  <SelectItem value="asia-tokyo">Asia/Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue={ROLE_LABELS[displayRole]} readOnly className="bg-muted/50" />
            </div>
          </div>
          <Button className="self-start" onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Account Type & Billing */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Account & Billing Information
          </CardTitle>
          <CardDescription>Your account type and billing details for invoices</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Account Type Selection */}
          <div className="space-y-3">
            <Label>Account Type</Label>
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
                  <p className="font-medium text-sm">Individual</p>
                  <p className="text-xs text-muted-foreground">Personal account</p>
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
                  <p className="font-medium text-sm">Corporate</p>
                  <p className="text-xs text-muted-foreground">Business account</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Corporate fields */}
          {accountType === "corporate" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tax-id">Tax ID / TRN / VAT Number</Label>
                <Input
                  id="tax-id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. 123-45-6789"
                />
              </div>
            </div>
          )}

          {/* Billing contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="billing-email">Billing Email</Label>
              <Input
                id="billing-email"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@company.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Billing address */}
          <div className="space-y-4">
            <Label>Billing Address</Label>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Street Address"
                value={billingAddress.street || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                placeholder="City"
                value={billingAddress.city || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
              />
              <Input
                placeholder="State / Province"
                value={billingAddress.state || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
              />
              <Input
                placeholder="Postal Code"
                value={billingAddress.postal_code || ""}
                onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
              />
            </div>
            <Select
              value={billingAddress.country || ""}
              onValueChange={(v) => setBillingAddress({ ...billingAddress, country: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Country" />
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
                  toast.success("Billing information saved")
                } else {
                  toast.error("Failed to save billing information")
                }
              } catch {
                toast.error("Failed to save billing information")
              } finally {
                setSavingBilling(false)
              }
            }}
          >
            {savingBilling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {savingBilling ? "Saving..." : "Save Billing Information"}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password
          </CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" placeholder="Enter current password" />
            </div>
            <div />
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="Min 8 characters" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input id="confirm-new-password" type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <Button variant="outline" className="self-start" onClick={() => toast.success("Password updated")}>
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {twoFactor ? "2FA is enabled" : "2FA is disabled"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {twoFactor
                  ? "Your account is protected with an authenticator app"
                  : "Enable two-factor authentication via authenticator app"}
              </p>
            </div>
            <Switch checked={twoFactor} onCheckedChange={(v) => { setTwoFactor(v); toast.success(v ? "2FA enabled" : "2FA disabled") }} />
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Language
          </CardTitle>
          <CardDescription>Choose your preferred display language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Display Language</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your preferred language for the interface
              </p>
            </div>
            <LanguageSwitcher variant="outline" size="sm" showLabel />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <SoundSettings />

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
