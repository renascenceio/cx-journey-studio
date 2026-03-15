import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// File extraction API - extracts text content from various file types
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("file") as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const extractedContents: { fileName: string; content: string; error?: string }[] = []

    for (const file of files) {
      if (!file || typeof file === "string") {
        continue
      }

      try {
        const fileName = file.name
        const fileType = file.type
        const fileExt = fileName.split(".").pop()?.toLowerCase() || ""
        
        let content = ""

        // Handle text-based files
        if (fileType === "text/plain" || fileType === "text/csv" || 
            fileType === "text/markdown" || fileExt === "txt" || 
            fileExt === "csv" || fileExt === "md") {
          content = await file.text()
        }
        // Handle PDF files
        else if (fileType === "application/pdf" || fileExt === "pdf") {
          content = await extractPdfContent(file)
        }
        // Handle Office documents
        else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                 fileExt === "docx") {
          content = await extractDocxContent(file)
        }
        else if (fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || 
                 fileExt === "pptx") {
          content = await extractPptxContent(file)
        }
        else if (fileExt === "doc" || fileExt === "ppt") {
          // Legacy Office formats - extract what we can
          content = `[Legacy Office format: ${fileName}. Content extraction limited. Please convert to modern format (.docx, .pptx) for better results.]`
        }
        else if (fileExt === "key") {
          // Apple Keynote files - limited support
          content = `[Keynote file: ${fileName}. Please export to PDF or PPTX for better text extraction.]`
        }
        else {
          content = `[Unsupported file type: ${fileName}]`
        }

        extractedContents.push({ fileName, content })
      } catch (fileError) {
        console.error(`Error extracting ${file.name}:`, fileError)
        extractedContents.push({ 
          fileName: file.name, 
          content: "", 
          error: `Failed to extract content from ${file.name}` 
        })
      }
    }

    // Combine all extracted content
    const combinedContent = extractedContents
      .filter(e => e.content && !e.error)
      .map(e => `--- Content from ${e.fileName} ---\n${e.content}`)
      .join("\n\n")

    return NextResponse.json({
      content: combinedContent,
      files: extractedContents,
      totalFiles: files.length,
      successCount: extractedContents.filter(e => !e.error).length,
    })
  } catch (error) {
    console.error("File extraction error:", error)
    return NextResponse.json(
      { error: "Failed to extract file content" },
      { status: 500 }
    )
  }
}

// Extract text from PDF using pdf-parse approach
async function extractPdfContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Simple PDF text extraction - looks for text between stream markers
    const text = buffer.toString("utf-8", 0, buffer.length)
    
    // Extract text content from PDF streams
    const textMatches: string[] = []
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g
    let match
    
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1]
      // Extract readable ASCII text
      const readableText = streamContent
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      
      if (readableText.length > 20) {
        textMatches.push(readableText)
      }
    }
    
    // Also try to extract text objects (Tj, TJ operators)
    const tjRegex = /\(([^)]+)\)\s*Tj/g
    while ((match = tjRegex.exec(text)) !== null) {
      const textContent = match[1].replace(/\\/g, "")
      if (textContent.length > 2) {
        textMatches.push(textContent)
      }
    }
    
    const extractedText = textMatches.join(" ").substring(0, 50000) // Limit to 50K chars
    
    if (extractedText.length < 100) {
      return `[PDF file: ${file.name}. Limited text extracted. This may be a scanned document or image-based PDF.]`
    }
    
    return extractedText
  } catch (error) {
    console.error("PDF extraction error:", error)
    return `[PDF file: ${file.name}. Could not extract text content.]`
  }
}

// Extract text from DOCX files
async function extractDocxContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // DOCX files are ZIP archives containing XML
    // Look for document.xml content
    const content = buffer.toString("utf-8")
    
    // Extract text from XML tags
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
    const textParts: string[] = []
    let match
    
    while ((match = textRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        textParts.push(match[1])
      }
    }
    
    const extractedText = textParts.join(" ").substring(0, 50000)
    
    if (extractedText.length < 50) {
      return `[DOCX file: ${file.name}. Limited text extracted.]`
    }
    
    return extractedText
  } catch (error) {
    console.error("DOCX extraction error:", error)
    return `[DOCX file: ${file.name}. Could not extract text content.]`
  }
}

// Extract text from PPTX files  
async function extractPptxContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // PPTX files are ZIP archives containing XML
    const content = buffer.toString("utf-8")
    
    // Extract text from presentation XML tags
    const textRegex = /<a:t>([^<]*)<\/a:t>/g
    const textParts: string[] = []
    let match
    
    while ((match = textRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        textParts.push(match[1])
      }
    }
    
    const extractedText = textParts.join(" ").substring(0, 50000)
    
    if (extractedText.length < 50) {
      return `[PPTX file: ${file.name}. Limited text extracted.]`
    }
    
    return extractedText
  } catch (error) {
    console.error("PPTX extraction error:", error)
    return `[PPTX file: ${file.name}. Could not extract text content.]`
  }
}
