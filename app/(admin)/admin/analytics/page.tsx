"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users, Map, Sparkles, TrendingUp, Activity, Globe,
  Download, RefreshCw, Building2, FileText, Layers, Clock
} from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  dateRange: { start: string; end: string; range: string }
  users: {
    total: number
    newInPeriod: number
    activeInPeriod: number
    byPlan: Record<string, number>
    byType?: Record<string, number>
    growthRate: number
  }
  teams?: {
    totalWorkspaces: number
    avgTeamSize: number
    teamSizeDistribution: {
      solo: number
      small: number
      medium: number
      large: number
    }
  }
  content: {
    journeys: {
      total: number
      newInPeriod: number
      byType: Record<string, number>
      public: number
      private: number
    }
    archetypes: number
    solutions: number
    stages: number
    steps: number
    touchpoints: number
  }
  engagement: {
    aiGenerations: number
    aiGeneratedContent: number
    avgJourneyDepth: number
  }
  platform: {
    workspaces: number
    templates: number
  }
  trends: {
    signups: Array<{ date: string; count: number }>
    journeys: Array<{ date: string; count: number }>
  }
}

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
]

// Colors for charts (not using CSS variables per guidelines)
const CHART_COLORS = {
  primary: "#2563eb",
  secondary: "#8b5cf6",
  success: "#22c55e",
  warning: "#f59e0b",
  muted: "#94a3b8",
}

const PLAN_COLORS: Record<string, string> = {
  free: CHART_COLORS.muted,
  starter: CHART_COLORS.primary,
  pro: CHART_COLORS.secondary,
  enterprise: CHART_COLORS.success,
}

const USER_TYPE_COLORS: Record<string, string> = {
  cx_professional: "#2563eb",
  product_manager: "#8b5cf6",
  ux_designer: "#ec4899",
  business_analyst: "#f59e0b",
  marketer: "#22c55e",
  researcher: "#06b6d4",
  other: "#94a3b8",
  unknown: "#64748b",
}

const TEAM_SIZE_COLORS: Record<string, string> = {
  solo: "#94a3b8",
  small: "#22c55e",
  medium: "#2563eb",
  large: "#8b5cf6",
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  async function fetchAnalytics() {
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchAnalytics()
  }, [range])

  function handleRefresh() {
    setRefreshing(true)
    fetchAnalytics()
  }

  function handleExport(format: "csv" | "json") {
    if (!data) return
    
    const content = format === "json" 
      ? JSON.stringify(data, null, 2)
      : convertToCSV(data)
    
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${range}-${new Date().toISOString().split("T")[0]}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  function convertToCSV(analyticsData: AnalyticsData): string {
    const lines = [
      "Metric,Value",
      `Total Users,${analyticsData.users.total}`,
      `New Users (${range}),${analyticsData.users.newInPeriod}`,
      `Active Users (${range}),${analyticsData.users.activeInPeriod}`,
      `User Growth Rate,${analyticsData.users.growthRate}%`,
      `Total Journeys,${analyticsData.content.journeys.total}`,
      `New Journeys (${range}),${analyticsData.content.journeys.newInPeriod}`,
      `Total Archetypes,${analyticsData.content.archetypes}`,
      `Total Solutions,${analyticsData.content.solutions}`,
      `AI Generations (${range}),${analyticsData.engagement.aiGenerations}`,
      `Workspaces,${analyticsData.platform.workspaces}`,
      `Templates,${analyticsData.platform.templates}`,
    ]
    return lines.join("\n")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load analytics data</p>
          <Button variant="outline" className="mt-4" onClick={handleRefresh}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const planData = Object.entries(data.users.byPlan).map(([plan, count]) => ({
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    value: count,
    fill: PLAN_COLORS[plan] || CHART_COLORS.muted
  }))

  const journeyTypeData = Object.entries(data.content.journeys.byType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform metrics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{data.users.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{data.users.newInPeriod} this period
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {data.users.growthRate > 0 && (
              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{data.users.growthRate}%
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Journeys</p>
                <p className="text-3xl font-bold">{data.content.journeys.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{data.content.journeys.newInPeriod} this period
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Map className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Generations</p>
                <p className="text-3xl font-bold">{data.engagement.aiGenerations.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.engagement.aiGeneratedContent} AI-generated items
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Sparkles className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{data.users.activeInPeriod.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((data.users.activeInPeriod / data.users.total) * 100)}% of total
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Signups Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Signups</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends.signups} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        className="text-xs"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        className="text-xs" 
                        domain={[0, 'auto']}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                              <p className="text-sm font-medium">{payload[0].value} signups</p>
                            </div>
                          )
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={CHART_COLORS.primary} 
                        strokeWidth={2}
                        dot={{ r: 4, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Journeys Created Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Journeys Created</CardTitle>
                <CardDescription>New journey creations over time</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trends.journeys} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        className="text-xs"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        className="text-xs" 
                        domain={[0, 'auto']}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                              <p className="text-sm font-medium">{payload[0].value} journeys</p>
                            </div>
                          )
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={CHART_COLORS.secondary} 
                        strokeWidth={2}
                        dot={{ r: 4, fill: CHART_COLORS.secondary, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Users by Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users by Plan</CardTitle>
                <CardDescription>Distribution of users across subscription tiers</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                      >
                        {planData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Total Registered</span>
                  <span className="font-bold">{data.users.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Active in Period</span>
                  <span className="font-bold">{data.users.activeInPeriod.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">New in Period</span>
                  <span className="font-bold text-green-600">+{data.users.newInPeriod.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Activation Rate</span>
                  <span className="font-bold">
                    {Math.round((data.users.activeInPeriod / data.users.total) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Second row: Users by Type and Team Sizes */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Users by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users by Type</CardTitle>
                <CardDescription>Distribution by user profession/role</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {data.users.byType && Object.keys(data.users.byType).length > 0 ? (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={Object.entries(data.users.byType).map(([name, value]) => ({
                          name: name.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
                          value,
                          fill: USER_TYPE_COLORS[name] || CHART_COLORS.muted
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {Object.entries(data.users.byType).map(([name], index) => (
                            <Cell key={index} fill={USER_TYPE_COLORS[name] || CHART_COLORS.muted} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No user type data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Sizes / Workspaces */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Sizes</CardTitle>
                <CardDescription>Workspace distribution by team size</CardDescription>
              </CardHeader>
              <CardContent>
                {data.teams ? (
                  <div className="space-y-4">
                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{data.teams.totalWorkspaces}</p>
                        <p className="text-xs text-muted-foreground">Total Workspaces</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{data.teams.avgTeamSize}</p>
                        <p className="text-xs text-muted-foreground">Avg Team Size</p>
                      </div>
                    </div>
                    
                    {/* Size distribution */}
                    <div className="h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: "Solo (1)", value: data.teams.teamSizeDistribution.solo, fill: TEAM_SIZE_COLORS.solo },
                            { name: "Small (2-5)", value: data.teams.teamSizeDistribution.small, fill: TEAM_SIZE_COLORS.small },
                            { name: "Medium (6-15)", value: data.teams.teamSizeDistribution.medium, fill: TEAM_SIZE_COLORS.medium },
                            { name: "Large (15+)", value: data.teams.teamSizeDistribution.large, fill: TEAM_SIZE_COLORS.large },
                          ]}
                          margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9 }} allowDecimals={false} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {[TEAM_SIZE_COLORS.solo, TEAM_SIZE_COLORS.small, TEAM_SIZE_COLORS.medium, TEAM_SIZE_COLORS.large].map((color, index) => (
                              <Cell key={index} fill={color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                    No team data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Journeys by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Journeys by Type</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={journeyTypeData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Content Depth */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Journeys</span>
                  </div>
                  <span className="font-bold">{data.content.journeys.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Stages</span>
                  </div>
                  <span className="font-bold">{data.content.stages.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Touchpoints</span>
                  </div>
                  <span className="font-bold">{data.content.touchpoints.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Archetypes</span>
                  </div>
                  <span className="font-bold">{data.content.archetypes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Solutions</span>
                  </div>
                  <span className="font-bold">{data.content.solutions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.platform.workspaces}</p>
                    <p className="text-xs text-muted-foreground">Workspaces</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.platform.templates}</p>
                    <p className="text-xs text-muted-foreground">Templates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                    <Globe className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.content.journeys.public}</p>
                    <p className="text-xs text-muted-foreground">Public Journeys</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-primary">{data.engagement.avgJourneyDepth}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Stages / Journey</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-primary">
                    {data.content.journeys.total ? Math.round(data.content.touchpoints / data.content.journeys.total) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Touchpoints / Journey</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-primary">
                    {Math.round((data.content.journeys.public / (data.content.journeys.total || 1)) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Public Visibility</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <p className="text-3xl font-bold text-primary">
                    {data.content.touchpoints ? Math.round((data.engagement.aiGeneratedContent / data.content.touchpoints) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">AI-Generated Content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
