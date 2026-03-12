"use server"

// Default privileged domains (can be extended via admin settings)
const DEFAULT_PRIVILEGED_DOMAINS = [
  "renascence.io",
  "renascence.ae",
  "renascence.com",
]

// Cache for privileged domains (loaded from database or config)
let cachedDomains: string[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 60 * 1000 // 1 minute cache

/**
 * Get the list of privileged domains
 * These domains have special rights like AI badge suppression
 */
export async function getPrivilegedDomains(): Promise<string[]> {
  const now = Date.now()
  
  // Return cached if valid
  if (cachedDomains && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedDomains
  }
  
  try {
    // Try to load from environment or config
    const envDomains = process.env.PRIVILEGED_DOMAINS
    if (envDomains) {
      cachedDomains = [
        ...DEFAULT_PRIVILEGED_DOMAINS,
        ...envDomains.split(",").map(d => d.trim().toLowerCase()).filter(Boolean)
      ]
    } else {
      cachedDomains = DEFAULT_PRIVILEGED_DOMAINS
    }
    
    cacheTimestamp = now
    return cachedDomains
  } catch {
    return DEFAULT_PRIVILEGED_DOMAINS
  }
}

/**
 * Check if a user email domain is privileged
 * @param email - User email address
 * @returns true if the domain is privileged
 */
export async function isPrivilegedDomain(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return false
  
  const privilegedDomains = await getPrivilegedDomains()
  return privilegedDomains.some(pd => domain === pd || domain.endsWith(`.${pd}`))
}

/**
 * Check if AI badge should be shown for a user
 * Returns false if user is from privileged domain
 * @param email - User email address
 * @param assetHasBadgeOverride - Optional per-asset override (PRO feature B8)
 */
export async function shouldShowAIBadge(
  email: string | null | undefined,
  assetHasBadgeOverride?: boolean
): Promise<boolean> {
  // Per-asset override takes precedence (PRO feature)
  if (assetHasBadgeOverride === false) {
    return false
  }
  
  // Check privileged domain
  const isPrivileged = await isPrivilegedDomain(email)
  if (isPrivileged) {
    return false
  }
  
  // Default: show AI badge
  return true
}

/**
 * Get domain from email
 */
export function getEmailDomain(email: string | null | undefined): string | null {
  if (!email) return null
  return email.split("@")[1]?.toLowerCase() || null
}
