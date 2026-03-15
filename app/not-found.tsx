import Link from "next/link"
import {
  Search,
  Home,
  Route,
  LayoutDashboard,
  UserCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Quick navigation items
const quickLinks = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "from-blue-500 to-cyan-500" },
  { name: "Journeys", icon: Route, href: "/journeys", color: "from-emerald-500 to-teal-500" },
  { name: "Archetypes", icon: UserCircle, href: "/archetypes", color: "from-violet-500 to-purple-500" },
  { name: "Solutions", icon: Lightbulb, href: "/solutions", color: "from-amber-500 to-orange-500" },
]

// Journey path nodes for SVG
const journeyNodes = [
  { x: 10, y: 50 },
  { x: 25, y: 30 },
  { x: 40, y: 60 },
  { x: 55, y: 25 },
  { x: 70, y: 55 },
  { x: 85, y: 35 },
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
        
        {/* Journey Path SVG */}
        <div className="relative mb-8 w-full max-w-lg h-32 animate-in fade-in duration-500">
          <svg 
            viewBox="0 0 100 80" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Path line with CSS animation */}
            <path
              d={`M ${journeyNodes.map(n => `${n.x} ${n.y}`).join(" L ")}`}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-path"
              style={{ strokeDasharray: 200, strokeDashoffset: 0 }}
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="50%" stopColor="hsl(280 80% 60%)" />
                <stop offset="100%" stopColor="hsl(var(--primary) / 0.3)" />
              </linearGradient>
            </defs>
            
            {/* Journey nodes */}
            {journeyNodes.map((node, i) => (
              <g key={i}>
                {/* Main node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
              </g>
            ))}
            
            {/* Lost indicator (broken connection) */}
            <g className="animate-bounce">
              <circle cx="55" cy="25" r="8" fill="hsl(var(--destructive) / 0.15)" />
              <text x="55" y="29" textAnchor="middle" fill="hsl(var(--destructive))" className="text-[10px] font-bold">?</text>
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
        <div className="w-full max-w-xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="relative rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Where would you like to go?
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="p-2">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Quick Navigation
                </span>
              </div>
              <div className="space-y-0.5">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-muted/50 group"
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br",
                        link.color,
                        "text-white shadow-sm"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{link.name}</p>
                        <p className="text-xs text-muted-foreground">Go to {link.name.toLowerCase()}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Home Button */}
        <div className="animate-in fade-in duration-500 delay-500">
          <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
      
      </div>
  )
}
