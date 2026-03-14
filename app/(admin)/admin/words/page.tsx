"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  PenLine, 
  Search, 
  Plus,
  RefreshCw,
  Sparkles,
  Loader2,
  LayoutGrid,
  List,
  Filter,
  Clock,
  Eye,
  Edit,
  Trash2,
  Globe,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Tag,
  Link as LinkIcon,
  Languages,
  Copy
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR from "swr"

// Available languages on the website
const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
]

const BLOG_CATEGORIES = [
  "Customer Experience",
  "Journey Mapping",
  "CX Strategy",
  "Digital Transformation",
  "Employee Experience",
  "Analytics & Insights",
  "Best Practices",
  "Industry Trends",
  "Case Studies",
  "Product Updates"
]

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image?: string
  category: string
  tags: string[]
  author_name: string
  author_avatar?: string
  status: "draft" | "published" | "scheduled"
  published_at?: string
  scheduled_at?: string
  language: string
  translations?: { [key: string]: string }
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  reading_time?: number
  views: number
  is_ai_generated: boolean
  created_at: string
  updated_at: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminWordsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "scheduled">("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterLanguage, setFilterLanguage] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAIGenerateDialog, setShowAIGenerateDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form states
  const [newPost, setNewPost] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: BLOG_CATEGORIES[0],
    tags: "",
    author_name: "Renascence Team",
    language: "en",
    seo_title: "",
    seo_description: "",
    seo_keywords: ""
  })
  
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLanguages, setAiLanguages] = useState<string[]>(["en"])
  const [aiCategory, setAiCategory] = useState(BLOG_CATEGORIES[0])

  const { data: posts = [], mutate, isLoading } = useSWR<BlogPost[]>("/api/admin/words", fetcher)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setTimeout(() => setRefreshing(false), 500)
  }

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return []
    
    return posts.filter(post => {
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === "all" || post.status === filterStatus
      const matchesCategory = filterCategory === "all" || post.category === filterCategory
      const matchesLanguage = filterLanguage === "all" || post.language === filterLanguage
      
      return matchesSearch && matchesStatus && matchesCategory && matchesLanguage
    })
  }, [posts, searchQuery, filterStatus, filterCategory, filterLanguage])

  // Stats
  const stats = useMemo(() => {
    if (!Array.isArray(posts)) return { total: 0, published: 0, draft: 0, views: 0 }
    return {
      total: posts.length,
      published: posts.filter(p => p.status === "published").length,
      draft: posts.filter(p => p.status === "draft").length,
      views: posts.reduce((sum, p) => sum + (p.views || 0), 0)
    }
  }, [posts])

  const handleCreatePost = async () => {
    if (!newPost.title.trim()) {
      toast.error("Title is required")
      return
    }
    
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPost,
          tags: newPost.tags.split(",").map(t => t.trim()).filter(Boolean),
          seo_keywords: newPost.seo_keywords.split(",").map(k => k.trim()).filter(Boolean),
          slug: newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        })
      })
      
      if (!res.ok) throw new Error("Failed to create post")
      
      toast.success("Post created successfully")
      setShowCreateDialog(false)
      setNewPost({
        title: "",
        excerpt: "",
        content: "",
        category: BLOG_CATEGORIES[0],
        tags: "",
        author_name: "Renascence Team",
        language: "en",
        seo_title: "",
        seo_description: "",
        seo_keywords: ""
      })
      mutate()
    } catch (error) {
      toast.error("Failed to create post")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a topic or description")
      return
    }
    
    if (aiLanguages.length === 0) {
      toast.error("Please select at least one language")
      return
    }
    
    setIsGenerating(true)
    try {
      const res = await fetch("/api/admin/words/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          languages: aiLanguages,
          category: aiCategory
        })
      })
      
      if (!res.ok) throw new Error("Failed to generate article")
      
      const result = await res.json()
      toast.success(`Generated ${result.created} article(s) in ${aiLanguages.length} language(s)`)
      setShowAIGenerateDialog(false)
      setAiPrompt("")
      setAiLanguages(["en"])
      mutate()
    } catch (error) {
      toast.error("Failed to generate article")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return
    
    try {
      const res = await fetch(`/api/admin/words/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete post")
      
      toast.success("Post deleted")
      mutate()
    } catch (error) {
      toast.error("Failed to delete post")
    }
  }

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      const res = await fetch(`/api/admin/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: publish ? "published" : "draft",
          published_at: publish ? new Date().toISOString() : null
        })
      })
      
      if (!res.ok) throw new Error("Failed to update post")
      
      toast.success(publish ? "Post published" : "Post unpublished")
      mutate()
    } catch (error) {
      toast.error("Failed to update post")
    }
  }

  const toggleLanguage = (code: string) => {
    setAiLanguages(prev => 
      prev.includes(code) 
        ? prev.filter(l => l !== code)
        : [...prev, code]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Words</h1>
          <p className="text-muted-foreground">Manage blog articles and content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={showAIGenerateDialog} onOpenChange={setShowAIGenerateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate Article with AI</DialogTitle>
                <DialogDescription>
                  AI will write a full article based on your topic. Select multiple languages to generate translations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Topic / Description</Label>
                  <Textarea 
                    placeholder="e.g., How to improve customer journey mapping in retail..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={aiCategory} onValueChange={setAiCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Generate in Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.map(lang => (
                      <Badge
                        key={lang.code}
                        variant={aiLanguages.includes(lang.code) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleLanguage(lang.code)}
                      >
                        {lang.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select all languages you want the article generated in
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAIGenerateDialog(false)}>Cancel</Button>
                <Button onClick={handleAIGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
                <DialogDescription>Write a new blog post manually</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Title *</Label>
                    <Input 
                      placeholder="Article title"
                      value={newPost.title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newPost.category} 
                      onValueChange={(v) => setNewPost(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select 
                      value={newPost.language} 
                      onValueChange={(v) => setNewPost(prev => ({ ...prev, language: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_LANGUAGES.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Excerpt</Label>
                    <Textarea 
                      placeholder="Brief summary of the article..."
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost(prev => ({ ...prev, excerpt: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Content</Label>
                    <Textarea 
                      placeholder="Full article content (Markdown supported)..."
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma separated)</Label>
                    <Input 
                      placeholder="cx, journey, mapping"
                      value={newPost.tags}
                      onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Author Name</Label>
                    <Input 
                      placeholder="Author name"
                      value={newPost.author_name}
                      onChange={(e) => setNewPost(prev => ({ ...prev, author_name: e.target.value }))}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">SEO Settings</h4>
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input 
                      placeholder="Custom title for search engines"
                      value={newPost.seo_title}
                      onChange={(e) => setNewPost(prev => ({ ...prev, seo_title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <Textarea 
                      placeholder="Description for search engines (150-160 chars recommended)"
                      value={newPost.seo_description}
                      onChange={(e) => setNewPost(prev => ({ ...prev, seo_description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Keywords (comma separated)</Label>
                    <Input 
                      placeholder="customer experience, journey mapping, cx"
                      value={newPost.seo_keywords}
                      onChange={(e) => setNewPost(prev => ({ ...prev, seo_keywords: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreatePost} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Article"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.published}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold text-amber-600">{stats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.views.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {BLOG_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLanguage} onValueChange={setFilterLanguage}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {AVAILABLE_LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PenLine className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No articles yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first blog post or generate one with AI
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAIGenerateDialog(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="group hover:shadow-md transition-shadow">
              {post.featured_image && (
                <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                  <img 
                    src={post.featured_image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{post.excerpt}</CardDescription>
                  </div>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">{post.category}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {AVAILABLE_LANGUAGES.find(l => l.code === post.language)?.name || post.language}
                  </Badge>
                  {post.is_ai_generated && (
                    <Badge variant="outline" className="gap-1 text-violet-600 border-violet-200">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time || 5} min
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="flex items-center gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedPost(post)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={post.status === "published" ? "secondary" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePublish(post.id, post.status !== "published")}
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredPosts.map(post => (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                  {post.featured_image && (
                    <div className="w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={post.featured_image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{post.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.author_name}</span>
                      <span className="text-xs text-muted-foreground">{post.views} views</span>
                    </div>
                  </div>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>
                    {post.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPost(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePublish(post.id, post.status !== "published")}
                    >
                      {post.status === "published" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
