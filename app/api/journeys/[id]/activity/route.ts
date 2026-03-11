import { getActivityLog } from "@/lib/data"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const activity = await getActivityLog(id)
  return NextResponse.json(activity)
}
