"use client"

import { useState, useMemo } from "react"
import { Search, ChevronDown, BookOpen, Route, UserCircle, LayoutTemplate, Lightbulb, Milestone, Users, Shield, Cpu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FaqItem {
  question: string
  answer: string
  category: string
}

const faqCategories = [
  { value: "all", label: "All", icon: BookOpen },
  { value: "journeys", label: "Journeys", icon: Route },
  { value: "archetypes", label: "Archetypes", icon: UserCircle },
  { value: "templates", label: "Templates", icon: LayoutTemplate },
  { value: "solutions", label: "Solutions", icon: Lightbulb },
  { value: "roadmap", label: "Roadmap", icon: Milestone },
  { value: "collaboration", label: "Collaboration", icon: Users },
  { value: "roles", label: "Roles & Permissions", icon: Shield },
  { value: "ai", label: "AI Features", icon: Cpu },
]

const faqs: FaqItem[] = [
  // Journeys
  {
    category: "journeys",
    question: "What is a customer journey?",
    answer: "A customer journey maps the end-to-end experience a customer has with your product or service. It includes stages (major phases), steps (actions within a stage), and touchpoints (specific interactions). Each touchpoint can have an emotional score, pain points, and highlights to give a complete picture of the experience.",
  },
  {
    category: "journeys",
    question: "What are the different journey types?",
    answer: "There are three types: Current (maps the existing experience as-is), Future (designs the ideal experience you want to create), and Deployed (a future journey that has been approved and is live). You can promote a current journey to future, and deploy a future journey once it is approved.",
  },
  {
    category: "journeys",
    question: "How do I create a new journey?",
    answer: "Click the 'New Journey' button from the Dashboard or the Journeys page. You will be asked for a title, description, journey type (current/future), and optional tags. Three default stages (Awareness, Engagement, Outcome) are created automatically. You can then add or edit stages, steps, and touchpoints on the Canvas.",
  },
  {
    category: "journeys",
    question: "What is the Journey Canvas?",
    answer: "The Canvas is the visual editor for your journey. It shows stages as columns, each containing steps and touchpoints. You can switch between Default (column), Swimlane (channel-based), Timeline (linear), and Moments of Truth views. Toggle Edit Mode to add, reorder, rename, or delete stages, steps, and touchpoints.",
  },
  {
    category: "journeys",
    question: "How does the Emotional Arc work?",
    answer: "Every touchpoint has an emotional score from -5 (very negative) to +5 (very positive). The Emotional Arc chart plots these scores across the journey to visualise the emotional highs and lows. This helps identify critical pain points and moments of delight.",
  },
  {
    category: "journeys",
    question: "What is Gap Analysis?",
    answer: "Gap Analysis compares a current journey against a future journey to highlight where improvements are planned. It shows differences in emotional scores, new or removed touchpoints, and overall experience shifts between the two journeys.",
  },
  // Archetypes
  {
    category: "archetypes",
    question: "What is an archetype?",
    answer: "An archetype represents a customer persona linked to one or more journeys. It includes demographic details, goals, frustrations, behaviours, expectations, barriers, and drivers. Archetypes are rated against the 10 CX Principles to assess how well the experience serves that persona.",
  },
  {
    category: "archetypes",
    question: "What are the 10 CX Principles?",
    answer: "The 10 CX Principles are: Personalisation, Integrity, Time & Effort, Expectations, Resolution, Empathy, Accessibility, Channel Flexibility, Proactivity, and Journey Consistency. Each archetype is scored 0-100 on these pillars, and the radar chart provides a visual overview.",
  },
  {
    category: "archetypes",
    question: "Can I create archetypes with AI?",
    answer: "Yes. Use the 'Create with AI' button on the Archetypes page. Provide a brief (name, role, category, journey) and AI will generate a complete archetype with goals, frustrations, behaviours, CX principle ratings, and more. You can then edit any field.",
  },
  // Templates
  {
    category: "templates",
    question: "How do journey templates work?",
    answer: "Templates are pre-built journey structures with stages, steps, and optional touchpoints. Click 'Use Template' to create a new journey pre-populated with the template's structure. You can choose between My Templates (saved from your own journeys) and Public Templates (community-shared).",
  },
  {
    category: "templates",
    question: "Can I save my journey as a template?",
    answer: "Yes. From the journey Overview tab, you can save the current journey as a template. It will appear under 'My Templates' in the Template Library and can optionally be published to the public library.",
  },
  // Solutions
  {
    category: "solutions",
    question: "What are solutions?",
    answer: "Solutions are proven strategies and approaches to improve customer experience. They are categorised by type (Behavioural, Rituals, Industrial, Technological, Social, Environmental). Platform Solutions are curated by the system, while Crowd Solutions are contributed by the community.",
  },
  {
    category: "solutions",
    question: "How do I apply a solution to a journey?",
    answer: "Click 'Apply' on any solution card, then select the target journey, stage, and touchpoint. The solution will be linked to that touchpoint and appear in the Solutions Lane on the Canvas as well as in the touchpoint's Quick View pane.",
  },
  // Roadmap
  {
    category: "roadmap",
    question: "What is the Roadmap?",
    answer: "The Roadmap tracks improvement initiatives derived from solutions applied to journeys. Items can be assigned to team members, given priorities and deadlines, and moved through statuses (Planned, In Progress, Done). Project Managers and Team Admins can approve completion.",
  },
  // Collaboration
  {
    category: "collaboration",
    question: "How do I invite collaborators to a journey?",
    answer: "Go to the journey Overview tab and click 'Invite' in the Collaborators section. You can add existing workspace members by name or invite new people by email. Collaborators can comment, edit, or view depending on their assigned role.",
  },
  {
    category: "collaboration",
    question: "How do comments work?",
    answer: "Comments can be added to any stage or step on the Canvas. Click the comment icon on a stage or step, or use the Comments sidebar. Comments support threaded replies and can be resolved when addressed. Mentions (@username) send notifications to the mentioned user.",
  },
  // Roles & Permissions
  {
    category: "roles",
    question: "What roles are available?",
    answer: "Journey Master (full access, can manage workspace and all journeys), Admin (can manage team members and settings), Contributor (can edit journeys they are assigned to), Viewer (read-only access), and Project Manager (can edit the Roadmap and approve items).",
  },
  {
    category: "roles",
    question: "What can a Viewer do?",
    answer: "Viewers have read-only access. They can browse journeys, archetypes, templates, and solutions, and view analytics. They cannot create, edit, or delete any content. To get editing access, ask a Journey Master or Admin to upgrade your role.",
  },
  // AI Features
  {
    category: "ai",
    question: "What AI features are available?",
    answer: "AI powers several features: Archetype creation (generates full persona from a brief), Template generation (creates complete journey structures from a scenario description), Solution search (finds relevant solutions using natural language), and Gap Analysis insights. The AI provider can be configured per workspace in Settings.",
  },
  {
    category: "ai",
    question: "Which AI providers are supported?",
    answer: "The platform supports OpenAI, Anthropic (Claude), and Google (Gemini). Workspace administrators can select the preferred provider in Settings > Workspace > AI Provider. All AI features route through the selected provider.",
  },
  {
    category: "ai",
    question: "Is my data shared with AI providers?",
    answer: "Journey data is sent to the configured AI provider only when you explicitly trigger an AI feature (e.g., Generate Archetype, AI Search). Data is not stored by the AI provider beyond processing the request. Review your provider's data policy for details.",
  },
]

function FaqAccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/30"
      >
        <span className="text-sm font-medium text-foreground">{item.question}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const filtered = useMemo(() => {
    let items = faqs
    if (selectedCategory !== "all") {
      items = items.filter((f) => f.category === selectedCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      )
    }
    return items
  }, [search, selectedCategory])

  function toggleItem(idx: number) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h1>
        <p className="text-sm text-muted-foreground">
          Find answers about journeys, archetypes, templates, solutions, roles, and AI features
        </p>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {faqCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.value}
                onClick={() => { setSelectedCategory(cat.value); setOpenItems(new Set()) }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  selectedCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full sm:w-56 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {filtered.length} {filtered.length === 1 ? "question" : "questions"}
        </Badge>
        {selectedCategory !== "all" && (
          <button onClick={() => setSelectedCategory("all")} className="text-xs text-primary hover:underline">
            Clear filter
          </button>
        )}
      </div>

      {/* FAQ list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">No matching questions</p>
          <p className="text-xs text-muted-foreground">Try a different search term or category</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          {filtered.map((item, idx) => (
            <FaqAccordionItem
              key={`${item.category}-${idx}`}
              item={item}
              isOpen={openItems.has(idx)}
              onToggle={() => toggleItem(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
