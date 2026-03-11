"use client"

import { useTranslations } from "next-intl"
import { useSounds, type SoundPreferences, preloadCommonSounds } from "@/hooks/use-sounds"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  MousePointer,
  Play,
} from "lucide-react"
import { useEffect } from "react"

const categoryInfo: Record<keyof SoundPreferences["categories"], { 
  labelKey: string
  descKey: string
  icon: typeof Volume2
  testSound: Parameters<ReturnType<typeof useSounds>["play"]>[0]
}> = {
  success: {
    labelKey: "sounds.success",
    descKey: "sounds.successDesc",
    icon: CheckCircle,
    testSound: "success",
  },
  notification: {
    labelKey: "sounds.notification",
    descKey: "sounds.notificationDesc",
    icon: Bell,
    testSound: "notification",
  },
  action: {
    labelKey: "sounds.action",
    descKey: "sounds.actionDesc",
    icon: MousePointer,
    testSound: "click",
  },
  alert: {
    labelKey: "sounds.alert",
    descKey: "sounds.alertDesc",
    icon: AlertCircle,
    testSound: "error",
  },
  ai: {
    labelKey: "sounds.ai",
    descKey: "sounds.aiDesc",
    icon: Sparkles,
    testSound: "ai-complete",
  },
}

export function SoundSettings() {
  const t = useTranslations()
  const { 
    play, 
    preferences, 
    isLoaded, 
    toggleSounds, 
    toggleCategory, 
    setVolume,
  } = useSounds()

  // Preload sounds on mount
  useEffect(() => {
    preloadCommonSounds()
  }, [])

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            {t("sounds.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {preferences.enabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
          {t("sounds.title")}
        </CardTitle>
        <CardDescription>
          {t("sounds.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">{t("sounds.enableSounds")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("sounds.enableSoundsDesc")}
            </p>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={toggleSounds}
          />
        </div>

        {/* Volume slider */}
        {preferences.enabled && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t("sounds.volume")}</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(preferences.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[preferences.volume * 100]}
              onValueChange={([value]) => setVolume(value / 100)}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Category toggles */}
        {preferences.enabled && (
          <div className="space-y-4 pt-4 border-t border-border">
            <Label className="text-sm font-medium text-muted-foreground">{t("sounds.categories")}</Label>
            {(Object.keys(categoryInfo) as Array<keyof typeof categoryInfo>).map((category) => {
              const info = categoryInfo[category]
              const IconComponent = info.icon
              return (
                <div key={category} className="flex items-start gap-4 py-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t(info.labelKey)}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => play(info.testSound)}
                          disabled={!preferences.categories[category]}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {t("sounds.test")}
                        </Button>
                        <Switch
                          checked={preferences.categories[category]}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(info.descKey)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sound Events Reference */}
        {preferences.enabled && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-sm font-medium text-muted-foreground">When Sounds Play</Label>
            <div className="grid gap-2 text-xs">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Success Sounds
                </div>
                <ul className="space-y-1 text-muted-foreground ml-5">
                  <li>Journey created successfully</li>
                  <li>Archetype added or generated</li>
                  <li>Solution applied to pain point</li>
                  <li>Stage added to journey</li>
                  <li>Save or export completed</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-blue-500" />
                  Notification Sounds
                </div>
                <ul className="space-y-1 text-muted-foreground ml-5">
                  <li>New comment received</li>
                  <li>Mentioned in a comment</li>
                  <li>Collaborator joined journey</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  AI Sounds
                </div>
                <ul className="space-y-1 text-muted-foreground ml-5">
                  <li>AI generation started</li>
                  <li>AI generation completed</li>
                  <li>Archetype AI suggestions ready</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="font-medium text-foreground flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  Alert Sounds
                </div>
                <ul className="space-y-1 text-muted-foreground ml-5">
                  <li>Error occurred</li>
                  <li>Validation failed</li>
                  <li>Delete action confirmed</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility note */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>
            {t("sounds.accessibilityNote")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
