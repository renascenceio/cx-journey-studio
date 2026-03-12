"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Check, ChevronsUpDown, Clock, MapPin } from "lucide-react"
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

// Common timezones grouped by region
const TIMEZONE_GROUPS: { region: string; timezones: { value: string; label: string; offset: string }[] }[] = [
  {
    region: "Americas",
    timezones: [
      { value: "America/New_York", label: "New York", offset: "EST/EDT" },
      { value: "America/Chicago", label: "Chicago", offset: "CST/CDT" },
      { value: "America/Denver", label: "Denver", offset: "MST/MDT" },
      { value: "America/Los_Angeles", label: "Los Angeles", offset: "PST/PDT" },
      { value: "America/Anchorage", label: "Anchorage", offset: "AKST/AKDT" },
      { value: "America/Toronto", label: "Toronto", offset: "EST/EDT" },
      { value: "America/Vancouver", label: "Vancouver", offset: "PST/PDT" },
      { value: "America/Mexico_City", label: "Mexico City", offset: "CST" },
      { value: "America/Sao_Paulo", label: "São Paulo", offset: "BRT" },
      { value: "America/Buenos_Aires", label: "Buenos Aires", offset: "ART" },
      { value: "America/Lima", label: "Lima", offset: "PET" },
      { value: "America/Bogota", label: "Bogota", offset: "COT" },
    ],
  },
  {
    region: "Europe",
    timezones: [
      { value: "Europe/London", label: "London", offset: "GMT/BST" },
      { value: "Europe/Dublin", label: "Dublin", offset: "GMT/IST" },
      { value: "Europe/Paris", label: "Paris", offset: "CET/CEST" },
      { value: "Europe/Berlin", label: "Berlin", offset: "CET/CEST" },
      { value: "Europe/Amsterdam", label: "Amsterdam", offset: "CET/CEST" },
      { value: "Europe/Brussels", label: "Brussels", offset: "CET/CEST" },
      { value: "Europe/Madrid", label: "Madrid", offset: "CET/CEST" },
      { value: "Europe/Rome", label: "Rome", offset: "CET/CEST" },
      { value: "Europe/Zurich", label: "Zurich", offset: "CET/CEST" },
      { value: "Europe/Stockholm", label: "Stockholm", offset: "CET/CEST" },
      { value: "Europe/Warsaw", label: "Warsaw", offset: "CET/CEST" },
      { value: "Europe/Moscow", label: "Moscow", offset: "MSK" },
      { value: "Europe/Istanbul", label: "Istanbul", offset: "TRT" },
      { value: "Europe/Athens", label: "Athens", offset: "EET/EEST" },
    ],
  },
  {
    region: "Middle East",
    timezones: [
      { value: "Asia/Dubai", label: "Dubai", offset: "GST" },
      { value: "Asia/Riyadh", label: "Riyadh", offset: "AST" },
      { value: "Asia/Jerusalem", label: "Jerusalem", offset: "IST/IDT" },
      { value: "Asia/Tehran", label: "Tehran", offset: "IRST" },
      { value: "Asia/Kuwait", label: "Kuwait", offset: "AST" },
      { value: "Asia/Bahrain", label: "Bahrain", offset: "AST" },
      { value: "Asia/Qatar", label: "Qatar", offset: "AST" },
    ],
  },
  {
    region: "Asia & Pacific",
    timezones: [
      { value: "Asia/Kolkata", label: "Mumbai/Delhi", offset: "IST" },
      { value: "Asia/Karachi", label: "Karachi", offset: "PKT" },
      { value: "Asia/Dhaka", label: "Dhaka", offset: "BST" },
      { value: "Asia/Bangkok", label: "Bangkok", offset: "ICT" },
      { value: "Asia/Singapore", label: "Singapore", offset: "SGT" },
      { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "HKT" },
      { value: "Asia/Shanghai", label: "Shanghai", offset: "CST" },
      { value: "Asia/Tokyo", label: "Tokyo", offset: "JST" },
      { value: "Asia/Seoul", label: "Seoul", offset: "KST" },
      { value: "Asia/Manila", label: "Manila", offset: "PHT" },
      { value: "Asia/Jakarta", label: "Jakarta", offset: "WIB" },
      { value: "Australia/Sydney", label: "Sydney", offset: "AEST/AEDT" },
      { value: "Australia/Melbourne", label: "Melbourne", offset: "AEST/AEDT" },
      { value: "Australia/Perth", label: "Perth", offset: "AWST" },
      { value: "Pacific/Auckland", label: "Auckland", offset: "NZST/NZDT" },
      { value: "Pacific/Fiji", label: "Fiji", offset: "FJT" },
      { value: "Pacific/Honolulu", label: "Honolulu", offset: "HST" },
    ],
  },
  {
    region: "Africa",
    timezones: [
      { value: "Africa/Cairo", label: "Cairo", offset: "EET" },
      { value: "Africa/Johannesburg", label: "Johannesburg", offset: "SAST" },
      { value: "Africa/Lagos", label: "Lagos", offset: "WAT" },
      { value: "Africa/Nairobi", label: "Nairobi", offset: "EAT" },
      { value: "Africa/Casablanca", label: "Casablanca", offset: "WET" },
    ],
  },
]

// Flatten all timezones for searching
const ALL_TIMEZONES = TIMEZONE_GROUPS.flatMap((g) => g.timezones)

// Get current UTC offset for a timezone
function getUtcOffset(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    })
    const parts = formatter.formatToParts(now)
    const offsetPart = parts.find((p) => p.type === "timeZoneName")
    return offsetPart?.value || ""
  } catch {
    return ""
  }
}

// Auto-detect user's timezone
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

interface TimezonePickerProps {
  value?: string
  onChange: (timezone: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showAutoDetect?: boolean
}

export function TimezonePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  showAutoDetect = true,
}: TimezonePickerProps) {
  const t = useTranslations("settings")
  const [open, setOpen] = useState(false)
  const [currentOffset, setCurrentOffset] = useState("")

  // Calculate current offset for selected timezone
  useEffect(() => {
    if (value) {
      setCurrentOffset(getUtcOffset(value))
    }
  }, [value])

  const selectedTimezone = useMemo(() => {
    if (!value) return null
    return ALL_TIMEZONES.find((tz) => tz.value === value) || {
      value,
      label: value.split("/").pop()?.replace(/_/g, " ") || value,
      offset: "",
    }
  }, [value])

  const handleAutoDetect = () => {
    const detected = detectTimezone()
    onChange(detected)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between h-9 text-sm font-normal", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 truncate">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {selectedTimezone ? (
              <>
                <span className="truncate">{selectedTimezone.label}</span>
                {currentOffset && (
                  <span className="text-muted-foreground text-xs">({currentOffset})</span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder || t("selectTimezone")}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("searchTimezones")} />
          <CommandList>
            <CommandEmpty>{t("noTimezoneFound")}</CommandEmpty>
            
            {showAutoDetect && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleAutoDetect}
                  className="flex items-center gap-2 text-primary"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {t("detectTimezone")}
                </CommandItem>
              </CommandGroup>
            )}

            {TIMEZONE_GROUPS.map((group) => (
              <CommandGroup key={group.region} heading={group.region}>
                {group.timezones.map((tz) => (
                  <CommandItem
                    key={tz.value}
                    value={`${tz.label} ${tz.value} ${tz.offset}`}
                    onSelect={() => {
                      onChange(tz.value)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          value === tz.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tz.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{tz.offset}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Hook for using timezone in components
export function useTimezone() {
  const [timezone, setTimezone] = useState<string>("")

  useEffect(() => {
    // Try to get from localStorage first, then auto-detect
    const saved = localStorage.getItem("user_timezone")
    if (saved) {
      setTimezone(saved)
    } else {
      const detected = detectTimezone()
      setTimezone(detected)
    }
  }, [])

  const saveTimezone = (tz: string) => {
    setTimezone(tz)
    localStorage.setItem("user_timezone", tz)
  }

  return { timezone, setTimezone: saveTimezone, detectTimezone }
}

// Format a date in the user's timezone
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    ...options,
  }).format(d)
}
