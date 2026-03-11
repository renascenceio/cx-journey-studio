import useSWR from "swr"
import type { Journey } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useJourneys(type?: string) {
  const url = type ? `/api/journeys?type=${type}` : "/api/journeys"
  const { data, error, isLoading, mutate } = useSWR<Journey[]>(url, fetcher)
  return { journeys: data ?? [], error, isLoading, mutate }
}
