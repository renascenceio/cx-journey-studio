import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Clock, User, Eye, Calendar, ArrowRight } from "lucide-react"

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

async function getBlogPosts(lang: string = "en") {
  const supabase = await createClient()
  
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
  searchParams: Promise<{ category?: string; lang?: string }>
}) {
  const params = await searchParams
  const lang = params.lang || "en"
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background">
        {/* Compact Header */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Words
                </h1>
                <p className="text-muted-foreground mt-1">
                  Insights and best practices in customer experience
                </p>
              </div>
              
              {/* Categories inline */}
              {categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/words">
                    <Badge 
                      variant={!selectedCategory ? "default" : "outline"}
                      className="cursor-pointer"
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

        {/* Posts Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold mb-2">No articles yet</h2>
                <p className="text-muted-foreground">Check back soon for new content</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, idx) => (
                  <article key={post.id}>
                    <Link href={`/words/${post.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow group">
                        {post.featured_image && (
                          <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                            <img 
                              src={post.featured_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading={idx < 6 ? "eager" : "lazy"}
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
                          <h2 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                        </CardContent>
                        <CardFooter className="pt-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {post.author_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {post.reading_time || 5} min
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
