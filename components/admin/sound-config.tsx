"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Volume2, 
  VolumeX, 
  Play, 
  CheckCircle, 
  Bell, 
  MousePointerClick, 
  AlertTriangle, 
  Sparkles,
  RefreshCw,
  Navigation,
  Wind
} from "lucide-react"
import { SOUND_LIBRARY, playSound, type SoundCategory } from "@/lib/sound-library"
import { toast } from "sonner"

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  notification: <Bell className="h-4 w-4 text-blue-500" />,
  action: <MousePointerClick className="h-4 w-4 text-purple-500" />,
  alert: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  ai: <Sparkles className="h-4 w-4 text-indigo-500" />,
  navigation: <Navigation className="h-4 w-4 text-cyan-500" />,
  ambient: <Wind className="h-4 w-4 text-teal-500" />,
}

export interface SoundConfig {
  enabled: boolean
  globalVolume: number
  categories: {
    [key: string]: {
      enabled: boolean
      volume: number
      soundId: string
    }
  }
  eventOverrides?: Record<string, string>
}

const DEFAULT_CONFIG: SoundConfig = {
  enabled: true,
  globalVolume: 0.5,
  categories: {
    success: { enabled: true, volume: 0.5, soundId: "chime-1" },
    notification: { enabled: true, volume: 0.6, soundId: "notify-1" },
    action: { enabled: false, volume: 0.3, soundId: "click-1" },
    alert: { enabled: true, volume: 0.7, soundId: "alert-1" },
    ai: { enabled: true, volume: 0.5, soundId: "ai-1" },
    navigation: { enabled: false, volume: 0.3, soundId: "nav-1" },
    ambient: { enabled: false, volume: 0.2, soundId: "ambient-1" },
  },
  eventOverrides: {},
}

interface SoundConfigProps {
  config: SoundConfig | null
  onSave: (config: SoundConfig) => Promise<void>
  saving?: boolean
}

export function SoundConfigCard({ config, onSave, saving }: SoundConfigProps) {
  const [localConfig, setLocalConfig] = useState<SoundConfig>(config || DEFAULT_CONFIG)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (config) {
      setLocalConfig({
        ...DEFAULT_CONFIG,
        ...config,
        categories: {
          ...DEFAULT_CONFIG.categories,
          ...config.categories,
        },
      })
    }
  }, [config])

  const updateConfig = (updates: Partial<SoundConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }))
    setHasChanges(true)
  }

  const updateCategory = (categoryId: string, updates: Partial<{ enabled: boolean; volume: number; soundId: string }>) => {
    setLocalConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryId]: {
          ...prev.categories[categoryId],
          ...updates,
        },
      },
    }))
    setHasChanges(true)
  }

  const previewSound = (categoryId: string, soundId?: string) => {
    const id = soundId || localConfig.categories[categoryId]?.soundId
    if (!id || id === "none") return
    
    const volume = localConfig.globalVolume * (localConfig.categories[categoryId]?.volume || 0.5)
    playSound(categoryId, id, volume)
  }

  const handleSave = async () => {
    await onSave(localConfig)
    setHasChanges(false)
  }

  const resetToDefaults = () => {
    setLocalConfig(DEFAULT_CONFIG)
    setHasChanges(true)
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-cyan-500" />
            <CardTitle className="text-base">Sound Configuration</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="text-xs"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Reset
            </Button>
            {hasChanges && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Sounds"}
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Configure sounds for different events in the application</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Global Controls */}
        <div className="flex flex-col gap-4 rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localConfig.enabled ? (
                <Volume2 className="h-5 w-5 text-foreground" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Enable Sounds</p>
                <p className="text-xs text-muted-foreground">Master toggle for all application sounds</p>
              </div>
            </div>
            <Switch
              checked={localConfig.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
          
          {localConfig.enabled && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Global Volume</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(localConfig.globalVolume * 100)}%</span>
                </div>
                <Slider
                  value={[localConfig.globalVolume]}
                  onValueChange={([v]) => updateConfig({ globalVolume: v })}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* Category Settings */}
        {localConfig.enabled && (
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-medium text-foreground">Sound Categories</h4>
            
            {SOUND_LIBRARY.map((category) => (
              <CategoryConfig
                key={category.id}
                category={category}
                config={localConfig.categories[category.id] || DEFAULT_CONFIG.categories[category.id]}
                globalVolume={localConfig.globalVolume}
                icon={CATEGORY_ICONS[category.id]}
                onUpdate={(updates) => updateCategory(category.id, updates)}
                onPlay={(soundId) => previewSound(category.id, soundId)}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Note: Users can also adjust their personal sound preferences in their settings. 
          These defaults apply to new users and serve as the baseline configuration.
        </p>
      </CardContent>
    </Card>
  )
}

interface CategoryConfigProps {
  category: SoundCategory
  config: { enabled: boolean; volume: number; soundId: string }
  globalVolume: number
  icon: React.ReactNode
  onUpdate: (updates: Partial<{ enabled: boolean; volume: number; soundId: string }>) => void
  onPlay: (soundId?: string) => void
}

function CategoryConfig({ category, config, globalVolume, icon, onUpdate, onPlay }: CategoryConfigProps) {
  return (
    <div className="rounded-lg border border-border/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{category.name}</p>
              <Switch
                checked={config.enabled}
                onCheckedChange={(enabled) => onUpdate({ enabled })}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
          </div>
        </div>
      </div>
      
      {config.enabled && (
        <div className="mt-4 flex flex-col gap-3 pl-7">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Sound</Label>
              <Select
                value={config.soundId}
                onValueChange={(soundId) => onUpdate({ soundId })}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {category.sounds.map((sound) => (
                    <SelectItem key={sound.id} value={sound.id} className="text-xs">
                      {sound.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 h-8"
              onClick={() => onPlay()}
              disabled={config.soundId === "none"}
            >
              <Play className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Category Volume</Label>
              <span className="text-xs text-muted-foreground">
                {Math.round(config.volume * 100)}% (Effective: {Math.round(config.volume * globalVolume * 100)}%)
              </span>
            </div>
            <Slider
              value={[config.volume]}
              onValueChange={([v]) => onUpdate({ volume: v })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
