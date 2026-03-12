"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Zap, Database, Shield, CreditCard, HardDrive, Map, Users, Lightbulb, Route } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServiceStatus {
  name: string
  status: "healthy" | "degraded" | "unhealthy" | "unknown"
  latency?: number
  lastChecked: string
  error?: string
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy"
  services: ServiceStatus[]
  timestamp: string
}

const serviceIcons: Record<string, React.ElementType> = {
  "Database (Supabase)": Database,
  "Authentication (Supabase Auth)": Shield,
  "AI Service (Anthropic/Gateway)": Zap,
  "Payments (Stripe)": CreditCard,
  "Blob Storage (Vercel)": HardDrive,
  "Journeys Engine": Route,
  "Archetypes Engine": Users,
  "Solutions Engine": Lightbulb,
  "Roadmap Engine": Map,
}

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    badge: "bg-green-500/20 text-green-700 dark:text-green-400",
    label: "Healthy",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    badge: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    label: "Degraded",
  },
  unhealthy: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    badge: "bg-red-500/20 text-red-700 dark:text-red-400",
    label: "Unhealthy",
  },
  unknown: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted",
    badge: "bg-muted text-muted-foreground",
    label: "Unknown",
  },
}

export default function SystemStatusPage() {
  const t = useTranslations("admin")
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  async function fetchHealth() {
    try {
      const res = await fetch("/api/health")
      const data = await res.json()
      setHealth(data)
      setLastRefresh(new Date())
    } catch {
      setHealth({
        overall: "unhealthy",
        services: [],
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  function handleRefresh() {
    setRefreshing(true)
    fetchHealth()
  }

  const overallConfig = health ? statusConfig[health.overall] : statusConfig.unknown
  const OverallIcon = overallConfig.icon

  // Group services by category
  const coreServices = health?.services.filter(s => 
    ["Database (Supabase)", "Authentication (Supabase Auth)", "AI Service (Anthropic/Gateway)", "Payments (Stripe)", "Blob Storage (Vercel)"].includes(s.name)
  ) || []
  
  const moduleServices = health?.services.filter(s => 
    ["Journeys Engine", "Archetypes Engine", "Solutions Engine", "Roadmap Engine"].includes(s.name)
  ) || []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("systemStatus")}</h1>
          <p className="text-sm text-muted-foreground">{t("systemStatusDesc")}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={cn("border-2", overallConfig.bg)}>
        <CardContent className="flex items-center gap-4 py-6">
          {loading ? (
            <Skeleton className="h-12 w-12 rounded-full" />
          ) : (
            <div className={cn("p-3 rounded-full", overallConfig.bg)}>
              <OverallIcon className={cn("h-6 w-6", overallConfig.color)} />
            </div>
          )}
          <div className="flex-1">
            {loading ? (
              <>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">
                  {t("overallStatus")}: <span className={overallConfig.color}>{overallConfig.label}</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {health?.services.filter(s => s.status === "healthy").length || 0} of {health?.services.length || 0} services healthy
                </p>
              </>
            )}
          </div>
          {!loading && (
            <Badge className={overallConfig.badge}>
              {overallConfig.label}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Core Infrastructure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("coreInfrastructure")}</CardTitle>
          </div>
          <CardDescription>{t("coreInfrastructureDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : (
              coreServices.map((service) => {
                const config = statusConfig[service.status]
                const StatusIcon = config.icon
                const ServiceIcon = serviceIcons[service.name] || Activity
                
                return (
                  <div key={service.name} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <ServiceIcon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{service.name}</span>
                        <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {service.latency !== undefined && (
                          <span>{service.latency}ms</span>
                        )}
                        {service.error && (
                          <span className="text-red-500 truncate">{service.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("applicationModules")}</CardTitle>
          </div>
          <CardDescription>{t("applicationModulesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : (
              moduleServices.map((service) => {
                const config = statusConfig[service.status]
                const StatusIcon = config.icon
                const ServiceIcon = serviceIcons[service.name] || Activity
                
                return (
                  <div key={service.name} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <ServiceIcon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{service.name.replace(" Engine", "")}</span>
                        <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {service.latency !== undefined ? `${service.latency}ms` : service.status}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("serviceDetails")}</CardTitle>
          <CardDescription>{t("serviceDetailsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Service</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Latency</th>
                  <th className="p-3 text-left font-medium">Last Checked</th>
                  <th className="p-3 text-left font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))
                ) : (
                  health?.services.map((service) => {
                    const config = statusConfig[service.status]
                    return (
                      <tr key={service.name} className="border-b last:border-0">
                        <td className="p-3 font-medium">{service.name}</td>
                        <td className="p-3">
                          <Badge className={config.badge}>{config.label}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {service.latency !== undefined ? `${service.latency}ms` : "-"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(service.lastChecked).toLocaleTimeString()}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">
                          {service.error || "-"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
