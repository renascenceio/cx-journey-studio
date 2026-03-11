"use client"

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
  label: string
  description: string
  icon: typeof Volume2
  testSound: Parameters<ReturnType<typeof useSounds>["play"]>[0]
}> = {
  success: {
    label: "Success Sounds",
    description: "Play when actions complete successfully (saving, creating, exporting)",
    icon: CheckCircle,
    testSound: "success",
  },
  notification: {
    label: "Notification Sounds",
    description: "Play for comments, mentions, and collaborator activity",
    icon: Bell,
    testSound: "notification",
  },
  action: {
    label: "Action Sounds",
    description: "Subtle sounds for clicks, tabs, and interactions",
    icon: MousePointer,
    testSound: "click",
  },
  alert: {
    label: "Alert Sounds",
    description: "Play for errors, warnings, and important alerts",
    icon: AlertCircle,
    testSound: "error",
  },
  ai: {
    label: "AI Sounds",
    description: "Play when AI generation starts or completes",
    icon: Sparkles,
    testSound: "ai-complete",
  },
}

export function SoundSettings() {
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
            Sound Settings
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
          Sound Settings
        </CardTitle>
        <CardDescription>
          Configure audio feedback for actions and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Enable Sounds</Label>
            <p className="text-sm text-muted-foreground">
              Play audio feedback throughout the app
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
              <Label className="text-sm font-medium">Volume</Label>
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
            <Label className="text-sm font-medium text-muted-foreground">Sound Categories</Label>
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
                      <Label className="text-sm font-medium">{info.label}</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => play(info.testSound)}
                          disabled={!preferences.categories[category]}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Switch
                          checked={preferences.categories[category]}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
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
            Sounds respect your system&apos;s &quot;Reduce Motion&quot; accessibility setting. 
            When enabled, no sounds will play.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
