"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileSpreadsheet, FileText, Image, Printer, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { 
  journeyToCSV, 
  journeyMetadataToCSV, 
  archetypeToCSV, 
  downloadCSV, 
  downloadPNG,
  downloadPDF,
  downloadSVGFromElement,
  sanitizeFilename 
} from "@/lib/export-utils"
import type { Journey, Archetype } from "@/lib/types"

type ExportFormat = "csv" | "pdf" | "png" | "svg"

interface ExportDialogProps {
  children: React.ReactNode
  type: "journey" | "archetype"
  data: Journey | Archetype
  elementRef?: React.RefObject<HTMLElement>
  title?: string
}

export function ExportDialog({ children, type, data, elementRef, title }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  const itemName = type === "journey" ? (data as Journey).title : (data as Archetype).name
  const filename = sanitizeFilename(itemName)
  
  async function handleExport() {
    setExporting(true)
    
    try {
      switch (format) {
        case "csv":
          if (type === "journey") {
            const journey = data as Journey
            let content = journeyToCSV(journey)
            if (includeMetadata) {
              content = journeyMetadataToCSV(journey) + "\n\n" + content
            }
            downloadCSV(content, `${filename}-journey.csv`)
          } else {
            const archetype = data as Archetype
            const content = archetypeToCSV(archetype)
            downloadCSV(content, `${filename}-archetype.csv`)
          }
          toast.success("CSV exported successfully")
          break
          
        case "pdf":
          if (elementRef?.current) {
            await downloadPDF(elementRef.current, `${filename}.pdf`, itemName)
            toast.success("PDF exported successfully")
          } else {
            // Fallback to print for archetypes or when no element
            window.print()
            toast.success("Print dialog opened")
          }
          break
          
        case "png":
          if (elementRef?.current) {
            await downloadPNG(elementRef.current, `${filename}.png`)
            toast.success("PNG exported successfully")
          } else {
            toast.error("No content element available for export")
          }
          break
          
        case "svg":
          if (elementRef?.current) {
            await downloadSVGFromElement(elementRef.current, `${filename}.svg`)
            toast.success("SVG exported successfully")
          } else {
            toast.error("No content element available for export")
          }
          break
      }
      
      setOpen(false)
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export {type === "journey" ? "Journey" : "Archetype"}</DialogTitle>
          <DialogDescription>
            Choose a format to export {title || itemName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="grid grid-cols-2 gap-3">
              <Label
                htmlFor="csv"
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  format === "csv" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="csv" id="csv" className="sr-only" />
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">CSV</p>
                  <p className="text-[10px] text-muted-foreground">Spreadsheet data</p>
                </div>
              </Label>
              
              <Label
                htmlFor="pdf"
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  format === "pdf" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                <FileText className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">PDF</p>
                  <p className="text-[10px] text-muted-foreground">Print / Save as PDF</p>
                </div>
              </Label>
              
              <Label
                htmlFor="png"
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  format === "png" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="png" id="png" className="sr-only" />
                <Image className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">PNG</p>
                  <p className="text-[10px] text-muted-foreground">High-res image</p>
                </div>
              </Label>
              
              <Label
                htmlFor="svg"
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  format === "svg" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="svg" id="svg" className="sr-only" />
                <Image className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">SVG</p>
                  <p className="text-[10px] text-muted-foreground">Vector graphic</p>
                </div>
              </Label>
            </RadioGroup>
          </div>
          
          {format === "csv" && type === "journey" && (
            <div className="flex items-center gap-2">
              <Checkbox 
                id="metadata" 
                checked={includeMetadata} 
                onCheckedChange={(c) => setIncludeMetadata(c === true)}
              />
              <Label htmlFor="metadata" className="text-sm cursor-pointer">
                Include journey metadata (title, description, stats)
              </Label>
            </div>
          )}
          
          {(format === "png" || format === "svg") && !elementRef?.current && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Image export is only available from visual views like Canvas or Report.
            </p>
          )}
          
          {format === "pdf" && (
            <p className="text-xs text-muted-foreground">
              Exports the full journey canvas as a high-quality PDF document with title and date.
            </p>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                {format === "pdf" ? <Printer className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {format === "pdf" ? "Print / PDF" : "Download"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
