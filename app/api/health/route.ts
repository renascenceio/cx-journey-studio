import { NextResponse } from "next/server"
import { checkSystemHealth } from "@/lib/service-health"

// Public health check endpoint for monitoring
export async function GET() {
  try {
    const health = await checkSystemHealth()
    
    // Return appropriate HTTP status based on health
    const status = health.overall === "unhealthy" ? 503 : 200
    
    return NextResponse.json(health, { status })
  } catch (error) {
    return NextResponse.json({
      overall: "unhealthy",
      services: [],
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Health check failed",
    }, { status: 503 })
  }
}
