"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, Cpu, Zap, DollarSign, HelpCircle, TrendingUp } from "lucide-react"

// AI Model pricing (per 1M tokens) - Based on Anthropic's pricing
const modelPricing = {
  "claude-3-opus": { input: 15.00, output: 75.00, creditsPerKInput: 15, creditsPerKOutput: 75 },
  "claude-3.5-sonnet": { input: 3.00, output: 15.00, creditsPerKInput: 3, creditsPerKOutput: 15 },
  "claude-3-sonnet": { input: 3.00, output: 15.00, creditsPerKInput: 3, creditsPerKOutput: 15 },
  "claude-3-haiku": { input: 0.25, output: 1.25, creditsPerKInput: 0.25, creditsPerKOutput: 1.25 },
  "claude-3.5-haiku": { input: 0.80, output: 4.00, creditsPerKInput: 0.8, creditsPerKOutput: 4 },
}

// Credit conversion: 1 credit = $0.001 USD (1000 credits = $1)
const CREDIT_TO_USD = 0.001

// Typical token usage per operation
const operationEstimates = [
  { operation: "Generate Journey from Description", inputTokens: 500, outputTokens: 2000, model: "claude-3.5-sonnet" },
  { operation: "Generate Archetype", inputTokens: 800, outputTokens: 3000, model: "claude-3.5-sonnet" },
  { operation: "Pain Point Analysis", inputTokens: 400, outputTokens: 800, model: "claude-3.5-sonnet" },
  { operation: "Solution Generation", inputTokens: 600, outputTokens: 1500, model: "claude-3.5-sonnet" },
  { operation: "Journey Summary", inputTokens: 1000, outputTokens: 500, model: "claude-3-haiku" },
  { operation: "Auto-tagging", inputTokens: 300, outputTokens: 200, model: "claude-3-haiku" },
  { operation: "Emotional Score Analysis", inputTokens: 500, outputTokens: 400, model: "claude-3.5-sonnet" },
  { operation: "Competitive Benchmark", inputTokens: 1500, outputTokens: 4000, model: "claude-3.5-sonnet" },
]

function calculateCredits(inputTokens: number, outputTokens: number, model: keyof typeof modelPricing) {
  const pricing = modelPricing[model]
  const inputCredits = (inputTokens / 1000) * pricing.creditsPerKInput
  const outputCredits = (outputTokens / 1000) * pricing.creditsPerKOutput
  return Math.ceil(inputCredits + outputCredits)
}

export default function CreditsFAQPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Credits System</h1>
        <p className="text-muted-foreground">
          Understanding how AI credits work and how they're calculated
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            Model Pricing
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            Operations Cost
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Credit Conversion Rate
              </CardTitle>
              <CardDescription>How credits translate to real costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">1 Credit</p>
                  <p className="text-sm text-muted-foreground">= $0.001 USD</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">1,000 Credits</p>
                  <p className="text-sm text-muted-foreground">= $1.00 USD</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">10,000 Credits</p>
                  <p className="text-sm text-muted-foreground">= $10.00 USD</p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Credit Calculation Formula</h4>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  Total Credits = (Input Tokens / 1000 * Input Rate) + (Output Tokens / 1000 * Output Rate)
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Credits are always rounded up to the nearest whole number.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Monthly Allowances by Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Monthly Credits</TableHead>
                    <TableHead className="text-right">USD Value</TableHead>
                    <TableHead className="text-right">Estimated Operations*</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Free</TableCell>
                    <TableCell className="text-right">50</TableCell>
                    <TableCell className="text-right">$0.05</TableCell>
                    <TableCell className="text-right text-muted-foreground">~2-3 AI generations</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Starter</TableCell>
                    <TableCell className="text-right">500</TableCell>
                    <TableCell className="text-right">$0.50</TableCell>
                    <TableCell className="text-right text-muted-foreground">~20-30 AI generations</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Business</TableCell>
                    <TableCell className="text-right">2,000</TableCell>
                    <TableCell className="text-right">$2.00</TableCell>
                    <TableCell className="text-right text-muted-foreground">~80-120 AI generations</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Enterprise</TableCell>
                    <TableCell className="text-right">Unlimited</TableCell>
                    <TableCell className="text-right">Custom</TableCell>
                    <TableCell className="text-right text-muted-foreground">Custom allocation</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">
                * Estimates based on average usage of Claude 3.5 Sonnet model
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Claude Model Pricing</CardTitle>
              <CardDescription>
                Credit costs per 1,000 tokens for each Anthropic Claude model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Input (per 1K tokens)</TableHead>
                    <TableHead className="text-right">Output (per 1K tokens)</TableHead>
                    <TableHead className="text-right">USD per 1M Input</TableHead>
                    <TableHead className="text-right">USD per 1M Output</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(modelPricing).map(([model, pricing]) => (
                    <TableRow key={model}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {model}
                          {model === "claude-3.5-sonnet" && (
                            <Badge variant="secondary" className="text-[10px]">Default</Badge>
                          )}
                          {model === "claude-3-opus" && (
                            <Badge variant="outline" className="text-[10px]">Most Capable</Badge>
                          )}
                          {model.includes("haiku") && (
                            <Badge variant="outline" className="text-[10px]">Fastest</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{pricing.creditsPerKInput} credits</TableCell>
                      <TableCell className="text-right">{pricing.creditsPerKOutput} credits</TableCell>
                      <TableCell className="text-right">${pricing.input.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${pricing.output.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">Why different rates for input vs output?</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Output tokens cost more because generating text requires more computational resources than reading text. 
                  The AI must make decisions at each step of generation, while input processing is more straightforward.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estimated Credit Usage by Operation</CardTitle>
              <CardDescription>
                Typical credit costs for common AI-powered features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Model Used</TableHead>
                    <TableHead className="text-right">Input Tokens</TableHead>
                    <TableHead className="text-right">Output Tokens</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationEstimates.map((op) => {
                    const credits = calculateCredits(op.inputTokens, op.outputTokens, op.model as keyof typeof modelPricing)
                    return (
                      <TableRow key={op.operation}>
                        <TableCell className="font-medium">{op.operation}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{op.model}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{op.inputTokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{op.outputTokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{credits}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Example Calculation</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Generate Journey from Description using Claude 3.5 Sonnet:
                  </p>
                  <ul className="text-xs space-y-1 font-mono">
                    <li>Input: 500 tokens / 1000 * 3 = 1.5 credits</li>
                    <li>Output: 2000 tokens / 1000 * 15 = 30 credits</li>
                    <li className="font-bold border-t pt-1 mt-1">Total: ceil(31.5) = 32 credits</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Token Estimation Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>1 token ~ 4 characters in English</li>
                    <li>1 token ~ 0.75 words</li>
                    <li>100 words ~ 130 tokens</li>
                    <li>Actual usage varies by content complexity</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <div className="grid gap-4">
            {[
              {
                q: "What happens when I run out of credits?",
                a: "AI-powered features will be disabled until you either wait for your monthly reset or purchase additional credits. Your existing journeys and data remain fully accessible."
              },
              {
                q: "Do unused credits roll over?",
                a: "No, monthly allowance credits reset at the beginning of each billing cycle. However, purchased credits never expire and carry over indefinitely."
              },
              {
                q: "Can I see my credit usage history?",
                a: "Yes, the billing page shows a detailed breakdown of credit usage by operation type, date, and the specific journey/feature that consumed the credits."
              },
              {
                q: "Why are some operations more expensive?",
                a: "Operations that generate more content (like creating full journeys or archetypes) use more output tokens, which cost more. Simple analysis operations use fewer tokens and cost less."
              },
              {
                q: "Can I choose which AI model to use?",
                a: "The system automatically selects the optimal model for each operation. Complex creative tasks use more capable (and expensive) models, while simple tasks use faster, cheaper models."
              },
              {
                q: "How do credit top-ups work?",
                a: "You can purchase credit packs at any time. Credits are added instantly and never expire. Larger packs offer better value per credit."
              },
              {
                q: "Is there a way to estimate costs before running AI features?",
                a: "Yes, AI-powered features show an estimated credit cost before you confirm the operation. Actual usage may vary slightly based on content complexity."
              },
              {
                q: "What's the refund policy for credits?",
                a: "Purchased credits are non-refundable but never expire. If an AI operation fails due to a system error, credits are automatically refunded to your account."
              },
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
