"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, Globe, FileJson, RefreshCw, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { locales, languageNames, type Locale } from "@/lib/i18n/config"

export default function TranslationsAdminPage() {
  const t = useTranslations()
  const [selectedLocale, setSelectedLocale] = useState<Locale>("en")
  const [jsonContent, setJsonContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Download translations for a specific locale
  async function handleDownload() {
    try {
      const response = await fetch(`/api/admin/translations/${selectedLocale}`)
      if (!response.ok) throw new Error("Failed to fetch translations")
      
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedLocale}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Downloaded ${languageNames[selectedLocale]} translations`)
    } catch (error) {
      toast.error("Failed to download translations")
    }
  }

  // Upload translations for a specific locale
  async function handleUpload() {
    if (!jsonContent.trim()) {
      toast.error("Please paste JSON content first")
      return
    }

    try {
      // Validate JSON
      const parsed = JSON.parse(jsonContent)
      
      setIsLoading(true)
      const response = await fetch(`/api/admin/translations/${selectedLocale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })

      if (!response.ok) throw new Error("Failed to upload translations")

      toast.success(`${languageNames[selectedLocale]} translations updated successfully`)
      setJsonContent("")
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error("Invalid JSON format")
      } else {
        toast.error("Failed to upload translations")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Load current translations into editor
  async function handleLoadCurrent() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/translations/${selectedLocale}`)
      if (!response.ok) throw new Error("Failed to fetch translations")
      
      const data = await response.json()
      setJsonContent(JSON.stringify(data, null, 2))
      toast.success(`Loaded ${languageNames[selectedLocale]} translations`)
    } catch (error) {
      toast.error("Failed to load translations")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // Validate JSON
        JSON.parse(content)
        setJsonContent(content)
        toast.success("File loaded successfully")
      } catch {
        toast.error("Invalid JSON file")
      }
    }
    reader.readAsText(file)
    // Reset input
    event.target.value = ""
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.translations")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.translationsDesc")}
        </p>
      </div>

      {/* Language selector */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t("admin.selectLanguage")}
          </CardTitle>
          <CardDescription>
            Choose a language to download or upload translations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="locale-select" className="mb-2 block">
                Language
              </Label>
              <Select
                value={selectedLocale}
                onValueChange={(v) => setSelectedLocale(v as Locale)}
              >
                <SelectTrigger id="locale-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {languageNames[locale]} ({locale})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              {t("admin.downloadJson")}
            </Button>
            <Button variant="outline" onClick={handleLoadCurrent} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Load Current
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileJson className="h-4 w-4" />
            Translation Editor
          </CardTitle>
          <CardDescription>
            Edit translations directly or upload a JSON file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          
          <Textarea
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            placeholder={`Paste or edit ${languageNames[selectedLocale]} translations JSON here...`}
            className="font-mono text-sm min-h-[400px]"
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setJsonContent("")}
              disabled={!jsonContent}
            >
              Clear
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!jsonContent || isLoading}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Translations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-border/60 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Select a language from the dropdown above.</p>
          <p>2. Click "Download JSON" to get the current translation file.</p>
          <p>3. Edit the JSON file in your preferred editor or use the built-in editor.</p>
          <p>4. Upload the modified file or paste the content and click "Save Translations".</p>
          <p className="text-amber-600 dark:text-amber-400">
            Note: Changes will take effect after the next page refresh or deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
