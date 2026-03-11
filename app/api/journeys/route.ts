import { getJourneys } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const journeys = await getJourneys()
  if (type) {
    return NextResponse.json(journeys.filter((j) => j.type === type))
  }
  return NextResponse.json(journeys)
}
