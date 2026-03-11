// Supported locales configuration
export const locales = ['en', 'zh', 'es', 'hi', 'pt', 'ru', 'fr', 'ar', 'tr', 'vi', 'ja', 'ko'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

// RTL languages
export const rtlLocales: Locale[] = ['ar']

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}

// Language display names (in their native script)
export const languageNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  pt: 'Português',
  ru: 'Русский',
  fr: 'Français',
  ar: 'العربية',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  ja: '日本語',
  ko: '한국어',
}

// Language flags/icons (using country codes for common flag emoji mappings)
export const languageFlags: Record<Locale, string> = {
  en: '🇬🇧',
  zh: '🇨🇳',
  es: '🇪🇸',
  hi: '🇮🇳',
  pt: '🇧🇷',
  ru: '🇷🇺',
  fr: '🇫🇷',
  ar: '🇸🇦',
  tr: '🇹🇷',
  vi: '🇻🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
}

// Cookie name for storing locale preference
export const LOCALE_COOKIE = 'NEXT_LOCALE'
