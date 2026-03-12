// v3 - Load translations from Blob storage (production) or filesystem (dev)
import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { locales, defaultLocale, type Locale, LOCALE_COOKIE } from '@/lib/i18n/config'
import { list } from '@vercel/blob'

// Use Blob storage for production when token is available
const USE_BLOB = process.env.BLOB_READ_WRITE_TOKEN ? true : false

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

// Load messages from Blob storage or fall back to static files
async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (USE_BLOB) {
    try {
      // Try to fetch from Blob storage first (custom admin translations)
      const blobPrefix = `translations/${locale}.json`
      const { blobs } = await list({ prefix: blobPrefix, limit: 1 })
      
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url, { 
          next: { revalidate: 60 } // Cache for 60 seconds
        })
        if (response.ok) {
          return await response.json()
        }
      }
    } catch (error) {
      console.warn(`[i18n] Failed to load ${locale} from Blob, falling back to static:`, error)
    }
  }
  
  // Fall back to static JSON files
  return (await import(`@/messages/${locale}.json`)).default
}

export default getRequestConfig(async () => {
  const locale = await getLocale()
  const messages = await loadMessages(locale)
  
  return {
    locale,
    messages,
    timeZone: 'UTC',
  }
})
