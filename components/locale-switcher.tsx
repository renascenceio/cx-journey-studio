"use client"

// v4 - Complete rewrite, no useTranslations, pure client-side
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [currentLocale, setCurrentLocale] = useState<Locale>("en")
  const [isPending, setIsPending] = useState(false)

  // Read locale from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(";")
    const localeCookie = cookies.find((c) => c.trim().startsWith(LOCALE_COOKIE + "="))
    if (localeCookie) {
      const value = localeCookie.split("=")[1] as Locale
      if (locales.includes(value)) {
        setCurrentLocale(value)
      }
    }
  }, [])

  async function handleLocaleChange(newLocale: Locale) {
    if (newLocale === currentLocale) return
    
    setIsPending(true)
    
    // Set cookie directly on client
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    setCurrentLocale(newLocale)
    
    // Full page reload to apply new locale
    window.location.reload()
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
      <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={cn(
              "cursor-pointer",
              loc === currentLocale && "bg-accent font-medium"
            )}
          >
            <span className="mr-2">{languageNames[loc]}</span>
            {loc === currentLocale && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
