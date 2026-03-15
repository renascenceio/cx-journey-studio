// Export utilities for journeys and archetypes
import type { Journey, Stage, Step, TouchPoint, Archetype } from "@/lib/types"

// ============================================
// CSV Export
// ============================================

export function journeyToCSV(journey: Journey): string {
  const rows: string[][] = []
  
  // Header
  rows.push([
    "Stage",
    "Stage Order",
    "Step",
    "Step Order",
    "Touchpoint Channel",
    "Touchpoint Description",
    "Emotional Score",
    "Pain Points",
    "Pain Point Severities",
    "Highlights",
    "Highlight Impacts",
  ])
  
  // Data rows - Note: stage.order and step.order are 0-based in the database,
  // so we add 1 to make them 1-based (human-readable) in the export
  for (const stage of journey.stages || []) {
    for (const step of stage.steps || []) {
      for (const tp of step.touchPoints || []) {
        const painPointDescs = (tp.painPoints || []).map(p => p.description).join("; ")
        const painPointSeverities = (tp.painPoints || []).map(p => p.severity).join("; ")
        const highlightDescs = (tp.highlights || []).map(h => h.description).join("; ")
        const highlightImpacts = (tp.highlights || []).map(h => h.impact).join("; ")
        
        rows.push([
          stage.name,
          String((stage.order ?? 0) + 1),  // 1-based for human readability
          step.name,
          String((step.order ?? 0) + 1),   // 1-based for human readability
          tp.channel,
          tp.description || "",
          String(tp.emotionalScore),
          painPointDescs,
          painPointSeverities,
          highlightDescs,
          highlightImpacts,
        ])
      }
    }
  }
  
  // Convert to CSV string with proper escaping
  return rows.map(row => 
    row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""')
      return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
        ? `"${escaped}"`
        : escaped
    }).join(",")
  ).join("\n")
}

export function journeyMetadataToCSV(journey: Journey): string {
  const rows: string[][] = []
  
  rows.push(["Property", "Value"])
  rows.push(["Title", journey.title])
  rows.push(["Description", journey.description || ""])
  rows.push(["Type", journey.type])
  rows.push(["Status", journey.status])
  rows.push(["Created At", journey.createdAt])
  rows.push(["Updated At", journey.updatedAt])
  rows.push(["Total Stages", String((journey.stages || []).length)])
  rows.push(["Total Steps", String((journey.stages || []).reduce((s, st) => s + (st.steps?.length || 0), 0))])
  rows.push(["Total Touchpoints", String((journey.stages || []).reduce((s, st) => 
    s + (st.steps || []).reduce((ss, stp) => ss + (stp.touchPoints?.length || 0), 0), 0))])
  
  if (journey.archetypes?.length > 0) {
    rows.push(["Archetypes", journey.archetypes.map(a => a.name).join("; ")])
  }
  
  return rows.map(row => 
    row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""')
      return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
        ? `"${escaped}"`
        : escaped
    }).join(",")
  ).join("\n")
}

export function archetypeToCSV(archetype: Archetype): string {
  const rows: string[][] = []
  
  // Basic info
  rows.push(["Property", "Value"])
  rows.push(["Name", archetype.name])
  rows.push(["Role", archetype.role || ""])
  rows.push(["Description", archetype.description || ""])
  rows.push(["Tags", (archetype.tags || []).join("; ")])
  rows.push([""])
  
  // Demographics
  if (archetype.demographics) {
    rows.push(["Demographics"])
    rows.push(["Age Range", archetype.demographics.ageRange || ""])
    rows.push(["Income Level", archetype.demographics.incomeLevel || ""])
    rows.push(["Location", archetype.demographics.location || ""])
    rows.push(["Family Status", archetype.demographics.familyStatus || ""])
    rows.push([""])
  }
  
  // Pillar ratings
  if (archetype.pillarRatings?.length > 0) {
    rows.push(["Pillar Ratings"])
    rows.push(["Pillar", "Rating"])
    for (const pillar of archetype.pillarRatings) {
      rows.push([pillar.pillar, String(pillar.rating)])
    }
    rows.push([""])
  }
  
  // Solution principles
  if (archetype.solutionPrinciples?.length > 0) {
    rows.push(["Solution Principles"])
    for (const principle of archetype.solutionPrinciples) {
      rows.push([principle])
    }
  }
  
  return rows.map(row => 
    row.map(cell => {
      const escaped = String(cell).replace(/"/g, '""')
      return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
        ? `"${escaped}"`
        : escaped
    }).join(",")
  ).join("\n")
}

// ============================================
// Download Helpers
// ============================================

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadSVG(svgContent: string, filename: string) {
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".svg") ? filename : `${filename}.svg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadPNG(element: HTMLElement, filename: string, scale: number = 2) {
  const { toPng } = await import("html-to-image")
  
  try {
    // Find the actual canvas content (the flex container with stages)
    const canvasContent = element.querySelector('[data-export-target="journey-canvas"]') as HTMLElement
      || element
    
    // Get the full scroll dimensions
    const scrollWidth = canvasContent.scrollWidth || canvasContent.offsetWidth
    const scrollHeight = canvasContent.scrollHeight || canvasContent.offsetHeight
    
    // Store original styles to restore later
    const originalOverflow = element.style.overflow
    const originalWidth = element.style.width
    const originalHeight = element.style.height
    const originalTransform = canvasContent.style.transform
    
    // Temporarily expand the container and reset zoom for capture
    element.style.overflow = 'visible'
    element.style.width = `${scrollWidth + 48}px`
    element.style.height = `${scrollHeight + 48}px`
    canvasContent.style.transform = 'none'
    
    // Wait for reflow
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const dataUrl = await toPng(canvasContent, {
      quality: 1,
      pixelRatio: scale,
      backgroundColor: "#ffffff",
      width: scrollWidth,
      height: scrollHeight,
      cacheBust: true,
    })
    
    // Restore original styles
    element.style.overflow = originalOverflow
    element.style.width = originalWidth
    element.style.height = originalHeight
    canvasContent.style.transform = originalTransform
    
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Failed to generate PNG:", error)
    throw error
  }
}

export async function downloadSVGFromElement(element: HTMLElement, filename: string) {
  const { toSvg } = await import("html-to-image")
  
  try {
    // Find the actual canvas content
    const canvasContent = element.querySelector('[data-export-target="journey-canvas"]') as HTMLElement
      || element
    
    // Get the full scroll dimensions
    const scrollWidth = canvasContent.scrollWidth || canvasContent.offsetWidth
    const scrollHeight = canvasContent.scrollHeight || canvasContent.offsetHeight
    
    // Store original styles to restore later
    const originalOverflow = element.style.overflow
    const originalWidth = element.style.width
    const originalHeight = element.style.height
    const originalTransform = canvasContent.style.transform
    
    // Temporarily expand the container and reset zoom for capture
    element.style.overflow = 'visible'
    element.style.width = `${scrollWidth + 48}px`
    element.style.height = `${scrollHeight + 48}px`
    canvasContent.style.transform = 'none'
    
    // Wait for reflow
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const dataUrl = await toSvg(canvasContent, {
      backgroundColor: "#ffffff",
      width: scrollWidth,
      height: scrollHeight,
      cacheBust: true,
    })
    
    // Restore original styles
    element.style.overflow = originalOverflow
    element.style.width = originalWidth
    element.style.height = originalHeight
    canvasContent.style.transform = originalTransform
    
    // Convert data URL to actual SVG content
    const svgContent = decodeURIComponent(dataUrl.split(",")[1])
    downloadSVG(svgContent, filename)
  } catch (error) {
    console.error("Failed to generate SVG:", error)
    throw error
  }
}

// ============================================
// PDF Export (full canvas capture)
// ============================================

export async function downloadPDF(element: HTMLElement, filename: string, title?: string) {
  const { toPng } = await import("html-to-image")
  const { jsPDF } = await import("jspdf")
  
  try {
    // Find the actual canvas content
    const canvasContent = element.querySelector('[data-export-target="journey-canvas"]') as HTMLElement
      || element
    
    // Get the full scroll dimensions
    const scrollWidth = canvasContent.scrollWidth || canvasContent.offsetWidth
    const scrollHeight = canvasContent.scrollHeight || canvasContent.offsetHeight
    
    // Store original styles to restore later
    const originalOverflow = element.style.overflow
    const originalWidth = element.style.width
    const originalHeight = element.style.height
    const originalTransform = canvasContent.style.transform
    
    // Temporarily expand the container and reset zoom for capture
    element.style.overflow = 'visible'
    element.style.width = `${scrollWidth + 48}px`
    element.style.height = `${scrollHeight + 48}px`
    canvasContent.style.transform = 'none'
    
    // Wait for reflow
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Capture as PNG with high quality
    const dataUrl = await toPng(canvasContent, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: scrollWidth,
      height: scrollHeight,
      cacheBust: true,
    })
    
    // Restore original styles
    element.style.overflow = originalOverflow
    element.style.width = originalWidth
    element.style.height = originalHeight
    canvasContent.style.transform = originalTransform
    
    // Calculate PDF dimensions - landscape orientation for journey maps
    const imgWidth = scrollWidth
    const imgHeight = scrollHeight
    
    // Use landscape format with custom page size to fit content
    // Add some margins (50px on each side)
    const pdfWidth = imgWidth + 100
    const pdfHeight = imgHeight + 150 // Extra space for title
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight],
      compress: true,
    })
    
    // Add title if provided
    if (title) {
      pdf.setFontSize(24)
      pdf.setTextColor(0, 0, 0)
      pdf.text(title, 50, 50)
      
      // Add export date
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Exported on ${new Date().toLocaleDateString()}`, 50, 75)
      
      // Add the image below title
      pdf.addImage(dataUrl, 'PNG', 50, 100, imgWidth, imgHeight)
    } else {
      // Add the image with margins
      pdf.addImage(dataUrl, 'PNG', 50, 50, imgWidth, imgHeight)
    }
    
    // Download
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    throw error
  }
}

// ============================================
// Filename Sanitization
// ============================================

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}
