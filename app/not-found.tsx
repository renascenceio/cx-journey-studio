import Link from "next/link"
import {
  Home,
  Route,
  LayoutDashboard,
  UserCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Quick navigation items
const quickLinks = [
  { name: "Dashboard", description: "View your workspace overview", icon: LayoutDashboard, href: "/dashboard", color: "from-blue-500 to-cyan-500" },
  { name: "Journeys", description: "Browse customer journeys", icon: Route, href: "/journeys", color: "from-emerald-500 to-teal-500" },
  { name: "Archetypes", description: "Manage customer personas", icon: UserCircle, href: "/archetypes", color: "from-violet-500 to-purple-500" },
  { name: "Help Center", description: "Get support and documentation", icon: HelpCircle, href: "/help", color: "from-amber-500 to-orange-500" },
]

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_110%)] opacity-40" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        
        {/* Journey Path SVG - Smooth curved path */}
        <div className="relative mb-8 w-full max-w-md h-24 animate-in fade-in duration-500">
          <svg 
            viewBox="0 0 200 60" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="60%" stopColor="hsl(280 70% 60%)" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(280 70% 50%)" />
              </linearGradient>
            </defs>
            
            {/* Smooth curved path using bezier curves */}
            <path
              d="M 15 35 C 35 15, 55 45, 75 30 S 115 50, 135 25 S 165 35, 185 40"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            
            {/* Dashed continuation showing "lost" path */}
            <path
              d="M 135 25 L 160 15"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            
            {/* Journey nodes - filled with gradient for visibility */}
            <circle cx="15" cy="35" r="6" fill="url(#nodeGradient)" />
            <circle cx="75" cy="30" r="6" fill="url(#nodeGradient)" />
            <circle cx="135" cy="25" r="6" fill="url(#nodeGradient)" />
            <circle cx="185" cy="40" r="5" fill="hsl(var(--muted-foreground))" opacity="0.4" />
            
            {/* Inner white dots for style */}
            <circle cx="15" cy="35" r="2.5" fill="white" />
            <circle cx="75" cy="30" r="2.5" fill="white" />
            <circle cx="135" cy="25" r="2.5" fill="white" />
            
            {/* Lost indicator with question mark */}
            <g className="animate-bounce">
              <circle cx="160" cy="15" r="10" fill="hsl(var(--destructive))" opacity="0.15" />
              <circle cx="160" cy="15" r="7" fill="hsl(var(--destructive))" opacity="0.25" />
              <text x="160" y="19" textAnchor="middle" fill="hsl(var(--destructive))" fontSize="11" fontWeight="bold">?</text>
            </g>
          </svg>
        </div>

        {/* 404 Text */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <h1 className="text-8xl font-bold tracking-tighter bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Journey interrupted
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Looks like this path leads nowhere. Let&apos;s help you find your way back to a meaningful experience.
          </p>
        </div>

        {/* Quick Navigation Card */}
        <div className="w-full max-w-lg mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="relative rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-muted/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Quick Navigation</p>
                <p className="text-xs text-muted-foreground">Where would you like to go?</p>
              </div>
            </div>
            
            {/* Quick Links Grid */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:bg-muted/60 group border border-transparent hover:border-border/50"
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shrink-0",
                      link.color,
                      "text-white shadow-sm"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{link.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
            
            {/* Footer with home link */}
            <div className="px-5 py-3 border-t border-border/40 bg-muted/20">
              <Link 
                href="/" 
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Back to Home</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        </div>
    </div>
  )
}
