"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Copy, Check, Gift, Users, Coins, Crown, Clock, 
  CheckCircle2, XCircle, HelpCircle, Share2, Link2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PREMIUM_REFERRAL_CAP, STANDARD_REFERRAL_CREDITS, PREMIUM_REFERRAL_CREDITS } from "@/lib/referrals"

interface ReferralStats {
  totalReferrals: number
  pendingReferrals: number
  qualifiedReferrals: number
  creditsEarned: number
  premiumReferralsUsed: number
  premiumReferralsRemaining: number
}

interface Referral {
  id: string
  referee_email: string
  status: string
  is_premium: boolean
  credits_awarded: number
  credits_expires_at: string | null
  created_at: string
}

interface ReferralData {
  referralCode: string
  referralLink: string
  stats: ReferralStats
  referrals: Referral[]
}

export function ReferralDashboard() {
  const t = useTranslations("referral")
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/referrals")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch referral data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function handleCopy() {
    if (!data?.referralLink) return
    navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    toast.success(t("linkCopied"))
    setTimeout(() => setCopied(false), 2000)
  }

  function handleShare() {
    if (!data?.referralLink) return
    if (navigator.share) {
      navigator.share({
        title: t("shareTitle"),
        text: t("shareText"),
        url: data.referralLink
      })
    } else {
      handleCopy()
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "credited":
      case "qualified":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "signed_up":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "pending":
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "credited": return t("status.credited")
      case "qualified": return t("status.qualified")
      case "signed_up": return t("status.signedUp")
      case "pending": return t("status.pending")
      case "rejected": return t("status.rejected")
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("failedToLoad")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t("title")}</CardTitle>
          </div>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={data.referralLink} 
              readOnly 
              className="font-mono text-sm bg-muted/50"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button 
              variant="default" 
              size="icon"
              onClick={handleShare}
              className="shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>{t("standardReward", { credits: STANDARD_REFERRAL_CREDITS })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600">
              <Crown className="h-4 w-4" />
              <span>{t("premiumReward", { credits: PREMIUM_REFERRAL_CREDITS })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">{t("stats.totalReferrals")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.pendingReferrals}</p>
                <p className="text-xs text-muted-foreground">{t("stats.pending")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.creditsEarned}</p>
                <p className="text-xs text-muted-foreground">{t("stats.creditsEarned")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {data.stats.premiumReferralsRemaining}/{PREMIUM_REFERRAL_CAP}
                </p>
                <p className="text-xs text-muted-foreground">{t("stats.premiumRemaining")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("history")}</CardTitle>
          <CardDescription>{t("historyDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.referrals.length === 0 ? (
            <div className="py-8 text-center">
              <Link2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{t("noReferrals")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("noReferralsDesc")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.referrals.map((referral) => (
                <div 
                  key={referral.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    referral.status === "credited" && "bg-green-50/50 border-green-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(referral.status)}
                    <div>
                      <p className="text-sm font-medium">{referral.referee_email}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {referral.is_premium && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        <Crown className="h-3 w-3 mr-1" />
                        {t("premium")}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{getStatusLabel(referral.status)}</Badge>
                    {referral.credits_awarded > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        +{referral.credits_awarded} {t("credits")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">{t("howItWorks")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs shrink-0">1</span>
              {t("step1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs shrink-0">2</span>
              {t("step2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs shrink-0">3</span>
              {t("step3")}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
