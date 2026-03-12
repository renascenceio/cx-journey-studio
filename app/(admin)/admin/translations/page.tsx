"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Globe, FileSpreadsheet, RefreshCw, Check, AlertCircle, Search, FileJson, Save, Languages } from "lucide-react"
import { toast } from "sonner"
import { locales, languageNames, type Locale } from "@/lib/i18n/config"

type TranslationEntry = {
  key: string
  english: string
  translation: string
  section: string
}

// Flatten nested JSON to dot notation keys
function flattenJson(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value as Record<string, unknown>, newKey))
    } else if (typeof value === "string") {
      result[newKey] = value
    }
  }
  
  return result
}

// Unflatten dot notation keys back to nested JSON
function unflattenJson(obj: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(".")
    let current = result
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!(part in current)) {
        current[part] = {}
      }
      current = current[part] as Record<string, unknown>
    }
    
    current[parts[parts.length - 1]] = value
  }
  
  return result
}

// Convert translations to CSV format
function toCsv(entries: TranslationEntry[]): string {
  const header = "Key,Section,English,Translation"
  const rows = entries.map(e => {
    // Escape quotes and wrap in quotes if contains comma, newline, or quotes
    const escape = (s: string) => {
      if (s.includes(",") || s.includes("\n") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    return `${escape(e.key)},${escape(e.section)},${escape(e.english)},${escape(e.translation)}`
  })
  return [header, ...rows].join("\n")
}

// Parse CSV to translation entries
function parseCsv(csv: string): TranslationEntry[] {
  const lines = csv.split("\n")
  if (lines.length < 2) return []
  
  const entries: TranslationEntry[] = []
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Parse CSV with quote handling
    const values: string[] = []
    let current = ""
    let inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        values.push(current)
        current = ""
      } else {
        current += char
      }
    }
    values.push(current)
    
    if (values.length >= 4) {
      entries.push({
        key: values[0],
        section: values[1],
        english: values[2],
        translation: values[3],
      })
    }
  }
  
  return entries
}

export default function TranslationsAdminPage() {
  const t = useTranslations()
  const [selectedLocale, setSelectedLocale] = useState<Locale>("ru")
  const [englishData, setEnglishData] = useState<Record<string, string>>({})
  const [translationData, setTranslationData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSection, setFilterSection] = useState<string>("all")
  const [editedKeys, setEditedKeys] = useState<Set<string>>(new Set())

  // Load both English and target language on mount/locale change
  useEffect(() => {
    async function loadTranslations() {
      setIsLoading(true)
      try {
        const [enRes, localeRes] = await Promise.all([
          fetch("/api/admin/translations/en"),
          fetch(`/api/admin/translations/${selectedLocale}`),
        ])
        
        if (enRes.ok) {
          const enData = await enRes.json()
          setEnglishData(flattenJson(enData))
        }
        
        if (localeRes.ok) {
          const localeData = await localeRes.json()
          setTranslationData(flattenJson(localeData))
        }
        
        setEditedKeys(new Set())
      } catch (error) {
        toast.error("Failed to load translations")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTranslations()
  }, [selectedLocale])

  // Get unique sections
  const sections = useMemo(() => {
    const sectionSet = new Set<string>()
    for (const key of Object.keys(englishData)) {
      const section = key.split(".")[0]
      sectionSet.add(section)
    }
    return Array.from(sectionSet).sort()
  }, [englishData])

  // Build translation entries with filtering
  const entries = useMemo(() => {
    const result: TranslationEntry[] = []
    
    for (const [key, english] of Object.entries(englishData)) {
      const section = key.split(".")[0]
      const translation = translationData[key] || ""
      
      // Apply filters
      if (filterSection !== "all" && section !== filterSection) continue
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!key.toLowerCase().includes(query) && 
            !english.toLowerCase().includes(query) && 
            !translation.toLowerCase().includes(query)) {
          continue
        }
      }
      
      result.push({ key, english, translation, section })
    }
    
    return result.sort((a, b) => a.key.localeCompare(b.key))
  }, [englishData, translationData, filterSection, searchQuery])

  // Count missing translations
  const missingCount = useMemo(() => {
    let count = 0
    for (const key of Object.keys(englishData)) {
      if (!translationData[key]) count++
    }
    return count
  }, [englishData, translationData])

  // Update a single translation
  function updateTranslation(key: string, value: string) {
    setTranslationData(prev => ({ ...prev, [key]: value }))
    setEditedKeys(prev => new Set(prev).add(key))
  }

  // Save all changes
  async function handleSave() {
    setIsLoading(true)
    try {
      const nestedData = unflattenJson(translationData)
      
      const response = await fetch(`/api/admin/translations/${selectedLocale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nestedData),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast.success(`${languageNames[selectedLocale]} translations saved successfully`)
      setEditedKeys(new Set())
    } catch {
      toast.error("Failed to save translations")
    } finally {
      setIsLoading(false)
    }
  }

  // Download as CSV
  function handleDownloadCsv() {
    const allEntries: TranslationEntry[] = []
    
    for (const [key, english] of Object.entries(englishData)) {
      const section = key.split(".")[0]
      const translation = translationData[key] || ""
      allEntries.push({ key, english, translation, section })
    }
    
    allEntries.sort((a, b) => a.key.localeCompare(b.key))
    
    const csv = toCsv(allEntries)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `translations_${selectedLocale}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`Downloaded ${languageNames[selectedLocale]} translations as CSV`)
  }

  // Download as JSON
  function handleDownloadJson() {
    const nestedData = unflattenJson(translationData)
    const blob = new Blob([JSON.stringify(nestedData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedLocale}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`Downloaded ${languageNames[selectedLocale]} translations as JSON`)
  }

  // Handle CSV file upload
  function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedEntries = parseCsv(content)
        
        if (parsedEntries.length === 0) {
          toast.error("No valid entries found in CSV")
          return
        }
        
        // Update translation data
        const newData = { ...translationData }
        const newEditedKeys = new Set(editedKeys)
        
        for (const entry of parsedEntries) {
          if (entry.translation && entry.translation !== newData[entry.key]) {
            newData[entry.key] = entry.translation
            newEditedKeys.add(entry.key)
          }
        }
        
        setTranslationData(newData)
        setEditedKeys(newEditedKeys)
        toast.success(`Imported ${parsedEntries.length} translations from CSV`)
      } catch {
        toast.error("Failed to parse CSV file")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Translation Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit and manage translations with side-by-side English reference
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editedKeys.size > 0 && (
            <Badge variant="secondary" className="gap-1">
              {editedKeys.size} unsaved changes
            </Badge>
          )}
          <Button onClick={handleSave} disabled={isLoading || editedKeys.size === 0}>
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Language selector and stats */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <Label htmlFor="locale-select" className="mb-2 block text-sm">
                <Globe className="inline h-4 w-4 mr-1" />
                Target Language
              </Label>
              <Select
                value={selectedLocale}
                onValueChange={(v) => setSelectedLocale(v as Locale)}
              >
                <SelectTrigger id="locale-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.filter(l => l !== "en").map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {languageNames[locale]} ({locale})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm">
                <span className="text-muted-foreground">Total keys:</span>{" "}
                <span className="font-medium">{Object.keys(englishData).length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Missing:</span>{" "}
                <span className={`font-medium ${missingCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {missingCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Export / Import
          </CardTitle>
          <CardDescription>
            Download translations as CSV for editing in Excel/Sheets, or upload edited CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleDownloadCsv}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={handleDownloadJson}>
              <FileJson className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
            <div className="border-l border-border/60 mx-2" />
            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys, English text, or translations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sections</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section} value={section}>
                {section}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Translation Editor */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Translations ({entries.length} keys)
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterSection("all")}
              className={filterSection === "all" ? "invisible" : ""}
            >
              Clear filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No translations found matching your filters
            </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-background z-10">
                <div className="col-span-3">Key</div>
                <div className="col-span-4">English (Reference)</div>
                <div className="col-span-5">{languageNames[selectedLocale]} Translation</div>
              </div>
              
              {entries.map((entry) => (
                <div
                  key={entry.key}
                  className={`grid grid-cols-12 gap-3 px-3 py-2 rounded-md hover:bg-muted/50 ${
                    editedKeys.has(entry.key) ? "bg-primary/5" : ""
                  } ${!entry.translation ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
                >
                  <div className="col-span-3">
                    <code className="text-xs text-muted-foreground break-all">
                      {entry.key}
                    </code>
                  </div>
                  <div className="col-span-4 text-sm text-foreground/80">
                    {entry.english}
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={entry.translation}
                      onChange={(e) => updateTranslation(entry.key, e.target.value)}
                      placeholder="Enter translation..."
                      className={`h-8 text-sm ${!entry.translation ? "border-amber-300 dark:border-amber-700" : ""}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-border/60 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Editing:</strong> Edit translations directly in the table above. Missing translations are highlighted in yellow.</p>
          <p><strong>CSV Export:</strong> Download as CSV to edit in Excel, Google Sheets, or any spreadsheet app. The CSV has 4 columns: Key, Section, English, Translation.</p>
          <p><strong>CSV Import:</strong> After editing the CSV, upload it back. Only the "Translation" column will be imported - other columns are for reference.</p>
          <p><strong>Saving:</strong> Click "Save Changes" to save all edits. Changes will take effect after the next page refresh.</p>
        </CardContent>
      </Card>
    </div>
  )
}
