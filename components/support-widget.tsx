"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { 
  Headphones, X, Send, MessageCircle, HelpCircle, Search, 
  BookOpen, ChevronRight, ArrowLeft, Sparkles 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import Link from "next/link"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

interface TicketMessage {
  id: string
  sender_type: string
  message: string
  created_at: string
}

const SAMPLE_FAQ: FAQ[] = [
  { id: "1", question: "How do I create a new journey?", answer: "Click the 'New Journey' button on the dashboard or go to Journeys > Create New. You can start from scratch or use a template.", category: "Getting Started" },
  { id: "2", question: "How do AI credits work?", answer: "AI credits are used for AI-powered features like generating templates, brainstorming archetypes, and auto-suggestions. Each generation uses a certain number of credits based on the complexity.", category: "Billing" },
  { id: "3", question: "Can I share journeys with my team?", answer: "Yes! You can invite team members to your workspace and share journeys with specific permissions (view, edit, or admin).", category: "Collaboration" },
  { id: "4", question: "How do I export a journey?", answer: "Open the journey, click the three-dot menu, and select 'Export'. You can export as PDF, PNG, or CSV.", category: "Features" },
  { id: "5", question: "What is the Roadmap feature?", answer: "The Roadmap aggregates solutions from all your journeys into a single view where you can plan, prioritize, and track implementation.", category: "Features" },
]

type View = "home" | "faq" | "faq-detail" | "ticket" | "chat"

export function SupportWidget() {
  const t = useTranslations("support")
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null)
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", category: "general", priority: "medium" })
  const [submitting, setSubmitting] = useState(false)
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const filteredFaq = searchQuery 
    ? SAMPLE_FAQ.filter(f => 
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SAMPLE_FAQ

  async function handleSubmitTicket() {
    if (!ticketForm.subject.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      })
      if (!res.ok) throw new Error("Failed")
      const ticket = await res.json()
      toast.success(t("ticketSubmitted"))
      setActiveTicketId(ticket.id)
      setView("chat")
      setTicketForm({ subject: "", description: "", category: "general", priority: "medium" })
    } catch {
      toast.error(t("ticketFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  async function loadTicketMessages(ticketId: string) {
    const res = await fetch(`/api/support/tickets/${ticketId}`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  async function sendMessage() {
    if (!chatInput.trim() || !activeTicketId) return
    const res = await fetch(`/api/support/tickets/${activeTicketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      setChatInput("")
    }
  }

  function openFaqDetail(faq: FAQ) {
    setSelectedFaq(faq)
    setView("faq-detail")
  }

  function goBack() {
    if (view === "faq-detail") setView("faq")
    else if (view === "chat") setView("home")
    else setView("home")
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
        aria-label="Open support"
      >
        <Headphones className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3">
        <div className="flex items-center gap-2">
          {view !== "home" && (
            <button onClick={goBack} className="text-primary-foreground/70 hover:text-primary-foreground mr-1">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <Headphones className="h-4 w-4 text-primary-foreground" />
          <span className="text-sm font-semibold text-primary-foreground">{t("helpSupport")}</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === "home" && (
          <div className="p-4 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setView("faq") }}
                placeholder={t("searchHelp")}
                className="pl-9"
              />
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView("faq")}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left hover:bg-accent transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t("browseFaq")}</p>
                  <p className="text-xs text-muted-foreground">{t("findAnswers")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => setView("ticket")}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left hover:bg-accent transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t("submitTicket")}</p>
                  <p className="text-xs text-muted-foreground">{t("getPersonalHelp")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <Link
                href="/support"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left hover:bg-accent transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <MessageCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t("viewMyTickets")}</p>
                  <p className="text-xs text-muted-foreground">{t("trackStatus")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>

            {/* Online status */}
            <div className="flex items-center gap-2 justify-center pt-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">{t("agentsOnline")}</span>
            </div>
          </div>
        )}

        {view === "faq" && (
          <div className="p-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchFaq")}
                className="pl-9"
              />
            </div>
            
            {filteredFaq.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">{t("noFaqResults")}</p>
                <Button variant="link" size="sm" onClick={() => setView("ticket")} className="mt-2">
                  {t("submitTicketInstead")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredFaq.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => openFaqDetail(faq)}
                    className="flex items-start gap-2 rounded-lg border border-border/40 p-3 text-left hover:bg-accent transition-colors"
                  >
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{faq.question}</p>
                      <Badge variant="secondary" className="mt-1 text-[9px]">{faq.category}</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "faq-detail" && selectedFaq && (
          <div className="p-4 flex flex-col gap-4">
            <div>
              <Badge variant="secondary" className="text-[9px] mb-2">{selectedFaq.category}</Badge>
              <h3 className="text-sm font-semibold text-foreground">{selectedFaq.question}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{selectedFaq.answer}</p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">{t("stillNeedHelp")}</p>
              <Button size="sm" onClick={() => setView("ticket")} className="w-full">
                {t("submitTicket")}
              </Button>
            </div>
          </div>
        )}

        {view === "ticket" && (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">{t("subject")}</label>
              <Input
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder={t("subjectPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-foreground">{t("description")}</label>
              <Textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder={t("descriptionPlaceholder")}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">{t("category")}</label>
                <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">{t("priority")}</label>
                <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}>
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
            <Button onClick={handleSubmitTicket} disabled={!ticketForm.subject.trim() || submitting} className="w-full">
              {submitting ? t("submitting") : t("submitTicket")}
            </Button>
          </div>
        )}

        {view === "chat" && (
          <div className="flex flex-col h-80">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 text-primary/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{t("ticketCreated")}</p>
                    <p className="text-xs text-muted-foreground">{t("agentWillReply")}</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
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
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-border/50">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
                placeholder={t("typeMessage")}
                className="flex-1 h-9 text-xs"
              />
              <Button size="sm" className="h-9" onClick={sendMessage} disabled={!chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
