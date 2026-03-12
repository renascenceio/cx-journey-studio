"use client"

// v6 - Fixed hydration mismatch by only rendering dropdown on client
import { useState, useEffect } from "react"
import { Globe, Loader2, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { locales, languageNames, type Locale, LOCALE_COOKIE } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
  className?: string
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
  showLabel = false,
  className,
}: LanguageSwitcherProps) {
  const [isPending, setIsPending] = useState(false)
  const [currentLocale, setCurrentLocale] = useState<Locale>("en")
  const [mounted, setMounted] = useState(false)
  
  // Read locale from cookie on mount and mark as mounted
  useEffect(() => {
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=")
      if (key === LOCALE_COOKIE && locales.includes(value as Locale)) {
        setCurrentLocale(value as Locale)
        break
      }
    }
    setMounted(true)
  }, [])

  async function handleLocaleChange(newLocale: Locale) {
    if (newLocale === currentLocale) return
    
    setIsPending(true)
    
    // Set cookie directly
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    setCurrentLocale(newLocale)
    
    // Full page reload to get new translations from server
    window.location.reload()
  }

  // Render a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        disabled
      >
        <Globe className="h-4 w-4" />
        {showLabel && <span>{languageNames.en}</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {showLabel && <span>{languageNames[currentLocale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center justify-between gap-2"
          >
            <span>{languageNames[loc]}</span>
            {loc === currentLocale && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
