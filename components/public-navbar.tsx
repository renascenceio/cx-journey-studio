"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X, Sun, Moon, LayoutDashboard, Settings, LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSiteConfig } from "@/hooks/use-site-config"
import { useAuth } from "@/lib/auth-provider"

export function PublicNavbar() {
  const t = useTranslations()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { getLogo, config } = useSiteConfig()
  const { isAuthenticated, isLoading, user } = useAuth()
  
  // Wait for client to mount to avoid hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const navLinks = [
    { href: "/home#features", label: t("publicNav.features") },
    { href: "/pricing", label: t("publicNav.pricing") },
    { href: "/home#how-it-works", label: t("publicNav.howItWorks") },
  ]
  
  // Use "light" as server-side default, then switch to resolved theme after mount
  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light"
  
  // getLogo now always returns a logo (configured or default), no flickering
  const logoSrc = getLogo(theme)
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/home" className="flex items-center h-14 md:h-[58px]" suppressHydrationWarning>
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={config?.siteName || "René Studio"}
              width={259}
              height={69}
              className="h-14 w-auto md:h-[58px]"
              priority
            />
          ) : (
            <span className="text-xl font-bold text-foreground">{config?.siteName || "René Studio"}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher variant="ghost" size="icon" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          {!isLoading && isAuthenticated && user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  {t("publicNav.dashboard")}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name || ""} />}
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {(user.name || user.email || "U").split(" ").map(n => n[0]?.toUpperCase()).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t("publicNav.dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/journeys">
                      <User className="mr-2 h-4 w-4" />
                      {t("publicNav.myJourneys")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      {t("publicNav.settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      const { getSupabaseClient } = await import("@/lib/supabase/client")
                      const supabase = getSupabaseClient()
                      await supabase.auth.signOut()
                      // Clear local storage to fully reset auth state
                      window.localStorage.removeItem('sb-auth-token')
                      window.location.href = "/login"
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("publicNav.logOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t("publicNav.logIn")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">{t("publicNav.getStarted")}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">{t("publicNav.language")}</span>
            <LanguageSwitcher variant="outline" size="sm" showLabel />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("publicNav.appearance")}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
            >
              {theme === "dark" ? (
                <><Sun className="h-3.5 w-3.5" /> {t("publicNav.light")}</>
              ) : (
                <><Moon className="h-3.5 w-3.5" /> {t("publicNav.dark")}</>
              )}
            </Button>
          </div>
          
          <div className="mt-4 flex flex-col gap-3">
            {!isLoading && isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 py-2 border-b border-border mb-2">
                  <Avatar className="h-10 w-10">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name || ""} />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(user.name || user.email || "U").split(" ").map(n => n[0]?.toUpperCase()).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name || "User"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-1.5" />
                    {t("publicNav.dashboard")}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/journeys">{t("publicNav.myJourneys")}</Link>
                </Button>
              </>
            ) : !isLoading ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">{t("publicNav.logIn")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">{t("publicNav.getStarted")}</Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  )
}
