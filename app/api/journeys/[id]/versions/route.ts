import { getVersionsForJourney } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const versions = await getVersionsForJourney(id)
  return NextResponse.json(versions)
}
