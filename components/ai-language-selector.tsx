"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Check, ChevronsUpDown, Globe, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

// Supported languages for AI generation
export const AI_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", direction: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", direction: "ltr" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", direction: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", direction: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", direction: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", direction: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", direction: "rtl" },
  { code: "pl", name: "Polish", nativeName: "Polski", direction: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", direction: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr" },
  { code: "th", name: "Thai", nativeName: "ไทย", direction: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", direction: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", direction: "ltr" },
] as const

export type AILanguageCode = typeof AI_LANGUAGES[number]["code"]

// Unicode ranges for script detection
const SCRIPT_RANGES = {
  // Arabic script (Arabic, Persian, Urdu)
  arabic: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
  // Chinese (CJK Unified Ideographs)
  chinese: /[\u4E00-\u9FFF\u3400-\u4DBF]/,
  // Japanese (Hiragana, Katakana)
  japanese: /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/,
  // Korean (Hangul)
  korean: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
  // Cyrillic (Russian, Ukrainian)
  cyrillic: /[\u0400-\u04FF\u0500-\u052F]/,
  // Hebrew
  hebrew: /[\u0590-\u05FF]/,
  // Thai
  thai: /[\u0E00-\u0E7F]/,
  // Hindi/Devanagari
  devanagari: /[\u0900-\u097F]/,
  // Greek
  greek: /[\u0370-\u03FF]/,
  // Vietnamese (Latin with diacritics - detect via specific characters)
  vietnamese: /[ăâđêôơưĂÂĐÊÔƠƯ]/,
}

/**
 * Detect the likely language from text based on script/character analysis
 * Returns the ISO 639-1 language code or null if undetermined
 */
export function detectLanguageFromText(text: string): AILanguageCode | null {
  if (!text || text.trim().length === 0) return null

  // Count characters matching each script
  const scriptCounts: Record<string, number> = {}
  
  for (const [script, regex] of Object.entries(SCRIPT_RANGES)) {
    const matches = text.match(new RegExp(regex, "g"))
    scriptCounts[script] = matches?.length || 0
  }

  // Find the dominant non-Latin script
  const dominantScript = Object.entries(scriptCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0]

  if (!dominantScript || dominantScript[1] === 0) {
    // Check for Vietnamese specifically (Latin-based but with unique diacritics)
    if (SCRIPT_RANGES.vietnamese.test(text)) {
      return "vi"
    }
    // Default to null (will use user's profile language)
    return null
  }

  // Map script to language
  switch (dominantScript[0]) {
    case "arabic":
      // Could be Arabic, Persian, or Urdu - default to Arabic
      return "ar"
    case "chinese":
      // Could be Simplified or Traditional - default to Simplified
      return "zh"
    case "japanese":
      return "ja"
    case "korean":
      return "ko"
    case "cyrillic":
      // Could be Russian, Ukrainian, etc. - default to Russian
      return "ru"
    case "hebrew":
      return "ar" // Hebrew not in our list, use Arabic as closest RTL
    case "thai":
      return "th"
    case "devanagari":
      return "hi"
    case "greek":
      return "en" // Greek not in our list, default to English
    default:
      return null
  }
}

/**
 * Get the user's preferred AI language from profile or browser
 */
export function getUserPreferredLanguage(): AILanguageCode {
  // Check localStorage for saved preference
  const saved = typeof window !== "undefined" 
    ? localStorage.getItem("ai_preferred_language") 
    : null
  if (saved && AI_LANGUAGES.some(l => l.code === saved)) {
    return saved as AILanguageCode
  }
  
  // Check browser language
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language.split("-")[0]
    if (AI_LANGUAGES.some(l => l.code === browserLang)) {
      return browserLang as AILanguageCode
    }
  }
  
  return "en"
}

interface AILanguageSelectorProps {
  value: AILanguageCode
  onChange: (language: AILanguageCode) => void
  assetName?: string // Optional asset name for auto-detection
  className?: string
  disabled?: boolean
  showDetectedBadge?: boolean
}

export function AILanguageSelector({
  value,
  onChange,
  assetName,
  className,
  disabled,
  showDetectedBadge = true,
}: AILanguageSelectorProps) {
  const t = useTranslations("ai")
  const [open, setOpen] = useState(false)
  const [detectedLanguage, setDetectedLanguage] = useState<AILanguageCode | null>(null)

  // Auto-detect language from asset name
  useEffect(() => {
    if (assetName) {
      const detected = detectLanguageFromText(assetName)
      setDetectedLanguage(detected)
      
      // Auto-select if detected and different from current
      if (detected && detected !== value) {
        onChange(detected)
      }
    } else {
      setDetectedLanguage(null)
    }
  }, [assetName]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLanguage = useMemo(() => {
    return AI_LANGUAGES.find(l => l.code === value)
  }, [value])

  const isDetected = detectedLanguage && detectedLanguage === value

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between h-9 text-sm font-normal min-w-[180px]"
            disabled={disabled}
          >
            <span className="flex items-center gap-2 truncate">
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {selectedLanguage ? (
                <>
                  <span>{selectedLanguage.name}</span>
                  <span className="text-muted-foreground text-xs">({selectedLanguage.nativeName})</span>
                </>
              ) : (
                <span className="text-muted-foreground">{t("selectLanguage")}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t("searchLanguages")} />
            <CommandList>
              <CommandEmpty>{t("noLanguageFound")}</CommandEmpty>
              <CommandGroup>
                {AI_LANGUAGES.map((lang) => (
                  <CommandItem
                    key={lang.code}
                    value={`${lang.name} ${lang.nativeName} ${lang.code}`}
                    onSelect={() => {
                      onChange(lang.code)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          value === lang.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{lang.name}</span>
                      <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
                    </span>
                    {lang.direction === "rtl" && (
                      <span className="text-[10px] text-muted-foreground">RTL</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {showDetectedBadge && isDetected && (
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Sparkles className="h-3 w-3" />
          {t("autoDetected")}
        </Badge>
      )}
    </div>
  )
}

/**
 * Hook for managing AI generation language
 */
export function useAILanguage(assetName?: string) {
  const [language, setLanguage] = useState<AILanguageCode>(() => getUserPreferredLanguage())

  useEffect(() => {
    if (assetName) {
      const detected = detectLanguageFromText(assetName)
      if (detected) {
        setLanguage(detected)
      }
    }
  }, [assetName])

  const savePreference = (lang: AILanguageCode) => {
    setLanguage(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("ai_preferred_language", lang)
    }
  }

  const getPromptPrefix = () => {
    const langInfo = AI_LANGUAGES.find(l => l.code === language)
    if (!langInfo || language === "en") return ""
    return `Generate the following content in ${langInfo.name}. `
  }

  return {
    language,
    setLanguage: savePreference,
    getPromptPrefix,
    isRTL: AI_LANGUAGES.find(l => l.code === language)?.direction === "rtl",
  }
}
