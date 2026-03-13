"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  TrendingUp, 
  Search, 
  Plus, 
  Sparkles, 
  Calendar, 
  ExternalLink,
  BarChart3,
  Globe,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Send,
  Eye,
  Trash2,
  Edit3,
  Filter,
  LayoutGrid,
  List,
  ArrowUpRight,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

// Categories for trends
const TREND_CATEGORIES = [
  "Customer Experience",
  "Digital Transformation",
  "AI & Automation",
  "Personalization",
  "Omnichannel",
  "Employee Experience",
  "Sustainability",
  "Voice of Customer",
  "Self-Service",
  "Data & Analytics"
]

interface Trend {
  id: string
  title: string
  description: string
  impact_score: number
  proof: string
  source: string
  source_url?: string
  categories: string[]
  is_ai_generated: boolean
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TrendsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedTrends, setSelectedTrends] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState("")
  
  const [newTrend, setNewTrend] = useState({
    title: "",
    description: "",
    impact_score: 7,
    proof: "",
    source: "",
    source_url: "",
    categories: [] as string[]
  })

  // Fetch trends
  const { data: trends = [], isLoading } = useSWR<Trend[]>("/api/admin/trends", fetcher)

  // Filter trends
  const filteredTrends = useMemo(() => {
    return trends.filter(trend => {
      const matchesSearch = !searchQuery || 
        trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = filterCategory === "all" || 
        trend.categories.includes(filterCategory)
      
      const matchesStatus = filterStatus === "all" ||
        (filterStatus === "published" && trend.is_published) ||
        (filterStatus === "draft" && !trend.is_published) ||
        (filterStatus === "ai" && trend.is_ai_generated)
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [trends, searchQuery, filterCategory, filterStatus])

  // Select all visible
  const selectAll = () => {
    if (selectedTrends.length === filteredTrends.length) {
      setSelectedTrends([])
    } else {
      setSelectedTrends(filteredTrends.map(t => t.id))
    }
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedTrends(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Create new trend
  const handleCreateTrend = async () => {
    try {
      const res = await fetch("/api/admin/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrend)
      })
      
      if (!res.ok) throw new Error("Failed to create trend")
      
      toast.success("Trend created successfully")
      mutate("/api/admin/trends")
      setShowAddDialog(false)
      setNewTrend({
        title: "",
        description: "",
        impact_score: 7,
        proof: "",
        source: "",
        source_url: "",
        categories: []
      })
    } catch (error) {
      toast.error("Failed to create trend")
    }
  }

  // Generate trends with AI
  const handleGenerateTrends = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/admin/trends/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatePrompt })
      })
      
      if (!res.ok) throw new Error("Failed to generate trends")
      
      const data = await res.json()
      toast.success(`Generated ${data.count} new trends`)
      mutate("/api/admin/trends")
      setShowGenerateDialog(false)
      setGeneratePrompt("")
    } catch (error) {
      toast.error("Failed to generate trends")
    } finally {
      setGenerating(false)
    }
  }

  // Publish selected trends to solutions
  const handlePublishToSolutions = async () => {
    if (selectedTrends.length === 0) return
    
    setPublishing(true)
    try {
      const res = await fetch("/api/admin/trends/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendIds: selectedTrends })
      })
      
      if (!res.ok) throw new Error("Failed to publish trends")
      
      toast.success(`Published ${selectedTrends.length} trends to Solutions`)
      mutate("/api/admin/trends")
      setSelectedTrends([])
    } catch (error) {
      toast.error("Failed to publish trends")
    } finally {
      setPublishing(false)
    }
  }

  // Delete selected trends
  const handleDeleteSelected = async () => {
    if (selectedTrends.length === 0) return
    
    try {
      const res = await fetch("/api/admin/trends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedTrends })
      })
      
      if (!res.ok) throw new Error("Failed to delete trends")
      
      toast.success(`Deleted ${selectedTrends.length} trends`)
      mutate("/api/admin/trends")
      setSelectedTrends([])
    } catch (error) {
      toast.error("Failed to delete trends")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CX Trends</h1>
          <p className="text-muted-foreground">
            AI-generated and curated customer experience trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Trends with AI</DialogTitle>
                <DialogDescription>
                  Describe the type of CX trends you want to generate, or leave blank for general trends.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Prompt (optional)</Label>
                  <Textarea
                    placeholder="e.g., 'Latest trends in AI-powered customer service for retail industry'"
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateTrends} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Trends
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Trend
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Trend</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Trend title"
                    value={newTrend.title}
                    onChange={(e) => setNewTrend({ ...newTrend, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the trend and its essence"
                    value={newTrend.description}
                    onChange={(e) => setNewTrend({ ...newTrend, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Impact Score (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={newTrend.impact_score}
                      onChange={(e) => setNewTrend({ ...newTrend, impact_score: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      placeholder="e.g., Gartner, Forrester"
                      value={newTrend.source}
                      onChange={(e) => setNewTrend({ ...newTrend, source: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Proof / Impact Measurement</Label>
                  <Textarea
                    placeholder="Numeric measurement or evidence of the trend's impact"
                    value={newTrend.proof}
                    onChange={(e) => setNewTrend({ ...newTrend, proof: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source URL (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={newTrend.source_url}
                    onChange={(e) => setNewTrend({ ...newTrend, source_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {TREND_CATEGORIES.map(cat => (
                      <Badge
                        key={cat}
                        variant={newTrend.categories.includes(cat) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setNewTrend(prev => ({
                            ...prev,
                            categories: prev.categories.includes(cat)
                              ? prev.categories.filter(c => c !== cat)
                              : [...prev.categories, cat]
                          }))
                        }}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateTrend} disabled={!newTrend.title}>Create Trend</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TREND_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ai">AI Generated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(viewMode === "grid" && "bg-muted")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(viewMode === "list" && "bg-muted")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTrends.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Checkbox
            checked={selectedTrends.length === filteredTrends.length}
            onCheckedChange={selectAll}
          />
          <span className="text-sm font-medium">{selectedTrends.length} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" onClick={handlePublishToSolutions} disabled={publishing}>
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish to Solutions
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeleteSelected}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trends</p>
                <p className="text-2xl font-bold">{trends.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{trends.filter(t => t.is_published).length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Generated</p>
                <p className="text-2xl font-bold">{trends.filter(t => t.is_ai_generated).length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-violet-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Impact</p>
                <p className="text-2xl font-bold">
                  {trends.length > 0 
                    ? (trends.reduce((sum, t) => sum + t.impact_score, 0) / trends.length).toFixed(1)
                    : "0"
                  }
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTrends.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No trends found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search" : "Generate or add your first trend"}
            </p>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Trends with AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === "grid" 
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
            : "space-y-3"
        )}>
          {filteredTrends.map(trend => (
            <Card 
              key={trend.id} 
              className={cn(
                "group transition-all hover:shadow-md",
                selectedTrends.includes(trend.id) && "ring-2 ring-primary"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTrends.includes(trend.id)}
                      onCheckedChange={() => toggleSelect(trend.id)}
                    />
                    <div className="flex items-center gap-1.5">
                      {trend.is_ai_generated && (
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      )}
                      {trend.is_published && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Published
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base leading-tight mt-2">
                  {trend.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {trend.description}
                </p>
                
                {/* Impact Score */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Impact:</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        trend.impact_score >= 8 ? "bg-emerald-500" :
                        trend.impact_score >= 5 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${trend.impact_score * 10}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{trend.impact_score}/10</span>
                </div>

                {/* Proof */}
                {trend.proof && (
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      <span className="font-medium">Proof:</span> {trend.proof}
                    </p>
                  </div>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {trend.categories.slice(0, 3).map(cat => (
                    <Badge key={cat} variant="secondary" className="text-[10px]">
                      {cat}
                    </Badge>
                  ))}
                  {trend.categories.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{trend.categories.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {trend.source || "Unknown"}
                  </div>
                  {trend.source_url && (
                    <a 
                      href={trend.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      View Source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
