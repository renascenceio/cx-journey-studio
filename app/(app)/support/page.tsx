"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  HelpCircle, Plus, Send, MessageCircle, Clock, CheckCircle2,
  AlertCircle, ArrowRight, Headphones, BookOpen, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Ticket {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  sla_deadline: string | null
  created_at: string
  resolved_at: string | null
}

interface TicketMessage {
  id: string
  sender_type: string
  message: string
  created_at: string
}

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  waiting: "bg-muted text-muted-foreground",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
}

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-foreground",
  high: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<TicketMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [liveChatOpen, setLiveChatOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "general",
    priority: "medium",
  })

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
  }, [chatMessages])

  async function handleCreate() {
    if (!form.subject.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      setCreateOpen(false)
      setForm({ subject: "", description: "", category: "general", priority: "medium" })
      toast.success("Ticket submitted! We'll get back to you soon.")
      // Reload
      const data = await fetch("/api/support/tickets").then((r) => r.json())
      setTickets(Array.isArray(data) ? data : [])
    } catch { toast.error("Failed to submit ticket") }
    finally { setSaving(false) }
  }

  async function openChat(ticketId: string) {
    setChatOpen(ticketId)
    const res = await fetch(`/api/support/tickets/${ticketId}`)
    const data = await res.json()
    setChatMessages(data.messages || [])
  }

  async function sendMessage() {
    if (!chatInput.trim() || !chatOpen) return
    const res = await fetch(`/api/support/tickets/${chatOpen}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput }),
    })
    if (res.ok) {
      const msg = await res.json()
      setChatMessages((prev) => [...prev, msg])
      setChatInput("")
    }
  }

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress")
  const resolvedTickets = tickets.filter((t) => t.status === "resolved" || t.status === "closed")

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 lg:px-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Help & Support</h1>
          <p className="text-sm text-muted-foreground">
            Submit tickets, track their status, and chat with our support team
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Ticket
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60 hover:border-border transition-colors cursor-pointer" onClick={() => setCreateOpen(true)}>
          <CardContent className="flex items-center gap-3 py-4 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Submit a Ticket</p>
              <p className="text-[11px] text-muted-foreground">Report an issue or request a feature</p>
            </div>
          </CardContent>
        </Card>
        <Link href="/faq">
          <Card className="border-border/60 hover:border-border transition-colors cursor-pointer h-full">
            <CardContent className="flex items-center gap-3 py-4 px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Browse FAQ</p>
                <p className="text-[11px] text-muted-foreground">Find answers to common questions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="border-border/60 hover:border-border transition-colors cursor-pointer" onClick={() => setLiveChatOpen(true)}>
          <CardContent className="flex items-center gap-3 py-4 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Headphones className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Live Chat</p>
              <p className="text-[11px] text-muted-foreground">Chat with an agent in real-time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Tickets */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Active Tickets
          {openTickets.length > 0 && <Badge className="ml-2 text-[9px]" variant="secondary">{openTickets.length}</Badge>}
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : openTickets.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">No active tickets</p>
              <p className="text-xs text-muted-foreground">All your issues have been resolved.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {openTickets.map((ticket) => (
              <Card key={ticket.id} className="border-border/60">
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <AlertCircle className={cn("h-4 w-4 shrink-0", priorityColors[ticket.priority])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={cn("text-[9px]", statusColors[ticket.status])}>{ticket.status.replace("_", " ")}</Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">{ticket.category}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      {ticket.sla_deadline && (
                        <span className={cn(
                          "text-[10px] flex items-center gap-0.5",
                          new Date(ticket.sla_deadline) < new Date() ? "text-red-500" : "text-muted-foreground"
                        )}>
                          <Clock className="h-2.5 w-2.5" />
                          SLA: {new Date(ticket.sla_deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => openChat(ticket.id)}>
                    <MessageCircle className="h-3 w-3" />
                    Chat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Tickets */}
      {resolvedTickets.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Resolved ({resolvedTickets.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {resolvedTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-3 rounded-md border border-border/40 px-3 py-2 opacity-70">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{ticket.subject}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and we will respond within your SLA window.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of the issue" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Provide details, steps to reproduce, or any relevant context..." rows={4} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="data">Data / Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.subject.trim() || saving}>
              {saving ? "Submitting..." : "Submit Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Chat Dialog */}
      <Dialog open={!!chatOpen} onOpenChange={() => { setChatOpen(null); setChatMessages([]) }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Ticket Chat
            </DialogTitle>
            <DialogDescription>
              {tickets.find((t) => t.id === chatOpen)?.subject || "Conversation"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-2 min-h-48 max-h-80">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No messages yet. Start the conversation below.</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender_type === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-xs max-w-[80%]",
                    msg.sender_type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    <p>{msg.message}</p>
                    <p className={cn(
                      "text-[9px] mt-1",
                      msg.sender_type === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {msg.sender_type === "agent" ? "Support Agent" : "You"} -- {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Input
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
              className="flex-1 h-9 text-xs"
            />
            <Button size="sm" className="h-9 gap-1" onClick={sendMessage} disabled={!chatInput.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Chat Widget (Floating) */}
      {liveChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-background shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">Live Chat</span>
            </div>
            <button onClick={() => setLiveChatOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close live chat</span>
            </button>
          </div>
          <div className="flex-1 p-4 min-h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Agents Online</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Start a conversation with our support team. Average response time: under 5 minutes.
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setLiveChatOpen(false)
                  setCreateOpen(true)
                  setForm({ ...form, category: "general", priority: "high" })
                  toast.info("Submit a ticket and we'll connect you with an agent right away!")
                }}
              >
                <ArrowRight className="h-3 w-3" />
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
