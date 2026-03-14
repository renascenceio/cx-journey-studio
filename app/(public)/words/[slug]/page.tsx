import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, User, Calendar, ArrowLeft, Share2, Globe } from "lucide-react"

// Language names for display
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ar: "العربية",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  zh: "中文",
  ja: "日本語"
}

async function getPost(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Increment view count
  await supabase
    .from("blog_posts")
    .update({ views: (data.views || 0) + 1 })
    .eq("id", data.id)
  
  return data
}

async function getRelatedPosts(category: string, currentId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, featured_image, reading_time")
    .eq("status", "published")
    .eq("category", category)
    .neq("id", currentId)
    .limit(3)
  
  return data || []
}

async function getTranslations(slug: string) {
  const supabase = await createClient()
  
  // Get the base slug (without language suffix)
  const baseSlug = slug.replace(/-(?:ar|es|fr|de|pt|zh|ja)$/, "")
  
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, language, title")
    .eq("status", "published")
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`)
  
  return data || []
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    return {
      title: "Article Not Found",
    }
  }

  const translations = await getTranslations(slug)
  const alternateLanguages: Record<string, string> = {}
  translations.forEach(t => {
    alternateLanguages[t.language] = `/words/${t.slug}`
  })

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    keywords: post.seo_keywords || [],
    authors: [{ name: post.author_name }],
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: "article",
      url: `/words/${post.slug}`,
      images: post.featured_image ? [post.featured_image] : [],
      publishedTime: post.published_at,
      authors: [post.author_name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
    },
    alternates: {
      canonical: `/words/${post.slug}`,
      languages: alternateLanguages,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function WordsArticlePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.category, post.id)
  const translations = await getTranslations(slug)

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featured_image,
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Person",
      "name": post.author_name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Renascence",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rene.cx/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://rene.cx/words/${post.slug}`
    },
    "keywords": post.seo_keywords?.join(", "),
    "articleSection": post.category,
    "wordCount": post.content?.split(/\s+/).length || 0,
    "inLanguage": post.language
  }

  // Format date
  const publishedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background">
        <article className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Back link */}
          <Link 
            href="/words" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Words
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge>{post.category}</Badge>
              {post.tags?.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-muted-foreground text-pretty">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author_name}
              </span>
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {publishedDate}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.reading_time || 5} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                {LANGUAGE_NAMES[post.language] || post.language}
              </span>
            </div>

            {/* Language switcher */}
            {translations.length > 1 && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Also available in:</span>
                {translations
                  .filter(t => t.slug !== slug)
                  .map(t => (
                    <Link key={t.slug} href={`/words/${t.slug}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        {LANGUAGE_NAMES[t.language] || t.language}
                      </Badge>
                    </Link>
                  ))}
              </div>
            )}
          </header>

          {/* Featured image */}
          {post.featured_image && (
            <figure className="mb-8 rounded-lg overflow-hidden bg-muted">
              <img 
                src={post.featured_image}
                alt={post.title}
                className="w-full h-auto"
              />
            </figure>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-4 prose-li:text-muted-foreground
              prose-blockquote:border-l-primary prose-blockquote:italic"
            dangerouslySetInnerHTML={{ 
              __html: post.content
                // Basic markdown to HTML conversion
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^(.+)$/gm, '<p>$1</p>')
                .replace(/<p><h/g, '<h')
                .replace(/<\/h(\d)><\/p>/g, '</h$1>')
            }}
          />

          <Separator className="my-12" />

          {/* Author & Share */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{post.author_name}</p>
                <p className="text-sm text-muted-foreground">Author</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t bg-muted/30 py-12">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedPosts.map(related => (
                  <Link key={related.id} href={`/words/${related.slug}`}>
                    <div className="group p-4 rounded-lg border bg-background hover:shadow-md transition-shadow">
                      {related.featured_image && (
                        <div className="aspect-video bg-muted rounded mb-3 overflow-hidden">
                          <img 
                            src={related.featured_image}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {related.reading_time || 5} min read
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
)}
      </div>
      </>
  )
}
