"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const industries = [
  "SaaS", "Retail", "Healthcare", "Finance", "Hospitality",
  "Education", "Logistics", "Media", "Telecom", "Other",
]

const teamSizes = [
  { label: "Just me", value: "1" },
  { label: "2-5", value: "2-5" },
  { label: "6-20", value: "6-20" },
  { label: "21-50", value: "21-50" },
  { label: "50+", value: "50+" },
]

const goals = [
  "Map existing customer journeys",
  "Design future-state journeys",
  "Identify experience gaps",
  "Improve NPS / satisfaction scores",
  "Reduce churn & friction points",
  "Align cross-functional teams",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("")
  const [selectedTeamSize, setSelectedTeamSize] = useState("")
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [inviteEmails, setInviteEmails] = useState("")
  const [creating, setCreating] = useState(false)

  const totalSteps = 4

  const canProceed = () => {
    switch (step) {
      case 0: return workspaceName.trim().length > 0
      case 1: return selectedIndustry !== "" && selectedTeamSize !== ""
      case 2: return selectedGoals.length > 0
      case 3: return true
      default: return true
    }
  }

  async function handleComplete() {
    setCreating(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName,
          industry: selectedIndustry,
          teamSize: selectedTeamSize,
          goals: selectedGoals,
          inviteEmails: inviteEmails.split(",").map((e) => e.trim()).filter(Boolean),
        }),
      })
      toast.success("Workspace created! Welcome aboard.")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to create workspace")
    }
    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Toaster />

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i <= step ? "bg-primary w-10" : "bg-muted w-6"
            )}
          />
        ))}
      </div>

      <Card className="w-full max-w-lg border-border/60 shadow-lg">
        <CardContent className="p-8">
          {/* Step 0: Workspace Name */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Name your workspace</h2>
                <p className="text-sm text-muted-foreground">
                  This is where your team will collaborate on customer journeys.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ws-name" className="text-sm">Workspace Name</Label>
                <Input
                  id="ws-name"
                  placeholder="e.g., Acme CX Team"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="h-10"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 1: Industry + Team Size */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Tell us about your team</h2>
                <p className="text-sm text-muted-foreground">
                  We will customize your experience based on your industry and team size.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Label className="text-sm">Industry</Label>
                <div className="flex flex-wrap gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setSelectedIndustry(ind)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedIndustry === ind
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label className="text-sm">Team Size</Label>
                <div className="flex flex-wrap gap-2">
                  {teamSizes.map((ts) => (
                    <button
                      key={ts.value}
                      onClick={() => setSelectedTeamSize(ts.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedTeamSize === ts.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {ts.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">What are your goals?</h2>
                <p className="text-sm text-muted-foreground">
                  Select one or more to help us personalize your workspace.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {goals.map((goal) => {
                  const selected = selectedGoals.includes(goal)
                  return (
                    <button
                      key={goal}
                      onClick={() =>
                        setSelectedGoals(
                          selected
                            ? selectedGoals.filter((g) => g !== goal)
                            : [...selectedGoals, goal]
                        )
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                      )}>
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      {goal}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Invite Team */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Invite your team</h2>
                <p className="text-sm text-muted-foreground">
                  Add team members to start collaborating. You can also do this later.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-emails" className="text-sm">
                  Email Addresses <span className="text-muted-foreground font-normal">(comma-separated)</span>
                </Label>
                <Input
                  id="invite-emails"
                  placeholder="jane@company.com, john@company.com"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Your workspace <Badge variant="secondary" className="text-[10px] mx-1">{workspaceName}</Badge>
                  in <Badge variant="outline" className="text-[10px] mx-1">{selectedIndustry}</Badge>
                  is ready to go!
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
            {step < totalSteps - 1 ? (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Continue
                <ArrowRight className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={creating}
                onClick={handleComplete}
              >
                {creating ? "Creating..." : "Create Workspace"}
                <Sparkles className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skip link */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  )
}
