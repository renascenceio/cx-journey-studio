"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, DollarSign, Zap, Users, AlertCircle, Check, X, Infinity, TestTube, Sparkles, Percent } from "lucide-react"
import { toast } from "sonner"
import useSWR, { mutate as swrMutate } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  journey_limit: number
  team_member_limit: number
  ai_credits_monthly: number
  version_history_days: number
  features: {
    templates: string
    export: string[]
    collaboration: boolean
    analytics: string | boolean
    customBranding: boolean
    sso: boolean
    api: boolean
  }
  is_active: boolean
}

const defaultPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    journey_limit: 3,
    team_member_limit: 1,
    ai_credits_monthly: 50,
    version_history_days: 7,
    features: { templates: "community", export: ["pdf"], collaboration: false, analytics: false, customBranding: false, sso: false, api: false },
    is_active: true,
  },
  {
    id: "starter",
    name: "Starter",
    price_monthly: 19,
    price_yearly: 15,
    journey_limit: 15,
    team_member_limit: 5,
    ai_credits_monthly: 500,
    version_history_days: 30,
    features: { templates: "full", export: ["pdf", "png", "csv"], collaboration: true, analytics: "basic", customBranding: false, sso: false, api: false },
    is_active: true,
  },
  {
    id: "business",
    name: "Business",
    price_monthly: 49,
    price_yearly: 39,
    journey_limit: -1,
    team_member_limit: 25,
    ai_credits_monthly: 2000,
    version_history_days: 90,
    features: { templates: "full_custom", export: ["pdf", "png", "csv", "json"], collaboration: true, analytics: "advanced", customBranding: true, sso: false, api: true },
    is_active: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price_monthly: -1,
    price_yearly: -1,
    journey_limit: -1,
    team_member_limit: -1,
    ai_credits_monthly: -1,
    version_history_days: -1,
    features: { templates: "custom_dev", export: ["all"], collaboration: true, analytics: "enterprise", customBranding: true, sso: true, api: true },
    is_active: true,
  },
]

const featureLabels: Record<string, string> = {
  templates: "Templates",
  export: "Export Formats",
  collaboration: "Team Collaboration",
  analytics: "Analytics",
  customBranding: "Custom Branding",
  sso: "SSO / SAML",
  api: "API Access",
}

export default function AdminBillingPage() {
  const { data: config } = useSWR("/api/admin/config", fetcher)
  const { data: plansData } = useSWR("/api/admin/plans", fetcher)
  const [stripeKey, setStripeKey] = useState("")
  const [stripeSecret, setStripeSecret] = useState("")
  const [saving, setSaving] = useState(false)
  const [creatingTestUsers, setCreatingTestUsers] = useState(false)

  const [plans, setPlans] = useState<Plan[]>(defaultPlans)
  const [regCost, setRegCost] = useState(config?.registrationCost ?? "0")
  const [aiCreditFeePercent, setAiCreditFeePercent] = useState(config?.aiCreditFeePercentage ?? 0)

  useEffect(() => {
    if (plansData?.plans) {
      setPlans(plansData.plans)
    }
  }, [plansData])

  useEffect(() => {
    if (config?.aiCreditFeePercentage !== undefined) {
      setAiCreditFeePercent(config.aiCreditFeePercentage)
    }
  }, [config])

  async function handleSaveStripe() {
    if (!stripeKey && !stripeSecret) return
    setSaving(true)
    try {
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripe_publishable_key: stripeKey || undefined,
          stripe_secret_key: stripeSecret || undefined,
        }),
      })
      toast.success("Stripe keys saved")
      setStripeKey("")
      setStripeSecret("")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

async function handleSaveRegCost() {
  setSaving(true)
  try {
  await fetch("/api/admin/config", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ registration_cost: parseFloat(regCost) || 0 }),
  })
  toast.success("Registration cost updated")
  } catch { toast.error("Failed to save") }
  finally { setSaving(false) }
  }

  // B13: Save AI credit fee percentage
  async function handleSaveFeePercent() {
    setSaving(true)
    try {
      await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_credit_fee_percentage: parseFloat(String(aiCreditFeePercent)) || 0 }),
      })
      toast.success("AI credit fee updated")
      swrMutate("/api/admin/config")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  // B13: Calculate display price with markup
  function getDisplayPrice(basePrice: number) {
    const markup = 1 + (aiCreditFeePercent / 100)
    return Math.round(basePrice * markup * 100) / 100
  }

  async function createTestUsers() {
    setCreatingTestUsers(true)
    try {
      const res = await fetch("/api/admin/create-test-users", { method: "POST" })
      if (!res.ok) throw new Error("Failed to create test users")
      const result = await res.json()
      toast.success("Test users created", {
        description: `Created ${result.created} test accounts for each plan tier.`,
      })
      swrMutate("/api/admin/users")
    } catch {
      toast.error("Failed to create test users")
    } finally {
      setCreatingTestUsers(false)
    }
  }

  function formatLimit(value: number) {
    return value === -1 ? <Infinity className="h-4 w-4 text-primary" /> : value
  }

  function formatPrice(price: number) {
    if (price === -1) return "Custom"
    if (price === 0) return "Free"
    return `$${price}`
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure payment gateway, subscription plans, and registration costs</p>
      </div>

      {/* Payment Gateway */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Payment Gateway</CardTitle>
          </div>
          <CardDescription>Connect Stripe to enable payments and subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={config?.stripeConnected ? "default" : "secondary"} className="text-xs">
              {config?.stripeConnected ? "Connected" : "Not Connected"}
            </Badge>
            {!config?.stripeConnected && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Add your Stripe API keys to enable payments
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stripe-pk">Publishable Key</Label>
              <Input
                id="stripe-pk"
                type="password"
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                placeholder="pk_live_..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stripe-sk">Secret Key</Label>
              <Input
                id="stripe-sk"
                type="password"
                value={stripeSecret}
                onChange={(e) => setStripeSecret(e.target.value)}
                placeholder="sk_live_..."
              />
            </div>
          </div>
          <Button onClick={handleSaveStripe} disabled={saving || (!stripeKey && !stripeSecret)} className="self-start">
            {saving ? "Saving..." : "Save Stripe Keys"}
          </Button>
        </CardContent>
      </Card>

      {/* Registration Cost */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Registration Cost</CardTitle>
          </div>
          <CardDescription>Set a one-time registration fee for new accounts (0 = free registration)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex flex-col gap-2 w-48">
            <Label htmlFor="reg-cost">Amount (USD)</Label>
            <Input id="reg-cost" type="number" min={0} step={0.01} value={regCost} onChange={(e) => setRegCost(e.target.value)} />
          </div>
          <Button onClick={handleSaveRegCost} disabled={saving}>
            {saving ? "Saving..." : "Update"}
          </Button>
        </CardContent>
      </Card>

      {/* B13: AI Credit Fee Control */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-green-500" />
            <CardTitle className="text-base">AI Credit Fee Markup</CardTitle>
          </div>
          <CardDescription>Set the markup percentage applied to AI credit costs. This margin covers platform operations.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4 max-w-md">
            <div className="flex-1">
              <Label htmlFor="fee-percent">Markup Percentage</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  id="fee-percent" 
                  type="number" 
                  min={0} 
                  max={100}
                  step={1} 
                  value={aiCreditFeePercent} 
                  onChange={(e) => setAiCreditFeePercent(parseFloat(e.target.value) || 0)} 
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <Button onClick={handleSaveFeePercent} disabled={saving} className="self-end">
              {saving ? "Saving..." : "Update"}
            </Button>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">Price Example</p>
            <p className="text-muted-foreground mt-1">
              Base cost: $10.00 + {aiCreditFeePercent}% = <strong>${getDisplayPrice(10).toFixed(2)}</strong> display price
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Credits Pricing */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">AI Credits Pricing</CardTitle>
          </div>
          <CardDescription>Configure the cost per credit bundle for top-ups (includes {aiCreditFeePercent}% markup)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">100</p>
              <p className="text-xs text-muted-foreground">credits</p>
              <p className="mt-2 text-lg font-semibold text-primary">${getDisplayPrice(5).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${(getDisplayPrice(5) / 100).toFixed(3)}/credit</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">500</p>
              <p className="text-xs text-muted-foreground">credits</p>
              <p className="mt-2 text-lg font-semibold text-primary">${getDisplayPrice(20).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${(getDisplayPrice(20) / 500).toFixed(3)}/credit</p>
            </div>
            <div className="rounded-lg border p-4 text-center border-primary">
              <Badge className="mb-2" variant="default">Popular</Badge>
              <p className="text-2xl font-bold text-foreground">1,000</p>
              <p className="text-xs text-muted-foreground">credits</p>
              <p className="mt-2 text-lg font-semibold text-primary">${getDisplayPrice(35).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${(getDisplayPrice(35) / 1000).toFixed(4)}/credit</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">5,000</p>
              <p className="text-xs text-muted-foreground">credits</p>
              <p className="mt-2 text-lg font-semibold text-primary">${getDisplayPrice(150).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${(getDisplayPrice(150) / 5000).toFixed(4)}/credit</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Credit pricing is based on Claude API costs. 1 credit = approximately $0.001 in API costs. 
            Top-up prices include a {aiCreditFeePercent}% margin for platform operations.
          </p>
        </CardContent>
      </Card>

      {/* Subscription Plans Table */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Subscription Plans</CardTitle>
            </div>
          </div>
          <CardDescription>Current pricing tiers and their features. Edit prices in the database or via API.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Feature</TableHead>
                  {plans.map((plan) => (
                    <TableHead key={plan.id} className="text-center font-semibold">
                      <div className="flex flex-col items-center gap-1">
                        <span>{plan.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {formatPrice(plan.price_monthly)}/mo
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Journeys</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">{formatLimit(plan.journey_limit)}</div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Team Members</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">{formatLimit(plan.team_member_limit)}</div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">AI Credits/Month</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">{formatLimit(plan.ai_credits_monthly)}</div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Version History</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">
                        {plan.version_history_days === -1 ? <Infinity className="h-4 w-4 text-primary" /> : `${plan.version_history_days} days`}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Templates</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle text-xs capitalize">
                      <div className="flex items-center justify-center">{plan.features.templates.replace("_", " ")}</div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Export</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle text-xs uppercase">
                      <div className="flex items-center justify-center">{plan.features.export.join(", ")}</div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Team Collaboration</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">
                        {plan.features.collaboration ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Analytics</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle text-xs capitalize">
                      <div className="flex items-center justify-center">
                        {plan.features.analytics === false ? <X className="h-4 w-4 text-muted-foreground" /> : plan.features.analytics}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Custom Branding</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">
                        {plan.features.customBranding ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SSO / SAML</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">
                        {plan.features.sso ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">API Access</TableCell>
                  {plans.map((plan) => (
                    <TableCell key={plan.id} className="text-center align-middle">
                      <div className="flex items-center justify-center">
                        {plan.features.api ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Test Users */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Test Accounts</CardTitle>
          </div>
          <CardDescription>Create test accounts for each plan tier to verify functionality</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            This will create 4 test users, one for each plan tier (Free, Starter, Business, Enterprise). 
            Each user will have the appropriate plan attached with corresponding limits and features enabled.
          </p>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <p><strong>Test accounts created:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>test-free@example.com (Free plan)</li>
              <li>test-starter@example.com (Starter plan)</li>
              <li>test-business@example.com (Business plan)</li>
              <li>test-enterprise@example.com (Enterprise plan)</li>
            </ul>
            <p className="mt-2">Password for all: <code className="bg-muted px-1 rounded">TestPassword123!</code></p>
          </div>
          <Button onClick={createTestUsers} disabled={creatingTestUsers} className="self-start">
            <TestTube className="mr-2 h-4 w-4" />
            {creatingTestUsers ? "Creating..." : "Create Test Users"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
