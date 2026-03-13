"use client"

import Link from "next/link"
import Image from "next/image"
import { Quote } from "lucide-react"
import { AuthProvider } from "@/lib/auth-provider"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const testimonials = [
  {
    quote: "René Studio transformed how we visualize and improve our customer experience. The emotional arc mapping alone saved us months of guesswork.",
    author: "Aslan Patov",
    role: "Chief Executive Officer, Founder",
    company: "Renascence",
  },
]

interface AuthLayoutClientProps {
  children: React.ReactNode
  logoDark: string | null
  logoLight: string | null
  siteName: string
}

// Default fallback logos
const DEFAULT_LOGO_DARK = "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-dark-xOhDTEdqNvUAZaKUpWWdevckyCXaMX.png"
const DEFAULT_LOGO_LIGHT = "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-light-TKrukgyff9qYn05XX01mnhB1RP7Wrb.png"

export function AuthLayoutClient({ children, logoDark, logoLight, siteName }: AuthLayoutClientProps) {
  // Use first testimonial for SSR consistency, avoiding hydration mismatch from Math.random()
  const t = testimonials[0]
  
  // Fetch real stats from the API
  const { data: stats } = useSWR("/api/public/stats", fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: false,
  })
  
  const journeyCount = stats?.journeyCount ?? "10,000+"
  const orgCount = stats?.organizationCount ?? "500+"
  const avgRating = stats?.avgRating ?? "4.9"
  
  // Use provided logos or fallback to defaults
  const darkLogo = logoDark || DEFAULT_LOGO_DARK
  const lightLogo = logoLight || DEFAULT_LOGO_LIGHT

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        {/* Left panel - testimonial */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground">
          <Link href="/home" className="flex items-center h-[76px]">
            <Image
              src={darkLogo}
              alt={siteName}
              width={320}
              height={85}
              className="h-[76px] w-auto"
              priority
            />
          </Link>

          <div className="flex flex-col gap-6 max-w-lg">
            <Quote className="h-10 w-10 text-primary-foreground/30" />
            <blockquote className="text-xl font-medium leading-relaxed text-balance">
              {t.quote}
            </blockquote>
            <div>
              <p className="font-semibold">{t.author}</p>
              <p className="text-sm text-primary-foreground/70">
                {t.role}, {t.company}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-primary-foreground/50">
            <span>{typeof journeyCount === "number" ? journeyCount.toLocaleString() : journeyCount} journeys mapped</span>
            <span className="h-1 w-1 rounded-full bg-primary-foreground/30" />
            <span>{typeof orgCount === "number" ? orgCount.toLocaleString() : orgCount} organizations</span>
            <span className="h-1 w-1 rounded-full bg-primary-foreground/30" />
            <span>{avgRating} avg rating</span>
          </div>
        </div>

        {/* Right panel - auth form */}
        <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
          <Link href="/home" className="mb-8 lg:hidden flex items-center h-16">
            <Image
              src={lightLogo}
              alt={siteName}
              width={288}
              height={77}
              className="h-16 w-auto"
              priority
            />
          </Link>
          {children}
        </div>
      </div>
    </AuthProvider>
  )
}
