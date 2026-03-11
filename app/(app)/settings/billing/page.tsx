"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { cn } from "@/lib/utils"
import { 
  CreditCard, 
  Zap, 
  ArrowUpRight, 
  CheckCircle2,
  Sparkles, 
  TrendingUp,
  AlertCircle,
  Crown,
  Loader2,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Credit packages for top-up
const CREDIT_PACKAGES = [
  { id: "small", credits: 100, price: 5, perCredit: 0.05, popular: false },
  { id: "medium", credits: 500, price: 20, perCredit: 0.04, popular: true },
  { id: "large", credits: 1500, price: 50, perCredit: 0.033, popular: false },
  { id: "xlarge", credits: 5000, price: 150, perCredit: 0.03, popular: false },
]

const PLAN_DETAILS: Record<string, { name: string; color: string; icon: typeof Crown; monthlyCredits: number; journeys: string; members: string }> = {
  free: { name: "Free", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", icon: Zap, monthlyCredits: 50, journeys: "3", members: "1" },
  starter: { name: "Starter", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Sparkles, monthlyCredits: 500, journeys: "15", members: "5" },
  business: { name: "Business", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: TrendingUp, monthlyCredits: 2000, journeys: "Unlimited", members: "25" },
  enterprise: { name: "Enterprise", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Crown, monthlyCredits: -1, journeys: "Unlimited", members: "Unlimited" },
}

const mockInvoices = [
  { id: "INV-2026-03", date: "Mar 1, 2026", amount: "$20.00", status: "paid", description: "AI Credits - 500 pack" },
  { id: "INV-2026-02", date: "Feb 1, 2026", amount: "$19.00", status: "paid", description: "Starter Plan - Monthly" },
  { id: "INV-2026-01", date: "Jan 1, 2026", amount: "$19.00", status: "paid", description: "Starter Plan - Monthly" },
]

export default function BillingSettingsPage() {
  const { organization } = useAuth()
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState("medium")
  const [purchasing, setPurchasing] = useState(false)
  const [credits, setCredits] = useState({ used: 23, total: 500, purchased: 0 })
  const [loading, setLoading] = useState(true)
  
  const currentPlan = organization?.plan_id || "free"
  const planInfo = PLAN_DETAILS[currentPlan] || PLAN_DETAILS.free
  const PlanIcon = planInfo.icon
  
  // Fetch credits
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch("/api/credits")
        if (res.ok) {
          const data = await res.json()
          setCredits(data)
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchCredits()
  }, [])
  
  const creditsRemaining = credits.total + credits.purchased - credits.used
  const creditsPercentUsed = credits.total > 0 ? Math.min(100, (credits.used / (credits.total + credits.purchased)) * 100) : 0
  const isLowCredits = creditsRemaining < 20
  
  async function handlePurchaseCredits() {
    const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage)
    if (!pkg) return
    
    setPurchasing(true)
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPackage }),
      })
      
      if (!res.ok) throw new Error("Purchase failed")
      
      setCredits(prev => ({ ...prev, purchased: prev.purchased + pkg.credits }))
      setTopUpOpen(false)
      toast.success(`Added ${pkg.credits} AI credits to your account`, {
        description: `Your new balance is ${creditsRemaining + pkg.credits} credits.`,
      })
    } catch {
      toast.error("Failed to purchase credits. Please try again.")
    } finally {
      setPurchasing(false)
    }
  }
  
  return (
    <div className="flex flex-col gap-6">
      {/* Current Plan */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            <Badge className={cn("gap-1.5", planInfo.color)}>
              <PlanIcon className="h-3 w-3" />
              {planInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs text-muted-foreground">Journeys</p>
              <p className="text-2xl font-semibold">{planInfo.journeys}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs text-muted-foreground">Team Members</p>
              <p className="text-2xl font-semibold">{planInfo.members}</p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-xs text-muted-foreground">Monthly AI Credits</p>
              <p className="text-2xl font-semibold">{planInfo.monthlyCredits === -1 ? "Custom" : planInfo.monthlyCredits.toLocaleString()}</p>
            </div>
          </div>
          
          {currentPlan !== "enterprise" && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {currentPlan === "free" 
                  ? "Upgrade to unlock more features and AI credits" 
                  : "Need more? Upgrade your plan for additional features"}
              </p>
              <Button asChild>
                <Link href="/pricing">
                  <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Credits */}
      <Card className={cn("border-border/60", isLowCredits && "border-amber-300 dark:border-amber-700")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Credits
              </CardTitle>
              <CardDescription>Credits are used for AI-powered features like journey generation and suggestions</CardDescription>
            </div>
            {isLowCredits && (
              <Badge variant="outline" className="border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                Low Balance
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold">{creditsRemaining}</p>
                  <p className="text-sm text-muted-foreground">credits remaining</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{credits.used} used of {credits.total + credits.purchased}</p>
                  {credits.purchased > 0 && (
                    <p className="text-xs">({credits.purchased} purchased)</p>
                  )}
                </div>
              </div>
              
              <Progress 
                value={creditsPercentUsed} 
                className={cn("h-2", isLowCredits && "[&>div]:bg-amber-500")} 
              />
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Need more credits?</p>
                  <p className="text-xs text-muted-foreground">Top up anytime, credits never expire</p>
                </div>
                <Button onClick={() => setTopUpOpen(true)}>
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Top Up Credits
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Payment Method */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                VISA
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/2027</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Invoice History</CardTitle>
          <CardDescription>Download past invoices for your records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Invoice</th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Description</th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 text-right text-xs font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-sm font-medium text-foreground">{inv.id}</td>
                    <td className="py-2.5 text-sm text-muted-foreground">{inv.date}</td>
                    <td className="py-2.5 text-sm text-muted-foreground hidden sm:table-cell">{inv.description}</td>
                    <td className="py-2.5 text-sm text-foreground">{inv.amount}</td>
                    <td className="py-2.5">
                      <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 capitalize">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Top Up AI Credits
            </DialogTitle>
            <DialogDescription>
              Choose a credit package. Credits never expire and can be used for AI-powered features.
            </DialogDescription>
          </DialogHeader>
          
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="gap-3 py-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all",
                  selectedPackage === pkg.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-border hover:border-muted-foreground/50"
                )}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={pkg.id} id={pkg.id} />
                  <div>
                    <Label htmlFor={pkg.id} className="font-semibold text-foreground cursor-pointer">
                      {pkg.credits.toLocaleString()} Credits
                      {pkg.popular && (
                        <Badge className="ml-2 text-[10px] bg-primary/10 text-primary border-0">Popular</Badge>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ${pkg.perCredit.toFixed(3)} per credit
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${pkg.price}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTopUpOpen(false)} disabled={purchasing}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseCredits} disabled={purchasing}>
              {purchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Purchase for ${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.price}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
