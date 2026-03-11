import { getAllSolutions, getJourneysByType } from "@/lib/data"
import { SolutionsClient } from "./solutions-client"

export default async function SolutionsPage() {
  let solutions = { 
    platform: [] as Awaited<ReturnType<typeof getAllSolutions>>["platform"], 
    crowd: [] as Awaited<ReturnType<typeof getAllSolutions>>["crowd"],
    my: [] as Awaited<ReturnType<typeof getAllSolutions>>["my"]
  }
  let futureJourneys: Awaited<ReturnType<typeof getJourneysByType>> = []

  try {
    const [sol, fj] = await Promise.all([
      getAllSolutions(),
      getJourneysByType("future"),
    ])
    solutions = sol
    futureJourneys = fj
  } catch (e) {
    console.error("[v0] Solutions page data fetch error:", e)
  }

  return (
    <SolutionsClient
      platformSolutions={solutions.platform}
      crowdSolutions={solutions.crowd}
      mySolutions={solutions.my}
      futureJourneys={futureJourneys}
    />
  )
}
