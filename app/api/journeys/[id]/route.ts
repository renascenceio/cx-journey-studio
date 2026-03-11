import { getJourneyById } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const journey = await getJourneyById(id)
  if (!journey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(journey)
}
