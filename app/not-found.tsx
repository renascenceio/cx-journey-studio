"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Home,
  Route,
  LayoutDashboard,
  UserCircle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Journey path visualization nodes
const journeyNodes = [
  { x: 10, y: 50, delay: 0 },
  { x: 25, y: 30, delay: 0.1 },
  { x: 40, y: 60, delay: 0.2 },
  { x: 55, y: 25, delay: 0.3 },
  { x: 70, y: 55, delay: 0.4 },
  { x: 85, y: 35, delay: 0.5 },
]

// Quick navigation items
const quickLinks = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "from-blue-500 to-cyan-500" },
  { name: "Journeys", icon: Route, href: "/journeys", color: "from-emerald-500 to-teal-500" },
  { name: "Archetypes", icon: UserCircle, href: "/archetypes", color: "from-violet-500 to-purple-500" },
  { name: "Solutions", icon: Lightbulb, href: "/solutions", color: "from-amber-500 to-orange-500" },
]

export default function NotFound() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter quick links based on query
  const filteredLinks = query.length > 0 
    ? quickLinks.filter(link => link.name.toLowerCase().includes(query.toLowerCase()))
    : quickLinks

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredLinks.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      router.push(filteredLinks[selectedIndex].href)
    }
  }, [filteredLinks, selectedIndex, router])

  // Focus input on Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [query])

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_110%)] opacity-40" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        
        {/* Animated Journey Path SVG */}
        <div className="relative mb-8 w-full max-w-lg h-32">
          <svg 
            viewBox="0 0 100 80" 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Animated path line */}
            <motion.path
              d={`M ${journeyNodes.map(n => `${n.x} ${n.y}`).join(" L ")}`}
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
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
              <motion.g key={i}>
                {/* Pulse ring */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="6"
                  fill="none"
                  stroke="hsl(var(--primary) / 0.3)"
                  strokeWidth="1"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ 
                    delay: node.delay + 1.5,
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
                {/* Main node */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: node.delay + 0.8, duration: 0.3, type: "spring" }}
                />
              </motion.g>
            ))}
            
            {/* Lost indicator (broken connection) */}
            <motion.g
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.5 }}
            >
              <circle cx="55" cy="25" r="8" fill="hsl(var(--destructive) / 0.1)" />
              <text x="55" y="28" textAnchor="middle" className="fill-destructive text-[8px] font-bold">?</text>
            </motion.g>
          </svg>
        </div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-8xl font-bold tracking-tighter bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Journey interrupted
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Looks like this path leads nowhere. Let&apos;s help you find your way back to a meaningful experience.
          </p>
        </motion.div>

        {/* Spotlight Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xl mb-8"
        >
          <div className={cn(
            "relative rounded-2xl border bg-background/80 backdrop-blur-xl shadow-2xl transition-all duration-300",
            isFocused ? "border-primary/50 shadow-primary/10" : "border-border/50"
          )}>
            {/* Animated gradient border */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-violet-500/50 to-primary/50 -z-10 blur-sm"
                />
              )}
            </AnimatePresence>
            
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, journeys, or type a destination..."
                className="h-10 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-2 py-1 font-mono text-[10px] font-medium text-muted-foreground/70">
                <Command className="h-3 w-3" />K
              </kbd>
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
                {filteredLinks.map((link, index) => {
                  const Icon = link.icon
                  const isSelected = index === selectedIndex
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                        isSelected 
                          ? "bg-primary/10" 
                          : "hover:bg-muted/50"
                      )}
                      onMouseEnter={() => setSelectedIndex(index)}
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
                      <ArrowRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isSelected && "translate-x-1 text-primary"
                      )} />
                    </Link>
                  )
                })}
              </div>
              
              {filteredLinks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No pages found</p>
                </div>
              )}
            </div>
            
            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2">
              <span className="text-[10px] text-muted-foreground">
                Use <kbd className="mx-1 rounded border border-border/50 bg-background px-1 py-0.5 font-mono text-[9px]">↑</kbd>
                <kbd className="mx-1 rounded border border-border/50 bg-background px-1 py-0.5 font-mono text-[9px]">↓</kbd> to navigate
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CornerDownLeft className="h-3 w-3" />
                to select
              </span>
            </div>
          </div>
        </motion.div>

        {/* Home Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button asChild variant="outline" size="lg" className="gap-2 rounded-xl">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
