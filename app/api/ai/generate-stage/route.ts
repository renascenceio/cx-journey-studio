import { generateText, Output } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { stageName, description, journeyTitle } = await req.json()

  if (!stageName || !description) {
    return NextResponse.json({ error: "Missing stageName or description" }, { status: 400 })
  }

  const result = await generateText({
    model: anthropic("claude-3-5-sonnet-20241022"),
    output: Output.object({
      schema: z.object({
        steps: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            touchpoints: z.array(
              z.object({
                channel: z.string(),
                description: z.string(),
                emotionalScore: z.number().min(-5).max(5),
              })
            ),
          })
        ),
      }),
    }),
    prompt: `You are a CX journey design expert. Generate 3-5 steps for a journey stage.

Journey: ${journeyTitle || "Customer Journey"}
Stage Name: ${stageName}
Stage Description: ${description}

For each step, create 1-2 realistic touchpoints with appropriate emotional scores (-5 to +5).
Use real-world channels like: Web, Mobile App, Email, Phone, Live Chat, Social Media, Physical Store, SMS, In-App, Self-Service Portal.
Make the touchpoint descriptions specific and actionable.`,
  })

  return NextResponse.json(result.output)
}
