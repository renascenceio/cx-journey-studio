import { redirect } from "next/navigation"

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/journeys/${id}/canvas`)
}
