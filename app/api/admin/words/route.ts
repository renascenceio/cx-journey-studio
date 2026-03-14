import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json([])
      }
      console.error("[Words API] Error:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("[Words API] Unexpected error:", err)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Generate slug from title if not provided
    const slug = body.slug || body.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    
    // Calculate reading time (approx 200 words per minute)
    const wordCount = (body.content || "").split(/\s+/).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: body.title,
        slug: slug,
        excerpt: body.excerpt || "",
        content: body.content || "",
        featured_image: body.featured_image,
        category: body.category || "Customer Experience",
        tags: body.tags || [],
        author_name: body.author_name || "Renascence Team",
        author_avatar: body.author_avatar,
        status: body.status || "draft",
        published_at: body.published_at,
        language: body.language || "en",
        translations: body.translations || {},
        seo_title: body.seo_title || body.title,
        seo_description: body.seo_description || body.excerpt,
        seo_keywords: body.seo_keywords || [],
        reading_time: readingTime,
        views: 0,
        is_ai_generated: body.is_ai_generated || false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("[Words API] Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("[Words API] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
