import useSWR from "swr"
import type { Journey, ActivityLogEntry, Comment, JourneyVersion } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useJourney(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Journey>(
    id ? `/api/journeys/${id}` : null,
    fetcher
  )
  return { journey: data ?? null, error, isLoading, mutate }
}

export function useJourneyActivity(id: string | undefined) {
  const { data, error, isLoading } = useSWR<ActivityLogEntry[]>(
    id ? `/api/journeys/${id}/activity` : null,
    fetcher
  )
  return { activity: data ?? [], error, isLoading }
}

export function useJourneyComments(id: string | undefined) {
  const { data, error, isLoading } = useSWR<Comment[]>(
    id ? `/api/journeys/${id}/comments` : null,
    fetcher
  )
  return { comments: data ?? [], error, isLoading }
}

export function useJourneyVersions(id: string | undefined) {
  const { data, error, isLoading } = useSWR<JourneyVersion[]>(
    id ? `/api/journeys/${id}/versions` : null,
    fetcher
  )
  return { versions: data ?? [], error, isLoading }
}
