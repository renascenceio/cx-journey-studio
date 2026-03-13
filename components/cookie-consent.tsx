"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { X, Cookie, Settings2, ChevronDown, ChevronUp } from "lucide-react"

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const COOKIE_CONSENT_KEY = "cookie-consent"

// Static translations - cookie consent needs to work even outside i18n context
const translations = {
  title: "Cookie Preferences",
  description: "We use cookies to enhance your experience.",
  explanation: "We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking 'Accept All', you agree to this use. Click 'Manage Preferences' to customize your choices.",
  necessary: "Strictly Necessary",
  necessaryDesc: "Required for the website to function. Cannot be disabled.",
  analytics: "Analytics",
  analyticsDesc: "Help us understand how visitors interact with our website.",
  functional: "Functional",
  functionalDesc: "Enable enhanced functionality and personalization.",
  marketing: "Marketing",
  marketingDesc: "Used to track visitors across websites for advertising purposes.",
  managePreferences: "Manage Preferences",
  learnMore: "Learn more",
  savePreferences: "Save Preferences",
  rejectAll: "Reject All",
  acceptAll: "Accept All",
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: true,  // Default ON
    marketing: true,  // Default ON
    functional: true, // Default ON
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
      <Card className="mx-auto max-w-xl border border-border/80 bg-background shadow-xl">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cookie className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {translations.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {translations.explanation}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 -mt-1 -mr-1"
              onClick={acceptNecessary}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              {/* Necessary */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="necessary" className="text-xs font-medium">
                    {translations.necessary}
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {translations.necessaryDesc}
                  </p>
                </div>
                <Switch id="necessary" checked disabled className="shrink-0" />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="analytics" className="text-xs font-medium">
                    {translations.analytics}
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {translations.analyticsDesc}
                  </p>
                </div>
                <Switch 
                  id="analytics" 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                  className="shrink-0"
                />
              </div>

              {/* Functional */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="functional" className="text-xs font-medium">
                    {translations.functional}
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {translations.functionalDesc}
                  </p>
                </div>
                <Switch 
                  id="functional" 
                  checked={preferences.functional}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, functional: checked }))}
                  className="shrink-0"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="marketing" className="text-xs font-medium">
                    {translations.marketing}
                  </Label>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {translations.marketingDesc}
                  </p>
                </div>
                <Switch 
                  id="marketing" 
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                  className="shrink-0"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>{showSettings ? "Hide" : "Manage"}</span>
                {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <Link 
                href="/cookies" 
                className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                {translations.learnMore}
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              {showSettings ? (
                <Button size="sm" className="h-8 px-4 text-xs" onClick={saveCustom}>
                  {translations.savePreferences}
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={acceptNecessary}>
                    {translations.rejectAll}
                  </Button>
                  <Button size="sm" className="h-8 px-4 text-xs" onClick={acceptAll}>
                    {translations.acceptAll}
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
