"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Link2, Link2Off, Mail, Loader2, CheckCircle2 } from "lucide-react"
import { 
  getLinkedIdentities, 
  linkOAuthProvider, 
  unlinkOAuthProvider,
  type OAuthProvider
} from "@/lib/oauth"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Identity {
  id: string
  provider: string
  created_at: string
  identity_data?: {
    email?: string
    name?: string
    avatar_url?: string
  }
}

const providerConfig: Record<string, { name: string; color: string; icon: React.ReactNode }> = {
  email: {
    name: "Email",
    color: "bg-muted",
    icon: <Mail className="h-4 w-4" />,
  },
  google: {
    name: "Google",
    color: "bg-[#4285F4]/10 text-[#4285F4]",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  azure: {
    name: "Microsoft",
    color: "bg-[#00A4EF]/10 text-[#00A4EF]",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
      </svg>
    ),
  },
}

export function LinkedAccounts() {
  const t = useTranslations("auth")
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState<OAuthProvider | null>(null)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState<Identity | null>(null)

  async function fetchIdentities() {
    try {
      const data = await getLinkedIdentities()
      setIdentities(data as Identity[])
    } catch {
      // Silent fail - user may not be logged in
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIdentities()
  }, [])

  async function handleLink(provider: OAuthProvider) {
    setLinking(provider)
    try {
      await linkOAuthProvider(provider)
      // Will redirect to OAuth provider
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to link ${provider}`)
      setLinking(null)
    }
  }

  async function handleUnlink() {
    if (!confirmUnlink) return
    
    // Don't allow unlinking if it's the only auth method
    if (identities.length <= 1) {
      toast.error(t("cannotUnlinkLast"))
      setConfirmUnlink(null)
      return
    }

    setUnlinkingId(confirmUnlink.id)
    try {
      await unlinkOAuthProvider(confirmUnlink.id)
      toast.success(t("providerUnlinked"))
      await fetchIdentities()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("unlinkFailed"))
    } finally {
      setUnlinkingId(null)
      setConfirmUnlink(null)
    }
  }

  const linkedProviders = identities.map(i => i.provider)
  const availableProviders: OAuthProvider[] = (["google", "azure"] as OAuthProvider[]).filter(
    p => !linkedProviders.includes(p)
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            {t("linkedAccounts")}
          </CardTitle>
          <CardDescription>{t("linkedAccountsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Linked providers */}
          {identities.map((identity) => {
            const config = providerConfig[identity.provider] || providerConfig.email
            return (
              <div 
                key={identity.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.color)}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{config.name}</span>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                        {t("connected")}
                      </Badge>
                    </div>
                    {identity.identity_data?.email && (
                      <p className="text-xs text-muted-foreground">
                        {identity.identity_data.email}
                      </p>
                    )}
                  </div>
                </div>
                {identities.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmUnlink(identity)}
                    disabled={unlinkingId === identity.id}
                  >
                    {unlinkingId === identity.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2Off className="h-4 w-4" />
                    )}
                    <span className="sr-only">{t("disconnect")}</span>
                  </Button>
                )}
              </div>
            )
          })}

          {/* Available providers to link */}
          {availableProviders.length > 0 && (
            <>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">{t("connectMore")}</p>
              </div>
              {availableProviders.map((provider) => {
                const config = providerConfig[provider]
                return (
                  <Button
                    key={provider}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleLink(provider)}
                    disabled={linking !== null}
                  >
                    {linking === provider ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <span className="mr-2">{config.icon}</span>
                    )}
                    {t("connectWith", { provider: config.name })}
                  </Button>
                )
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* Unlink confirmation dialog */}
      <AlertDialog open={!!confirmUnlink} onOpenChange={() => setConfirmUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unlinkConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unlinkConfirmDesc", { 
                provider: confirmUnlink ? providerConfig[confirmUnlink.provider]?.name : "" 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink}>
              {t("disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
