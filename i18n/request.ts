import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { locales, defaultLocale, type Locale, LOCALE_COOKIE } from '@/lib/i18n/config'

// Get locale from request (cookies, headers, or default)
async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  
  // 1. Check cookie for saved preference
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }
  
  // 2. Check Accept-Language header from browser
  const acceptLanguage = headerStore.get('accept-language')
  if (acceptLanguage) {
    // Parse Accept-Language header and find first match
    const browserLocales = acceptLanguage
      .split(',')
      .map(lang => {
        const [code] = lang.trim().split(';')
        // Handle both "en" and "en-US" formats
        return code.split('-')[0].toLowerCase()
      })
    
    for (const browserLocale of browserLocales) {
      if (locales.includes(browserLocale as Locale)) {
        return browserLocale as Locale
      }
    }
  }
  
  // 3. Fall back to default
  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await getLocale()
  
  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
    timeZone: 'UTC',
  }
})
