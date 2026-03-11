import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all archetype solutions for a journey
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("archetype_solutions")
    .select("*")
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] Failed to fetch archetype solutions:", error)
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(data || [])
}

// POST - Create a new archetype solution
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const body = await request.json()
  const { archetypeId, principleIndex, stageId, solutionText, solutionId, appliedId } = body

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("archetype_solutions")
    .insert({
      archetype_id: archetypeId,
      journey_id: journeyId,
      principle_index: principleIndex,
      stage_id: stageId,
      solution_text: solutionText,
      solution_id: solutionId || null,
      applied_id: appliedId || null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Failed to create archetype solution:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PUT - Update an archetype solution
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const body = await request.json()
  const { id, solutionText } = body

  if (!id) {
    return NextResponse.json({ error: "Solution ID is required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("archetype_solutions")
    .update({
      solution_text: solutionText,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("journey_id", journeyId)
    .select()
    .single()

  if (error) {
    console.error("[v0] Failed to update archetype solution:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE - Remove an archetype solution
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const { searchParams } = new URL(request.url)
  const solutionId = searchParams.get("solutionId")

  if (!solutionId) {
    return NextResponse.json({ error: "Solution ID is required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("archetype_solutions")
    .delete()
    .eq("id", solutionId)
    .eq("journey_id", journeyId)

  if (error) {
    console.error("[v0] Failed to delete archetype solution:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
