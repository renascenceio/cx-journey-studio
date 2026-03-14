"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  Search, 
  RefreshCw,
  Globe,
  MapPin,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Loader2,
  LayoutGrid,
  List,
  Filter,
  Clock,
  Building2,
  Route,
  Footprints,
  Target,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ArrowRight,
  Layers,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR from "swr"

// Journey element types
type ElementType = "stage" | "step" | "touchpoint" | "pain_point" | "highlight"

const ELEMENT_TYPES: { value: ElementType; label: string; icon: typeof Route; color: string }[] = [
  { value: "stage", label: "Stages", icon: Layers, color: "bg-blue-500" },
  { value: "step", label: "Steps", icon: Footprints, color: "bg-violet-500" },
  { value: "touchpoint", label: "Touchpoints", icon: Target, color: "bg-emerald-500" },
  { value: "pain_point", label: "Pain Points", icon: AlertTriangle, color: "bg-red-500" },
  { value: "highlight", label: "Highlights", icon: Sparkles, color: "bg-amber-500" },
]

// Categories will be extracted dynamically from elements

interface CrowdsourceElement {
  id: string
  type: ElementType
  name: string
  description: string
  frequency: number
  category: string
  geographies: string[]
  journeys_used: number
  organizations_used: number
  first_seen: string
  last_seen: string
  example_context?: string
  sentiment_score?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CrowdsourcePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeType, setActiveType] = useState<ElementType | "all">("all")
  const [filterCategory, setFilterCategory] = useState("All Categories")
  const [sortBy, setSortBy] = useState<"frequency" | "recent" | "sentiment">("frequency")
  const [refreshing, setRefreshing] = useState(false)
  const [selectedElement, setSelectedElement] = useState<CrowdsourceElement | null>(null)

  // Fetch crowdsource data
  const { data, isLoading, mutate } = useSWR<{ 
    elements: CrowdsourceElement[]
    lastAnalyzed: string
    totalJourneys: number
  }>("/api/admin/crowdsource", fetcher)

  const elements = data?.elements || []
  
  // Extract unique categories from elements
  const categories = useMemo(() => {
    const uniqueCategories = new Set(elements.map(el => el.category).filter(Boolean))
    return ["All Categories", ...Array.from(uniqueCategories).sort()]
  }, [elements])
  
  // Filter and sort elements
  const filteredElements = useMemo(() => {
    let filtered = elements.filter(el => {
      const matchesSearch = !searchQuery || 
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = activeType === "all" || el.type === activeType
      
      const matchesCategory = filterCategory === "All Categories" || 
        el.category === filterCategory
      
      return matchesSearch && matchesType && matchesCategory
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "frequency") return b.frequency - a.frequency
      if (sortBy === "recent") return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
      if (sortBy === "sentiment") return (b.sentiment_score || 0) - (a.sentiment_score || 0)
      return 0
    })

    return filtered
  }, [elements, searchQuery, activeType, filterCategory, sortBy])

  // Stats by type
  const statsByType = useMemo(() => {
    const stats: Record<string, number> = { all: elements.length }
    ELEMENT_TYPES.forEach(type => {
      stats[type.value] = elements.filter(el => el.type === type.value).length
    })
    return stats
  }, [elements])

  // Refresh analysis
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch("/api/admin/crowdsource/analyze", { method: "POST" })
      await mutate()
      toast.success("Analysis complete")
    } catch (error) {
      toast.error("Failed to refresh analysis")
    } finally {
      setRefreshing(false)
    }
  }

  const getTypeConfig = (type: ElementType) => 
    ELEMENT_TYPES.find(t => t.value === type) || ELEMENT_TYPES[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Crowdsource Insights</h1>
          <p className="text-muted-foreground">
            Patterns discovered across all customer journeys
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Analysis
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ELEMENT_TYPES.map(type => {
          const Icon = type.icon
          const count = statsByType[type.value] || 0
          return (
            <Card 
              key={type.value}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                activeType === type.value && "ring-2 ring-primary"
              )}
              onClick={() => setActiveType(activeType === type.value ? "all" : type.value)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{type.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={cn("p-2 rounded-lg", type.color, "bg-opacity-10")}>
                    <Icon className={cn("h-5 w-5", type.color.replace("bg-", "text-"))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Last Analysis Info */}
      {data?.lastAnalyzed && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Last analyzed: {new Date(data.lastAnalyzed).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Route className="h-4 w-4" />
            {data.totalJourneys} journeys analyzed
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
{categories.map(cat => (
  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
  ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequency">Most Frequent</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredElements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No insights found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search or filters" 
                : "Run the analysis to discover patterns across journeys"
              }
            </p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analyze Journeys
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === "grid" 
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
            : "space-y-3"
        )}>
          {filteredElements.map(element => {
            const typeConfig = getTypeConfig(element.type)
            const Icon = typeConfig.icon
            
            return (
              <Card 
                key={element.id} 
                className="group transition-all hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      typeConfig.color,
                      "bg-opacity-10"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        typeConfig.color.replace("bg-", "text-")
                      )} />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {typeConfig.label.slice(0, -1)}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-tight mt-2">
                    {element.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {element.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Frequency Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium">{element.frequency} occurrences</span>
                    </div>
                    <Progress value={Math.min(element.frequency, 100)} className="h-1.5" />
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Route className="h-3.5 w-3.5" />
                      {element.journeys_used} journeys
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {element.organizations_used} orgs
                    </div>
                  </div>

                  {/* Geographies */}
                  {element.geographies.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {element.geographies.slice(0, 3).map(geo => (
                        <Badge key={geo} variant="outline" className="text-[10px] px-1.5">
                          {geo}
                        </Badge>
                      ))}
                      {element.geographies.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          +{element.geographies.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Sentiment (for pain points and highlights) */}
                  {element.sentiment_score !== undefined && (
                    <div className="flex items-center gap-2">
                      {element.sentiment_score > 0 ? (
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {element.sentiment_score > 0 ? "Positive" : "Negative"} sentiment
                      </span>
                    </div>
                  )}

                  {/* Example Context */}
                  {element.example_context && (
                    <div className="rounded-md bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="font-medium">Example:</span> {element.example_context}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {element.category}
                    </Badge>
<Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setSelectedElement(element)}
                    >
                      View Details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Element Detail Dialog */}
      <Dialog open={!!selectedElement} onOpenChange={(open) => !open && setSelectedElement(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedElement && (() => {
            const typeConfig = ELEMENT_TYPES.find(t => t.value === selectedElement.type) || ELEMENT_TYPES[0]
            const Icon = typeConfig.icon
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", typeConfig.color, "bg-opacity-20")}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle>{selectedElement.name}</DialogTitle>
                      <DialogDescription>{typeConfig.label.slice(0, -1)} in {selectedElement.category}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedElement.description || "No description available."}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Frequency</p>
                      <p className="text-lg font-semibold">{selectedElement.frequency}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Journeys Used</p>
                      <p className="text-lg font-semibold">{selectedElement.journeys_used}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Organizations</p>
                      <p className="text-lg font-semibold">{selectedElement.organizations_used}</p>
                    </div>
                    {selectedElement.sentiment_score !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sentiment</p>
                        <div className="flex items-center gap-1">
                          {selectedElement.sentiment_score > 0 ? (
                            <ThumbsUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-lg font-semibold">
                            {selectedElement.sentiment_score > 0 ? "Positive" : "Negative"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {selectedElement.geographies && selectedElement.geographies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Geographic Distribution</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedElement.geographies.map((geo: string) => (
                          <Badge key={geo} variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {geo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedElement.example_context && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Example Usage</h4>
                      <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm text-muted-foreground">{selectedElement.example_context}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      First seen: {new Date(selectedElement.first_seen).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Last seen: {new Date(selectedElement.last_seen).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
