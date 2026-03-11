import { getJourneys } from "@/lib/data"
import { JourneysClient } from "./journeys-client"

export default async function JourneysPage() {
  const journeys = await getJourneys()
  return <JourneysClient journeys={journeys} />
}
