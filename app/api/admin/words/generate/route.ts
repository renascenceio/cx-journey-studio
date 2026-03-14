import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, languages = ["en"], category = "Customer Experience" } = body

    // Fetch the Words generation prompt from database
    const { data: aiPrompt } = await supabase
      .from("ai_prompts")
      .select("system_prompt")
      .eq("category", "words_generation")
      .single()

    const createdPosts: any[] = []

    for (const lang of languages) {
      const languageName = {
        en: "English",
        ar: "Arabic",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        zh: "Chinese",
        ja: "Japanese",
        ko: "Korean",
        ru: "Russian",
        hi: "Hindi",
        tr: "Turkish",
        vi: "Vietnamese"
      }[lang] || "English"

      // Use database prompt if available, with language-specific additions
      const basePrompt = aiPrompt?.system_prompt || `You are an expert content writer specializing in customer experience, journey mapping, and CX strategy.`
      
      const systemPrompt = `${basePrompt}

IMPORTANT: Write this article in ${languageName}.

Article category: ${category}

Respond in JSON format with these fields:
{
  "title": "Article title",
  "excerpt": "2-3 sentence summary",
  "content": "Full article content in Markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "seo_title": "SEO optimized title (max 60 chars)",
  "seo_description": "Meta description (max 160 chars)",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"]
}`

      try {
        const { text } = await generateText({
          model: gateway("anthropic/claude-sonnet-4"),
          system: systemPrompt,
          prompt: `Write an article about: ${prompt}`,
          maxTokens: 4000
        })

        // Parse the JSON response
        let articleData
        try {
          // Extract JSON from the response
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            articleData = JSON.parse(jsonMatch[0])
          } else {
            throw new Error("No JSON found in response")
          }
        } catch (parseError) {
          console.error("[Words Generate] Parse error:", parseError)
          // Create a basic structure from the text
          articleData = {
            title: `${prompt} (${languageName})`,
            excerpt: prompt,
            content: text,
            tags: [category.toLowerCase()],
            seo_title: prompt,
            seo_description: prompt,
            seo_keywords: [category.toLowerCase()]
          }
        }

        // Generate slug
        const slug = articleData.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          + (lang !== "en" ? `-${lang}` : "")

        // Calculate reading time
        const wordCount = (articleData.content || "").split(/\s+/).length
        const readingTime = Math.max(1, Math.ceil(wordCount / 200))

        const { data, error } = await supabase
          .from("blog_posts")
          .insert({
            title: articleData.title,
            slug: slug,
            excerpt: articleData.excerpt,
            content: articleData.content,
            category: category,
            tags: articleData.tags || [],
            author_name: "AI Writer",
            status: "draft",
            language: lang,
            seo_title: articleData.seo_title,
            seo_description: articleData.seo_description,
            seo_keywords: articleData.seo_keywords || [],
            reading_time: readingTime,
            views: 0,
            is_ai_generated: true,
            created_by: user.id
          })
          .select()
          .single()

        if (!error && data) {
          createdPosts.push(data)
        }
      } catch (langError) {
        console.error(`[Words Generate] Error generating ${languageName}:`, langError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      created: createdPosts.length,
      posts: createdPosts 
    })
  } catch (err) {
    console.error("[Words Generate] Unexpected error:", err)
    return NextResponse.json({ error: "Failed to generate article" }, { status: 500 })
  }
}
