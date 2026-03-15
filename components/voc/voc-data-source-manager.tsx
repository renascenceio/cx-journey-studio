"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  RefreshCw, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  FileSpreadsheet,
  BarChart3,
  Award,
  HelpCircle,
  Globe,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { VoCDataSource, VoCDataSourceType } from "@/lib/types"

interface VoCDataSourceManagerProps {
  dataSources: VoCDataSource[]
  journeyId: string
  organizationId: string
  onRefresh: () => void
}

const sourceTypeInfo: Record<VoCDataSourceType, { label: string; icon: React.ReactNode; description: string }> = {
  google_sheets: {
    label: "Google Sheets",
    icon: <FileSpreadsheet className="h-5 w-5 text-green-600" />,
    description: "Connect to a Google Spreadsheet with survey responses",
  },
  qualtrics: {
    label: "Qualtrics",
    icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
    description: "Import survey data from Qualtrics XM",
  },
  medallia: {
    label: "Medallia",
    icon: <Award className="h-5 w-5 text-purple-600" />,
    description: "Connect to Medallia experience platform",
  },
  questionpro: {
    label: "QuestionPro",
    icon: <HelpCircle className="h-5 w-5 text-orange-600" />,
    description: "Import from QuestionPro surveys",
  },
  surveymonkey: {
    label: "SurveyMonkey",
    icon: <BarChart3 className="h-5 w-5 text-teal-600" />,
    description: "Connect to SurveyMonkey surveys",
  },
  custom_api: {
    label: "Custom API",
    icon: <Globe className="h-5 w-5 text-gray-600" />,
    description: "Connect to any REST API endpoint",
  },
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Never synced</Badge>
  
  switch (status) {
    case "success":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Success
        </Badge>
      )
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    case "partial":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Partial
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function DataSourceCard({ 
  source, 
  onSync, 
  onDelete,
  syncing 
}: { 
  source: VoCDataSource
  onSync: () => void
  onDelete: () => void
  syncing: boolean
}) {
  const typeInfo = sourceTypeInfo[source.type]
  
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="shrink-0">
        {typeInfo?.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{source.name}</h4>
          {!source.isActive && (
            <Badge variant="secondary" className="text-xs">Disabled</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{typeInfo?.label}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <StatusBadge status={source.lastSyncStatus} />
          {source.lastSyncAt && (
            <span>
              Last sync: {formatDistanceToNow(new Date(source.lastSyncAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncing || !source.isActive}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function AddDataSourceDialog({ 
  journeyId, 
  organizationId,
  onAdd 
}: { 
  journeyId: string
  organizationId: string
  onAdd: () => void 
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"select" | "configure">("select")
  const [selectedType, setSelectedType] = useState<VoCDataSourceType | null>(null)
  const [name, setName] = useState("")
  const [config, setConfig] = useState<Record<string, string>>({})
  const [syncFrequency, setSyncFrequency] = useState("daily")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!selectedType || !name) return
    
    setCreating(true)
    try {
      const res = await fetch("/api/voc/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: selectedType,
          config,
          journeyId,
          organizationId,
          syncFrequency,
        }),
      })
      
      if (!res.ok) {
        throw new Error("Failed to create data source")
      }
      
      toast.success("Data source created successfully")
      setOpen(false)
      setStep("select")
      setSelectedType(null)
      setName("")
      setConfig({})
      onAdd()
    } catch (err) {
      toast.error("Failed to create data source")
    } finally {
      setCreating(false)
    }
  }

  const renderConfigFields = () => {
    switch (selectedType) {
      case "google_sheets":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
              <Input
                id="spreadsheetId"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={config.spreadsheetId || ""}
                onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Found in the Google Sheets URL after /d/
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheetName">Sheet Name</Label>
              <Input
                id="sheetName"
                placeholder="Survey Responses"
                value={config.sheetName || ""}
                onChange={(e) => setConfig({ ...config, sheetName: e.target.value })}
              />
            </div>
          </>
        )
      case "qualtrics":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="surveyId">Survey ID</Label>
              <Input
                id="surveyId"
                placeholder="SV_..."
                value={config.surveyId || ""}
                onChange={(e) => setConfig({ ...config, surveyId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="datacenterId">Datacenter ID</Label>
              <Input
                id="datacenterId"
                placeholder="ca1"
                value={config.datacenterId || ""}
                onChange={(e) => setConfig({ ...config, datacenterId: e.target.value })}
              />
            </div>
          </>
        )
      case "custom_api":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">API URL</Label>
              <Input
                id="url"
                placeholder="https://api.example.com/feedback"
                value={config.url || ""}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
            </div>
          </>
        )
      default:
        return (
          <p className="text-sm text-muted-foreground py-4">
            Configuration for {sourceTypeInfo[selectedType!]?.label} coming soon.
          </p>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Choose Data Source" : `Configure ${sourceTypeInfo[selectedType!]?.label}`}
          </DialogTitle>
          <DialogDescription>
            {step === "select" 
              ? "Select the type of VoC data source you want to connect"
              : "Enter the configuration details for your data source"
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === "select" ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {(Object.entries(sourceTypeInfo) as [VoCDataSourceType, typeof sourceTypeInfo[VoCDataSourceType]][]).map(([type, info]) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type)
                  setStep("configure")
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors text-center",
                )}
              >
                {info.icon}
                <span className="font-medium text-sm">{info.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder="My Survey Data"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            {renderConfigFields()}
            
            <div className="space-y-2">
              <Label htmlFor="syncFrequency">Sync Frequency</Label>
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {step === "configure" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleCreate} disabled={!name || creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Data Source"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function VoCDataSourceManager({ 
  dataSources, 
  journeyId, 
  organizationId,
  onRefresh 
}: VoCDataSourceManagerProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const handleSync = async (sourceId: string) => {
    setSyncingId(sourceId)
    try {
      const res = await fetch("/api/voc/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataSourceId: sourceId }),
      })
      
      if (!res.ok) {
        throw new Error("Sync failed")
      }
      
      const data = await res.json()
      if (data.isDemo) {
        toast.info("Demo mode - sync simulated")
      } else {
        toast.success("Sync completed successfully")
      }
      onRefresh()
    } catch (err) {
      toast.error("Failed to sync data source")
    } finally {
      setSyncingId(null)
    }
  }

  const handleDelete = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this data source?")) return
    
    try {
      const res = await fetch(`/api/voc/data-sources/${sourceId}`, {
        method: "DELETE",
      })
      
      if (!res.ok) {
        throw new Error("Delete failed")
      }
      
      toast.success("Data source deleted")
      onRefresh()
    } catch (err) {
      toast.error("Failed to delete data source")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Connect to external VoC platforms to import customer feedback
          </CardDescription>
        </div>
        <AddDataSourceDialog 
          journeyId={journeyId} 
          organizationId={organizationId}
          onAdd={onRefresh} 
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {dataSources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No data sources configured yet.</p>
            <p className="text-sm mt-1">Add a data source to start importing VoC data.</p>
          </div>
        ) : (
          dataSources.map(source => (
            <DataSourceCard
              key={source.id}
              source={source}
              onSync={() => handleSync(source.id)}
              onDelete={() => handleDelete(source.id)}
              syncing={syncingId === source.id}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
