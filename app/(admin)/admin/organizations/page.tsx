"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Building2, 
  Users, 
  CreditCard, 
  Calendar, 
  Globe, 
  Wallet,
  FileText,
  LayoutGrid,
  List,
  X,
  ExternalLink,
  TrendingUp,
  Clock,
  Languages,
  Receipt,
  Coins
} from "lucide-react"
import useSWR from "swr"
import { getInitials } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Organization {
  id: string
  name: string
  slug: string
  logo: string | null
  plan: string
  created_at: string
  // Extended data
  userCount: number
  workspaceCount: number
  journeyCount: number
  totalPayments: number
  monthlyExpenses: number
  creditsBalance: number
  invoiceCount: number
  mainLanguage: string
  languages: string[]
  lastActivityAt: string | null
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
}

export default function AdminOrganizationsPage() {
  const { data, isLoading } = useSWR<{ organizations: Organization[] }>("/api/admin/organizations", fetcher)
  const organizations = data?.organizations || []
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [planFilter, setPlanFilter] = useState<string>("all")

  const filtered = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
    const matchesPlan = planFilter === "all" || org.plan === planFilter
    return matchesSearch && matchesPlan
  })

  const stats = {
    total: organizations.length,
    free: organizations.filter(o => o.plan === "free").length,
    pro: organizations.filter(o => o.plan === "pro").length,
    enterprise: organizations.filter(o => o.plan === "enterprise").length,
    totalUsers: organizations.reduce((acc, o) => acc + o.userCount, 0),
    totalRevenue: organizations.reduce((acc, o) => acc + o.totalPayments, 0),
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  function getTenure(createdAt: string) {
    const created = new Date(createdAt)
    const now = new Date()
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())
    if (months < 1) return "< 1 month"
    if (months < 12) return `${months} month${months > 1 ? "s" : ""}`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) return `${years} year${years > 1 ? "s" : ""}`
    return `${years}y ${remainingMonths}m`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all registered organizations and their details
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Orgs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="secondary" className={planColors.free}>Free</Badge>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.free}</p>
              <p className="text-xs text-muted-foreground">Free Plan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="secondary" className={planColors.pro}>Pro</Badge>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.pro}</p>
              <p className="text-xs text-muted-foreground">Pro Plan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Badge variant="secondary" className={planColors.enterprise}>Enterprise</Badge>
            <div>
              <p className="text-lg font-bold text-foreground">{stats.enterprise}</p>
              <p className="text-xs text-muted-foreground">Enterprise</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={planFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setPlanFilter("all")}
          >
            All
          </Button>
          <Button
            variant={planFilter === "free" ? "default" : "outline"}
            size="sm"
            onClick={() => setPlanFilter("free")}
          >
            Free
          </Button>
          <Button
            variant={planFilter === "pro" ? "default" : "outline"}
            size="sm"
            onClick={() => setPlanFilter("pro")}
          >
            Pro
          </Button>
          <Button
            variant={planFilter === "enterprise" ? "default" : "outline"}
            size="sm"
            onClick={() => setPlanFilter("enterprise")}
          >
            Enterprise
          </Button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Organization List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">No organizations found</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => (
            <Card 
              key={org.id} 
              className="border-border/60 hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelectedOrg(org)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-lg">
                      {org.logo ? (
                        <AvatarImage src={org.logo} alt={org.name} />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{org.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">/{org.slug}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={planColors[org.plan]}>
                    {org.plan}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{org.userCount}</p>
                    <p className="text-[10px] text-muted-foreground">Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{org.workspaceCount}</p>
                    <p className="text-[10px] text-muted-foreground">Workspaces</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{org.journeyCount}</p>
                    <p className="text-[10px] text-muted-foreground">Journeys</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTenure(org.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    <span>{formatCurrency(org.monthlyExpenses)}/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/60">
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <div className="col-span-3">Organization</div>
              <div className="col-span-1">Plan</div>
              <div className="col-span-1">Users</div>
              <div className="col-span-1">Workspaces</div>
              <div className="col-span-1">Journeys</div>
              <div className="col-span-2">Revenue</div>
              <div className="col-span-2">Tenure</div>
              <div className="col-span-1">Actions</div>
            </div>

            {filtered.map((org) => (
              <div key={org.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-accent/30 transition-colors">
                <div className="col-span-3 flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    {org.logo ? <AvatarImage src={org.logo} alt={org.name} /> : null}
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-medium text-primary">
                      {getInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground truncate">/{org.slug}</p>
                  </div>
                </div>
                <div className="col-span-1">
                  <Badge variant="secondary" className={`text-[10px] ${planColors[org.plan]}`}>
                    {org.plan}
                  </Badge>
                </div>
                <div className="col-span-1 text-sm text-foreground">{org.userCount}</div>
                <div className="col-span-1 text-sm text-foreground">{org.workspaceCount}</div>
                <div className="col-span-1 text-sm text-foreground">{org.journeyCount}</div>
                <div className="col-span-2 text-sm text-foreground">{formatCurrency(org.totalPayments)}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{getTenure(org.created_at)}</div>
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setSelectedOrg(org)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Organization Detail Dialog */}
      <Dialog open={!!selectedOrg} onOpenChange={(open) => !open && setSelectedOrg(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrg && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-xl">
                    {selectedOrg.logo ? <AvatarImage src={selectedOrg.logo} alt={selectedOrg.name} /> : null}
                    <AvatarFallback className="rounded-xl bg-primary/10 text-xl font-semibold text-primary">
                      {getInitials(selectedOrg.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedOrg.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                      /{selectedOrg.slug}
                      <Badge variant="secondary" className={planColors[selectedOrg.plan]}>
                        {selectedOrg.plan}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedOrg.userCount}</p>
                            <p className="text-xs text-muted-foreground">Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedOrg.workspaceCount}</p>
                            <p className="text-xs text-muted-foreground">Workspaces</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedOrg.journeyCount}</p>
                            <p className="text-xs text-muted-foreground">Journeys</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tenure</span>
                        <span className="text-sm font-medium">{getTenure(selectedOrg.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm font-medium">{formatDate(selectedOrg.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Activity</span>
                        <span className="text-sm font-medium">
                          {selectedOrg.lastActivityAt ? formatDate(selectedOrg.lastActivityAt) : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Main Language</span>
                        <span className="text-sm font-medium">{selectedOrg.mainLanguage || "English"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Languages Used</span>
                        <div className="flex gap-1">
                          {(selectedOrg.languages || ["en"]).slice(0, 3).map((lang) => (
                            <Badge key={lang} variant="outline" className="text-[10px]">{lang}</Badge>
                          ))}
                          {selectedOrg.languages && selectedOrg.languages.length > 3 && (
                            <Badge variant="outline" className="text-[10px]">+{selectedOrg.languages.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{formatCurrency(selectedOrg.totalPayments)}</p>
                            <p className="text-xs text-muted-foreground">Total Payments</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{formatCurrency(selectedOrg.monthlyExpenses)}</p>
                            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Coins className="h-8 w-8 text-amber-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedOrg.creditsBalance.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Credits Balance</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Receipt className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedOrg.invoiceCount}</p>
                            <p className="text-xs text-muted-foreground">Invoices Sent</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">Usage analytics coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">Organization settings coming soon</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
