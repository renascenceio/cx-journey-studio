"use client"

import Link from "next/link"
import Image from "next/image"
import { Quote } from "lucide-react"
import { AuthProvider } from "@/lib/auth-provider"

const testimonials = [
  {
    quote: "Journey Studio transformed how we visualize and improve our customer experience. The emotional arc mapping alone saved us months of guesswork.",
    author: "Maria Gonzalez",
    role: "VP of Customer Experience",
    company: "Northwind Financial",
  },
  {
    quote: "We went from siloed journey data to a single source of truth in under a week. The archetype system is incredibly powerful.",
    author: "Tom Andersen",
    role: "CX Program Director",
    company: "Meridian Healthcare",
  },
]

interface AuthLayoutClientProps {
  children: React.ReactNode
  logoDark: string | null
  logoLight: string | null
  siteName: string
}

export function AuthLayoutClient({ children, logoDark, logoLight, siteName }: AuthLayoutClientProps) {
  const t = testimonials[Math.floor(Math.random() * testimonials.length)]

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        {/* Left panel - testimonial */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground">
          <Link href="/home" className="flex items-center h-[76px]">
            <Image
              src={logoDark || "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-dark-xOhDTEdqNvUAZaKUpWWdevckyCXaMX.png"}
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
            <span>12,000+ journeys mapped</span>
            <span className="h-1 w-1 rounded-full bg-primary-foreground/30" />
            <span>800+ organizations</span>
            <span className="h-1 w-1 rounded-full bg-primary-foreground/30" />
            <span>4.9 avg rating</span>
          </div>
        </div>

        {/* Right panel - auth form */}
        <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
          <Link href="/home" className="mb-8 lg:hidden flex items-center h-16">
            <Image
              src={logoLight || "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-light-TKrukgyff9qYn05XX01mnhB1RP7Wrb.png"}
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
