"use client"

// v2 - Fixed: removed useTranslations, added debug logging
import { useLocale } from "next-intl"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Globe, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { locales, languageNames, type Locale } from "@/lib/i18n/config"
import { setLocale } from "@/lib/i18n/actions"
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
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleLocaleChange(newLocale: Locale) {
    console.log("[v0] Language change requested:", newLocale)
    startTransition(async () => {
      console.log("[v0] Setting locale to:", newLocale)
      const result = await setLocale(newLocale)
      console.log("[v0] setLocale result:", result)
      router.refresh()
      console.log("[v0] Router refresh called")
    })
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
          {showLabel && <span>{languageNames[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={cn(
              "cursor-pointer",
              loc === locale && "bg-accent font-medium"
            )}
          >
            <span className="mr-2">{languageNames[loc]}</span>
            {loc === locale && (
              <span className="ml-auto text-xs text-muted-foreground">
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
