import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Clock, User, ArrowRight, Sparkles } from "lucide-react"
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from "@/lib/i18n/config"

export const metadata: Metadata = {
  title: "Words - CX Journey Studio Blog",
  description: "Insights, trends, and best practices in customer experience and journey mapping from the Renascence team.",
  keywords: ["customer experience", "journey mapping", "CX strategy", "blog", "insights"],
  openGraph: {
    title: "Words - CX Journey Studio Blog",
    description: "Insights, trends, and best practices in customer experience and journey mapping.",
    type: "website",
    url: "/words",
  },
  twitter: {
    card: "summary_large_image",
    title: "Words - CX Journey Studio Blog",
    description: "Insights, trends, and best practices in customer experience and journey mapping.",
  },
  alternates: {
    canonical: "/words",
    languages: {
      "en": "/words",
      "ar": "/ar/words",
      "es": "/es/words",
      "fr": "/fr/words",
      "de": "/de/words",
    }
  }
}

async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }
  return defaultLocale
}

async function getBlogPosts(lang: string = "en") {
  const supabase = await createClient()
  
  // First try to get posts in the requested language
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("language", lang)
    .order("published_at", { ascending: false })
    .limit(20)
  
  if (error) {
    console.error("[Words] Error fetching posts:", error)
    return []
  }
  
  // If no posts in requested language, fall back to English
  if ((!data || data.length === 0) && lang !== "en") {
    const { data: fallbackData } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .eq("language", "en")
      .order("published_at", { ascending: false })
      .limit(20)
    return fallbackData || []
  }
  
  return data || []
}

async function getCategories() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("status", "published")
  
  if (!data) return []
  
  const categories = [...new Set(data.map(p => p.category))]
  return categories
}

export default async function WordsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  // Get language from cookie (set by language switcher)
  const lang = await getCurrentLocale()
  const posts = await getBlogPosts(lang)
  const categories = await getCategories()
  const selectedCategory = params.category

  const filteredPosts = selectedCategory 
    ? posts.filter(p => p.category === selectedCategory)
    : posts

  // JSON-LD structured data for blog
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Words - CX Journey Studio",
    "description": "Insights, trends, and best practices in customer experience and journey mapping.",
    "url": "https://rene.cx/words",
    "publisher": {
      "@type": "Organization",
      "name": "Renascence",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rene.cx/logo.png"
      }
    },
    "blogPost": filteredPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `https://rene.cx/words/${post.slug}`,
      "datePublished": post.published_at,
      "author": {
        "@type": "Person",
        "name": post.author_name
      }
    }))
  }

  // Split into featured (first post) and rest
  const featuredPost = filteredPosts[0]
  const recentPosts = filteredPosts.slice(1, 7)
  const olderPosts = filteredPosts.slice(7)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">Words</h1>
              
              {/* Categories */}
              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/words">
                    <Badge 
                      variant={!selectedCategory ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90"
                    >
                      All
                    </Badge>
                  </Link>
                  {categories.map(cat => (
                    <Link key={cat} href={`/words?category=${encodeURIComponent(cat)}`}>
                      <Badge 
                        variant={selectedCategory === cat ? "default" : "outline"}
                        className="cursor-pointer"
                      >
                        {cat}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {filteredPosts.length === 0 ? (
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl font-semibold mb-2">No articles yet</h2>
              <p className="text-muted-foreground">Check back soon for new content</p>
            </div>
          </section>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && !selectedCategory && (
              <section className="py-10 border-b">
                <div className="container mx-auto px-4">
                  <Link href={`/words/${featuredPost.slug}`}>
                    <article className="group grid md:grid-cols-2 gap-8 items-center">
                      {featuredPost.featured_image ? (
                        <div className="aspect-[16/10] bg-muted rounded-xl overflow-hidden">
                          <img 
                            src={featuredPost.featured_image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl flex items-center justify-center">
                          <Sparkles className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge>{featuredPost.category}</Badge>
                          <span className="text-sm text-muted-foreground">Featured</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h2>
                        <p className="text-lg text-muted-foreground line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {featuredPost.author_name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {featuredPost.reading_time || 5} min read
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              </section>
            )}

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
              <section className="py-10">
                <div className="container mx-auto px-4">
                  {!selectedCategory && (
                    <h2 className="text-xl font-semibold mb-6">Recent Articles</h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedCategory ? filteredPosts : recentPosts).map((post) => (
                      <article key={post.id}>
                        <Link href={`/words/${post.slug}`}>
                          <Card className="h-full border-0 shadow-none hover:bg-muted/50 transition-colors group -mx-4 px-4 py-3 rounded-lg">
                            <CardHeader className="p-0 pb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {post.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {post.reading_time || 5} min
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h3>
                            </CardHeader>
                            <CardContent className="p-0 pb-3">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.excerpt}
                              </p>
                            </CardContent>
                            <CardFooter className="p-0 text-sm text-muted-foreground">
                              <div className="flex items-center justify-between w-full">
                                <span className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" />
                                  {post.author_name}
                                </span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </div>
                            </CardFooter>
                          </Card>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Older Posts - Different Style */}
            {olderPosts.length > 0 && !selectedCategory && (
              <section className="py-10 bg-muted/30 border-t">
                <div className="container mx-auto px-4">
                  <h2 className="text-xl font-semibold mb-6">More Articles</h2>
                  <div className="grid gap-4">
                    {olderPosts.map((post) => (
                      <article key={post.id}>
                        <Link href={`/words/${post.slug}`}>
                          <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-background transition-colors group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {post.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {post.reading_time || 5} min read
                                </span>
                              </div>
                              <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                                {post.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {post.excerpt}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
