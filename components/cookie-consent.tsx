"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { X, Cookie, Settings2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const COOKIE_CONSENT_KEY = "cookie-consent"

export function CookieConsent() {
  const t = useTranslations()
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  })

  useEffect(() => {
    // Check if user has already set preferences
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!savedConsent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    } else {
      try {
        const parsed = JSON.parse(savedConsent)
        setPreferences(parsed)
      } catch {
        // If parsing fails, show banner again
        setShowBanner(true)
      }
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs))
    setShowBanner(false)
    
    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: prefs }))
  }

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    }
    setPreferences(allAccepted)
    savePreferences(allAccepted)
  }

  const acceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    }
    setPreferences(necessaryOnly)
    savePreferences(necessaryOnly)
  }

  const saveCustom = () => {
    savePreferences(preferences)
  }

  if (!showBanner) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-2xl border-border bg-background/95 backdrop-blur-sm shadow-lg">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("cookies.title") || "Cookie Preferences"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("cookies.description") || "We use cookies to enhance your experience."}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={acceptNecessary}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm text-muted-foreground">
            {t("cookies.explanation") || "We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking 'Accept All', you agree to this use. Click 'Manage Preferences' to customize your choices."}
          </p>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              {/* Necessary */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="necessary" className="text-sm font-medium">
                    {t("cookies.necessary") || "Strictly Necessary"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.necessaryDesc") || "Required for the website to function. Cannot be disabled."}
                  </p>
                </div>
                <Switch id="necessary" checked disabled />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="analytics" className="text-sm font-medium">
                    {t("cookies.analytics") || "Analytics"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.analyticsDesc") || "Help us understand how visitors interact with our website."}
                  </p>
                </div>
                <Switch 
                  id="analytics" 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                />
              </div>

              {/* Functional */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="functional" className="text-sm font-medium">
                    {t("cookies.functional") || "Functional"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.functionalDesc") || "Enable enhanced functionality and personalization."}
                  </p>
                </div>
                <Switch 
                  id="functional" 
                  checked={preferences.functional}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, functional: checked }))}
                />
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="marketing" className="text-sm font-medium">
                    {t("cookies.marketing") || "Marketing"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("cookies.marketingDesc") || "Used to track visitors across websites for advertising purposes."}
                  </p>
                </div>
                <Switch 
                  id="marketing" 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings2 className="h-4 w-4" />
                {t("cookies.managePreferences") || "Manage Preferences"}
                {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Link 
                href="/cookies" 
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("cookies.learnMore") || "Learn more"}
              </Link>
            </div>
            
            <div className="flex gap-2">
              {showSettings ? (
                <Button size="sm" onClick={saveCustom}>
                  {t("cookies.savePreferences") || "Save Preferences"}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={acceptNecessary}>
                    {t("cookies.rejectAll") || "Reject All"}
                  </Button>
                  <Button size="sm" onClick={acceptAll}>
                    {t("cookies.acceptAll") || "Accept All"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
