"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Fingerprint,
  Sparkles,
  Upload,
  LayoutTemplate,
  Copy,
  GitFork,
  Search,
  Download,
  RefreshCw,
  Shield,
  Map,
  Users,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface LineageRecord {
  id: string
  content_uuid: string
  parent_uuid: string | null
  original_creator_email: string
  original_created_at: string
  source_type: "original" | "ai_generated" | "imported" | "template" | "duplicated"
  lineage_depth: number
  asset_type: string
  asset_title: string
}

interface LineageStats {
  total: number
  bySourceType: Record<string, number>
  byAssetType: Record<string, number>
  aiGenerated: number
  derivatives: number
}

const sourceConfig: Record<string, { label: string; icon: typeof Fingerprint; color: string }> = {
  original: { label: "Original", icon: Fingerprint, color: "text-blue-600" },
  ai_generated: { label: "AI Generated", icon: Sparkles, color: "text-violet-600" },
  imported: { label: "Imported", icon: Upload, color: "text-amber-600" },
  template: { label: "From Template", icon: LayoutTemplate, color: "text-emerald-600" },
  duplicated: { label: "Duplicated", icon: Copy, color: "text-gray-600" },
}

const assetTypeIcons: Record<string, typeof Map> = {
  journey: Map,
  archetype: Users,
  solution: Lightbulb,
}

export default function AdminLineagePage() {
  const [records, setRecords] = useState<LineageRecord[]>([])
  const [stats, setStats] = useState<LineageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [assetFilter, setAssetFilter] = useState<string>("all")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/lineage")
      if (res.ok) {
        const data = await res.json()
        setRecords(data.records || [])
        setStats(data.stats || null)
      } else {
        toast.error("Failed to load lineage data")
      }
    } catch {
      toast.error("Failed to load lineage data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = records.filter((r) => {
    const matchesSearch =
      !search ||
      r.asset_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.original_creator_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.content_uuid.toLowerCase().includes(search.toLowerCase())
    const matchesSource = sourceFilter === "all" || r.source_type === sourceFilter
    const matchesAsset = assetFilter === "all" || r.asset_type === assetFilter
    return matchesSearch && matchesSource && matchesAsset
  })

  const handleExportCsv = () => {
    const headers = ["Content UUID", "Asset Type", "Asset Title", "Source Type", "Original Creator", "Created At", "Lineage Depth"]
    const rows = filtered.map((r) => [
      r.content_uuid,
      r.asset_type,
      r.asset_title,
      r.source_type,
      r.original_creator_email,
      r.original_created_at,
      r.lineage_depth.toString(),
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c || ""}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lineage-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Exported CSV")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Asset Lineage</h1>
          <p className="text-sm text-muted-foreground">Track content provenance and IP attribution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Assets Tracked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">With lineage metadata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-500" />
                AI Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.aiGenerated.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? Math.round((stats.aiGenerated / stats.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <GitFork className="h-4 w-4 text-primary" />
                Derivatives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.derivatives.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Copied or forked assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" />
                IP Protected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">With attribution chain</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lineage Records</CardTitle>
          <CardDescription>Browse and search asset provenance history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, creator, or UUID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(sourceConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="journey">Journeys</SelectItem>
                <SelectItem value="archetype">Archetypes</SelectItem>
                <SelectItem value="solution">Solutions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Original Creator</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Lineage</TableHead>
                  <TableHead>UUID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <RefreshCw className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No lineage records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(0, 50).map((record) => {
                    const source = sourceConfig[record.source_type] || sourceConfig.original
                    const SourceIcon = source.icon
                    const AssetIcon = assetTypeIcons[record.asset_type] || Map

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AssetIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{record.asset_title || "Untitled"}</p>
                              <p className="text-xs text-muted-foreground capitalize">{record.asset_type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-normal">
                            <SourceIcon className={cn("h-3 w-3", source.color)} />
                            {source.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{record.original_creator_email || "Unknown"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(record.original_created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.lineage_depth > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <GitFork className="h-3 w-3" />
                              Depth {record.lineage_depth}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Original</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] text-muted-foreground font-mono">
                            {record.content_uuid.slice(0, 8)}...
                          </code>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing 50 of {filtered.length} records. Export CSV for full data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
