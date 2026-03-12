import { createClient } from "@/lib/supabase/server"

// Service definitions for modular architecture
export interface ServiceStatus {
  name: string
  status: "healthy" | "degraded" | "unhealthy" | "unknown"
  latency?: number
  lastChecked: string
  error?: string
  details?: Record<string, unknown>
}

export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy"
  services: ServiceStatus[]
  timestamp: string
}

// Circuit breaker state management
interface CircuitState {
  failures: number
  lastFailure: number
  isOpen: boolean
  openedAt?: number
}

const circuitStates = new Map<string, CircuitState>()

const CIRCUIT_BREAKER_THRESHOLD = 5 // failures before opening
const CIRCUIT_BREAKER_TIMEOUT = 30000 // 30 seconds before retry

function getCircuitState(serviceName: string): CircuitState {
  if (!circuitStates.has(serviceName)) {
    circuitStates.set(serviceName, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    })
  }
  return circuitStates.get(serviceName)!
}

function recordFailure(serviceName: string): void {
  const state = getCircuitState(serviceName)
  state.failures++
  state.lastFailure = Date.now()
  
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.isOpen = true
    state.openedAt = Date.now()
  }
}

function recordSuccess(serviceName: string): void {
  const state = getCircuitState(serviceName)
  state.failures = 0
  state.isOpen = false
  state.openedAt = undefined
}

function isCircuitOpen(serviceName: string): boolean {
  const state = getCircuitState(serviceName)
  
  if (!state.isOpen) return false
  
  // Check if timeout has passed - allow retry
  if (state.openedAt && Date.now() - state.openedAt > CIRCUIT_BREAKER_TIMEOUT) {
    // Half-open state - allow one request through
    return false
  }
  
  return true
}

// Service health check functions
async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("profiles").select("id").limit(1)
    
    if (error) throw error
    
    return {
      name: "Database (Supabase)",
      status: "healthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name: "Database (Supabase)",
      status: "unhealthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function checkAIServiceHealth(): Promise<ServiceStatus> {
  const start = Date.now()
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY || !!process.env.AI_GATEWAY_API_KEY
  
  if (!hasApiKey) {
    return {
      name: "AI Service (Anthropic/Gateway)",
      status: "unknown",
      lastChecked: new Date().toISOString(),
      error: "No API key configured",
    }
  }
  
  // Check circuit breaker
  if (isCircuitOpen("ai-service")) {
    return {
      name: "AI Service (Anthropic/Gateway)",
      status: "degraded",
      lastChecked: new Date().toISOString(),
      error: "Circuit breaker open - too many failures",
    }
  }
  
  return {
    name: "AI Service (Anthropic/Gateway)",
    status: "healthy",
    latency: Date.now() - start,
    lastChecked: new Date().toISOString(),
    details: { provider: process.env.ANTHROPIC_API_KEY ? "Anthropic" : "AI Gateway" },
  }
}

async function checkStorageHealth(): Promise<ServiceStatus> {
  const start = Date.now()
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
  
  return {
    name: "Blob Storage (Vercel)",
    status: hasToken ? "healthy" : "unknown",
    latency: Date.now() - start,
    lastChecked: new Date().toISOString(),
    error: hasToken ? undefined : "No storage token configured",
  }
}

async function checkPaymentHealth(): Promise<ServiceStatus> {
  const start = Date.now()
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
  
  if (!hasStripeKey) {
    return {
      name: "Payments (Stripe)",
      status: "unknown",
      lastChecked: new Date().toISOString(),
      error: "Stripe not configured",
    }
  }
  
  // Check circuit breaker
  if (isCircuitOpen("stripe")) {
    return {
      name: "Payments (Stripe)",
      status: "degraded",
      lastChecked: new Date().toISOString(),
      error: "Circuit breaker open - too many failures",
    }
  }
  
  return {
    name: "Payments (Stripe)",
    status: "healthy",
    latency: Date.now() - start,
    lastChecked: new Date().toISOString(),
  }
}

async function checkAuthHealth(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    // Test auth service by checking session capability
    const { error } = await supabase.auth.getSession()
    
    if (error) throw error
    
    return {
      name: "Authentication (Supabase Auth)",
      status: "healthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name: "Authentication (Supabase Auth)",
      status: "unhealthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Module-specific health checks
async function checkJourneysEngine(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("journeys").select("id").limit(1)
    
    return {
      name: "Journeys Engine",
      status: error ? "degraded" : "healthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error?.message,
    }
  } catch (error) {
    return {
      name: "Journeys Engine",
      status: "unhealthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function checkArchetypesEngine(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("archetypes").select("id").limit(1)
    
    return {
      name: "Archetypes Engine",
      status: error ? "degraded" : "healthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error?.message,
    }
  } catch (error) {
    return {
      name: "Archetypes Engine",
      status: "unhealthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function checkSolutionsEngine(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("solutions").select("id").limit(1)
    
    return {
      name: "Solutions Engine",
      status: error ? "degraded" : "healthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error?.message,
    }
  } catch (error) {
    return {
      name: "Solutions Engine",
      status: "unhealthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function checkRoadmapEngine(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("roadmap_initiatives").select("id").limit(1)
    
    return {
      name: "Roadmap Engine",
      status: error ? "degraded" : "healthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error?.message,
    }
  } catch (error) {
    return {
      name: "Roadmap Engine",
      status: "unhealthy",
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Main health check function
export async function checkSystemHealth(): Promise<SystemHealth> {
  const services = await Promise.all([
    checkDatabaseHealth(),
    checkAuthHealth(),
    checkAIServiceHealth(),
    checkPaymentHealth(),
    checkStorageHealth(),
    checkJourneysEngine(),
    checkArchetypesEngine(),
    checkSolutionsEngine(),
    checkRoadmapEngine(),
  ])
  
  // Determine overall health
  const unhealthyCount = services.filter(s => s.status === "unhealthy").length
  const degradedCount = services.filter(s => s.status === "degraded").length
  
  let overall: "healthy" | "degraded" | "unhealthy" = "healthy"
  if (unhealthyCount > 0) {
    overall = unhealthyCount >= 3 ? "unhealthy" : "degraded"
  } else if (degradedCount > 0) {
    overall = "degraded"
  }
  
  return {
    overall,
    services,
    timestamp: new Date().toISOString(),
  }
}

// Wrapper for external API calls with circuit breaker
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  if (isCircuitOpen(serviceName)) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error(`Service ${serviceName} is currently unavailable (circuit open)`)
  }
  
  try {
    const result = await operation()
    recordSuccess(serviceName)
    return result
  } catch (error) {
    recordFailure(serviceName)
    if (fallback !== undefined) {
      return fallback
    }
    throw error
  }
}
