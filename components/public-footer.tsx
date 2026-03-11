"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useSiteConfig } from "@/hooks/use-site-config"

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/home#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Templates", href: "/home#features" },
      { label: "Integrations", href: "/home#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Guides", href: "#" },
      { label: "API Reference", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
]

export function PublicFooter() {
  const { resolvedTheme } = useTheme()
  const { getLogo, config } = useSiteConfig()
  
  const logoSrc = getLogo(resolvedTheme === "dark" ? "dark" : "light")
  
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col items-start gap-3">
            <Link href="/home" className="flex items-center h-[76px]">
              <Image
                src={logoSrc || (resolvedTheme === "dark" 
                  ? "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-dark-xOhDTEdqNvUAZaKUpWWdevckyCXaMX.png"
                  : "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-light-TKrukgyff9qYn05XX01mnhB1RP7Wrb.png"
                )}
                alt={config?.siteName || "René Studio"}
                width={480}
                height={128}
                className="h-[76px] max-w-[240px] object-contain object-left"
              />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground text-left">
              Map, understand, and transform every customer experience journey.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <nav className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            {"2026 René Studio by Renascence. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
