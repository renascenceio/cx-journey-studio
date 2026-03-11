// v6 - Singleton Supabase browser client with lock disabled
// Uses @supabase/ssr for cookie-based auth compatible with server middleware
import { createBrowserClient } from "@supabase/ssr"

// Single instance created at module load time
let instance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (instance) return instance
  
  instance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disable browser lock to prevent LockManager timeout issues
        // See: https://github.com/supabase/supabase-js/issues/936
        lock: (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn(),
      },
    }
  )
  
  return instance
}

// For backwards compatibility with createClient naming convention
export { getSupabaseClient as createClient }
