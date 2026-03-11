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
  
  // Data rows
  for (const stage of journey.stages || []) {
    for (const step of stage.steps || []) {
      for (const tp of step.touchPoints || []) {
        const painPointDescs = (tp.painPoints || []).map(p => p.description).join("; ")
        const painPointSeverities = (tp.painPoints || []).map(p => p.severity).join("; ")
        const highlightDescs = (tp.highlights || []).map(h => h.description).join("; ")
        const highlightImpacts = (tp.highlights || []).map(h => h.impact).join("; ")
        
        rows.push([
          stage.name,
          String(stage.order),
          step.name,
          String(step.order),
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
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: scale,
      backgroundColor: "#ffffff",
    })
    
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
    const dataUrl = await toSvg(element, {
      backgroundColor: "#ffffff",
    })
    
    // Convert data URL to actual SVG content
    const svgContent = decodeURIComponent(dataUrl.split(",")[1])
    downloadSVG(svgContent, filename)
  } catch (error) {
    console.error("Failed to generate SVG:", error)
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
