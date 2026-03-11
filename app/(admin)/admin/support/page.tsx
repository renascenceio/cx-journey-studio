"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Headphones, Send, MessageCircle, Clock, CheckCircle2,
  AlertCircle, Inbox, Timer, User, Search, Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  assigned_to: string | null
  created_by: string
  sla_deadline: string | null
  created_at: string
  resolved_at: string | null
  updated_at: string
}

interface TicketMessage {
  id: string
  sender_type: string
  message: string
  created_at: string
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  waiting: "bg-muted text-muted-foreground",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-foreground" },
  high: { label: "High", color: "text-amber-600 dark:text-amber-400" },
  critical: { label: "Critical", color: "text-red-600 dark:text-red-400 font-bold" },
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/support/tickets")
      .then((r) => r.json())
      .then((data) => {
        setTickets(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function openTicketChat(ticket: Ticket) {
    setSelectedTicket(ticket)
    const res = await fetch(`/api/support/tickets/${ticket.id}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  async function sendAgentMessage() {
    if (!chatInput.trim() || !selectedTicket) return
    const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages((prev) => [...prev, msg])
      setChatInput("")
    }
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    const res = await fetch(`/api/support/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Ticket status updated to ${status}`)
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t))
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status })
    }
  }

  // SLA calculations
  const now = new Date()
  const breachedCount = tickets.filter((t) =>
    t.sla_deadline && new Date(t.sla_deadline) < now && t.status !== "resolved" && t.status !== "closed"
  ).length
  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length

  // Average resolution time (for resolved tickets)
  const resolvedTickets = tickets.filter((t) => t.resolved_at)
  const avgResolutionMs = resolvedTickets.length > 0
    ? resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()), 0) / resolvedTickets.length
    : 0
  const avgResolutionHours = Math.round(avgResolutionMs / (1000 * 60 * 60))

  // Filter + search
  const displayed = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <Toaster />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Open", value: openCount, icon: Inbox, color: "text-blue-600 dark:text-blue-400" },
          { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
          { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "SLA Breached", value: breachedCount, icon: AlertCircle, color: breachedCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground" },
          { label: "Avg Resolution", value: `${avgResolutionHours}h`, icon: Timer, color: "text-foreground" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <stat.icon className={cn("h-5 w-5 shrink-0", stat.color)} />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {["all", "open", "in_progress", "waiting", "resolved", "closed"].map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket Inbox */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : displayed.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Headphones className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-1.5">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="col-span-4">Subject</span>
            <span className="col-span-1">Category</span>
            <span className="col-span-1">Priority</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2">SLA</span>
            <span className="col-span-1">Created</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {displayed.map((ticket) => {
            const slaBreached = ticket.sla_deadline && new Date(ticket.sla_deadline) < now && ticket.status !== "resolved" && ticket.status !== "closed"
            const prio = priorityLabels[ticket.priority] || priorityLabels.medium

            return (
              <div
                key={ticket.id}
                className={cn(
                  "grid grid-cols-12 gap-2 items-center rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent/50 cursor-pointer",
                  slaBreached ? "border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-900/5" : "border-border/60"
                )}
                onClick={() => openTicketChat(ticket)}
              >
                <div className="col-span-4 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{ticket.subject}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{ticket.description.slice(0, 60)}{ticket.description.length > 60 ? "..." : ""}</p>
                </div>
                <span className="col-span-1 text-[10px] text-muted-foreground capitalize">{ticket.category}</span>
                <span className={cn("col-span-1 text-[10px]", prio.color)}>{prio.label}</span>
                <div className="col-span-1">
                  <Badge className={cn("text-[9px]", statusColors[ticket.status])}>{ticket.status.replace("_", " ")}</Badge>
                </div>
                <div className="col-span-2">
                  {ticket.sla_deadline ? (
                    <span className={cn("text-[10px] flex items-center gap-1", slaBreached ? "text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground")}>
                      <Clock className="h-2.5 w-2.5" />
                      {slaBreached ? "BREACHED" : new Date(ticket.sla_deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">--</span>
                  )}
                </div>
                <span className="col-span-1 text-[10px] text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <div className="col-span-2 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => updateTicketStatus(ticket.id, v)}
                  >
                    <SelectTrigger className="h-6 w-24 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openTicketChat(ticket)}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="sr-only">Open chat</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Agent Chat Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => { setSelectedTicket(null); setMessages([]) }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4" />
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Badge className={cn("text-[9px]", statusColors[selectedTicket?.status || "open"])}>{selectedTicket?.status?.replace("_", " ")}</Badge>
              <span className="text-[10px] capitalize">{selectedTicket?.category}</span>
              <span className={cn("text-[10px]", priorityLabels[selectedTicket?.priority || "medium"]?.color)}>
                {priorityLabels[selectedTicket?.priority || "medium"]?.label} priority
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Ticket description */}
          {selectedTicket?.description && (
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
              {selectedTicket.description}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-2 min-h-40 max-h-64">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No messages. Reply as support agent below.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender_type === "agent" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-xs max-w-[80%]",
                    msg.sender_type === "agent"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    <p>{msg.message}</p>
                    <p className={cn(
                      "text-[9px] mt-1",
                      msg.sender_type === "agent" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {msg.sender_type === "agent" ? "You (Agent)" : "Customer"} -- {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Agent reply */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Input
              placeholder="Reply as support agent..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendAgentMessage() }}
              className="flex-1 h-9 text-xs"
            />
            <Button size="sm" className="h-9 gap-1" onClick={sendAgentMessage} disabled={!chatInput.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Quick status actions */}
          {selectedTicket && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] text-muted-foreground">Quick:</span>
              {selectedTicket.status !== "in_progress" && (
                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateTicketStatus(selectedTicket.id, "in_progress")}>
                  Mark In Progress
                </Button>
              )}
              {selectedTicket.status !== "resolved" && (
                <Button variant="outline" size="sm" className="h-6 text-[10px] text-emerald-600" onClick={() => updateTicketStatus(selectedTicket.id, "resolved")}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Resolve
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
