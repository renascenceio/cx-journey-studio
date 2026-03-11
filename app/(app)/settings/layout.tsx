"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Building2, Users, CreditCard, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const settingsNav = [
  { label: "Profile", href: "/settings", icon: User, segment: null },
  { label: "Workspace", href: "/settings/workspace", icon: Building2, segment: "workspace" },
  { label: "Team", href: "/settings/team", icon: Users, segment: "team" },
  { label: "Billing", href: "/settings/billing", icon: CreditCard, segment: "billing" },
  { label: "Notifications", href: "/settings/notifications", icon: Bell, segment: "notifications" },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  function isActive(item: (typeof settingsNav)[0]) {
    if (item.segment === null) {
      return pathname === "/settings" || pathname === "/settings/"
    }
    return pathname.startsWith(`/settings/${item.segment}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, workspace, and preferences</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Side navigation */}
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col md:overflow-visible">
          {settingsNav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive(item)
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
